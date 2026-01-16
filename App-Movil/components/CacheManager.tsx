/**
 * Componente de gestión de caché
 * Limpia automáticamente el caché expirado
 */

import { useEffect } from 'react';
import { cacheService } from '@/lib/cacheService';
import { imageCacheService } from '@/lib/performance/imageCache';

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora

export function CacheManager() {
  useEffect(() => {
    // Limpiar caché expirado al iniciar
    const initialCleanup = async () => {
      console.log('🧹 Limpieza inicial de caché...');
      await cacheService.cleanExpired();
      await imageCacheService.cleanOldImages();
    };

    initialCleanup();

    // Programar limpiezas periódicas
    const interval = setInterval(async () => {
      console.log('🧹 Limpieza programada de caché...');
      await cacheService.cleanExpired();
      await imageCacheService.cleanOldImages();
    }, CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return null; // Componente sin UI
}
