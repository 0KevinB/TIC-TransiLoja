import { doc, updateDoc, serverTimestamp, GeoPoint, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as Location from 'expo-location';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

class DriverLocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private conductorId: string | null = null;
  private busId: string | null = null;
  private routeId: string | null = null;
  private tripId: string | null = null;
  private updateInterval = 5000; // Actualizar cada 5 segundos

  /**
   * Inicia el seguimiento de ubicación del conductor
   */
  async startTracking(
    conductorId: string,
    busId: string,
    routeId?: string,
    tripId?: string
  ): Promise<boolean> {
    console.log('🚗 Iniciando seguimiento GPS para conductor:', conductorId, 'en bus:', busId);

    try {
      // Verificar permisos de ubicación
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        console.error('❌ Permiso de ubicación denegado');
        return false;
      }

      // Solicitar permisos de ubicación en segundo plano (opcional, para mejor precisión)
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (error) {
        console.warn('⚠️ No se pudieron obtener permisos de ubicación en segundo plano:', error);
      }

      this.conductorId = conductorId;
      this.busId = busId;
      this.routeId = routeId || null;
      this.tripId = tripId || null;
      this.isTracking = true;

      // Configurar el seguimiento de ubicación
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: this.updateInterval,
          distanceInterval: 10, // Actualizar cada 10 metros de movimiento
        },
        async (location) => {
          await this.updateLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            accuracy: location.coords.accuracy,
          });
        }
      );

      console.log('✅ Seguimiento GPS iniciado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al iniciar seguimiento GPS:', error);
      this.isTracking = false;
      return false;
    }
  }

  /**
   * Detiene el seguimiento de ubicación
   */
  async stopTracking(): Promise<void> {
    console.log('🛑 Deteniendo seguimiento GPS');

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Actualizar el estado del bus a "offline" en Firebase (liveBuses collection)
    if (this.busId) {
      try {
        const database = db();
        await updateDoc(doc(database, 'liveBuses', this.busId), {
          status: 'stopped',
          lastUpdated: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error al actualizar estado del bus:', error);
      }
    }

    this.isTracking = false;
    this.conductorId = null;
    this.busId = null;
    this.routeId = null;
    this.tripId = null;

    console.log('✅ Seguimiento GPS detenido');
  }

  /**
   * Actualiza la ubicación del bus en Firebase (liveBuses collection)
   */
  private async updateLocation(location: LocationUpdate): Promise<void> {
    if (!this.busId || !this.isTracking) {
      return;
    }

    try {
      const database = db();

      // Calcular estado basado en velocidad
      const speedKmh = location.speed ? Math.round(location.speed * 3.6) : 0;
      const status = speedKmh > 5 ? 'moving' : 'stopped';

      // Actualizar ubicación del bus en tiempo real en la colección liveBuses
      const updateData = {
        busId: this.busId,
        lat: location.latitude,
        lng: location.longitude,
        speed: speedKmh,
        bearing: location.heading || 0,
        status: status,
        timestamp: serverTimestamp(),
        accuracy: location.accuracy || 0,
        conductorId: this.conductorId,
        routeId: this.routeId,
        tripId: this.tripId,
      };

      await setDoc(doc(database, 'liveBuses', this.busId), updateData, { merge: true });

      console.log(`📍 Ubicación actualizada en tiempo real: (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}) - ${status}`);
    } catch (error) {
      console.error('❌ Error al actualizar ubicación en Firebase:', error);
    }
  }

  /**
   * Verifica si el seguimiento está activo
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Obtiene el ID del bus actual
   */
  getCurrentBusId(): string | null {
    return this.busId;
  }

  /**
   * Obtiene el ID del conductor actual
   */
  getCurrentConductorId(): string | null {
    return this.conductorId;
  }
}

// Exportar una instancia única (singleton)
export const driverLocationService = new DriverLocationService();
