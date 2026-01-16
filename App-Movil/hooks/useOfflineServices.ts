import { useState, useEffect } from 'react';
import { offlineDataService } from '../lib/offlineDataService';
import { Conductor, Calendario, AsignacionServicio } from '../lib/types';
import { useNetworkStatus } from './useNetworkStatus';

export interface OfflineServicesData {
  conductores: Conductor[];
  calendarios: Calendario[];
  asignaciones: AsignacionServicio[];
  isOffline: boolean;
  loading: boolean;
}

export const useOfflineServices = (): OfflineServicesData => {
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const networkStatus = useNetworkStatus();
  const isOffline = !networkStatus.isConnected || !networkStatus.isInternetReachable;

  useEffect(() => {
    loadServicesData();
  }, []);

  const loadServicesData = async () => {
    try {
      setLoading(true);

      // Intentar cargar desde caché offline
      const offlineData = await offlineDataService.getOfflineData();

      if (offlineData) {
        setConductores(offlineData.conductores || []);
        setCalendarios(offlineData.calendarios || []);
        setAsignaciones(offlineData.asignaciones || []);
        console.log('📱 Datos de servicios cargados desde caché offline:', {
          conductores: offlineData.conductores?.length || 0,
          calendarios: offlineData.calendarios?.length || 0,
          asignaciones: offlineData.asignaciones?.length || 0
        });
      }
    } catch (error) {
      console.error('Error cargando datos de servicios desde caché offline:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    conductores,
    calendarios,
    asignaciones,
    isOffline,
    loading
  };
};
