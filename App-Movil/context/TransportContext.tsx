import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../lib/firebase';
import { Parada, Ruta, Bus, Alerta, Municipio } from '../lib/types';
import { OfflineStorageService } from '../lib/offlineStorage';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../lib/cacheService';

const VIEWED_ALERTS_KEY = '@TransiLoja:viewedAlerts';

// Límites de queries para optimizar rendimiento
const QUERY_LIMITS = {
  ALERTS: 100, // Máximo de alertas (activas + recientes)
  BUSES: 200,  // Máximo de buses
};

interface TransportContextType {
  paradas: Parada[];
  rutas: Ruta[];
  buses: Bus[];
  alertas: Alerta[];
  municipio: Municipio | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>; // Forzar recarga manual
  getBusesEnRuta: (rutaId: string) => Bus[];
  getParadasCercanas: (lat: number, lng: number, radius?: number) => Parada[];
  getAlertasActivas: () => Alerta[];
  getUnviewedAlertsCount: () => number;
  markAlertsAsViewed: () => Promise<void>;
  viewedAlertIds: string[];
  isOfflineMode: boolean;
  downloadOfflineData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  hasOfflineData: boolean;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

interface TransportProviderProps {
  children: ReactNode;
  municipioId?: string;
}

export const TransportProvider: React.FC<TransportProviderProps> = ({
  children,
  municipioId = process.env.EXPO_PUBLIC_MUNICIPALITY_ID || 'loja'
}) => {
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [municipio, setMunicipio] = useState<Municipio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Flag para evitar cargas múltiples
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [viewedAlertIds, setViewedAlertIds] = useState<string[]>([]);
  const networkStatus = useNetworkStatus();
  const isOfflineMode = !networkStatus.isConnected || !networkStatus.isInternetReachable;

  // Cargar alertas vistas al iniciar
  useEffect(() => {
    loadViewedAlerts();
  }, []);

  const loadViewedAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem(VIEWED_ALERTS_KEY);
      if (stored) {
        setViewedAlertIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading viewed alerts:', error);
    }
  };

  // Suscripción en tiempo real para alertas
  useEffect(() => {
    if (isOfflineMode) return;

    console.log('🔔 Iniciando suscripción en tiempo real a alertas...');

    const alertasQuery = query(
      collection(db(), 'alerts'),
      orderBy('startDate', 'desc'),
      limit(QUERY_LIMITS.ALERTS)
    );

    const unsubscribe = onSnapshot(alertasQuery, (snapshot) => {
      const alertasData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.title,
          mensaje: data.description || data.message || '',
          tipo: data.type === 'warning' ? 'advertencia' : data.type === 'critical' ? 'critica' : 'informacion',
          ruta_ids: data.affectedRoutes || [],
          parada_ids: data.affectedStops || [],
          alternativeRoute: data.alternativeRoute || '',
          activa: data.isActive !== false && data.active !== false,
          fecha_inicio: data.startDate?.toDate() || new Date(),
          fecha_fin: data.endDate?.toDate(),
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Alerta[];

      setAlertas(alertasData);
      console.log(`🔔 Alertas actualizadas en tiempo real: ${alertasData.length}`);
    }, (err) => {
      console.error('Error en suscripción de alertas:', err);
    });

    return () => {
      console.log('🔔 Cancelando suscripción de alertas');
      unsubscribe();
    };
  }, [isOfflineMode]);

  // Verificar si hay datos offline al iniciar
  useEffect(() => {
    checkOfflineData();
  }, []);

  // Inicializar datos considerando el estado de red
  useEffect(() => {
    if (!isInitialized && networkStatus.type !== null) {
      console.log('🚀 INICIALIZANDO TRANSPORT PROVIDER');
      console.log('📶 Estado de red:', {
        isConnected: networkStatus.isConnected,
        isInternetReachable: networkStatus.isInternetReachable,
        type: networkStatus.type,
      });

      if (isOfflineMode) {
        console.log('📵 Modo offline detectado, cargando datos offline...');
        loadOfflineData();
      } else {
        console.log('📶 Modo online, cargando datos desde Firebase...');
        loadData();
      }
    }
  }, [isInitialized, networkStatus.type, isOfflineMode]);

  // Cambiar entre modo online/offline automáticamente
  useEffect(() => {
    if (isInitialized) {
      if (isOfflineMode && hasOfflineData) {
        console.log('📵 Cambiando a modo offline...');
        loadOfflineData();
      } else if (!isOfflineMode && !loading) {
        console.log('📶 Conexión restaurada, recargando datos online...');
        loadData();
      }
    }
  }, [isOfflineMode, hasOfflineData]);

  const loadMunicipio = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const database = db();
      const municipioQuery = query(
        collection(database, 'municipios'),
        where('codigo', '==', municipioId),
        limit(1)
      );
      const municipioSnapshot = await getDocs(municipioQuery);
      
      if (!municipioSnapshot.empty) {
        const municipioDoc = municipioSnapshot.docs[0];
        const data = municipioDoc.data();
        setMunicipio({
          id: municipioDoc.id,
          nombre: data.nombre,
          codigo: data.codigo,
          configuracion: data.configuracion,
          activo: data.activo,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        });
      }
    } catch (err) {
      console.error('Error loading municipio:', err);
      setError('Error al cargar datos del municipio');
    }
  };

  const subscribeToTransportData = () => {
    const unsubscribeFunctions: Array<() => void> = [];

    // Suscripción a paradas
    const paradasQuery = query(
      collection(db(), 'paradas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true)
    );
    
    const unsubscribeParadas = onSnapshot(paradasQuery, (snapshot) => {
      const paradasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Parada[];
      setParadas(paradasData);
    }, (err) => {
      console.error('Error subscribing to paradas:', err);
      setError('Error al cargar paradas');
    });
    unsubscribeFunctions.push(unsubscribeParadas);

    // Suscripción a rutas
    const rutasQuery = query(
      collection(db(), 'rutas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true)
    );
    
    const unsubscribeRutas = onSnapshot(rutasQuery, (snapshot) => {
      const rutasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Ruta[];
      setRutas(rutasData);
    }, (err) => {
      console.error('Error subscribing to rutas:', err);
      setError('Error al cargar rutas');
    });
    unsubscribeFunctions.push(unsubscribeRutas);

    // Suscripción a buses
    const busesQuery = query(
      collection(db(), 'buses'),
      where('municipio_id', '==', municipioId),
      where('estado', '==', 'activo')
    );
    
    const unsubscribeBuses = onSnapshot(busesQuery, (snapshot) => {
      const busesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
        ubicacion_actual: doc.data().ubicacion_actual ? {
          ...doc.data().ubicacion_actual,
          timestamp: doc.data().ubicacion_actual.timestamp?.toDate() || new Date(),
        } : undefined,
      })) as Bus[];
      setBuses(busesData);
    }, (err) => {
      console.error('Error subscribing to buses:', err);
      setError('Error al cargar buses');
    });
    unsubscribeFunctions.push(unsubscribeBuses);

    // Suscripción a alertas
    const alertasQuery = query(
      collection(db(), 'alertas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribeAlertas = onSnapshot(alertasQuery, (snapshot) => {
      const alertasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
        fecha_fin: doc.data().fecha_fin?.toDate(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Alerta[];
      setAlertas(alertasData);
    }, (err) => {
      console.error('Error subscribing to alertas:', err);
      setError('Error al cargar alertas');
    });
    unsubscribeFunctions.push(unsubscribeAlertas);

    setLoading(false);

    // Función de limpieza
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  };

  const checkOfflineData = async () => {
    const hasData = await OfflineStorageService.hasOfflineData();
    setHasOfflineData(hasData);
  };

  const loadOfflineData = async () => {
    setLoading(true);
    setError(null);

    console.log('=== CARGANDO DATOS OFFLINE ===');

    try {
      const offlineData = await OfflineStorageService.getAllData();

      if (offlineData) {
        setParadas(offlineData.paradas);
        setRutas(offlineData.rutas);
        setAlertas(offlineData.alertas);
        setBuses([]); // Los buses en tiempo real no están disponibles offline
        console.log(`📥 Datos offline cargados: ${offlineData.paradas.length} paradas, ${offlineData.rutas.length} rutas, ${offlineData.alertas.length} alertas`);
      } else {
        console.warn('⚠️ No hay datos offline disponibles');
        setParadas([]);
        setRutas([]);
        setAlertas([]);
        setBuses([]);
        setError('No hay datos offline disponibles. Necesitas conexión para descargarlos.');
      }
    } catch (err) {
      console.error('❌ Error loading offline data:', err);
      setError('Error al cargar datos offline');
      setParadas([]);
      setRutas([]);
      setAlertas([]);
      setBuses([]);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const downloadOfflineData = async () => {
    console.log('⬇️ Iniciando descarga de datos offline...');

    try {
      // Primero cargar datos online
      const database = db();

      // Cargar paradas
      const paradasSnapshot = await getDocs(collection(database, 'stops'));
      const paradasData = paradasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          id_parada: doc.id,
          nombre: data.stop_name || data.name || 'Sin nombre',
          ubicacion: {
            latitud: data.stop_lat || data.lat || 0,
            longitud: data.stop_lon || data.lng || 0,
          },
          coordenadas: {
            lat: data.stop_lat || data.lat || 0,
            lng: data.stop_lon || data.lng || 0,
          },
          codigo: data.stop_code || data.code || '',
          municipio_id: data.municipio_id || 'loja',
          activa: true,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Parada[];

      // Cargar rutas
      const rutasSnapshot = await getDocs(collection(database, 'routes'));
      const rutasData = rutasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          id_ruta: doc.id,
          numero: data.route_short_name || data.routeNumber || data.shortName || data.name || 'N/A',
          nombre: data.route_long_name || data.name || 'Sin nombre',
          color: (data.route_color || data.color || '3B82F6').replace('#', ''),
          paradas: data.custom_stop_ids || data.stopIds || [],
          stopIds: data.custom_stop_ids || data.stopIds || [],
          municipio_id: data.municipio_id || 'loja',
          activa: data.active !== false,
          operatingStartTime: data.operatingStartTime,
          operatingEndTime: data.operatingEndTime,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Ruta[];

      // Cargar alertas (ordenadas por fecha de inicio, limitadas)
      // 🔥 ÍNDICE REQUERIDO: startDate (DESC)
      // Ver App-Movil/FIREBASE_INDEXES.md para configuración
      const alertasQuery = query(
        collection(database, 'alerts'),
        orderBy('startDate', 'desc'),
        limit(QUERY_LIMITS.ALERTS)
      );
      const alertasSnapshot = await getDocs(alertasQuery);
      const alertasData = alertasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.title,
          mensaje: data.description || data.message || '',
          tipo: data.type === 'warning' ? 'advertencia' : data.type === 'critical' ? 'critica' : 'informacion',
          ruta_ids: data.affectedRoutes || [],
          parada_ids: data.affectedStops || [],
          alternativeRoute: data.alternativeRoute || '',
          activa: data.isActive !== false && data.active !== false,
          fecha_inicio: data.startDate?.toDate() || new Date(),
          fecha_fin: data.endDate?.toDate(),
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Alerta[];

      // Guardar en AsyncStorage
      await OfflineStorageService.saveAllData(paradasData, rutasData, alertasData);

      setHasOfflineData(true);
      console.log('✅ Datos offline descargados y guardados correctamente');
    } catch (err) {
      console.error('❌ Error downloading offline data:', err);
      throw err;
    }
  };

  const clearOfflineData = async () => {
    await OfflineStorageService.clearAllData();
    setHasOfflineData(false);
    console.log('🗑️ Datos offline eliminados');
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    console.log('=== INICIANDO CARGA DE DATOS CON CACHÉ ===');

    try {
      const database = db();

      // Cargar paradas con caché
      console.log('Cargando paradas (con caché)...');
      const paradasData = await cacheService.getOrSet<Parada[]>(
        CACHE_KEYS.STOPS,
        async () => {
          console.log('📥 Descargando paradas desde Firebase...');
          const paradasSnapshot = await getDocs(collection(database, 'stops'));
          return paradasSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              id_parada: doc.id,
              nombre: data.stop_name || data.name || 'Sin nombre',
              ubicacion: {
                latitud: data.stop_lat || data.lat || 0,
                longitud: data.stop_lon || data.lng || 0,
              },
              coordenadas: {
                lat: data.stop_lat || data.lat || 0,
                lng: data.stop_lon || data.lng || 0,
              },
              codigo: data.stop_code || data.code || '',
              municipio_id: data.municipio_id || 'loja',
              activa: true,
              created_at: data.createdAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
            };
          }) as Parada[];
        },
        CACHE_TTL.STATIC_DATA
      );
      setParadas(paradasData);
      console.log(`✅ ${paradasData.length} paradas cargadas`);

      // Cargar rutas con caché
      console.log('Cargando rutas (con caché)...');
      const rutasData = await cacheService.getOrSet<Ruta[]>(
        CACHE_KEYS.ROUTES,
        async () => {
          console.log('📥 Descargando rutas desde Firebase...');
          const rutasSnapshot = await getDocs(collection(database, 'routes'));
          return rutasSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              id_ruta: doc.id,
              numero: data.route_short_name || data.routeNumber || data.shortName || data.name || 'N/A',
              nombre: data.route_long_name || data.name || 'Sin nombre',
              color: (data.route_color || data.color || '3B82F6').replace('#', ''),
              paradas: data.custom_stop_ids || data.stopIds || [],
              stopIds: data.custom_stop_ids || data.stopIds || [],
              municipio_id: data.municipio_id || 'loja',
              activa: data.active !== false,
              operatingStartTime: data.operatingStartTime,
              operatingEndTime: data.operatingEndTime,
              created_at: data.createdAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
            };
          }) as Ruta[];
        },
        CACHE_TTL.STATIC_DATA
      );
      setRutas(rutasData);
      console.log(`✅ ${rutasData.length} rutas cargadas`);

      // Cargar buses con caché (TTL más corto para datos dinámicos)
      console.log('Cargando buses (con caché)...');
      const busesData = await cacheService.getOrSet<Bus[]>(
        CACHE_KEYS.BUSES,
        async () => {
          console.log('📥 Descargando buses desde Firebase...');
          const busesSnapshot = await getDocs(collection(database, 'buses'));
          return busesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              numero_placa: data.licensePlate || data.plateNumber,
              estado: data.status || 'activo',
              coordenadas_actuales: data.currentLocation ? {
                lat: data.currentLocation.lat,
                lng: data.currentLocation.lng
              } : null,
              coordenadas: data.currentLocation ? {
                lat: data.currentLocation.lat,
                lng: data.currentLocation.lng
              } : null,
              ruta_asignada: data.assignedRoute,
              created_at: data.createdAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
            };
          }) as Bus[];
        },
        CACHE_TTL.DYNAMIC_DATA
      );
      setBuses(busesData);
      console.log(`✅ ${busesData.length} buses cargados`);

      // Cargar alertas con caché (ordenadas y limitadas)
      console.log('Cargando alertas (con caché)...');
      const alertasData = await cacheService.getOrSet<Alerta[]>(
        CACHE_KEYS.ALERTS,
        async () => {
          console.log('📥 Descargando alertas desde Firebase...');
          // 🔥 ÍNDICE REQUERIDO: startDate (DESC)
          // Ver App-Movil/FIREBASE_INDEXES.md
          const alertasQuery = query(
            collection(database, 'alerts'),
            orderBy('startDate', 'desc'),
            limit(QUERY_LIMITS.ALERTS)
          );
          const alertasSnapshot = await getDocs(alertasQuery);
          return alertasSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              titulo: data.title,
              mensaje: data.description || data.message || '',
              tipo: data.type === 'warning' ? 'advertencia' : data.type === 'critical' ? 'critica' : 'informacion',
              ruta_ids: data.affectedRoutes || [],
              parada_ids: data.affectedStops || [],
              alternativeRoute: data.alternativeRoute || '',
              activa: data.isActive !== false && data.active !== false,
              fecha_inicio: data.startDate?.toDate() || new Date(),
              fecha_fin: data.endDate?.toDate(),
              created_at: data.createdAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
            };
          }) as Alerta[];
        },
        CACHE_TTL.STATIC_DATA
      );
      setAlertas(alertasData);
      console.log(`✅ ${alertasData.length} alertas cargadas`);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos del transporte');
    } finally {
      console.log('=== CARGA DE DATOS COMPLETADA ===');
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const refreshData = async () => {
    if (loading) {
      console.log('⚠️ refreshData: Ya hay una carga en progreso, ignorando');
      return;
    }
    console.log('🔄 refreshData: Invalidando caché y recargando datos');
    // Invalidar caché antes de recargar
    await cacheService.remove(CACHE_KEYS.STOPS);
    await cacheService.remove(CACHE_KEYS.ROUTES);
    await cacheService.remove(CACHE_KEYS.BUSES);
    await cacheService.remove(CACHE_KEYS.ALERTS);
    await loadData();
  };

  const forceRefresh = async () => {
    console.log('🔄 FORZANDO RECARGA MANUAL - Limpiando caché');
    // Invalidar caché antes de recargar
    await cacheService.remove(CACHE_KEYS.STOPS);
    await cacheService.remove(CACHE_KEYS.ROUTES);
    await cacheService.remove(CACHE_KEYS.BUSES);
    await cacheService.remove(CACHE_KEYS.ALERTS);
    await loadData();
  };

  // Función de cálculo de distancia memoizada (Haversine)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  const getBusesEnRuta = useCallback((rutaId: string): Bus[] => {
    return buses.filter(bus => bus.ruta_asignada === rutaId);
  }, [buses]);

  const getParadasCercanas = useCallback((lat: number, lng: number, radius: number = 1000): Parada[] => {
    if (!paradas.length) return [];

    // Pre-calcular constantes para optimización
    const radiusSq = radius * radius;
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;

    // Filtrar y mapear en una sola pasada
    const paradasConDistancia = paradas
      .filter(parada =>
        parada.ubicacion &&
        typeof parada.ubicacion.latitud === 'number' &&
        typeof parada.ubicacion.longitud === 'number'
      )
      .map(parada => {
        const distance = calculateDistance(lat, lng, parada.ubicacion.latitud, parada.ubicacion.longitud);
        return { parada, distance };
      })
      .filter(item => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return paradasConDistancia.map(item => ({
      ...item.parada,
      distancia: item.distance
    }));
  }, [paradas, calculateDistance]);

  const getAlertasActivas = useCallback((): Alerta[] => {
    const now = new Date();
    return alertas.filter(alerta => {
      if (!alerta.activa) return false;
      if (alerta.fecha_inicio > now) return false;
      if (alerta.fecha_fin && alerta.fecha_fin < now) return false;
      return true;
    });
  }, [alertas]);

  const getUnviewedAlertsCount = useCallback((): number => {
    const activas = getAlertasActivas();
    return activas.filter(alerta => !viewedAlertIds.includes(alerta.id)).length;
  }, [getAlertasActivas, viewedAlertIds]);

  const markAlertsAsViewed = useCallback(async () => {
    const activas = getAlertasActivas();
    const activeIds = activas.map(a => a.id);

    // Combinar con los ya vistos (mantener histórico pero limpiar los que ya no existen)
    const updatedViewedIds = [...new Set([...viewedAlertIds, ...activeIds])];

    try {
      await AsyncStorage.setItem(VIEWED_ALERTS_KEY, JSON.stringify(updatedViewedIds));
      setViewedAlertIds(updatedViewedIds);
    } catch (error) {
      console.error('Error saving viewed alerts:', error);
    }
  }, [getAlertasActivas, viewedAlertIds]);

  return (
    <TransportContext.Provider value={{
      paradas,
      rutas,
      buses,
      alertas,
      municipio,
      loading,
      error,
      refreshData,
      forceRefresh,
      getBusesEnRuta,
      getParadasCercanas,
      getAlertasActivas,
      getUnviewedAlertsCount,
      markAlertsAsViewed,
      viewedAlertIds,
      isOfflineMode,
      downloadOfflineData,
      clearOfflineData,
      hasOfflineData,
    }}>
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = (): TransportContextType => {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};