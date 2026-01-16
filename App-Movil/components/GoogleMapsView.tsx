import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert, Platform } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  MarkerPressEvent,
  MapPressEvent,
  LatLng
} from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { useDirections } from '../hooks/useDirections';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import PlannedRouteRenderer from './PlannedRouteRenderer';

interface GoogleMapsViewProps {
  initialRegion?: Region;
  showUserLocation?: boolean;
  showStops?: boolean;
  showRoutes?: boolean;
  showBuses?: boolean;
  selectedStops?: string[];
  onStopPress?: (stop: any) => void;
  onBusPress?: (bus: any) => void;
  onMapPress?: (coordinate: LatLng) => void;
  onOriginSelect?: (coordinate: LatLng) => void;
  onDestinationSelect?: (coordinate: LatLng) => void;
  origin?: { latitude: number; longitude: number; name?: string };
  destination?: { latitude: number; longitude: number; name?: string };
  plannedRoute?: any;
  style?: any;
  mode?: 'view' | 'select-stops' | 'plan-route' | 'select-origin' | 'select-destination';
  filteredParadas?: any[];
  filteredRutas?: any[];
  filteredBuses?: any[];
  centerLocation?: { lat: number; lng: number };
  selectedPlaceName?: string;
}

const defaultRegion: Region = {
  latitude: -3.9929, // Loja, Ecuador (valor por defecto)
  longitude: -79.2045,
  latitudeDelta: 0.005, // Zoom más cercano
  longitudeDelta: 0.005,
};

// Colores predefinidos para rutas
const routeColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
];

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  initialRegion = defaultRegion,
  showUserLocation = true,
  showStops = true,
  showRoutes = true,
  showBuses = false,
  selectedStops = [],
  onStopPress,
  onBusPress,
  onMapPress,
  onOriginSelect,
  onDestinationSelect,
  origin,
  destination,
  plannedRoute,
  style,
  mode = 'view',
  filteredParadas,
  filteredRutas,
  filteredBuses,
  centerLocation,
  selectedPlaceName,
}) => {
  const { theme } = useTheme();
  const { paradas, rutas, buses, loading } = useTransport();
  const { location } = useLocation();
  const { getBusRouteDirections } = useDirections();
  const mapRef = useRef<MapView>(null);
  
  // Estado para la región actual del mapa
  const [currentRegion, setCurrentRegion] = useState<Region>(() => {
    // Prioridad: centerLocation > ubicación del usuario > región inicial
    if (centerLocation) {
      return {
        latitude: centerLocation.lat,
        longitude: centerLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return initialRegion;
  });

  // Estado para almacenar las coordenadas reales de las rutas
  const [routeCoordinates, setRouteCoordinates] = useState<Map<string, LatLng[]>>(new Map());

  // Usar datos filtrados si están disponibles, sino usar los del contexto
  const dataToUse = {
    paradas: filteredParadas || paradas,
    rutas: filteredRutas || rutas,
    buses: filteredBuses || buses
  };

  // Función para obtener color de ruta
  const getRouteColor = (route: any, index: number) => {
    if (route.color) {
      // Asegurar que el color tenga el formato correcto con #
      const color = route.color.startsWith('#') ? route.color : `#${route.color}`;
      return color;
    }
    return routeColors[index % routeColors.length];
  };

  // Manejar presión en el mapa
  const handleMapPress = useCallback((event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    
    if (mode === 'select-origin') {
      onOriginSelect?.(coordinate);
    } else if (mode === 'select-destination') {
      onDestinationSelect?.(coordinate);
    } else {
      onMapPress?.(coordinate);
    }
  }, [mode, onOriginSelect, onDestinationSelect, onMapPress]);

  // Manejar presión en parada
  const handleStopPress = useCallback((stop: any) => {
    onStopPress?.(stop);
  }, [onStopPress]);

  // Manejar presión en bus
  const handleBusPress = useCallback((bus: any) => {
    onBusPress?.(bus);
  }, [onBusPress]);

  // Centrar mapa en ubicación del usuario
  const centerOnUserLocation = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [location]);

  // Efecto para centrar el mapa cuando hay una ubicación específica
  useEffect(() => {
    if (centerLocation && mapRef.current) {
      const newRegion = {
        latitude: centerLocation.lat,
        longitude: centerLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setCurrentRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [centerLocation]);

  // Efecto para actualizar la región cuando cambia la ubicación
  useEffect(() => {
    if (location && mapRef.current && !centerLocation) {
      // Solo actualizar si no hay una ubicación específica para centrar
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setCurrentRegion(newRegion);
      
      // Animar el mapa a la nueva región
      mapRef.current.animateToRegion(newRegion, 500);
    }
  }, [location]);

  // Renderizar marcadores de paradas
  const renderStopMarkers = () => {
    if (!showStops) return null;

    // Si hay una ruta planificada, solo mostrar las paradas que forman parte de ella
    let paradasToRender = dataToUse.paradas;

    if (plannedRoute && plannedRoute.segmentos) {
      // Extraer IDs de paradas de la ruta planificada
      const stopIdsInRoute = new Set<string>();

      plannedRoute.segmentos.forEach((segmento: any) => {
        if (segmento.desde) stopIdsInRoute.add(segmento.desde);
        if (segmento.hasta) stopIdsInRoute.add(segmento.hasta);
      });

      // Filtrar solo las paradas que están en la ruta planificada
      paradasToRender = dataToUse.paradas.filter((parada: any) => {
        const paradaId = parada.id_parada || parada.id;
        return stopIdsInRoute.has(paradaId);
      });
    }

    return paradasToRender.map((parada) => {
      const lat = parada.coordenadas?.lat || parada.lat || 0;
      const lng = parada.coordenadas?.lng || parada.lng || 0;

      if (!lat || !lng) return null;

      const isConnection = parada.es_punto_conexion;
      const isActive = parada.activa !== false;
      const isSelected = selectedStops.includes(parada.id_parada || parada.id);

      // Determinar color del marcador
      let pinColor = '#F59E0B'; // Amber para paradas normales
      if (!isActive) {
        pinColor = '#EF4444'; // Rojo para inactivas
      } else if (isConnection) {
        pinColor = '#10B981'; // Verde para conexiones
      }

      if (isSelected) {
        pinColor = '#3B82F6'; // Azul para seleccionadas
      }

      return (
        <Marker
          key={parada.id_parada || parada.id}
          coordinate={{ latitude: lat, longitude: lng }}
          pinColor={pinColor}
          title={parada.nombre || parada.name || 'Parada'}
          description={
            `${parada.codigo ? `Código: ${parada.codigo}` : 'Parada pública'}${
              isConnection ? ' • Punto de Conexión' : ''
            }${!isActive ? ' • Inactiva' : ''}`
          }
          onPress={() => handleStopPress(parada)}
        />
      );
    });
  };

  // Efecto para cargar las rutas reales de los buses usando Google Directions API
  // Optimizado para cargar solo cuando sea necesario y mantener el cache
  useEffect(() => {
    if (!showRoutes || plannedRoute || dataToUse.rutas.length === 0) {
      return; // No limpiar el cache, solo no cargar nuevas rutas
    }

    let isMounted = true;

    const loadRealRoutes = async () => {
      const newRouteCoordinates = new Map<string, LatLng[]>(routeCoordinates);

      // Solo procesar rutas que no están en el cache
      const routesToLoad = dataToUse.rutas.filter(
        ruta => !newRouteCoordinates.has(ruta.id_ruta || ruta.id)
      );

      if (routesToLoad.length === 0) return;

      // Procesar en lotes de 3 para no saturar
      for (let i = 0; i < routesToLoad.length; i += 3) {
        if (!isMounted) break;

        const batch = routesToLoad.slice(i, i + 3);
        await Promise.all(
          batch.map(async (ruta) => {
            const rutaId = ruta.id_ruta || ruta.id;
            if (!ruta.stopIds || ruta.stopIds.length < 2) return;

            // Obtener coordenadas de todas las paradas de la ruta
            const stopCoordinates: LatLng[] = [];
            for (const stopId of ruta.stopIds) {
              const stop = dataToUse.paradas.find((s: any) => (s.id_parada || s.id) === stopId);
              if (stop) {
                const lat = stop.coordenadas?.lat || stop.lat || 0;
                const lng = stop.coordenadas?.lng || stop.lng || 0;
                if (lat && lng) {
                  stopCoordinates.push({ latitude: lat, longitude: lng });
                }
              }
            }

            if (stopCoordinates.length < 2) return;

            try {
              const directions = await getBusRouteDirections(stopCoordinates);
              if (isMounted && directions && directions.coordinates.length > 0) {
                newRouteCoordinates.set(rutaId, directions.coordinates);
              } else if (isMounted) {
                newRouteCoordinates.set(rutaId, stopCoordinates);
              }
            } catch (error) {
              if (isMounted) {
                newRouteCoordinates.set(rutaId, stopCoordinates);
              }
            }
          })
        );

        if (isMounted) {
          setRouteCoordinates(new Map(newRouteCoordinates));
        }

        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    loadRealRoutes();

    return () => {
      isMounted = false;
    };
  }, [dataToUse.rutas, dataToUse.paradas, showRoutes, plannedRoute]);

  // Renderizar líneas de rutas con coordenadas reales
  const renderRouteLines = () => {
    // No mostrar las líneas de rutas si hay una ruta planificada
    if (!showRoutes || plannedRoute) return null;

    return dataToUse.rutas.map((ruta, index) => {
      const rutaId = ruta.id_ruta || ruta.id;
      const coordinates = routeCoordinates.get(rutaId);

      if (!coordinates || coordinates.length < 2) return null;

      const routeColor = getRouteColor(ruta, index);
      const isActive = ruta.activa !== false;

      return (
        <Polyline
          key={rutaId}
          coordinates={coordinates}
          strokeColor={routeColor}
          strokeWidth={isActive ? 4 : 2}
          strokePattern={!isActive ? [15, 10] : undefined}
          lineCap="round"
          lineJoin="round"
          geodesic={true}
        />
      );
    });
  };

  // Renderizar marcadores de buses
  const renderBusMarkers = () => {
    if (!showBuses) return null;

    return dataToUse.buses.map((bus, index) => {
      const lat = bus.coordenadas?.lat || bus.lat || bus.ubicacion?.lat || bus.coordenadas_actuales?.lat || 0;
      const lng = bus.coordenadas?.lng || bus.lng || bus.ubicacion?.lng || bus.coordenadas_actuales?.lng || 0;

      if (!lat || !lng) return null;

      const estado = bus.estado || bus.status || 'desconocido';
      const isInTransit = estado === 'en_ruta' || estado === 'in_transit' || estado === 'activo';
      const isAtStop = estado === 'en_parada' || estado === 'stopped' || bus.isAtStop;
      const isOffline = estado === 'offline' || estado === 'inactivo' || estado === 'mantenimiento';

      // Determinar color del bus
      let pinColor = '#10B981'; // Verde para activo
      if (isOffline) {
        pinColor = '#EF4444'; // Rojo para offline
      } else if (isAtStop) {
        pinColor = '#F59E0B'; // Amber para en parada
      }

      return (
        <Marker
          key={bus.id || bus.numero_placa}
          coordinate={{ latitude: lat, longitude: lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          title={`Bus ${bus.numero_placa || bus.placa || bus.id || 'S/N'}`}
          description={
            `${bus.ruta_asignada ? `Ruta: ${bus.ruta_asignada}` : ''}${
              isOffline ? ' • Fuera de servicio' :
              isAtStop ? ' • En parada' : ' • En ruta'
            }`
          }
          onPress={() => handleBusPress(bus)}
        >
          <ThemedView style={[styles.busMarker, { borderColor: pinColor, backgroundColor: 'white' }]}>
            <Icon
              name="directions-bus"
              size="lg"
              library="material"
              style={{ color: pinColor }}
            />
          </ThemedView>
        </Marker>
      );
    });
  };

  // Renderizar marcadores de origen y destino
  const renderOriginDestinationMarkers = () => {
    const markers = [];

    if (origin) {
      markers.push(
        <Marker
          key="origin"
          coordinate={origin}
          pinColor="#10B981"
          title="Origen"
          description={origin.name || 'Punto de origen'}
        />
      );
    }

    if (destination) {
      markers.push(
        <Marker
          key="destination"
          coordinate={destination}
          pinColor="#EF4444"
          title="Destino"
          description={destination.name || 'Punto de destino'}
        />
      );
    }

    // Marcador para lugar seleccionado desde búsqueda
    if (centerLocation && selectedPlaceName && !destination) {
      markers.push(
        <Marker
          key="selected-place"
          coordinate={{ latitude: centerLocation.lat, longitude: centerLocation.lng }}
          pinColor="#3B82F6"
          title="Lugar encontrado"
          description={selectedPlaceName}
        />
      );
    }

    // Línea entre origen y destino (entrecortada)
    if (origin && destination && !plannedRoute) {
      markers.push(
        <Polyline
          key="origin-destination-line"
          coordinates={[origin, destination]}
          strokeColor="#666666"
          strokeWidth={2}
          strokePattern={[15, 10]}
          lineCap="round"
        />
      );
    }

    return markers;
  };


  // Función auxiliar para obtener coordenadas por ID
  const getCoordinatesFromId = (id: string): LatLng | null => {
    if (id === 'origen' && origin) return origin;
    if (id === 'destino' && destination) return destination;
    
    const stop = dataToUse.paradas.find((s: any) => (s.id_parada || s.id) === id);
    if (stop) {
      const lat = stop.coordenadas?.lat || stop.lat || 0;
      const lng = stop.coordenadas?.lng || stop.lng || 0;
      return lat && lng ? { latitude: lat, longitude: lng } : null;
    }
    
    return null;
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText>Cargando mapa...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentRegion}
        region={currentRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onPress={handleMapPress}
        customMapStyle={theme.mode === 'dark' ? darkMapStyle : undefined}
      >
        {renderStopMarkers()}
        {renderRouteLines()}
        {renderBusMarkers()}
        {renderOriginDestinationMarkers()}
        {plannedRoute && (
          <PlannedRouteRenderer
            plannedRoute={plannedRoute}
            getCoordinatesFromId={getCoordinatesFromId}
            dataToUse={dataToUse}
            origin={origin}
            destination={destination}
            showMarkers={true}
          />
        )}
      </MapView>
    </ThemedView>
  );
};

// Estilo de mapa oscuro para Google Maps
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});