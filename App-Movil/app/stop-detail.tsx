import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { StopDetailCard } from '../components/stops/StopDetailCard';
import { Parada } from '../lib/types';

export default function StopDetailScreen() {
  const { stopId } = useLocalSearchParams<{ stopId: string }>();
  const { rutas } = useTransport();
  const { location } = useLocation();
  const { theme } = useTheme();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [stop, setStop] = useState<Parada | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    loadStop();
  }, [stopId]);

  useEffect(() => {
    if (stop && location) {
      calculateDistance();
    }
  }, [stop, location]);

  const loadStop = async () => {
    if (!stopId) return;

    try {
      const stopDoc = await getDoc(doc(db(), 'stops', stopId));
      if (stopDoc.exists()) {
        const data = stopDoc.data();
        setStop({
          id: stopDoc.id,
          id_parada: stopDoc.id,
          nombre: data.name || data.nombre || '',
          ubicacion: {
            latitud: data.lat || data.ubicacion?.latitud || 0,
            longitud: data.lng || data.ubicacion?.longitud || 0,
          },
          coordenadas: {
            lat: data.lat || 0,
            lng: data.lng || 0,
          },
          codigo: data.code || data.codigo || null,
          municipio_id: data.municipio_id || '',
          activa: data.activa ?? true,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
          routeIds: data.routeIds || [],
          operator: data.operator || null,
          network: data.network || null,
          amenities: data.amenities || {
            shelter: false,
            bench: false,
            lighting: false,
            bin: false,
            wifi: false,
            realTimeDisplay: false,
          },
          desc: data.desc || null,
          zoneId: data.zoneId || null,
          url: data.url || null,
          locationType: data.locationType || null,
          wheelchairBoarding: data.wheelchairBoarding || null,
          levelId: data.levelId || null,
          platformCode: data.platformCode || null,
          distancia: 0,
        } as Parada);
      }
    } catch (error) {
      console.error('Error loading stop:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la parada');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!stop || !location) return;

    const R = 6371e3;
    const φ1 = location.latitude * Math.PI / 180;
    const φ2 = stop.ubicacion.latitud * Math.PI / 180;
    const Δφ = (stop.ubicacion.latitud - location.latitude) * Math.PI / 180;
    const Δλ = (stop.ubicacion.longitud - location.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    setDistance(R * c);
  };

  const getDistanceText = (): string | null => {
    if (!distance) return null;
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const getRoutesForStop = () => {
    if (!stop || !rutas) return [];
    return rutas.filter(ruta =>
      stop.routeIds?.includes(ruta.id) ||
      ruta.paradas?.includes(stop.id) ||
      ruta.stopIds?.includes(stop.id)
    );
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Iniciar Sesión Requerido',
        'Para agregar favoritos necesitas iniciar sesión primero.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    if (!stop) return;

    try {
      const isCurrentlyFavorited = isFavorite(stop.id, 'parada');
      let success = false;

      if (isCurrentlyFavorited) {
        success = await removeFromFavorites(stop.id, 'parada');
        if (success) {
          Alert.alert('Favoritos', `"${stop.nombre}" eliminada de favoritos`);
        }
      } else {
        success = await addToFavorites(stop, 'parada');
        if (success) {
          Alert.alert('Favoritos', `"${stop.nombre}" agregada a favoritos`);
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

  const handleViewOnMap = () => {
    if (!stop) return;

    const params = new URLSearchParams({
      centerLat: stop.ubicacion.latitud.toString(),
      centerLng: stop.ubicacion.longitud.toString(),
      selectedPlace: stop.nombre,
    });

    router.push(`/map?${params.toString()}`);
  };

  const handlePlanTrip = () => {
    if (!stop) return;

    const params = new URLSearchParams({
      openPlanner: 'true',
      destinationLat: stop.ubicacion.latitud.toString(),
      destinationLng: stop.ubicacion.longitud.toString(),
      destinationName: stop.nombre,
    });

    router.push(`/map?${params.toString()}`);
  };

  const handleOpenUrl = () => {
    if (!stop?.url) return;
    Linking.openURL(stop.url);
  };

  const handleRoutePress = (routeId: string) => {
    router.push(`/map?filterRoute=${routeId}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <Stack.Screen options={{ headerShown: false }} />

        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="md" onPress={() => router.back()}>
            <Icon name="arrow-back-ios" color="primary" size="lg" />
          </ThemedButton>

          <ThemedText variant="subtitle" weight="bold" style={styles.headerTitle}>
            Detalle de parada
          </ThemedText>

          <ThemedView style={{ width: 40 }} />
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText variant="body" color="textSecondary">Cargando...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!stop) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <Stack.Screen options={{ headerShown: false }} />

        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="md" onPress={() => router.back()}>
            <Icon name="arrow-back-ios" color="primary" size="lg" />
          </ThemedButton>

          <ThemedText variant="subtitle" weight="bold" style={styles.headerTitle}>
            Detalle de parada
          </ThemedText>

          <ThemedView style={{ width: 40 }} />
        </ThemedView>
        <ThemedView style={styles.emptyContainer}>
          <Icon name="error-outline" color="textSecondary" size="xl2" />
          <ThemedText variant="subtitle" color="textSecondary" weight="bold">
            Parada no encontrada
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const routesForStop = getRoutesForStop();
  const distanceText = getDistanceText();

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedButton variant="ghost" size="md" onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back-ios" color="primary" size="lg" />
        </ThemedButton>

        <ThemedText variant="subtitle" weight="bold" style={styles.headerTitle}>
          Detalle de parada
        </ThemedText>

        <ThemedView style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
            <Icon
              name={isFavorite(stop.id, 'parada') ? 'heart' : 'heart-outline'}
              library="ionicons"
              color={isFavorite(stop.id, 'parada') ? '#EF4444' : 'textSecondary'}
              size="xl"
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <ThemedView style={styles.titleSection}>
          <ThemedText variant="heading" weight="bold" style={styles.title}>
            {stop.nombre}
          </ThemedText>

          <ThemedView style={styles.metaInfo}>
            {stop.codigo && (
              <ThemedView style={styles.metaItem}>
                <Icon name="qr-code" size="sm" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary">
                  {stop.codigo}
                </ThemedText>
              </ThemedView>
            )}
            {distanceText && (
              <ThemedView style={styles.metaItem}>
                <Icon name="near-me" size="sm" color="primary" />
                <ThemedText variant="caption" color="primary">
                  {distanceText}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Botones de acción */}
        <ThemedView style={styles.actionsSection}>
          <ThemedButton
            variant="primary"
            size="lg"
            onPress={handlePlanTrip}
            style={styles.primaryAction}
          >
            <Icon name="directions" size="md" color="background" />
            <ThemedText color="background" weight="bold">Planificar Viaje</ThemedText>
          </ThemedButton>

          <ThemedView style={styles.secondaryActions}>
            <ThemedButton
              variant="outline"
              size="md"
              onPress={handleViewOnMap}
              style={styles.secondaryAction}
            >
              <Icon name="map" size="sm" color="primary" />
              <ThemedText color="primary">Ver en Mapa</ThemedText>
            </ThemedButton>

            {stop.url && (
              <ThemedButton
                variant="outline"
                size="md"
                onPress={handleOpenUrl}
                style={styles.secondaryAction}
              >
                <Icon name="open-in-new" size="sm" color="primary" />
                <ThemedText color="primary">Más Info</ThemedText>
              </ThemedButton>
            )}
          </ThemedView>
        </ThemedView>

        {/* Rutas que pasan por esta parada */}
        {routesForStop.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Rutas que pasan por aquí ({routesForStop.length})
            </ThemedText>

            <ThemedView style={styles.routesList}>
              {routesForStop.map((ruta) => (
                <Card
                  key={ruta.id}
                  interactive
                  variant="outlined"
                  padding="md"
                  style={styles.routeCard}
                  onPress={() => handleRoutePress(ruta.id)}
                >
                  <ThemedView style={styles.routeCardContent}>
                    <ThemedView
                      style={[styles.routeColorIndicator, { backgroundColor: ruta.color }]}
                    />
                    <ThemedView style={styles.routeInfo}>
                      <ThemedText variant="body" weight="bold">
                        {ruta.numero || ruta.shortName}
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {ruta.nombre}
                      </ThemedText>
                    </ThemedView>
                    <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="md" />
                  </ThemedView>
                </Card>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {/* Detalles completos de la parada */}
        <ThemedView style={styles.section}>
          <StopDetailCard stop={stop} />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  titleSection: {
    paddingVertical: 20,
    gap: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  routesList: {
    gap: 8,
  },
  routeCard: {
    borderRadius: 12,
  },
  routeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  routeInfo: {
    flex: 1,
  },
});
