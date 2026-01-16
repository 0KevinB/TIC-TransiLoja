import { useState, useCallback, useEffect, useRef } from 'react';
import { RutaOptima } from '../lib/types';
import { useTransport } from '../context/TransportContext';
import { RaptorManager, initializeRaptorManager, getRaptorManager } from '../lib/raptorManager';

interface RoutingState {
  rutas: RutaOptima[];
  loading: boolean;
  error: string | null;
  isUsingEnhanced: boolean;
  isPreloading: boolean;
  cacheStats: any;
}

export const useRouting = () => {
  const { paradas, rutas, buses } = useTransport();
  const raptorManagerRef = useRef<RaptorManager | null>(null);
  const [state, setState] = useState<RoutingState>({
    rutas: [],
    loading: false,
    error: null,
    isUsingEnhanced: false,
    isPreloading: false,
    cacheStats: null,
  });

  // Inicializar el manager cuando cambien los datos
  useEffect(() => {
    if (paradas.length > 0 && rutas.length > 0) {
      raptorManagerRef.current = initializeRaptorManager(paradas, rutas, buses);
      
      // Iniciar precarga en background
      raptorManagerRef.current.precargarDistancias().then(() => {
        updateState();
      }).catch(() => {
        updateState();
      });
      
      updateState();
    }
  }, [paradas, rutas, buses]);

  // Función para actualizar el estado con información del manager
  const updateState = useCallback(() => {
    const manager = raptorManagerRef.current;
    if (manager) {
      setState(prev => ({
        ...prev,
        isUsingEnhanced: manager.isUsingEnhanced(),
        isPreloading: manager.isPreloadingDistances(),
        cacheStats: manager.getCacheStats(),
      }));
    }
  }, []);

  const buscarRutas = useCallback(async (
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    horaInicio?: Date
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar que tenemos el manager disponible
      const manager = raptorManagerRef.current;
      if (!manager) {
        throw new Error('Sistema de rutas no inicializado');
      }

      // Verificar que tenemos datos disponibles
      if (paradas.length === 0 || rutas.length === 0) {
        throw new Error('Datos de transporte no disponibles');
      }

      // Buscar rutas óptimas usando el manager
      const rutasOptimas = await manager.encontrarRutaOptima(
        origenLat,
        origenLng,
        destinoLat,
        destinoLng,
        horaInicio
      );

      setState(prev => ({
        ...prev,
        rutas: rutasOptimas,
        loading: false,
        error: null,
      }));

      // Actualizar estado del manager
      updateState();

      return rutasOptimas;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        rutas: [],
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [paradas, rutas, buses, updateState]);

  const limpiarRutas = useCallback(() => {
    setState(prev => ({
      ...prev,
      rutas: [],
      loading: false,
      error: null,
    }));
  }, []);

  const toggleEnhanced = useCallback((enabled: boolean) => {
    const manager = raptorManagerRef.current;
    if (manager) {
      manager.setUseEnhanced(enabled);
      updateState();
    }
  }, [updateState]);

  const clearCache = useCallback(async () => {
    const manager = raptorManagerRef.current;
    if (manager) {
      await manager.clearCache();
      updateState();
    }
  }, [updateState]);

  return {
    ...state,
    buscarRutas,
    limpiarRutas,
    toggleEnhanced,
    clearCache,
    updateState,
  };
};