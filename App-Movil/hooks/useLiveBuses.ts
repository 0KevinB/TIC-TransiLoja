/**
 * Hook para obtener buses en vivo desde Firebase
 * Este hook se usa en la app de USUARIOS para visualizar los buses
 *
 * OPTIMIZACIONES:
 * - Reducción de logging para mejorar rendimiento
 * - Manejo eficiente de actualizaciones en tiempo real
 */

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, Timestamp, limit, orderBy } from 'firebase/firestore';
import { db as getDB } from '@/lib/firebase';

// Límite máximo de buses en vivo para optimizar rendimiento
const MAX_LIVE_BUSES = 50;

export interface LiveBus {
  id: string;
  busId: string;
  routeId?: string;
  tripId?: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  direction: number;
  status: 'moving' | 'stopped';
  timestamp: Date;
  isAtStop: boolean;
  currentStopIndex: number;
  nextStopId: string;
  routeStops: string[];
  delay: number;
  stopArrivalTime?: Date;
}

interface UseLiveBusesOptions {
  routeId?: string; // Filtrar por ruta específica
  autoRefresh?: boolean; // Actualización automática (default: true)
}

export function useLiveBuses(options: UseLiveBusesOptions = {}) {
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options.autoRefresh === false) {
      setLoading(false);
      return;
    }

    try {
      // Obtener instancia de Firestore
      const db = getDB();

      // Construir query con límites y ordenamiento
      // 🔥 ÍNDICE REQUERIDO: timestamp (DESC)
      // Ver FIREBASE_INDEXES.md para más detalles
      let q = query(
        collection(db, 'liveBuses'),
        orderBy('timestamp', 'desc'),
        limit(MAX_LIVE_BUSES)
      );

      // Filtrar por ruta si se especifica
      // 🔥 ÍNDICE COMPUESTO REQUERIDO: routeId (ASC), timestamp (DESC)
      // Ver FIREBASE_INDEXES.md para más detalles
      if (options.routeId) {
        q = query(
          collection(db, 'liveBuses'),
          where('routeId', '==', options.routeId),
          orderBy('timestamp', 'desc'),
          limit(MAX_LIVE_BUSES)
        );
      }

      // Suscribirse a cambios en tiempo real
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const liveBuses: LiveBus[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();

            liveBuses.push({
              id: doc.id,
              busId: data.busId,
              routeId: data.routeId,
              tripId: data.tripId,
              lat: data.lat,
              lng: data.lng,
              speed: data.speed || 0,
              bearing: data.bearing || 0,
              direction: data.direction || 0,
              status: data.status || 'stopped',
              timestamp: data.timestamp instanceof Timestamp
                ? data.timestamp.toDate()
                : new Date(),
              isAtStop: data.isAtStop || false,
              currentStopIndex: data.currentStopIndex || 0,
              nextStopId: data.nextStopId || '',
              routeStops: data.routeStops || [],
              delay: data.delay || 0,
              stopArrivalTime: data.stopArrivalTime instanceof Timestamp
                ? data.stopArrivalTime.toDate()
                : undefined,
            });
          });

          // Log reducido solo en desarrollo
          if (__DEV__) {
            console.log(`[LiveBuses] ${liveBuses.length} buses activos`);
          }

          setBuses(liveBuses);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[LiveBuses] Error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup
      return () => unsubscribe();

    } catch (err) {
      console.error('[LiveBuses] Error al configurar listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [options.routeId, options.autoRefresh]);

  return { buses, loading, error };
}
