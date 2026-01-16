import { useState, useCallback } from 'react';
import { googleMapsService, LatLng } from '../lib/googleMaps';
import { directionsCache } from '../lib/directionsCache';

interface DirectionsStep {
  start_location: LatLng;
  end_location: LatLng;
  polyline: { points: string };
  duration: { text: string; value: number };
  distance: { text: string; value: number };
  travel_mode: string;
  html_instructions: string;
}

interface DirectionsRoute {
  coordinates: LatLng[];
  distance: number;
  duration: number;
  steps: DirectionsStep[];
}

export const useDirections = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWalkingDirections = useCallback(async (
    origin: LatLng,
    destination: LatLng
  ): Promise<DirectionsRoute | null> => {
    setLoading(true);
    setError(null);

    try {
      // Verificar cache primero
      const cached = directionsCache.get(origin, destination, 'walking');
      if (cached) {
        setLoading(false);
        return cached;
      }

      const result = await googleMapsService.getDirections(origin, destination, 'walking');

      if (!result || result.routes.length === 0) {
        setError('No se encontraron direcciones de caminata');
        return null;
      }

      const route = result.routes[0];
      const leg = route.legs[0];

      // Decodificar polyline para obtener coordenadas precisas
      const coordinates = googleMapsService.decodePolyline(route.overview_polyline.points);

      const directionsRoute: DirectionsRoute = {
        coordinates,
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: leg.steps.map(step => ({
          start_location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng
          },
          end_location: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng
          },
          polyline: step.polyline,
          duration: step.duration,
          distance: step.distance,
          travel_mode: step.travel_mode,
          html_instructions: step.html_instructions
        }))
      };

      // Guardar en cache
      directionsCache.set(origin, destination, 'walking', directionsRoute);

      return directionsRoute;
    } catch (err) {
      setError('Error obteniendo direcciones de caminata');
      console.error('Walking directions error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransitDirections = useCallback(async (
    origin: LatLng,
    destination: LatLng
  ): Promise<DirectionsRoute | null> => {
    setLoading(true);
    setError(null);

    try {
      // Verificar cache primero
      const cached = directionsCache.get(origin, destination, 'transit');
      if (cached) {
        setLoading(false);
        return cached;
      }

      const result = await googleMapsService.getDirections(origin, destination, 'transit');

      if (!result || result.routes.length === 0) {
        // Si no hay ruta de tránsito, usar caminata como fallback
        return await getWalkingDirections(origin, destination);
      }

      const route = result.routes[0];
      const leg = route.legs[0];

      // Decodificar polyline para obtener coordenadas precisas
      const coordinates = googleMapsService.decodePolyline(route.overview_polyline.points);

      const directionsRoute: DirectionsRoute = {
        coordinates,
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: leg.steps.map(step => ({
          start_location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng
          },
          end_location: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng
          },
          polyline: step.polyline,
          duration: step.duration,
          distance: step.distance,
          travel_mode: step.travel_mode,
          html_instructions: step.html_instructions
        }))
      };

      // Guardar en cache
      directionsCache.set(origin, destination, 'transit', directionsRoute);

      return directionsRoute;
    } catch (err) {
      setError('Error obteniendo direcciones de tránsito');
      console.error('Transit directions error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getWalkingDirections]);

  const getBusRouteDirections = useCallback(async (
    waypoints: LatLng[]
  ): Promise<DirectionsRoute | null> => {
    if (waypoints.length < 2) return null;

    setLoading(true);
    setError(null);

    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];

      // Verificar cache primero
      const cached = directionsCache.get(origin, destination, 'driving');
      if (cached) {
        setLoading(false);
        return cached;
      }

      // Para rutas de bus, usar driving directions entre las paradas
      const result = await googleMapsService.getDirections(origin, destination, 'driving');

      if (!result || result.routes.length === 0) {
        // Fallback: conectar waypoints con líneas rectas
        const fallbackRoute: DirectionsRoute = {
          coordinates: waypoints,
          distance: 0,
          duration: 0,
          steps: []
        };

        // Guardar fallback en cache con TTL menor
        directionsCache.set(origin, destination, 'driving', fallbackRoute);
        return fallbackRoute;
      }

      const route = result.routes[0];
      const coordinates = googleMapsService.decodePolyline(route.overview_polyline.points);

      const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
      const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

      const directionsRoute: DirectionsRoute = {
        coordinates,
        distance: totalDistance,
        duration: totalDuration,
        steps: route.legs.flatMap(leg => leg.steps.map(step => ({
          start_location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng
          },
          end_location: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng
          },
          polyline: step.polyline,
          duration: step.duration,
          distance: step.distance,
          travel_mode: step.travel_mode,
          html_instructions: step.html_instructions
        })))
      };

      // Guardar en cache
      directionsCache.set(origin, destination, 'driving', directionsRoute);

      return directionsRoute;
    } catch (err) {
      setError('Error obteniendo direcciones de ruta de bus');
      console.error('Bus route directions error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    directionsCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return directionsCache.getStats();
  }, []);

  return {
    loading,
    error,
    getWalkingDirections,
    getTransitDirections,
    getBusRouteDirections,
    clearCache,
    getCacheStats
  };
};

export type { DirectionsRoute, DirectionsStep };