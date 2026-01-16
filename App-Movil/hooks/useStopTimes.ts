import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StopTime {
  tripId: string;
  arrivalTime: string;
  departureTime: string;
  stopSequence: number;
}

interface StopTimeEntry {
  stopId: string;
  stopSequence: number;
  arrivalTime: string;
  departureTime: string;
}

export function useStopTimes(stopId: string | null) {
  const [stopTimes, setStopTimes] = useState<StopTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stopId) {
      setStopTimes([]);
      return;
    }

    const fetchStopTimes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todos los documentos de stop_times (estructura anidada)
        const stopTimesSnapshot = await getDocs(collection(db, 'stop_times'));
        const allStopTimes: StopTime[] = [];

        // Filtrar horarios de esta parada
        stopTimesSnapshot.forEach((doc) => {
          const data = doc.data();
          const tripId = data.tripId;

          if (data.times && Array.isArray(data.times)) {
            data.times.forEach((time: StopTimeEntry) => {
              if (time.stopId === stopId) {
                allStopTimes.push({
                  tripId,
                  arrivalTime: time.arrivalTime,
                  departureTime: time.departureTime,
                  stopSequence: time.stopSequence,
                });
              }
            });
          }
        });

        // Ordenar por hora de llegada
        allStopTimes.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));

        setStopTimes(allStopTimes);
      } catch (err) {
        console.error('Error fetching stop times:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    fetchStopTimes();
  }, [stopId]);

  return { stopTimes, loading, error };
}

/**
 * Formatea la hora GTFS (HH:MM:SS) para mostrar solo HH:MM
 */
export function formatGTFSTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Agrupa los horarios por hora para mejor visualización
 */
export function groupStopTimesByHour(stopTimes: StopTime[]): Record<string, StopTime[]> {
  const grouped: Record<string, StopTime[]> = {};

  stopTimes.forEach((st) => {
    const hour = st.arrival_time.slice(0, 2);
    if (!grouped[hour]) {
      grouped[hour] = [];
    }
    grouped[hour].push(st);
  });

  return grouped;
}
