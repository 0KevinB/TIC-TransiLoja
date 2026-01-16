import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../context/ThemeContext';
import { useRouting } from '../hooks/useRouting';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { GoogleMapsView } from './GoogleMapsView';
import { SmartAddressSearch } from './SmartAddressSearch';
import { TripPreferences, TripPreferencesData } from './TripPreferences';
import { googleMapsService } from '../lib/googleMaps';
import type { RutaOptima, SegmentoViaje } from '../lib/types';

interface TripPlannerProps {
  visible: boolean;
  onClose: () => void;
  initialDestination?: {
    description: string;
    place_id: string;
    geometry: { location: { lat: number; lng: number } };
  };
}

export const TripPlanner: React.FC<TripPlannerProps> = ({
  visible,
  onClose,
  initialDestination,
}) => {
  const { paradas, rutas, buses } = useTransport();
  const { location, getCurrentLocation } = useLocation();
  const { theme } = useTheme();
  const { buscarRutas, loading: routingLoading } = useRouting();
  const scrollViewRef = useRef<ScrollView>(null);

  const [mode, setMode] = useState<'search' | 'select-origin' | 'select-destination' | 'view-route'>('search');
  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [plannedRoutes, setPlannedRoutes] = useState<RutaOptima[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RutaOptima | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Configuraciones de viaje
  const [tripPreferences, setTripPreferences] = useState<TripPreferencesData>({
    maxWalkingDistance: 1000,
    maxTransfers: 3,
    preferFastest: true,
    departureTime: new Date(),
    avoidStairs: false,
    accessibleOnly: false,
    weatherConsideration: false,
    costOptimization: false,
  });

  // Efecto para configurar destino inicial desde búsqueda
  useEffect(() => {
    if (initialDestination && visible) {
      const destinationPoint = {
        latitude: initialDestination.geometry.location.lat,
        longitude: initialDestination.geometry.location.lng,
        name: initialDestination.description,
        type: 'search',
        place_id: initialDestination.place_id,
      };
      setDestination(destinationPoint);

      // Configurar ubicación actual como origen automáticamente
      if (location) {
        const currentPoint = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Mi ubicación actual',
          type: 'current'
        };
        setOrigin(currentPoint);
        
        // Auto-planificar si tenemos origen y destino
        setTimeout(() => {
          handlePlanTrip(currentPoint, destinationPoint);
        }, 500);
      } else {
        // Intentar obtener ubicación actual
        getCurrentLocation();
      }
    }
  }, [initialDestination, visible, location]);

  // Efecto para limpiar estados al cerrar
  useEffect(() => {
    if (!visible) {
      // Limpiar estados cuando se cierre el modal
      setMode('search');
      setPlannedRoutes([]);
      setSelectedRoute(null);
      setShowMap(false);
      setIsPlanning(false);
      // No limpiar origin/destination para mantener la funcionalidad existente
    }
  }, [visible]);

  const handleOriginSelect = (coordinate: { latitude: number; longitude: number }) => {
    const originPoint = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: `Origen (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      type: 'coordinate'
    };
    setOrigin(originPoint);
    setMode('search');
    setShowMap(false);
  };

  const handleDestinationSelect = (coordinate: { latitude: number; longitude: number }) => {
    const destinationPoint = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: `Destino (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      type: 'coordinate'
    };
    setDestination(destinationPoint);
    setMode('search');
    setShowMap(false);
  };

  const handleStopSelect = (stop: any) => {
    if (mode === 'select-origin') {
      setOrigin({
        ...stop,
        latitude: stop.coordenadas?.lat || stop.lat,
        longitude: stop.coordenadas?.lng || stop.lng,
        type: 'stop'
      });
      setMode('search');
      setShowMap(false);
    } else if (mode === 'select-destination') {
      setDestination({
        ...stop,
        latitude: stop.coordenadas?.lat || stop.lat,
        longitude: stop.coordenadas?.lng || stop.lng,
        type: 'stop'
      });
      setMode('search');
      setShowMap(false);
    }
  };

  const handlePlanTrip = async (originData?: any, destinationData?: any) => {
    const tripOrigin = originData || origin;
    const tripDestination = destinationData || destination;

    if (!tripOrigin || !tripDestination) {
      Alert.alert('Error', 'Selecciona tanto el origen como el destino');
      return;
    }

    setIsPlanning(true);

    try {
      // Usar el hook useRouting que gestiona correctamente RAPTOR
      const routes = await buscarRutas(
        tripOrigin.latitude,
        tripOrigin.longitude,
        tripDestination.latitude,
        tripDestination.longitude,
        tripPreferences.departureTime
      );

      if (routes.length === 0) {
        // Mostrar mensaje más informativo
        const distancia = calculateDirectDistance(tripOrigin, tripDestination);
        Alert.alert(
          'Sin rutas disponibles',
          `No se encontraron rutas de transporte público entre los puntos seleccionados.\n\nDistancia directa: ${distancia}\n\nIntenta seleccionar puntos más cercanos a las paradas de bus o verifica que haya rutas disponibles en la zona.`
        );
      } else {
        setPlannedRoutes(routes);
        setSelectedRoute(routes[0]); // Seleccionar la mejor ruta
        setMode('view-route');
        setShowMap(true);
      }
    } catch (error) {
      console.error('Error planning trip:', error);
      Alert.alert('Error', 'No se pudo planificar el viaje. Intenta nuevamente.');
    } finally {
      setIsPlanning(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      if (location) {
        const currentPoint = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Mi ubicación actual',
          type: 'current'
        };
        setOrigin(currentPoint);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  const clearTrip = () => {
    setOrigin(null);
    setDestination(null);
    setPlannedRoutes([]);
    setSelectedRoute(null);
    setMode('search');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (timeString: string | number): string => {
    if (typeof timeString === 'string') {
      return timeString.substring(0, 5); // HH:MM
    }
    return new Date(timeString * 1000).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDirectDistance = (point1: any, point2: any): string => {
    if (!point1 || !point2) return 'N/A';
    
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const renderRouteSegment = (segment: SegmentoViaje, index: number) => {
    const isWalking = segment.tipo === 'caminar';
    const isLastSegment = index === selectedRoute!.segmentos.length - 1;

    return (
      <ThemedView key={index} style={styles.segmentWrapper}>
        <ThemedView style={styles.segmentTimelineContainer}>
          <ThemedView style={[
            styles.segmentDot,
            { backgroundColor: isWalking ? theme.colors.success : theme.colors.primary }
          ]} />
          {!isLastSegment && <ThemedView style={styles.segmentLine} />}
        </ThemedView>

        <Card style={styles.segmentCard}>
          <ThemedView style={styles.segmentContent}>
            <ThemedView style={[
              styles.segmentIcon,
              { backgroundColor: `${isWalking ? theme.colors.success : theme.colors.primary}15` }
            ]}>
              <Icon
                name={isWalking ? 'directions-walk' : 'directions-bus'}
                size="lg"
                color={isWalking ? 'success' : 'primary'}
              />
            </ThemedView>

            <ThemedView style={styles.segmentDetails}>
              <ThemedText variant="body" weight="semibold" style={styles.segmentInstruction}>
                {segment.instrucciones}
              </ThemedText>

              <ThemedView style={styles.segmentMetrics}>
                {segment.distancia_metros && (
                  <ThemedView style={styles.segmentMetric}>
                    <Icon name="straighten" size="sm" color="textSecondary" />
                    <ThemedText variant="caption" color="textSecondary">
                      {Math.round(segment.distancia_metros)}m
                    </ThemedText>
                  </ThemedView>
                )}

                {!isWalking && segment.id_ruta && (
                  <ThemedView style={styles.segmentMetric}>
                    <Icon name="info" size="sm" color="textSecondary" />
                    <ThemedText variant="caption" color="textSecondary">
                      Ruta {segment.id_ruta}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>
      </ThemedView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      marginBottom: 16,
      textAlign: 'center',
    },
    locationCard: {
      marginBottom: 8,
      borderRadius: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    originCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    destinationCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary,
    },
    locationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 16,
    },
    locationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationInfo: {
      flex: 1,
      gap: 4,
    },
    locationText: {
      minHeight: 24,
    },
    locationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    locationActionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectButton: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    connectionLine: {
      alignItems: 'center',
      paddingVertical: 12,
      marginVertical: 8,
    },
    connectionDots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textSecondary,
    },
    distanceText: {
      textAlign: 'center',
    },
    actionSection: {
      marginTop: 20,
      gap: 16,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    planButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
      elevation: 4,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    fullMap: {
      flex: 1,
    },
    floatingPanel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      paddingHorizontal: 16,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    floatingPanelRoute: {
      maxHeight: 120,
      backgroundColor: theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      paddingTop: 12,
      paddingBottom: 8,
      elevation: 6,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    floatingPanelDefault: {
      maxHeight: 200,
      paddingTop: 16,
      paddingBottom: 12,
    },
    mapHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    closeMapButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.colors.surface}80`,
    },
    mapTitle: {
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    compactInstructionPanel: {
      backgroundColor: `${theme.colors.primary}20`,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    compactLocationButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    minimalRouteSummary: {
      backgroundColor: `${theme.colors.success || theme.colors.primary}15`,
      borderRadius: 6,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    routeStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    statChip: {
      backgroundColor: `${theme.colors.surface}CC`,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    miniDetailsButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 0,
    },
    routeDetails: {
      padding: 16,
    },
    routeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: `${theme.colors.success || theme.colors.primary}20`,
      borderRadius: 12,
    },
    routeTitle: {
      flex: 1,
    },
    viewFullMapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      elevation: 3,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    routeSummary: {
      marginBottom: 24,
    },
    routeSummaryContent: {
      marginBottom: 16,
    },
    routeInfoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 12,
    },
    routeStat: {
      alignItems: 'center',
      gap: 8,
    },
    statText: {
      alignItems: 'center',
      gap: 2,
    },
    viewMapButton: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    segmentsContainer: {
      marginBottom: 24,
    },
    segmentsTitle: {
      marginBottom: 16,
    },
    segmentWrapper: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    segmentTimelineContainer: {
      alignItems: 'center',
      marginRight: 12,
      width: 24,
    },
    segmentDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginTop: 12,
    },
    segmentLine: {
      width: 2,
      flex: 1,
      backgroundColor: '#E5E7EB',
      marginTop: 4,
      marginBottom: 4,
    },
    segmentCard: {
      flex: 1,
      marginBottom: 0,
    },
    segmentContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    segmentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentDetails: {
      flex: 1,
    },
    segmentInstruction: {
      marginBottom: 8,
    },
    segmentMetrics: {
      flexDirection: 'row',
      gap: 16,
    },
    segmentMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    alternativeRoutes: {
      marginTop: 16,
      marginBottom: 24,
    },
    alternativesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    alternativesTitle: {
      flex: 1,
    },
    alternativeCard: {
      marginBottom: 12,
    },
    alternativeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    alternativeLeft: {
      flex: 1,
    },
    alternativeMainInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    alternativeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    alternativeMetrics: {
      flexDirection: 'row',
      gap: 16,
    },
    alternativeMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bottomSpacer: {
      height: 20,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <ThemedView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="sm" onPress={onClose}>
            <Icon name="close" size="md" color="textPrimary" />
          </ThemedButton>

          <ThemedText variant="title" weight="bold">
            Planificar viaje
          </ThemedText>

          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        {showMap ? (
          <ThemedView style={styles.mapContainer}>
            {/* Mapa de pantalla completa */}
            <GoogleMapsView
              mode={mode === 'select-origin' ? 'select-origin' : 
                    mode === 'select-destination' ? 'select-destination' : 'view'}
              showStops={true}
              showRoutes={true}
              showBuses={mode === 'view-route'}
              showUserLocation={true}
              onStopPress={handleStopSelect}
              onOriginSelect={handleOriginSelect}
              onDestinationSelect={handleDestinationSelect}
              origin={origin}
              destination={destination}
              plannedRoute={selectedRoute}
              style={styles.fullMap}
            />

            {/* Panel de información flotante */}
            <ThemedView style={[
              styles.floatingPanel,
              mode === 'view-route' ? styles.floatingPanelRoute : styles.floatingPanelDefault
            ]}>
              {/* Botón de cerrar mapa */}
              <ThemedView style={styles.mapHeader}>
                <ThemedButton
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setShowMap(false);
                    // Volver al modo search si estamos seleccionando origen o destino
                    if (mode === 'select-origin' || mode === 'select-destination') {
                      setMode('search');
                    }
                  }}
                  style={styles.closeMapButton}
                >
                  <Icon name="close" size="md" color="textPrimary" />
                </ThemedButton>

                <ThemedText variant="subtitle" weight="bold" style={styles.mapTitle}>
                  {mode === 'select-origin' && '📍 Seleccionar Origen'}
                  {mode === 'select-destination' && '🎯 Seleccionar Destino'}
                  {mode === 'view-route' && '🗺️ Ruta Planificada'}
                  {mode === 'search' && '🗺️ Mapa Interactivo'}
                </ThemedText>
              </ThemedView>

              {/* Información contextual - compacta */}
              {mode !== 'view-route' && (
                <ThemedView style={styles.compactInstructionPanel}>
                  <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                    {mode === 'select-origin' && '👆 Toca una parada o punto'}
                    {mode === 'select-destination' && '👆 Toca una parada o punto'}
                    {mode === 'search' && '🗺️ Explora el sistema de transporte'}
                  </ThemedText>
                  
                  {(mode === 'select-origin' || mode === 'select-destination') && (
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={useCurrentLocation}
                      style={styles.compactLocationButton}
                    >
                      <Icon name="my-location" size="sm" color="primary" />
                    </ThemedButton>
                  )}
                </ThemedView>
              )}

              {/* Resumen de ruta en vista de mapa - minimalista */}
              {mode === 'view-route' && selectedRoute && (
                <ThemedView style={styles.minimalRouteSummary}>
                  <ThemedView style={styles.routeStatsRow}>
                    <ThemedView style={styles.statChip}>
                      <ThemedText variant="caption" weight="bold" color="primary">
                        ⏱️ {selectedRoute.tiempo_total || selectedRoute.tiempo_total_seg ? 
                          formatDuration(selectedRoute.tiempo_total || selectedRoute.tiempo_total_seg) :
                          'N/D'
                        }
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.statChip}>
                      <ThemedText variant="caption" weight="bold" color="secondary">
                        🔄 {selectedRoute.numero_transbordos !== undefined ? selectedRoute.numero_transbordos :
                         selectedRoute.numero_transferencias !== undefined ? selectedRoute.numero_transferencias :
                         'N/D'
                        }
                      </ThemedText>
                    </ThemedView>
                    {selectedRoute.distancia_caminata && (
                      <ThemedView style={styles.statChip}>
                        <ThemedText variant="caption" weight="bold" color="accent">
                          🚶 {Math.round(selectedRoute.distancia_caminata)}m
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  
                  <ThemedButton
                    variant="primary"
                    size="sm"
                    onPress={() => setShowMap(false)}
                    style={styles.miniDetailsButton}
                  >
                    <Icon name="list" size="sm" color="background" />
                  </ThemedButton>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {mode === 'search' && (
              <>
                {/* Selección de origen y destino mejorada */}
                <ThemedView style={styles.section}>
                  <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
                    🗺️ Planifica tu viaje
                  </ThemedText>
                  
                  {/* Tarjeta de origen */}
                  <Card style={[styles.locationCard, styles.originCard]}>
                    <ThemedView style={styles.locationContent}>
                      <ThemedView style={[styles.locationIcon, { backgroundColor: `${theme.colors.primary}${theme.mode === 'dark' ? '40' : '20'}` }]}>
                        <Icon name="radio-button-checked" size="lg" color="primary" />
                      </ThemedView>
                      
                      <ThemedView style={styles.locationInfo}>
                        <ThemedText variant="caption" color="primary" weight="semibold">
                          ORIGEN
                        </ThemedText>
                        <ThemedText
                          variant="body"
                          weight="medium"
                          numberOfLines={2}
                          style={styles.locationText}
                          color={origin ? "text" : "textSecondary"}
                        >
                          {origin ? origin.name : 'Toca para seleccionar origen'}
                        </ThemedText>
                        {origin && origin.type && (
                          <ThemedText variant="caption" color="textSecondary">
                            {origin.type === 'current' ? '📍 Mi ubicación' : 
                             origin.type === 'stop' ? '🚏 Parada' : '🗺️ Coordenada'}
                          </ThemedText>
                        )}
                      </ThemedView>
                      
                      <ThemedView style={styles.locationActions}>
                        <ThemedButton
                          variant="ghost"
                          size="sm"
                          onPress={useCurrentLocation}
                          style={styles.locationActionButton}
                        >
                          <Icon name="my-location" size="md" color="primary" />
                        </ThemedButton>
                        <ThemedButton
                          variant="primary"
                          size="sm"
                          onPress={() => {
                            setMode('select-origin');
                            setShowMap(true);
                          }}
                          style={styles.selectButton}
                        >
                          <Icon name="place" size="sm" color="background" />
                        </ThemedButton>
                      </ThemedView>
                    </ThemedView>
                  </Card>

                  {/* Área de conexión visual */}
                  <ThemedView style={styles.connectionLine}>
                    <ThemedView style={styles.connectionDots}>
                      <ThemedView style={styles.dot} />
                      <ThemedView style={styles.dot} />
                      <ThemedView style={styles.dot} />
                    </ThemedView>
                    {origin && destination && (
                      <ThemedText variant="caption" color="textSecondary" style={styles.distanceText}>
                        📍 Distancia en línea recta: {calculateDirectDistance(origin, destination)}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {/* Tarjeta de destino */}
                  <Card style={[styles.locationCard, styles.destinationCard]}>
                    <ThemedView style={styles.locationContent}>
                      <ThemedView style={[styles.locationIcon, { backgroundColor: `${theme.colors.primary}${theme.mode === 'dark' ? '40' : '20'}` }]}>
                        <Icon name="location-on" size="lg" color="primary" />
                      </ThemedView>

                      <ThemedView style={styles.locationInfo}>
                        <ThemedText variant="caption" color="primary" weight="semibold">
                          DESTINO
                        </ThemedText>
                        <ThemedText
                          variant="body"
                          weight="medium"
                          numberOfLines={2}
                          style={styles.locationText}
                          color={destination ? "text" : "textSecondary"}
                        >
                          {destination ? destination.name : 'Toca para seleccionar destino'}
                        </ThemedText>
                        {destination && destination.type && (
                          <ThemedText variant="caption" color="textSecondary">
                            {destination.type === 'current' ? '📍 Mi ubicación' :
                             destination.type === 'stop' ? '🚏 Parada' :
                             destination.type === 'search' ? '🔍 Búsqueda' : '🗺️ Coordenada'}
                          </ThemedText>
                        )}
                      </ThemedView>

                      <ThemedView style={styles.locationActions}>
                        <ThemedButton
                          variant="primary"
                          size="sm"
                          onPress={() => {
                            setMode('select-destination');
                            setShowMap(true);
                          }}
                          style={styles.selectButton}
                        >
                          <Icon name="place" size="sm" color="background" />
                        </ThemedButton>
                      </ThemedView>
                    </ThemedView>
                  </Card>

                  {/* Botones de acción */}
                  <ThemedView style={styles.actionSection}>
                    <ThemedButton
                      variant="outline"
                      size="md"
                      onPress={() => setShowMap(true)}
                      style={styles.quickActionButton}
                    >
                      <Icon name="map" size="sm" color="accent" />
                      <ThemedText color="accent"> Ver mapa</ThemedText>
                    </ThemedButton>

                    <ThemedButton
                      variant="primary"
                      size="lg"
                      onPress={() => handlePlanTrip()}
                      loading={isPlanning}
                      disabled={!origin || !destination}
                      style={styles.planButton}
                    >
                      {isPlanning ? (
                        <>
                          <Icon name="refresh" size="md" color="background" />
                          <ThemedText color="background"> Planificando...</ThemedText>
                        </>
                      ) : (
                        <>
                          <Icon name="directions" size="md" color="background" />
                          <ThemedText color="background"> Planificar viaje</ThemedText>
                        </>
                      )}
                    </ThemedButton>
                  </ThemedView>
                </ThemedView>

                {/* Búsqueda inteligente de direcciones */}
                <SmartAddressSearch
                  onDestinationSelect={(destination) => {
                    const destinationPoint = {
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                      name: destination.name,
                      type: 'search',
                      place_id: destination.place_id,
                    };
                    setDestination(destinationPoint);

                    // Si ya tenemos origen, auto-planificar
                    if (origin) {
                      setTimeout(() => {
                        handlePlanTrip(origin, destinationPoint);
                      }, 500);
                    }
                  }}
                  showQuickPlan={false}
                />
              </>
            )}

            {mode === 'view-route' && selectedRoute && (
              <ThemedView style={styles.routeDetails}>
                {/* Botón para ver en mapa grande */}
                <ThemedView style={styles.routeHeader}>
                  <ThemedText variant="title" weight="bold" style={styles.routeTitle}>
                    📍 Ruta Planificada
                  </ThemedText>
                  <ThemedButton
                    variant="secondary"
                    size="sm"
                    onPress={() => setShowMap(true)}
                    style={styles.viewFullMapButton}
                  >
                    <Icon name="fullscreen" size="md" color="background" />
                    <ThemedText color="background"> Ver mapa completo</ThemedText>
                  </ThemedButton>
                </ThemedView>
                {/* Resumen de la ruta - SIN TIEMPOS ESTIMADOS */}
                <Card style={styles.routeSummary}>
                  <ThemedView style={styles.routeSummaryContent}>
                    <ThemedView style={styles.routeInfoGrid}>
                      <ThemedView style={styles.routeStat}>
                        <Icon name="directions-bus" size="lg" color="primary" />
                        <ThemedView style={styles.statText}>
                          <ThemedText variant="body" weight="bold">
                            {selectedRoute.segmentos.filter(s => s.tipo === 'autobus').length}
                          </ThemedText>
                          <ThemedText variant="caption" color="textSecondary">
                            {selectedRoute.segmentos.filter(s => s.tipo === 'autobus').length === 1 ? 'Bus' : 'Buses'}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      <ThemedView style={styles.routeStat}>
                        <Icon name="swap-horiz" size="lg" color="accent" />
                        <ThemedView style={styles.statText}>
                          <ThemedText variant="body" weight="bold">
                            {selectedRoute.numero_transbordos}
                          </ThemedText>
                          <ThemedText variant="caption" color="textSecondary">
                            Transbordos
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      {selectedRoute.distancia_caminata && (
                        <ThemedView style={styles.routeStat}>
                          <Icon name="directions-walk" size="lg" color="success" />
                          <ThemedView style={styles.statText}>
                            <ThemedText variant="body" weight="bold">
                              {Math.round(selectedRoute.distancia_caminata)}m
                            </ThemedText>
                            <ThemedText variant="caption" color="textSecondary">
                              A caminar
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                      )}
                    </ThemedView>
                  </ThemedView>

                  <ThemedButton
                    variant="primary"
                    size="md"
                    onPress={() => setShowMap(true)}
                    style={styles.viewMapButton}
                  >
                    <Icon name="map" size="md" color="background" />
                    <ThemedText color="background"> Ver ruta en mapa</ThemedText>
                  </ThemedButton>
                </Card>

                {/* Segmentos del viaje */}
                <ThemedView style={styles.segmentsContainer}>
                  <ThemedText variant="subtitle" weight="semibold" style={styles.segmentsTitle}>
                    Instrucciones de viaje
                  </ThemedText>
                  
                  {selectedRoute.segmentos.map((segment, index) => 
                    renderRouteSegment(segment, index)
                  )}
                </ThemedView>

                {/* Rutas alternativas - MEJORADAS */}
                {plannedRoutes.length > 1 && (
                  <ThemedView style={styles.alternativeRoutes}>
                    <ThemedView style={styles.alternativesHeader}>
                      <Icon name="alt-route" size="md" color="primary" />
                      <ThemedText variant="subtitle" weight="semibold" style={styles.alternativesTitle}>
                        Otras opciones ({plannedRoutes.length - 1})
                      </ThemedText>
                    </ThemedView>

                    {plannedRoutes.slice(1).map((route, index) => {
                      const busCount = route.segmentos.filter(s => s.tipo === 'autobus').length;
                      const walkDistance = Math.round(route.distancia_caminata || 0);

                      return (
                        <Card
                          key={index}
                          style={styles.alternativeCard}
                          onPress={() => {
                            setSelectedRoute(route);
                            // Scroll to top para ver la ruta seleccionada
                            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                          }}
                        >
                          <ThemedView style={styles.alternativeContent}>
                            <ThemedView style={styles.alternativeLeft}>
                              <ThemedView style={styles.alternativeMainInfo}>
                                <ThemedView style={styles.alternativeBadge}>
                                  <Icon name="directions-bus" size="sm" color="primary" />
                                  <ThemedText variant="caption" weight="bold" color="primary">
                                    {busCount}
                                  </ThemedText>
                                </ThemedView>
                                <ThemedText variant="body" weight="semibold">
                                  {route.numero_transbordos === 0
                                    ? 'Directo'
                                    : `${route.numero_transbordos} ${route.numero_transbordos === 1 ? 'transbordo' : 'transbordos'}`
                                  }
                                </ThemedText>
                              </ThemedView>

                              <ThemedView style={styles.alternativeMetrics}>
                                <ThemedView style={styles.alternativeMetric}>
                                  <Icon name="directions-walk" size="sm" color="textSecondary" />
                                  <ThemedText variant="caption" color="textSecondary">
                                    {walkDistance}m
                                  </ThemedText>
                                </ThemedView>
                              </ThemedView>
                            </ThemedView>

                            <Icon name="chevron-right" size="md" color="primary" />
                          </ThemedView>
                        </Card>
                      );
                    })}
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ScrollView>
        )}

        {/* Modal de preferencias */}
        <TripPreferences
          visible={showPreferences}
          preferences={tripPreferences}
          onClose={() => setShowPreferences(false)}
          onSave={setTripPreferences}
        />
      </ThemedView>
    </Modal>
  );
};