import React, { useState, useEffect } from 'react';
import { Polyline } from 'react-native-maps';
import { useDirections, DirectionsRoute } from '../hooks/useDirections';
import { LatLng } from '../lib/googleMaps';
import RouteMarkers from './RouteMarkers';

interface PlannedRouteRendererProps {
  plannedRoute: any;
  getCoordinatesFromId: (id: string) => LatLng | null;
  dataToUse: {
    paradas: any[];
    rutas: any[];
    buses: any[];
  };
  origin?: { latitude: number; longitude: number; name?: string };
  destination?: { latitude: number; longitude: number; name?: string };
  showMarkers?: boolean;
}

interface RouteSegmentWithDirections {
  segmento: any;
  directions: DirectionsRoute | null;
  coordinates: LatLng[];
  color: string;
  strokeWidth: number;
  strokePattern?: number[];
}

export const PlannedRouteRenderer: React.FC<PlannedRouteRendererProps> = React.memo(({
  plannedRoute,
  getCoordinatesFromId,
  dataToUse,
  origin,
  destination,
  showMarkers = true
}) => {
  const { getWalkingDirections, getBusRouteDirections } = useDirections();
  const [routeSegments, setRouteSegments] = useState<RouteSegmentWithDirections[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plannedRoute?.segmentos) {
      setRouteSegments([]);
      return;
    }

    const loadRouteDirections = async () => {
      setLoading(true);
      const segments: RouteSegmentWithDirections[] = [];

      console.log('🗺️ Renderizando ruta planificada con', plannedRoute.segmentos.length, 'segmentos');

      for (let index = 0; index < plannedRoute.segmentos.length; index++) {
        const segmento = plannedRoute.segmentos[index];
        console.log(`  Segmento ${index + 1}:`, segmento.tipo, 'desde', segmento.desde, 'hasta', segmento.hasta);

        const fromCoords = getCoordinatesFromId(segmento.desde);
        const toCoords = getCoordinatesFromId(segmento.hasta);

        if (!fromCoords || !toCoords) {
          console.warn(`  ⚠️ No se encontraron coordenadas para segmento ${index + 1}`);
          continue;
        }

        let coordinates: LatLng[] = [fromCoords, toCoords];
        let directions: DirectionsRoute | null = null;
        let color = '#FF6B6B'; // Rojo/naranja para caminata (más distinguible)
        let strokeWidth = 4;
        let strokePattern: number[] | undefined = [3, 15]; // Puntos grandes espaciados para caminata

        if (segmento.tipo === 'caminar') {
          // Para segmentos de caminata, usar Google Directions API
          try {
            directions = await getWalkingDirections(fromCoords, toCoords);
            if (directions && directions.coordinates.length > 0) {
              coordinates = directions.coordinates;
            }
          } catch (error) {
            console.warn('Error getting walking directions:', error);
            // Mantener línea recta como fallback
          }
        } else if (segmento.tipo === 'autobus') {
          // Obtener el color de la ruta desde la BD
          const ruta = dataToUse.rutas.find((r: any) =>
            (r.id_ruta || r.id) === segmento.id_ruta
          );
          // Asegurar que el color tenga el formato correcto con #
          const rutaColor = ruta?.color;
          color = rutaColor ? (rutaColor.startsWith('#') ? rutaColor : `#${rutaColor}`) : '#3B82F6';
          strokeWidth = 6;
          strokePattern = undefined; // Línea sólida para buses

          // Para segmentos de bus, encontrar la ruta real entre paradas
          if (segmento.id_ruta) {
            const ruta = dataToUse.rutas.find((r: any) =>
              (r.id_ruta || r.id) === segmento.id_ruta
            );

            if (ruta && ruta.stopIds) {
              const fromStopIndex = ruta.stopIds.indexOf(segmento.desde);
              const toStopIndex = ruta.stopIds.indexOf(segmento.hasta);

              if (fromStopIndex !== -1 && toStopIndex !== -1 && toStopIndex > fromStopIndex) {
                // Obtener todas las coordenadas de las paradas en el segmento
                const routeWaypoints: LatLng[] = [];

                for (let i = fromStopIndex; i <= toStopIndex; i++) {
                  const stopId = ruta.stopIds[i];
                  const stopCoords = getCoordinatesFromId(stopId);
                  if (stopCoords) {
                    routeWaypoints.push(stopCoords);
                  }
                }

                if (routeWaypoints.length >= 2) {
                  console.log(`    📍 Ruta tiene ${routeWaypoints.length} paradas en este segmento`);
                  try {
                    // Usar Google Directions API para obtener la ruta real entre paradas
                    directions = await getBusRouteDirections(routeWaypoints);
                    if (directions && directions.coordinates.length > 0) {
                      coordinates = directions.coordinates;
                      console.log(`    ✅ Obtenidas ${coordinates.length} coordenadas de Google Directions`);
                    } else {
                      // Fallback: usar las coordenadas de las paradas
                      coordinates = routeWaypoints;
                      console.log(`    ⚠️ Usando coordenadas de paradas (${coordinates.length} puntos)`);
                    }
                  } catch (error) {
                    console.warn('    ❌ Error getting bus route directions:', error);
                    // Fallback: usar las coordenadas de las paradas
                    coordinates = routeWaypoints;
                  }
                } else {
                  console.warn(`    ⚠️ Solo ${routeWaypoints.length} paradas, insuficiente para ruta`);
                }
              }
            }
          }
        }

        console.log(`    → ${coordinates.length} coordenadas finales, color: ${color}`);

        segments.push({
          segmento,
          directions,
          coordinates,
          color,
          strokeWidth,
          strokePattern
        });
      }

      console.log(`✅ Total de segmentos renderizados: ${segments.length}`);
      setRouteSegments(segments);
      setLoading(false);
    };

    loadRouteDirections();
  }, [plannedRoute, getCoordinatesFromId, dataToUse, getWalkingDirections, getBusRouteDirections]);

  if (loading || !routeSegments.length) {
    return null;
  }

  return (
    <>
      {routeSegments.map((segment, index) => (
        <Polyline
          key={`enhanced-route-${index}`}
          coordinates={segment.coordinates}
          strokeColor={segment.color}
          strokeWidth={segment.strokeWidth}
          strokePattern={segment.strokePattern}
          lineCap="round"
          lineJoin="round"
          geodesic={true} // Seguir la curvatura de la Tierra para mayor precisión
        />
      ))}
      {showMarkers && (
        <RouteMarkers
          plannedRoute={plannedRoute}
          getCoordinatesFromId={getCoordinatesFromId}
          origin={origin}
          destination={destination}
        />
      )}
    </>
  );
});

PlannedRouteRenderer.displayName = 'PlannedRouteRenderer';

export default PlannedRouteRenderer;