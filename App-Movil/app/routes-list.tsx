import React, { useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTransport } from '../context/TransportContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { ThemedButton } from '../components/ui/ThemedButton';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';

export default function RoutesListScreen() {
  const { rutas, refreshData } = useTransport();
  const { user, isAuthenticated } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing routes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredRoutes = rutas.filter(
    (ruta) =>
      ruta.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruta.numero?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoutePress = (ruta: any) => {
    router.push(`/map?filterRoute=${ruta.id}`);
  };

  const handleToggleFavorite = async (ruta: any, event: any) => {
    event.stopPropagation();

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
      const rutaId = ruta.id;
      const isCurrentlyFavorited = isFavorite(rutaId, 'ruta');

      let success = false;
      if (isCurrentlyFavorited) {
        success = await removeFromFavorites(rutaId, 'ruta');
        if (success) {
          Alert.alert('Favoritos', `Ruta "${ruta.numero || ruta.nombre}" eliminada de favoritos`, [
            { text: 'OK' },
          ]);
        }
      } else {
        success = await addToFavorites(ruta, 'ruta');
        if (success) {
          Alert.alert('Favoritos', `Ruta "${ruta.numero || ruta.nombre}" agregada a favoritos`, [
            { text: 'OK' },
          ]);
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

  const renderRoute = (ruta: any) => {
    console.log('Renderizando ruta:', {
      id: ruta.id,
      nombre: ruta.nombre,
      operatingStartTime: ruta.operatingStartTime,
      operatingEndTime: ruta.operatingEndTime,
      todosLosCampos: Object.keys(ruta)
    });

    return (
    <Card
      key={ruta.id}
      interactive
      variant="outlined"
      padding="lg"
      style={styles.routeCard}
      onPress={() => handleRoutePress(ruta)}
    >
      <ThemedView style={styles.routeHeader}>
        <ThemedView style={styles.routeInfo}>
          <ThemedView style={styles.routeNameContainer}>
            <ThemedView
              style={[
                styles.routeColorIndicator,
                { backgroundColor: ruta.color ? (ruta.color.startsWith('#') ? ruta.color : `#${ruta.color}`) : theme.colors.primary },
              ]}
            />
            <ThemedText style={styles.routeName}>{ruta.numero || ruta.nombre}</ThemedText>
          </ThemedView>

          {ruta.numero !== ruta.nombre && (
            <ThemedText variant="body" color="textSecondary" style={styles.routeSecondaryName}>
              {ruta.nombre}
            </ThemedText>
          )}

          <ThemedView style={styles.routeStatsContainer}>
            <ThemedView style={styles.routeStats}>
              <ThemedView style={styles.routeStat}>
                <Icon name="location-on" color="textSecondary" size="sm" />
                <ThemedText variant="caption" color="textSecondary">
                  {(ruta.stopIds || ruta.paradas || []).length} paradas
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.routeStat}>
                <Icon
                  name={ruta.activa ? 'check-circle' : 'cancel'}
                  color={ruta.activa ? 'success' : 'textSecondary'}
                  size="sm"
                />
                <ThemedText variant="caption" color={ruta.activa ? 'success' : 'textSecondary'}>
                  {ruta.activa ? 'Activa' : 'Inactiva'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {ruta.operatingStartTime && ruta.operatingEndTime && (
              <ThemedView style={styles.routeSchedule}>
                <Icon name="schedule" color="textSecondary" size="sm" />
                <ThemedText variant="caption" color="textSecondary">
                  {ruta.operatingStartTime} - {ruta.operatingEndTime}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.routeActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => handleToggleFavorite(ruta, e)}
          >
            <Icon
              name={isFavorite(ruta.id, 'ruta') ? 'heart' : 'heart-outline'}
              library="ionicons"
              color={isFavorite(ruta.id, 'ruta') ? '#EF4444' : 'textSecondary'}
              size="lg"
            />
          </TouchableOpacity>

          <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="lg" />
        </ThemedView>
      </ThemedView>
    </Card>
    );
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header con navegación */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <ThemedButton
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-back-ios" color="primary" size="lg" />
          </ThemedButton>

          <ThemedText variant="title" weight="bold">
            Rutas de Transporte
          </ThemedText>

          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          Explora todas las líneas de transporte público
        </ThemedText>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar rutas por nombre o número..."
          style={styles.searchInput}
          leftIcon="search"
        />
      </ThemedView>

      {/* Lista de rutas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredRoutes.length > 0 ? (
          <ThemedView style={styles.routesList}>
            <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
              {filteredRoutes.length} ruta{filteredRoutes.length !== 1 ? 's' : ''} encontrada
              {filteredRoutes.length !== 1 ? 's' : ''}
            </ThemedText>

            {filteredRoutes.map((ruta) => renderRoute(ruta))}
          </ThemedView>
        ) : searchQuery ? (
          <ThemedView style={styles.emptyState}>
            <Icon name="search-off" color="textSecondary" size="xl2" />
            <ThemedText
              variant="subtitle"
              color="textSecondary"
              weight="bold"
              style={styles.emptyTitle}
            >
              Sin resultados
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              No encontramos rutas que coincidan con "{searchQuery}"
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.emptyState}>
            <Icon name="route" color="textSecondary" size="xl2" />
            <ThemedText
              variant="subtitle"
              color="textSecondary"
              weight="bold"
              style={styles.emptyTitle}
            >
              Cargando rutas...
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              Estamos obteniendo la información de las rutas de transporte
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    padding: 0,
  },
  headerSpacer: {
    width: 52,
  },
  headerSubtitle: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultsCount: {
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
  routesList: {
    gap: 12,
  },
  routeCard: {
    borderRadius: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  routeColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  routeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  routeSecondaryName: {
    fontSize: 14,
    marginTop: 2,
  },
  routeStatsContainer: {
    marginTop: 6,
    gap: 6,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
