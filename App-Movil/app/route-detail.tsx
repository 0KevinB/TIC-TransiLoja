import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { RouteDetailCard } from '../components/routes/RouteDetailCard';
import { Ruta, Parada } from '../lib/types';

export default function RouteDetailScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { theme } = useTheme();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [route, setRoute] = useState<Ruta | null>(null);
  const [stops, setStops] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    if (!routeId) return;

    try {
      const routeDoc = await getDoc(doc(db(), 'routes', routeId));
      if (routeDoc.exists()) {
        const data = routeDoc.data();
        const routeData: Ruta = {
          id: routeDoc.id,
          id_ruta: routeDoc.id,
          numero: data.shortName || data.numero || '',
          nombre: data.name || data.nombre || '',
          color: data.color || '#FF0000',
          paradas: data.stopIds || data.paradas || [],
          stopIds: data.stopIds || [],
          municipio_id: data.municipio_id || '',
          activa: data.activa ?? true,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
          shortName: data.shortName || null,
          description: data.description || null,
          textColor: data.textColor || '#FFFFFF',
          type: data.type || 'bus',
          agencyId: data.agencyId || null,
          sortOrder: data.sortOrder || null,
          url: data.url || null,
          continuousPickup: data.continuousPickup || null,
          continuousDropOff: data.continuousDropOff || null,
          networkId: data.networkId || null,
          operatingStartTime: data.operatingStartTime || null,
          operatingEndTime: data.operatingEndTime || null,
          frequency: data.frequency || null,
          averageTravelTime: data.averageTravelTime || null,
        };
        setRoute(routeData);

        // Cargar paradas de la ruta
        await loadStops(routeData.stopIds || routeData.paradas || []);
      }
    } catch (error) {
      console.error('Error loading route:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la ruta');
    } finally {
      setLoading(false);
    }
  };

  const loadStops = async (stopIds: string[]) => {
    if (stopIds.length === 0) return;

    try {
      const stopsData: Parada[] = [];

      // Cargar paradas en orden
      for (const stopId of stopIds) {
        const stopDoc = await getDoc(doc(db(), 'stops', stopId));
        if (stopDoc.exists()) {
          const data = stopDoc.data();
          stopsData.push({
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
            distancia: 0,
          } as Parada);
        }
      }

      setStops(stopsData);
    } catch (error) {
      console.error('Error loading stops:', error);
    }
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

    if (!route) return;

    try {
      const isCurrentlyFavorited = isFavorite(route.id, 'ruta');
      let success = false;

      if (isCurrentlyFavorited) {
        success = await removeFromFavorites(route.id, 'ruta');
        if (success) {
          Alert.alert('Favoritos', `Ruta "${route.numero || route.nombre}" eliminada de favoritos`);
        }
      } else {
        success = await addToFavorites(route, 'ruta');
        if (success) {
          Alert.alert('Favoritos', `Ruta "${route.numero || route.nombre}" agregada a favoritos`);
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
    if (!route) return;
    router.push(`/map?filterRoute=${route.id}`);
  };

  const handleOpenUrl = () => {
    if (!route?.url) return;
    Linking.openURL(route.url);
  };

  const handleStopPress = (stopId: string) => {
    router.push(`/stop-detail?stopId=${stopId}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="md" onPress={() => router.back()}>
            <Icon name="arrow-back-ios" color="primary" size="lg" />
          </ThemedButton>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText variant="body" color="textSecondary">Cargando...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!route) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="md" onPress={() => router.back()}>
            <Icon name="arrow-back-ios" color="primary" size="lg" />
          </ThemedButton>
        </ThemedView>
        <ThemedView style={styles.emptyContainer}>
          <Icon name="error-outline" color="textSecondary" size="xl2" />
          <ThemedText variant="subtitle" color="textSecondary" weight="bold">
            Ruta no encontrada
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedButton variant="ghost" size="md" onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back-ios" color="primary" size="lg" />
        </ThemedButton>

        <ThemedView style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
            <Icon
              name={isFavorite(route.id, 'ruta') ? 'heart' : 'heart-outline'}
              library="ionicons"
              color={isFavorite(route.id, 'ruta') ? '#EF4444' : 'textSecondary'}
              size="xl"
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <ThemedView style={styles.titleSection}>
          <ThemedView style={styles.routeHeader}>
            <ThemedView
              style={[styles.routeColorBox, { backgroundColor: route.color }]}
            />
            <ThemedView style={styles.routeTitleContent}>
              <ThemedText variant="heading" weight="bold" style={styles.title}>
                {route.numero || route.shortName}
              </ThemedText>
              {route.numero !== route.nombre && (
                <ThemedText variant="subtitle" color="textSecondary">
                  {route.nombre}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Botones de acción */}
        <ThemedView style={styles.actionsSection}>
          <ThemedButton
            variant="primary"
            size="lg"
            onPress={handleViewOnMap}
            style={styles.primaryAction}
          >
            <Icon name="map" size="md" color="background" />
            <ThemedText color="background" weight="bold">Ver en Mapa</ThemedText>
          </ThemedButton>

          {route.url && (
            <ThemedButton
              variant="outline"
              size="md"
              onPress={handleOpenUrl}
              style={styles.secondaryAction}
            >
              <Icon name="open-in-new" size="sm" color="primary" />
              <ThemedText color="primary">Más Información</ThemedText>
            </ThemedButton>
          )}
        </ThemedView>

        {/* Paradas de la ruta */}
        {stops.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Paradas de la ruta ({stops.length})
            </ThemedText>

            <ThemedView style={styles.stopsList}>
              {stops.map((stop, index) => (
                <Card
                  key={stop.id}
                  interactive
                  variant="outlined"
                  padding="md"
                  style={styles.stopCard}
                  onPress={() => handleStopPress(stop.id)}
                >
                  <ThemedView style={styles.stopCardContent}>
                    <ThemedView style={styles.stopNumber}>
                      <ThemedText variant="caption" weight="bold" color="primary">
                        {index + 1}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.stopInfo}>
                      <ThemedText variant="body" weight="bold">
                        {stop.nombre}
                      </ThemedText>
                      {stop.codigo && (
                        <ThemedText variant="caption" color="textSecondary">
                          {stop.codigo}
                        </ThemedText>
                      )}
                    </ThemedView>
                    <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="md" />
                  </ThemedView>
                </Card>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {/* Detalles completos de la ruta */}
        <ThemedView style={styles.section}>
          <RouteDetailCard route={route} />
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
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  routeColorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  routeTitleContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    flexDirection: 'row',
    gap: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  stopsList: {
    gap: 8,
  },
  stopCard: {
    borderRadius: 12,
  },
  stopCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopInfo: {
    flex: 1,
  },
});
