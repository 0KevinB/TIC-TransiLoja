import AsyncStorage from '@react-native-async-storage/async-storage';

interface RouteData {
  distance: number; // metros
  duration: number; // segundos
  polyline?: string;
  lastUpdated: number; // timestamp
}

interface CacheKey {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  mode: 'walking' | 'driving';
}

class RouteCache {
  private cache = new Map<string, RouteData>();
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días
  private readonly STORAGE_KEY = 'TransiLoja_RouteCache';
  private readonly DISTANCE_THRESHOLD = 50; // metros para considerar ubicaciones iguales

  constructor() {
    this.loadFromStorage();
  }

  private generateKey(from: { lat: number; lng: number }, to: { lat: number; lng: number }, mode: string): string {
    // Redondear coordenadas para agrupar ubicaciones cercanas
    const fromLatRounded = Math.round(from.lat * 10000) / 10000;
    const fromLngRounded = Math.round(from.lng * 10000) / 10000;
    const toLatRounded = Math.round(to.lat * 10000) / 10000;
    const toLngRounded = Math.round(to.lng * 10000) / 10000;
    
    return `${fromLatRounded},${fromLngRounded}-${toLatRounded},${toLngRounded}-${mode}`;
  }

  private isLocationSimilar(
    loc1: { lat: number; lng: number }, 
    loc2: { lat: number; lng: number }
  ): boolean {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    return distance <= this.DISTANCE_THRESHOLD;
  }

  async get(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    mode: 'walking' | 'driving' = 'walking'
  ): Promise<RouteData | null> {
    // Buscar en caché exacto
    const exactKey = this.generateKey(from, to, mode);
    const exactMatch = this.cache.get(exactKey);
    
    if (exactMatch && this.isValidCache(exactMatch)) {
      return exactMatch;
    }

    // Buscar coincidencias similares en el caché
    for (const [key, data] of this.cache.entries()) {
      if (!this.isValidCache(data)) continue;
      
      const [coords, cachedMode] = key.split('-');
      if (cachedMode !== mode) continue;
      
      const [fromCoords, toCoords] = coords.split('->');
      if (!fromCoords || !toCoords) continue;
      
      const [fromLat, fromLng] = fromCoords.split(',').map(Number);
      const [toLat, toLng] = toCoords.split(',').map(Number);
      
      if (
        this.isLocationSimilar(from, { lat: fromLat, lng: fromLng }) &&
        this.isLocationSimilar(to, { lat: toLat, lng: toLng })
      ) {
        return data;
      }
    }

    return null;
  }

  async set(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    data: Omit<RouteData, 'lastUpdated'>,
    mode: 'walking' | 'driving' = 'walking'
  ): Promise<void> {
    const key = this.generateKey(from, to, mode);
    const routeData: RouteData = {
      ...data,
      lastUpdated: Date.now()
    };
    
    this.cache.set(key, routeData);
    await this.saveToStorage();
  }

  private isValidCache(data: RouteData): boolean {
    const now = Date.now();
    return (now - data.lastUpdated) < this.CACHE_DURATION;
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, data] of this.cache.entries()) {
      if ((now - data.lastUpdated) >= this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      await this.saveToStorage();
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data));
        await this.clearExpired(); // Limpiar datos expirados al cargar
      }
    } catch (error) {
      console.warn('Error loading route cache from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = Object.fromEntries(this.cache.entries());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving route cache to storage:', error);
    }
  }

  // Estadísticas para debugging
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const data of this.cache.values()) {
      if (this.isValidCache(data)) {
        valid++;
      } else {
        expired++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      cacheHitRate: this.cache.size > 0 ? (valid / this.cache.size) : 0
    };
  }
}

export const routeCache = new RouteCache();
export type { RouteData };