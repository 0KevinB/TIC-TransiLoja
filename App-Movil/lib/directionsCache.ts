import { LatLng } from './googleMaps';
import { DirectionsRoute } from '../hooks/useDirections';

interface CacheKey {
  origin: string;
  destination: string;
  mode: 'walking' | 'driving' | 'transit';
}

interface CacheEntry {
  data: DirectionsRoute;
  timestamp: number;
  expiresAt: number;
}

class DirectionsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutos
  private readonly WALKING_TTL = 60 * 60 * 1000; // 1 hora para caminata
  private readonly TRANSIT_TTL = 10 * 60 * 1000; // 10 minutos para tránsito

  private generateKey(origin: LatLng, destination: LatLng, mode: string): string {
    // Redondear coordenadas para aumentar hits del cache
    const originKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}`;
    const destinationKey = `${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`;
    return `${originKey}-${destinationKey}-${mode}`;
  }

  private getTTL(mode: string): number {
    switch (mode) {
      case 'walking':
        return this.WALKING_TTL;
      case 'transit':
        return this.TRANSIT_TTL;
      case 'driving':
      default:
        return this.DEFAULT_TTL;
    }
  }

  get(origin: LatLng, destination: LatLng, mode: string): DirectionsRoute | null {
    const key = this.generateKey(origin, destination, mode);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si la entrada ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(origin: LatLng, destination: LatLng, mode: string, data: DirectionsRoute): void {
    const key = this.generateKey(origin, destination, mode);
    const ttl = this.getTTL(mode);
    const timestamp = Date.now();

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + ttl
    });

    // Limpiar entradas expiradas si el cache crece mucho
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  has(origin: LatLng, destination: LatLng, mode: string): boolean {
    const key = this.generateKey(origin, destination, mode);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Verificar si la entrada ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      expired
    };
  }

  // Método para pre-cargar rutas comunes
  async warmup(commonRoutes: Array<{ origin: LatLng; destination: LatLng; mode: string }>) {
    // Este método puede ser usado para pre-cargar rutas frecuentemente usadas
    console.log(`Warming up cache with ${commonRoutes.length} routes`);
  }
}

// Exportar instancia singleton
export const directionsCache = new DirectionsCache();

export default DirectionsCache;