/**
 * Servicio de Caché de Imágenes
 * Optimiza la carga de imágenes con caché en memoria
 */

import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

interface CachedImage {
  uri: string;
  localUri: string;
  timestamp: number;
}

class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private readonly cacheDir = `${FileSystem.cacheDirectory}images/`;
  private readonly maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Error inicializando caché de imágenes:', error);
    }
  }

  /**
   * Obtiene una imagen del caché o la descarga
   */
  async getCachedImage(uri: string): Promise<string> {
    // Verificar si está en memoria
    const cached = this.cache.get(uri);
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.localUri;
    }

    // Generar nombre de archivo
    const filename = this.getFilename(uri);
    const localUri = this.cacheDir + filename;

    try {
      // Verificar si existe en disco
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        const cachedImage: CachedImage = {
          uri,
          localUri,
          timestamp: Date.now(),
        };
        this.cache.set(uri, cachedImage);
        return localUri;
      }

      // Descargar imagen
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      const cachedImage: CachedImage = {
        uri,
        localUri: downloadResult.uri,
        timestamp: Date.now(),
      };
      this.cache.set(uri, cachedImage);
      return downloadResult.uri;
    } catch (error) {
      console.error('Error descargando imagen:', error);
      return uri; // Devolver URI original si falla
    }
  }

  /**
   * Pre-carga una imagen
   */
  async prefetch(uri: string): Promise<void> {
    try {
      await Image.prefetch(uri);
    } catch (error) {
      console.error('Error pre-cargando imagen:', error);
    }
  }

  /**
   * Pre-carga múltiples imágenes
   */
  async prefetchBatch(uris: string[]): Promise<void> {
    await Promise.all(uris.map(uri => this.prefetch(uri)));
  }

  /**
   * Limpia imágenes antiguas
   */
  async cleanOldImages(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const fileUri = this.cacheDir + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const age = now - fileInfo.modificationTime * 1000;
          if (age > this.maxAge) {
            await FileSystem.deleteAsync(fileUri);
          }
        }
      }

      console.log('✅ Caché de imágenes limpiado');
    } catch (error) {
      console.error('Error limpiando caché de imágenes:', error);
    }
  }

  /**
   * Limpia todo el caché de imágenes
   */
  async clearAll(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, {
        intermediates: true,
      });
      this.cache.clear();
      console.log('✅ Caché de imágenes eliminado');
    } catch (error) {
      console.error('Error limpiando caché de imágenes:', error);
    }
  }

  /**
   * Genera nombre de archivo desde URI
   */
  private getFilename(uri: string): string {
    const hash = this.hashCode(uri);
    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    return `${hash}.${extension}`;
  }

  /**
   * Hash simple para nombres de archivo
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Obtiene el tamaño del caché
   */
  async getCacheSize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const fileUri = this.cacheDir + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculando tamaño del caché:', error);
      return 0;
    }
  }
}

export const imageCacheService = new ImageCacheService();
