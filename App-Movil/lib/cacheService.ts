/**
 * Servicio de Caché Mejorado
 * Gestiona el almacenamiento en caché de datos con AsyncStorage
 * Incluye TTL (Time To Live) y limpieza automática
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface CacheConfig {
  defaultTTL?: number; // TTL por defecto (5 minutos)
  maxSize?: number; // Tamaño máximo del caché en bytes
}

class CacheService {
  private readonly CACHE_PREFIX = '@TransiLoja:cache:';
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private memoryCache: Map<string, CacheItem<any>> = new Map();

  constructor(config: CacheConfig = {}) {
    this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutos
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10 MB
  }

  /**
   * Guarda datos en caché (memoria + AsyncStorage)
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    const ttlToUse = ttl || this.defaultTTL;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlToUse,
    };

    // Guardar en memoria
    this.memoryCache.set(key, cacheItem);

    // Guardar en AsyncStorage
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  }

  /**
   * Obtiene datos del caché
   */
  async get<T>(key: string): Promise<T | null> {
    // Primero intentar obtener de memoria
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data as T;
    }

    // Si no está en memoria, buscar en AsyncStorage
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      // Verificar si expiró
      if (this.isExpired(cacheItem)) {
        await this.remove(key);
        return null;
      }

      // Restaurar en memoria
      this.memoryCache.set(key, cacheItem);

      return cacheItem.data;
    } catch (error) {
      console.error('Error leyendo caché:', error);
      return null;
    }
  }

  /**
   * Verifica si un item expiró
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Elimina un item del caché
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      const cacheKey = this.CACHE_PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error eliminando del caché:', error);
    }
  }

  /**
   * Limpia todos los items expirados
   */
  async cleanExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const cacheKey of cacheKeys) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (this.isExpired(cacheItem)) {
            await AsyncStorage.removeItem(cacheKey);
          }
        }
      }

      // Limpiar memoria
      for (const [key, item] of this.memoryCache.entries()) {
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
        }
      }

      console.log('✅ Caché limpiado');
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      this.memoryCache.clear();
      console.log('✅ Todo el caché eliminado');
    } catch (error) {
      console.error('Error limpiando todo el caché:', error);
    }
  }

  /**
   * Obtiene o establece datos (patrón cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar función y guardar
    const data = await fetchFunction();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Obtiene el tamaño aproximado del caché
   */
  async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculando tamaño del caché:', error);
      return 0;
    }
  }

  /**
   * Invalida caché por patrón
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key =>
        key.startsWith(this.CACHE_PREFIX) && key.includes(pattern)
      );

      await AsyncStorage.multiRemove(matchingKeys);

      // Limpiar de memoria también
      for (const [key] of this.memoryCache.entries()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }

      console.log(`✅ Caché invalidado para patrón: ${pattern}`);
    } catch (error) {
      console.error('Error invalidando caché:', error);
    }
  }
}

// Instancia singleton
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
  maxSize: 10 * 1024 * 1024, // 10 MB
});

// Claves de caché predefinidas
export const CACHE_KEYS = {
  ROUTES: 'routes',
  STOPS: 'stops',
  BUSES: 'buses',
  CONDUCTORES: 'conductores',
  TRIPS: 'trips',
  ALERTS: 'alerts',
  LIVE_BUSES: 'liveBuses',
  USER_FAVORITES: (userId: string) => `user:${userId}:favorites`,
  ROUTE_DETAIL: (routeId: string) => `route:${routeId}`,
  STOP_DETAIL: (stopId: string) => `stop:${stopId}`,
};

// TTL personalizados por tipo de dato
export const CACHE_TTL = {
  STATIC_DATA: 30 * 60 * 1000, // 30 minutos (rutas, paradas)
  DYNAMIC_DATA: 5 * 60 * 1000, // 5 minutos (buses en vivo)
  USER_DATA: 10 * 60 * 1000, // 10 minutos (favoritos)
  DETAILS: 15 * 60 * 1000, // 15 minutos (detalles de rutas/paradas)
};
