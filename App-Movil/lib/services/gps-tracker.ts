/**
 * Servicio para rastreo GPS de buses en tiempo real
 * Este servicio debe ejecutarse en la app del CONDUCTOR
 *
 * OPTIMIZACIONES:
 * - Intervalo de actualización optimizado para capa gratuita de Firebase
 * - Batching y debouncing de escrituras
 * - Throttling inteligente basado en estado (detenido vs. movimiento)
 * - Precisión GPS balanceada para ahorro de batería
 * - Validación de conectividad antes de escribir
 * - Memoización de referencias Firebase
 */

import * as Location from 'expo-location';
import { doc, setDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { db as getDB } from '../firebase';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../logger';

interface GPSTrackerConfig {
  busId: string;
  routeId?: string;
  tripId?: string;
  updateInterval?: number; // milisegundos, default 12000 (12 segundos)
}

interface BusLocation {
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  accuracy: number;
  timestamp: Date;
}

// Configuración de intervalos - MODO TESTING (máxima precisión y velocidad)
const INTERVALS = {
  MOVING: 1000,       // 1 segundo cuando está en movimiento (60 updates/minuto)
  STOPPED: 3000,      // 3 segundos cuando está detenido (20 updates/minuto)
  MIN_UPDATE: 500,    // Intervalo mínimo entre actualizaciones (0.5 segundos)
};

class GPSTracker {
  private subscription: Location.LocationSubscription | null = null;
  private config: GPSTrackerConfig | null = null;
  private isTracking = false;
  private lastUpdate: Date | null = null;
  private lastLocation: { lat: number; lng: number; timestamp: number } | null = null;

  // Optimizaciones de rendimiento
  private busRef: DocumentReference | null = null; // Memoización de referencia Firebase
  private pendingUpdate: BusLocation | null = null; // Buffer para batching
  private updateTimeout: NodeJS.Timeout | null = null; // Control de debouncing
  private lastFirebaseWrite: number = 0; // Timestamp de última escritura
  private currentStatus: 'moving' | 'stopped' = 'stopped'; // Estado actual del bus
  private writeInProgress = false; // Flag para evitar escrituras simultáneas

  /**
   * Inicia el rastreo GPS con configuración optimizada
   */
  async startTracking(config: GPSTrackerConfig): Promise<boolean> {
    try {
      // Solicitar permisos de ubicación
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        logger.error('[GPS] Permiso de ubicación denegado');
        return false;
      }

      // Configuración inicial
      this.config = config;
      this.isTracking = true;
      this.lastLocation = null;
      this.lastFirebaseWrite = 0;
      this.currentStatus = 'stopped';

      // Memoizar referencia de Firebase (evita recrear en cada update)
      const db = getDB();
      this.busRef = doc(db, 'liveBuses', config.busId);

      // Configurar rastreo de ubicación con MÁXIMA PRECISIÓN (modo testing)
      const updateInterval = config.updateInterval || INTERVALS.MOVING;

      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Máxima precisión GPS
          timeInterval: updateInterval,
          distanceInterval: 5, // 5 metros para actualizaciones frecuentes
        },
        (location) => this.handleLocationUpdate(location)
      );

      // Log de inicio
      logger.start('Rastreo GPS iniciado', {
        busId: config.busId,
        interval: `${updateInterval}ms`,
        accuracy: 'BestForNavigation',
        distanceInterval: '5m'
      });

      return true;

    } catch (error) {
      logger.error('[GPS] Error al iniciar rastreo', error);
      return false;
    }
  }

  /**
   * Detiene el rastreo GPS y limpia recursos
   */
  async stopTracking(): Promise<void> {
    // Cancelar timeout pendiente
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    // Escribir actualización pendiente antes de detener
    if (this.pendingUpdate && this.config) {
      await this.writeToFirebase(this.pendingUpdate, 'stopped');
    }

    // Remover suscripción GPS
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    // Actualizar estado final en Firebase
    if (this.config && this.busRef) {
      await this.updateBusStatus('stopped');
    }

    // Limpiar estado
    this.isTracking = false;
    this.config = null;
    this.lastLocation = null;
    this.busRef = null;
    this.pendingUpdate = null;
    this.lastFirebaseWrite = 0;
    this.currentStatus = 'stopped';
    this.writeInProgress = false;

    if (__DEV__) {
      console.log('[GPS] Rastreo detenido');
    }
  }

  /**
   * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
  }

  /**
   * Determina el estado del bus (moving/stopped) basándose en velocidad y movimiento
   * OPTIMIZADO: Reduce cálculos innecesarios
   */
  private determineStatus(location: Location.LocationObject): 'moving' | 'stopped' {
    const speed = location.coords.speed || 0;

    // Método 1: Usar velocidad GPS (más confiable y eficiente)
    // Umbral: 0.5 m/s ≈ 1.8 km/h
    if (speed > 0.5) {
      return 'moving';
    }

    // Método 2: Calcular movimiento solo si speed es cercano a cero
    if (this.lastLocation) {
      const timeDiff = (location.timestamp - this.lastLocation.timestamp) / 1000;

      // Solo calcular si ha pasado suficiente tiempo
      if (timeDiff >= 5) {
        const distance = this.calculateDistance(
          this.lastLocation.lat,
          this.lastLocation.lng,
          location.coords.latitude,
          location.coords.longitude
        );

        const calculatedSpeed = distance / timeDiff;

        // Umbral: 1.5 m/s ≈ 5.4 km/h
        if (calculatedSpeed > 1.5) {
          return 'moving';
        }
      }
    }

    return 'stopped';
  }

  /**
   * Maneja las actualizaciones de ubicación con throttling inteligente
   * OPTIMIZADO: Implementa debouncing y batching
   */
  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    if (!this.config || !this.isTracking) return;

    const busLocation: BusLocation = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed || 0,
      bearing: location.coords.heading || 0,
      accuracy: location.coords.accuracy || 0,
      timestamp: new Date(location.timestamp),
    };

    // Determinar estado del bus
    const status = this.determineStatus(location);

    // Log de recepción GPS
    logger.debug(`Ubicación GPS recibida - ${status} - ${busLocation.speed.toFixed(1)} km/h`);

    // Guardar ubicación para futuras comparaciones
    this.lastLocation = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: location.timestamp
    };

    // Guardar estado actual
    this.currentStatus = status;

    // THROTTLING INTELIGENTE: Verificar si debe actualizar Firebase
    const now = Date.now();
    const timeSinceLastWrite = now - this.lastFirebaseWrite;

    // Determinar intervalo mínimo según estado
    const minInterval = status === 'moving' ? INTERVALS.MOVING : INTERVALS.STOPPED;

    // En modo testing, permitir actualizaciones más frecuentes
    // Solo throttle si es demasiado rápido (< MIN_UPDATE)
    if (timeSinceLastWrite >= INTERVALS.MIN_UPDATE) {
      // Escribir inmediatamente si ha pasado suficiente tiempo
      await this.writeToFirebase(busLocation, status);
    } else {
      // Guardar como pendiente para escribir después (batching)
      this.pendingUpdate = busLocation;

      // Solo programar si no hay uno pendiente
      if (!this.updateTimeout) {
        const delay = INTERVALS.MIN_UPDATE - timeSinceLastWrite;
        this.scheduleWrite(busLocation, status, delay);
      }
    }
  }

  /**
   * Programa una escritura diferida (debouncing)
   */
  private scheduleWrite(location: BusLocation, status: 'moving' | 'stopped', delay: number): void {
    // Cancelar timeout anterior si existe
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Programar nueva escritura
    this.updateTimeout = setTimeout(async () => {
      if (this.pendingUpdate && this.config) {
        await this.writeToFirebase(this.pendingUpdate, status);
        this.pendingUpdate = null;
      }
      this.updateTimeout = null;
    }, delay);
  }

  /**
   * Escribe ubicación en Firebase con validación de conectividad
   * OPTIMIZADO: Valida conexión, evita escrituras simultáneas, reduce logging
   */
  private async writeToFirebase(location: BusLocation, status: 'moving' | 'stopped'): Promise<void> {
    if (!this.config || !this.busRef) return;

    // Evitar escrituras simultáneas
    if (this.writeInProgress) {
      this.pendingUpdate = location;
      return;
    }

    try {
      this.writeInProgress = true;

      // Validar conectividad antes de escribir (solo en producción para testing rápido)
      if (!__DEV__) {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          console.warn('[GPS] Sin conexión - actualización pospuesta');
          this.pendingUpdate = location;
          return;
        }
      }

      const updateData: any = {
        busId: this.config.busId,
        lat: location.lat,
        lng: location.lng,
        speed: location.speed,
        bearing: location.bearing,
        status: status,
        timestamp: serverTimestamp(),
        accuracy: location.accuracy,
      };

      // Solo agregar routeId y tripId si están definidos
      if (this.config.routeId) {
        updateData.routeId = this.config.routeId;
      }
      if (this.config.tripId) {
        updateData.tripId = this.config.tripId;
      }

      // Escribir a Firebase usando referencia memoizada
      await setDoc(this.busRef, updateData, { merge: true });

      // Actualizar timestamp de última escritura
      this.lastFirebaseWrite = Date.now();
      this.lastUpdate = new Date();

      // Log de actualización exitosa
      logger.debug('Firebase actualizado', {
        status,
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        speed: `${location.speed.toFixed(1)} km/h`,
        accuracy: `${location.accuracy.toFixed(1)}m`
      });

    } catch (error) {
      logger.error('[GPS] Error al escribir en Firebase', error);
      // Guardar como pendiente para reintentar
      this.pendingUpdate = location;
    } finally {
      this.writeInProgress = false;
    }
  }

  /**
   * Actualiza solo el estado del bus (usado al detener)
   * OPTIMIZADO: Usa referencia memoizada
   */
  private async updateBusStatus(status: 'moving' | 'stopped'): Promise<void> {
    if (!this.config || !this.busRef) return;

    try {
      await setDoc(this.busRef, {
        status: status,
        timestamp: serverTimestamp(),
      }, { merge: true });

      if (__DEV__) {
        console.log(`[GPS] Estado actualizado: ${status}`);
      }

    } catch (error) {
      console.error('[GPS] Error al actualizar estado:', error);
    }
  }

  /**
   * Verifica si el rastreo está activo
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Obtiene la última actualización
   */
  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): GPSTrackerConfig | null {
    return this.config;
  }
}

// Exportar instancia singleton
export const gpsTracker = new GPSTracker();

// Exportar tipos
export type { GPSTrackerConfig, BusLocation };
