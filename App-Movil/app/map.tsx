import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Alert, Platform, Modal, ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses, LiveBus } from '../hooks/useLiveBuses';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { GoogleMapsView } from '../components/GoogleMapsView';
import { TripPlanner } from '../components/TripPlanner';
import { Parada, Bus } from '../lib/types';

export default function MapScreen() {
  const { paradas, buses, rutas, forceRefresh, loading } = useTransport();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [selectedParada, setSelectedParada] = useState<any>(null);
  const [selectedBus, setSelectedBus] = useState<LiveBus | null>(null);
  const [showBuses, setShowBuses] = useState(false); // Ocultar buses por defecto
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set()); // Rutas seleccionadas (vacío = todas)
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState<{ lat: number; lng: number } | null>(null);
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(false);

  // Obtener buses en vivo solo cuando showBuses está activo (optimización de rendimiento)
  const { buses: liveBuses, loading: liveBusesLoading } = useLiveBuses({
    autoRefresh: showBuses, // Solo cargar cuando se necesitan
  });

  useEffect(() => {
    initializeLocation();
    loadMapData();
  }, []);

  // Efecto para centrar el mapa cuando la ubicación se actualiza después de hacer click
  useEffect(() => {
    if (shouldCenterOnUser && location) {
      setCenterOnUser({ lat: location.latitude, lng: location.longitude });
      setShouldCenterOnUser(false);
      // Resetear después de un momento para permitir futuros centrados
      setTimeout(() => setCenterOnUser(null), 1000);
    }
  }, [location, shouldCenterOnUser]);

  // Manejar parámetros de URL solo una vez
  useEffect(() => {
    if (params.openPlanner === 'true') {
      setShowTripPlanner(true);
    }
    if (params.filterRoute && typeof params.filterRoute === 'string') {
      setSelectedRoutes(new Set([params.filterRoute]));
    }
  }, []); // Solo ejecutar una vez al montar

  const initializeLocation = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        // Obtener la ubicación actual del usuario inmediatamente
        await getCurrentLocation();
        console.log('Ubicación actual obtenida correctamente');
      } else {
        console.log('Permiso de ubicación denegado');
        // Si no hay permiso, se usará la ubicación predeterminada
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  };

  const loadMapData = async () => {
    // Los datos se cargan automáticamente desde TransportContext
    // Solo refrescar manualmente si el usuario lo solicita
  };

  const handleStopPress = useCallback((stop: any) => {
    setSelectedParada(stop);
    setSelectedBus(null);
  }, []);

  const handleBusPress = useCallback((bus: any) => {
    setSelectedBus(bus);
    setSelectedParada(null);
  }, []);

  const handleLiveBusPress = useCallback((bus: LiveBus) => {
    setSelectedBus(bus);
    setSelectedParada(null);
    // Centrar en el bus
    setCenterOnUser({ lat: bus.lat, lng: bus.lng });
    setTimeout(() => setCenterOnUser(null), 1000);
  }, []);

  // Calcular tiempo desde última actualización
  const getTimeSinceUpdate = useCallback((timestamp: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }, []);

  // Obtener color del marcador según estado
  const getMarkerColor = useCallback((status: string, speed: number): string => {
    if (status === 'stopped' || speed < 1) return '#EF4444'; // Rojo - detenido
    if (speed < 5) return '#F59E0B'; // Naranja - lento
    return '#10B981'; // Verde - en movimiento
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParada(null);
    setSelectedBus(null);
  }, []);

  const handleToggleFavorite = async (item: any, type: 'parada' | 'ruta') => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Iniciar Sesión Requerido',
        'Para agregar favoritos necesitas iniciar sesión primero.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar Sesión',
            onPress: () => router.push('/auth/login'),
          },
        ]
      );
      return;
    }

    try {
      const itemId = item.id;
      const isCurrentlyFavorited = isFavorite(itemId, type);

      let success = false;
      if (isCurrentlyFavorited) {
        success = await removeFromFavorites(itemId, type);
        if (success) {
          Alert.alert(
            'Favoritos',
            `${type === 'parada' ? 'Parada' : 'Ruta'} "${
              item.name || item.nombre
            }" eliminada de favoritos`,
            [{ text: 'OK' }]
          );
        }
      } else {
        success = await addToFavorites(item, type);
        if (success) {
          Alert.alert(
            'Favoritos',
            `${type === 'parada' ? 'Parada' : 'Ruta'} "${
              item.name || item.nombre
            }" agregada a favoritos`,
            [{ text: 'OK' }]
          );
        }
      }

      if (!success) {
        Alert.alert('Error', 'No se pudo actualizar los favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar los favoritos');
    }
  };

  // Convertir liveBuses a formato Bus compatible con GoogleMapsView
  const convertLiveBusesToBuses = useCallback((liveBuses: LiveBus[]): Bus[] => {
    return liveBuses.map((lb) => ({
      id: lb.id,
      numero_placa: lb.busId,
      plateNumber: lb.busId,
      coordenadas: {
        lat: lb.lat,
        lng: lb.lng,
      },
      coordenadas_actuales: {
        lat: lb.lat,
        lng: lb.lng,
      },
      ubicacion_actual: {
        latitud: lb.lat,
        longitud: lb.lng,
        timestamp: lb.timestamp,
      },
      lat: lb.lat,
      lng: lb.lng,
      ruta_asignada: lb.routeId,
      estado: lb.status === 'moving' ? 'en_ruta' : 'en_parada',
      status: lb.status === 'moving' ? 'active' : 'stopped',
      numero_interno: lb.busId,
    }));
  }, []);

  // Filtrar datos según las rutas seleccionadas (memorizado para evitar recálculos)
  const { filteredParadas, filteredRutas, filteredBuses } = useMemo(() => {
    // Si no hay rutas específicas seleccionadas, mostrar todas
    const routesToShow =
      selectedRoutes.size === 0 ? (rutas || []) : (rutas || []).filter((r) => selectedRoutes.has(r.id));

    // Obtener todas las paradas de las rutas seleccionadas
    const routeStopIds = new Set<string>();
    routesToShow.forEach((route) => {
      const stopIds = route.stopIds || route.paradas || [];
      stopIds.forEach((stopId) => routeStopIds.add(stopId));
    });

    // Decidir qué buses mostrar: priorizar buses en vivo si están disponibles
    const busesToShow = liveBuses.length > 0
      ? convertLiveBusesToBuses(liveBuses)
      : (buses || []);

    return {
      filteredParadas: (paradas || []).filter((p) => routeStopIds.has(p.id)),
      filteredRutas: routesToShow,
      filteredBuses: showBuses
        ? busesToShow.filter((b) => {
            // Si no hay rutas específicas, mostrar todos los buses
            if (selectedRoutes.size === 0) return true;
            // Solo mostrar buses de las rutas seleccionadas
            return routesToShow.some(
              (route) =>
                b.ruta_asignada === route.id ||
                b.ruta_asignada === route.numero ||
                b.ruta_asignada === route.nombre
            );
          })
        : [],
    };
  }, [selectedRoutes, rutas, paradas, buses, liveBuses, showBuses, convertLiveBusesToBuses]);

  // Filtrar liveBuses por rutas seleccionadas para el panel (memorizado)
  const filteredLiveBuses = useMemo(() => {
    if (!showBuses || liveBuses.length === 0) return [];
    return liveBuses.filter((bus) => {
      if (selectedRoutes.size === 0) return true;
      return selectedRoutes.has(bus.routeId || '');
    });
  }, [showBuses, liveBuses, selectedRoutes]);

  const handleCenterOnUserLocation = async () => {
    if (location) {
      // Si ya tenemos la ubicación, centrar inmediatamente
      setCenterOnUser({ lat: location.latitude, lng: location.longitude });
      // Resetear después de un momento para permitir futuros centrados
      setTimeout(() => setCenterOnUser(null), 1000);
    } else {
      // Si no tenemos ubicación, obtenerla primero
      try {
        setShouldCenterOnUser(true);
        await getCurrentLocation();
      } catch (error) {
        setShouldCenterOnUser(false);
        Alert.alert(
          'Error de ubicación',
          'No se pudo obtener tu ubicación. Verifica que los permisos estén activados.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Determinar región inicial basada en ubicación del usuario
  const getInitialRegion = () => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    // Fallback a Loja, Ecuador si no hay ubicación
    return {
      latitude: -3.9929,
      longitude: -79.2045,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <GoogleMapsView
        showStops={true} // Siempre mostrar paradas (filtradas)
        showRoutes={true} // Siempre mostrar rutas (filtradas)
        showBuses={showBuses}
        showUserLocation={true}
        onStopPress={handleStopPress}
        onBusPress={handleBusPress}
        style={styles.map}
        initialRegion={getInitialRegion()}
        // Pasar los datos filtrados en lugar de usar los del contexto
        filteredParadas={filteredParadas}
        filteredRutas={filteredRutas}
        filteredBuses={filteredBuses}
        // Parámetros para centrar en lugar específico
        centerLocation={
          centerOnUser || // Prioridad a centrar en usuario
          (params.centerLat && params.centerLng
            ? {
                lat: parseFloat(params.centerLat as string),
                lng: parseFloat(params.centerLng as string),
              }
            : undefined)
        }
        selectedPlaceName={params.selectedPlace as string}
      />

      {/* Botón flotante de regreso */}
      <TouchableOpacity
        style={[
          styles.floatingBackButton,
          {
            backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
        onPress={() => router.back()}
      >
        <Icon name="arrow-back" size="md" color="text" />
      </TouchableOpacity>

      {/* Grupo de controles unificados (derecha) */}
      <ThemedView
        style={[
          styles.controlsGroup,
          {
            backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
      >
        {/* Mi ubicación */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCenterOnUserLocation}
        >
          <Icon name="my-location" size="sm" color="background" />
        </TouchableOpacity>

        {/* Actualizar */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor:
                theme.mode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            },
          ]}
          onPress={forceRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size="sm" color={loading ? 'textSecondary' : 'text'} />
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.controlSeparator} />

        {/* Toggle de buses */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: showBuses
                ? liveBuses.length > 0
                  ? '#10B981'
                  : theme.colors.primary
                : theme.mode === 'dark'
                ? 'rgba(51, 65, 85, 0.8)'
                : 'rgba(241, 245, 249, 0.8)',
            },
          ]}
          onPress={() => setShowBuses(!showBuses)}
        >
          <Icon name="directions-bus" size="sm" color={showBuses ? 'background' : 'text'} />
          {showBuses && liveBuses.length > 0 && (
            <View style={[styles.livePulse, { backgroundColor: '#10B981' }]} />
          )}
        </TouchableOpacity>

        {/* Selector de rutas */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor:
                selectedRoutes.size > 0
                  ? theme.colors.secondary
                  : theme.mode === 'dark'
                  ? 'rgba(51, 65, 85, 0.8)'
                  : 'rgba(241, 245, 249, 0.8)',
            },
          ]}
          onPress={() => setShowRouteSelector(true)}
        >
          <Icon name="tune" size="sm" color={selectedRoutes.size > 0 ? 'background' : 'text'} />
          {selectedRoutes.size > 0 && (
            <ThemedView style={[styles.controlBadge, { backgroundColor: '#EF4444' }]}>
              <ThemedText style={styles.controlBadgeText}>{selectedRoutes.size}</ThemedText>
            </ThemedView>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.controlSeparator} />

        {/* Planificador */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => setShowTripPlanner(true)}
        >
          <Icon name="directions" size="sm" color="background" />
        </TouchableOpacity>
      </ThemedView>

      {/* Información de parada seleccionada */}
      {selectedParada && (
        <Card style={styles.infoCard}>
          <ThemedView style={styles.infoHeader}>
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="subtitle" weight="semibold">
                {selectedParada.nombre}
              </ThemedText>
              {selectedParada.codigo && (
                <ThemedText variant="caption" color="textSecondary">
                  Código: {selectedParada.codigo}
                </ThemedText>
              )}
            </ThemedView>
            <ThemedView style={styles.infoHeaderButtons}>
              <ThemedButton
                variant="ghost"
                size="sm"
                onPress={() => handleToggleFavorite(selectedParada, 'parada')}
              >
                <Icon
                  name={isFavorite(selectedParada.id, 'parada') ? 'heart' : 'heart-outline'}
                  library="ionicons"
                  size="md"
                  color={isFavorite(selectedParada.id, 'parada') ? '#EF4444' : 'primary'}
                />
              </ThemedButton>
              <ThemedButton variant="ghost" size="sm" onPress={clearSelection}>
                <Icon name="close" size="sm" color="textSecondary" />
              </ThemedButton>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.infoActions}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => {
                // Encontrar rutas que pasan por esta parada
                const rutasEnParada = rutas.filter(ruta =>
                  (ruta.stopIds || ruta.paradas || []).includes(selectedParada.id || selectedParada.id_parada)
                );

                if (rutasEnParada.length === 0) {
                  Alert.alert('Horarios', 'No hay rutas que pasen por esta parada en este momento.');
                  return;
                }

                // Crear mensaje con horarios aproximados
                const mensaje = rutasEnParada.map(ruta => {
                  const frecuencia = ruta.frecuencia || ruta.intervalo || 15;
                  const horaInicio = ruta.hora_inicio || '05:00';
                  const horaFin = ruta.hora_fin || '22:00';
                  return `• ${ruta.nombre || ruta.numero}: ${horaInicio} - ${horaFin} (cada ${frecuencia} min)`;
                }).join('\n\n');

                Alert.alert(
                  'Horarios de buses',
                  `Rutas que pasan por esta parada:\n\n${mensaje}`,
                  [{ text: 'Cerrar' }]
                );
              }}
              style={styles.infoAction}
            >
              <Icon name="schedule" size="sm" color="primary" />
              <ThemedText color="primary"> Horarios</ThemedText>
            </ThemedButton>

            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => {
                // Encontrar rutas que pasan por esta parada
                const rutasEnParada = rutas.filter(ruta =>
                  (ruta.stopIds || ruta.paradas || []).includes(selectedParada.id || selectedParada.id_parada)
                );

                if (rutasEnParada.length === 0) {
                  Alert.alert('Rutas', 'No hay rutas que pasen por esta parada en este momento.');
                  return;
                }

                // Crear mensaje con información de rutas
                const mensaje = rutasEnParada.map(ruta => {
                  const numParadas = (ruta.stopIds || ruta.paradas || []).length;
                  return `• ${ruta.nombre || ruta.numero}\n  ${numParadas} paradas${ruta.descripcion ? `\n  ${ruta.descripcion}` : ''}`;
                }).join('\n\n');

                Alert.alert(
                  'Rutas disponibles',
                  `${rutasEnParada.length} ruta(s) pasan por esta parada:\n\n${mensaje}`,
                  [{ text: 'Cerrar' }]
                );
              }}
              style={styles.infoAction}
            >
              <Icon name="directions" size="sm" color="primary" />
              <ThemedText color="primary"> Rutas</ThemedText>
            </ThemedButton>
          </ThemedView>
        </Card>
      )}

      {/* Información de bus seleccionado */}
      {selectedBus && liveBuses.length > 0 && (
        <Card style={styles.infoCard}>
          <ThemedView style={styles.infoHeader}>
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="subtitle" weight="semibold">
                Bus {selectedBus.busId}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Estado: {selectedBus.status === 'moving' ? 'En movimiento' : 'Detenido'}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Velocidad: {Math.round(selectedBus.speed * 3.6)} km/h
              </ThemedText>
              {selectedBus.routeId && (
                <ThemedText variant="caption" color="textSecondary">
                  Ruta: {rutas.find(r => r.id === selectedBus.routeId)?.numero || selectedBus.routeId}
                </ThemedText>
              )}
            </ThemedView>
            <ThemedButton variant="ghost" size="sm" onPress={clearSelection}>
              <Icon name="close" size="sm" color="textSecondary" />
            </ThemedButton>
          </ThemedView>

          <ThemedView style={styles.infoActions}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => {
                handleLiveBusPress(selectedBus);
              }}
              style={styles.infoAction}
            >
              <Icon name="gps-fixed" size="sm" color="primary" />
              <ThemedText color="primary"> Centrar</ThemedText>
            </ThemedButton>

            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => {
                const route = rutas.find(r => r.id === selectedBus.routeId);
                Alert.alert(
                  'Información del Bus',
                  `Bus: ${selectedBus.busId}\n` +
                  `Ruta: ${route?.nombre || 'Sin ruta'}\n` +
                  `Velocidad: ${Math.round(selectedBus.speed * 3.6)} km/h\n` +
                  `Estado: ${selectedBus.status === 'moving' ? 'En movimiento' : 'Detenido'}\n` +
                  `Última actualización: ${getTimeSinceUpdate(selectedBus.timestamp)} atrás`
                );
              }}
              style={styles.infoAction}
            >
              <Icon
                name="information-circle-outline"
                library="ionicons"
                size="sm"
                color="secondary"
              />
              <ThemedText color="secondary"> Info</ThemedText>
            </ThemedButton>
          </ThemedView>
        </Card>
      )}


      {/* Planificador de viajes */}
      <TripPlanner
        visible={showTripPlanner}
        onClose={() => setShowTripPlanner(false)}
        initialDestination={
          params.destinationLat && params.destinationLng && params.destinationName
            ? {
                description: params.destinationName as string,
                place_id: 'search_result',
                geometry: {
                  location: {
                    lat: parseFloat(params.destinationLat as string),
                    lng: parseFloat(params.destinationLng as string),
                  },
                },
              }
            : undefined
        }
      />

      {/* Selector de rutas específicas */}
      <Modal
        visible={showRouteSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteSelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRouteSelector(false)}
        >
          {/* Aplicar colores dinámicos según el tema */}
          <ThemedView
            style={[
              styles.routeSelectorModal,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? 'rgba(15, 23, 42, 0.95)' // Fondo oscuro semitransparente
                    : theme.mode === 'high-contrast'
                    ? '#FFFFFF' // Fondo blanco sólido para alto contraste
                    : 'rgba(255, 255, 255, 0.95)', // Fondo claro semitransparente
              },
            ]}
            backgroundColor={theme.mode === 'high-contrast' ? 'background' : 'transparent'}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <ThemedView
                style={[
                  styles.modalHeader,
                  {
                    borderBottomColor:
                      theme.mode === 'dark'
                        ? 'rgba(51, 65, 85, 0.8)'
                        : theme.mode === 'high-contrast'
                        ? '#000000'
                        : 'rgba(229, 231, 235, 0.8)',
                  },
                ]}
              >
                <ThemedText variant="subtitle" weight="bold">
                  Filtrar Rutas
                </ThemedText>
                <ThemedView style={styles.headerActions}>
                  <ThemedButton
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setSelectedRoutes(new Set());
                    }}
                  >
                    <ThemedText variant="caption" color="primary">
                      Todas
                    </ThemedText>
                  </ThemedButton>
                  <ThemedButton
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowRouteSelector(false)}
                  >
                    <Icon name="close" size="sm" color="textSecondary" />
                  </ThemedButton>
                </ThemedView>
              </ThemedView>

              <ScrollView
                style={styles.routeList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <ThemedText variant="caption" color="textSecondary" style={styles.routeListHelp}>
                  Selecciona las rutas que quieres ver en el mapa
                </ThemedText>

                {/* Lista de rutas con checkboxes */}
                {rutas.map((ruta) => (
                  <TouchableOpacity
                    key={ruta.id}
                    style={[
                      styles.routeOption,
                      {
                        backgroundColor:
                          theme.mode === 'dark'
                            ? selectedRoutes.has(ruta.id)
                              ? 'rgba(30, 41, 59, 0.8)'
                              : 'transparent'
                            : theme.mode === 'high-contrast'
                            ? selectedRoutes.has(ruta.id)
                              ? '#E5E7EB'
                              : 'transparent'
                            : selectedRoutes.has(ruta.id)
                            ? 'rgba(243, 244, 246, 0.8)'
                            : 'transparent',
                      },
                      selectedRoutes.has(ruta.id) && [
                        styles.routeOptionSelected,
                        {
                          borderColor:
                            theme.mode === 'dark'
                              ? theme.colors.primary
                              : theme.mode === 'high-contrast'
                              ? '#000000'
                              : theme.colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => {
                      const newSelected = new Set(selectedRoutes);
                      if (newSelected.has(ruta.id)) {
                        newSelected.delete(ruta.id);
                      } else {
                        newSelected.add(ruta.id);
                      }
                      setSelectedRoutes(newSelected);
                    }}
                  >
                    <Icon
                      name={selectedRoutes.has(ruta.id) ? 'check-box' : 'check-box-outline-blank'}
                      size="md"
                      color={selectedRoutes.has(ruta.id) ? 'primary' : 'textSecondary'}
                    />
                    <ThemedView
                      style={[
                        styles.routeColorIndicator,
                        {
                          backgroundColor: ruta.color || theme.colors.primary,
                          borderWidth: theme.mode === 'high-contrast' ? 1 : 0,
                          borderColor: theme.mode === 'high-contrast' ? '#000000' : 'transparent',
                          width: theme.mode === 'high-contrast' ? 16 : 12,
                          height: theme.mode === 'high-contrast' ? 16 : 12,
                        },
                      ]}
                    />
                    <ThemedView style={styles.routeOptionContent}>
                      <ThemedText
                        variant="body"
                        weight={selectedRoutes.has(ruta.id) ? 'semibold' : 'regular'}
                      >
                        {ruta.numero}
                      </ThemedText>
                      {ruta.numero !== ruta.nombre && (
                        <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                          {ruta.nombre}
                        </ThemedText>
                      )}
                      <ThemedText variant="caption" color="textSecondary">
                        {(ruta.stopIds || ruta.paradas || []).length} paradas
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ThemedView
                style={[
                  styles.modalFooter,
                  {
                    borderTopColor:
                      theme.mode === 'dark'
                        ? 'rgba(51, 65, 85, 0.8)'
                        : theme.mode === 'high-contrast'
                        ? '#000000'
                        : 'rgba(229, 231, 235, 0.8)',
                  },
                ]}
              >
                <ThemedButton
                  variant="primary"
                  onPress={() => setShowRouteSelector(false)}
                  style={styles.applyButton}
                >
                  <ThemedText color="background" weight="semibold">
                    Aplicar {selectedRoutes.size === 0 ? '(Todas)' : `(${selectedRoutes.size})`}
                  </ThemedText>
                </ThemedButton>
              </ThemedView>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      {/* Panel de buses en vivo */}
      {showBuses && filteredLiveBuses.length > 0 && (
        <View style={styles.busPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Buses Activos ({filteredLiveBuses.length})</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Movimiento</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Lento</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Detenido</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.busList}
          >
            {filteredLiveBuses.map((bus) => {
              const route = rutas.find((r) => r.id === bus.routeId);
              const isSelected = selectedBus?.id === bus.id;
              const statusColor = getMarkerColor(bus.status, bus.speed);

              return (
                <TouchableOpacity
                  key={bus.id}
                  style={[
                    styles.busCard,
                    isSelected && styles.busCardSelected,
                  ]}
                  onPress={() => handleLiveBusPress(bus)}
                >
                  {/* Indicador de estado */}
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

                  {/* Información de ruta */}
                  {route ? (
                    <View style={[styles.routeHeader, { backgroundColor: route.color }]}>
                      <Text style={styles.routeShortName}>{route.numero}</Text>
                    </View>
                  ) : (
                    <View style={[styles.routeHeader, { backgroundColor: '#6B7280' }]}>
                      <Text style={styles.routeShortName}>GPS</Text>
                    </View>
                  )}

                  {/* Información del bus */}
                  <View style={styles.busInfo}>
                    <Text style={styles.busId} numberOfLines={1}>
                      {bus.busId}
                    </Text>

                    <View style={styles.busStats}>
                      <View style={styles.statItemBus}>
                        <Icon name="speed" size="sm" color="textSecondary" />
                        <Text style={styles.statText}>
                          {Math.round(bus.speed * 3.6)} km/h
                        </Text>
                      </View>

                      <View style={styles.statItemBus}>
                        <Icon name="access-time" size="sm" color="textSecondary" />
                        <Text style={styles.statText}>
                          {getTimeSinceUpdate(bus.timestamp)}
                        </Text>
                      </View>
                    </View>

                    {/* Estado */}
                    <Text style={[styles.busStatus, { color: statusColor }]}>
                      {bus.status === 'stopped' ? 'Detenido' : 'En movimiento'}
                    </Text>

                    {/* Parada actual */}
                    {bus.isAtStop && bus.routeStops && bus.routeStops.length > 0 && (
                      <View style={styles.stopInfo}>
                        <Icon name="location-on" size="sm" color="textSecondary" />
                        <Text style={styles.stopText}>
                          Parada {bus.currentStopIndex + 1}/{bus.routeStops.length}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Botón flotante de regreso (superior izquierda)
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Grupo de controles unificados (derecha)
  controlsGroup: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    borderRadius: 12,
    padding: 6,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Botones de control compactos
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Separador entre grupos
  controlSeparator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 2,
  },
  // Badge de control
  controlBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  controlBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    margin: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoHeaderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos para el modal de selección de rutas
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // Quitamos el fondo gris semitransparente
    justifyContent: 'flex-end',
  },
  routeSelectorModal: {
    maxHeight: '80%',
    minHeight: '40%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    // Los colores se aplicarán dinámicamente
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    // El color del borde se aplicará dinámicamente
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeList: {
    maxHeight: '60vh', // Altura máxima adaptativa
    paddingHorizontal: 20,
  },
  routeListHelp: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12, // Bordes más redondeados
    marginVertical: 6,
    gap: 12,
    // El fondo se aplicará dinámicamente
  },
  routeOptionSelected: {
    // Los colores se aplicarán dinámicamente
    borderWidth: 1,
  },
  routeOptionContent: {
    flex: 1,
  },
  routeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 30, // Más espacio en la parte inferior
    borderTopWidth: 1,
    // El color del borde se aplicará dinámicamente
  },
  applyButton: {
    width: '100%',
    borderRadius: 12, // Bordes más redondeados
    paddingVertical: 14, // Botón más alto
  },
  // Estilos para buses en vivo
  livePulse: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  busPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  panelHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  busList: {
    paddingHorizontal: 12,
  },
  busCard: {
    width: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  busCardSelected: {
    borderColor: '#61d45d',
    backgroundColor: '#F0FDF4',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  routeHeader: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  routeShortName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  busInfo: {
    gap: 6,
  },
  busId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  busStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statItemBus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  busStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stopText: {
    fontSize: 11,
    color: '#6B7280',
  },
});