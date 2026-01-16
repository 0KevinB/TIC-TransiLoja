/**
 * Servicio de Simulación de Bus
 * Simula el movimiento de un bus a lo largo de una ruta
 */

import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db as getDB } from '../firebase';

interface SimulatorConfig {
  busId: string;
  routeId: string;
  tripId: string;
  speed?: number; // km/h (default: 30)
  updateInterval?: number; // milisegundos (default: 3000)
}

interface RouteStop {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

class BusSimulator {
  private config: SimulatorConfig | null = null;
  private isSimulating = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentStopIndex = 0;
  private currentPosition = { lat: 0, lng: 0 };
  private routeStops: RouteStop[] = [];
  private progress = 0; // 0 a 1 entre paradas

  /**
   * Inicia la simulación
   */
  async startSimulation(config: SimulatorConfig): Promise<boolean> {
    try {
      this.config = config;

      // Cargar paradas de la ruta
      const stops = await this.loadRouteStops(config.routeId);
      if (stops.length === 0) {
        console.error('No se encontraron paradas para esta ruta');
        return false;
      }

      this.routeStops = stops;
      this.currentStopIndex = 0;
      this.currentPosition = {
        lat: stops[0].lat,
        lng: stops[0].lng,
      };
      this.progress = 0;

      // Crear documento inicial en liveBuses
      await this.createLiveBusDocument();

      // Iniciar intervalo de actualización
      const updateInterval = config.updateInterval || 3000;
      this.isSimulating = true;

      this.intervalId = setInterval(() => {
        this.updateSimulation();
      }, updateInterval);

      console.log('✅ Simulación iniciada:', config.busId);
      return true;

    } catch (error) {
      console.error('Error al iniciar simulación:', error);
      return false;
    }
  }

  /**
   * Detiene la simulación
   */
  async stopSimulation(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Eliminar documento de liveBuses
    if (this.config) {
      await this.deleteLiveBusDocument();
    }

    this.isSimulating = false;
    this.config = null;
    this.routeStops = [];
    this.currentStopIndex = 0;
    this.progress = 0;

    console.log('🛑 Simulación detenida');
  }

  /**
   * Carga las paradas de una ruta desde Firebase
   */
  private async loadRouteStops(routeId: string): Promise<RouteStop[]> {
    try {
      const db = getDB();
      const routeDoc = await getDoc(doc(db, 'routes', routeId));

      if (!routeDoc.exists()) {
        console.error('Ruta no encontrada:', routeId);
        return [];
      }

      const routeData = routeDoc.data();
      const stopIds = routeData.stopIds || [];

      // Cargar información de cada parada
      const stops: RouteStop[] = [];
      for (const stopId of stopIds) {
        const stopDoc = await getDoc(doc(db, 'stops', stopId));
        if (stopDoc.exists()) {
          const stopData = stopDoc.data();
          stops.push({
            id: stopDoc.id,
            lat: stopData.lat,
            lng: stopData.lng,
            name: stopData.name || 'Parada',
          });
        }
      }

      console.log(`📍 Cargadas ${stops.length} paradas para la ruta`);
      return stops;

    } catch (error) {
      console.error('Error al cargar paradas:', error);
      return [];
    }
  }

  /**
   * Crea el documento inicial en liveBuses
   */
  private async createLiveBusDocument(): Promise<void> {
    if (!this.config) return;

    try {
      const db = getDB();
      const busRef = doc(db, 'liveBuses', this.config.busId);

      await setDoc(busRef, {
        busId: this.config.busId,
        routeId: this.config.routeId,
        tripId: this.config.tripId,
        lat: this.currentPosition.lat,
        lng: this.currentPosition.lng,
        speed: 0,
        bearing: 0,
        direction: 0,
        status: 'stopped',
        timestamp: serverTimestamp(),
        isAtStop: true,
        currentStopIndex: 0,
        nextStopId: this.routeStops[1]?.id || '',
        routeStops: this.routeStops.map(s => s.id),
        delay: 0,
        stopArrivalTime: serverTimestamp(),
      });

      console.log('📝 Documento de bus en vivo creado');

    } catch (error) {
      console.error('Error al crear documento:', error);
    }
  }

  /**
   * Actualiza la simulación (movimiento del bus)
   */
  private async updateSimulation(): Promise<void> {
    if (!this.config || !this.isSimulating) return;

    // Calcular velocidad en m/s
    const speedKmH = this.config.speed || 30;
    const speedMs = (speedKmH * 1000) / 3600;

    // Calcular incremento de progreso
    const updateInterval = (this.config.updateInterval || 3000) / 1000; // segundos
    const currentStop = this.routeStops[this.currentStopIndex];
    const nextStopIndex = (this.currentStopIndex + 1) % this.routeStops.length;
    const nextStop = this.routeStops[nextStopIndex];

    // Calcular distancia entre paradas
    const distance = this.calculateDistance(
      currentStop.lat,
      currentStop.lng,
      nextStop.lat,
      nextStop.lng
    );

    // Calcular incremento de progreso
    const progressIncrement = (speedMs * updateInterval) / distance;
    this.progress += progressIncrement;

    // Si llegamos a la siguiente parada
    if (this.progress >= 1) {
      this.progress = 0;
      this.currentStopIndex = nextStopIndex;

      // Pausa en la parada (3 segundos)
      await this.updatePosition(nextStop.lat, nextStop.lng, 0, true);

      console.log(`🚏 Llegó a parada: ${nextStop.name} (${this.currentStopIndex + 1}/${this.routeStops.length})`);

      // Reiniciar si completó la ruta
      if (this.currentStopIndex === 0) {
        console.log('🔄 Completó la ruta, reiniciando...');
      }

      return;
    }

    // Interpolar posición entre paradas
    const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * this.progress;
    const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * this.progress;

    // Calcular bearing (dirección)
    const bearing = this.calculateBearing(
      currentStop.lat,
      currentStop.lng,
      nextStop.lat,
      nextStop.lng
    );

    await this.updatePosition(lat, lng, speedMs, false, bearing);
  }

  /**
   * Actualiza la posición del bus en Firebase
   */
  private async updatePosition(
    lat: number,
    lng: number,
    speed: number,
    isAtStop: boolean,
    bearing: number = 0
  ): Promise<void> {
    if (!this.config) return;

    try {
      const db = getDB();
      const busRef = doc(db, 'liveBuses', this.config.busId);

      const nextStopIndex = (this.currentStopIndex + 1) % this.routeStops.length;
      const status = speed > 1 ? 'moving' : 'stopped';

      await updateDoc(busRef, {
        lat,
        lng,
        speed,
        bearing,
        status,
        timestamp: serverTimestamp(),
        isAtStop,
        currentStopIndex: this.currentStopIndex,
        nextStopId: this.routeStops[nextStopIndex]?.id || '',
        ...(isAtStop && { stopArrivalTime: serverTimestamp() }),
      });

      this.currentPosition = { lat, lng };

    } catch (error) {
      console.error('Error al actualizar posición:', error);
    }
  }

  /**
   * Elimina el documento de liveBuses
   */
  private async deleteLiveBusDocument(): Promise<void> {
    if (!this.config) return;

    try {
      const db = getDB();
      await deleteDoc(doc(db, 'liveBuses', this.config.busId));
      console.log('🗑️ Documento de bus en vivo eliminado');
    } catch (error) {
      console.error('Error al eliminar documento:', error);
    }
  }

  /**
   * Calcula la distancia entre dos puntos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calcula el bearing (dirección) entre dos puntos
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /**
   * Verifica si la simulación está activa
   */
  isActive(): boolean {
    return this.isSimulating;
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): SimulatorConfig | null {
    return this.config;
  }

  /**
   * Obtiene el progreso actual
   */
  getProgress(): {
    currentStop: number;
    totalStops: number;
    progress: number;
    currentPosition: { lat: number; lng: number };
  } {
    return {
      currentStop: this.currentStopIndex + 1,
      totalStops: this.routeStops.length,
      progress: this.progress,
      currentPosition: this.currentPosition,
    };
  }
}

// Exportar instancia singleton
export const busSimulator = new BusSimulator();

// Exportar tipos
export type { SimulatorConfig, RouteStop };
