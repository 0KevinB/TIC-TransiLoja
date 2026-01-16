import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, ListRenderItem } from 'react-native';
import { router } from 'expo-router';
import { useTransport } from '../../context/TransportContext';
import { useLocation } from '../../hooks/useLocation';
import { useTheme } from '../../context/ThemeContext';
import { useOptimizedSearch } from '../../hooks/useOptimizedSearch';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedTextInput } from '../../components/ui/ThemedTextInput';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Parada } from '../../lib/types';

export default function StopsScreen() {
  const { paradas, rutas, refreshData, getParadasCercanas } = useTransport();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  // Función para calcular distancia (memoizada)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Memoizar paradas cercanas
  const paradasCercanas = useMemo(() => {
    if (!showNearby || !location || !paradas?.length) {
      return paradas || [];
    }
    return getParadasCercanas(location.latitude, location.longitude, 1000);
  }, [showNearby, location, paradas, getParadasCercanas]);

  // Usar hook optimizado de búsqueda
  const { query: searchText, setQuery: setSearchText, filteredData: filteredParadas, isSearching } = useOptimizedSearch({
    data: paradasCercanas || [],
    searchKeys: ['nombre', 'codigo'],
    debounceMs: 300,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleLocationToggle = useCallback(async () => {
    if (!location) {
      try {
        const granted = await requestPermission();
        if (granted) {
          await getCurrentLocation();
          setShowNearby(true);
        } else {
          Alert.alert(
            'Permisos requeridos',
            'Para mostrar paradas cercanas necesitamos acceso a tu ubicación.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener la ubicación');
      }
    } else {
      setShowNearby(!showNearby);
    }
  }, [location, requestPermission, getCurrentLocation, showNearby]);

  const handleVerTodasEnMapa = useCallback(() => {
    console.log('Navegando al mapa para ver todas las paradas');
    router.push('/map');
  }, []);

  // Memoizar función de cálculo de distancia en texto
  const getDistanceText = useCallback((parada: Parada): string | null => {
    if (!location || !parada.ubicacion?.latitud || !parada.ubicacion?.longitud) {
      return null;
    }

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      parada.ubicacion.latitud,
      parada.ubicacion.longitud
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }, [location, calculateDistance]);

  // Memoizar función de obtener rutas para una parada
  const getRutasParaParada = useCallback((paradaId: string) => {
    if (!rutas?.length) return [];
    return rutas.filter(ruta => ruta.paradas?.includes(paradaId));
  }, [rutas]);

  const handleVerEnMapa = useCallback((parada: Parada) => {
    // Verificar que la parada tenga ubicación
    if (!parada.ubicacion?.latitud || !parada.ubicacion?.longitud) {
      Alert.alert('Error', 'Esta parada no tiene ubicación disponible');
      return;
    }

    // Navegar al mapa con la parada centrada
    const params = new URLSearchParams({
      centerLat: parada.ubicacion.latitud.toString(),
      centerLng: parada.ubicacion.longitud.toString(),
      selectedPlace: parada.nombre,
    });

    console.log('Navegando al mapa con parada:', parada.nombre);
    router.push(`/map?${params.toString()}`);
  }, []);

  const handlePlanificarViaje = useCallback((parada: Parada) => {
    // Verificar que la parada tenga ubicación
    if (!parada.ubicacion?.latitud || !parada.ubicacion?.longitud) {
      Alert.alert('Error', 'Esta parada no tiene ubicación disponible');
      return;
    }

    // Navegar al mapa con el planificador abierto y destino establecido
    const params = new URLSearchParams({
      openPlanner: 'true',
      destinationLat: parada.ubicacion.latitud.toString(),
      destinationLng: parada.ubicacion.longitud.toString(),
      destinationName: parada.nombre,
    });

    console.log('Abriendo planificador de viaje para parada:', parada.nombre);
    router.push(`/map?${params.toString()}`);
  }, []);

  const handleVerRutas = useCallback((parada: Parada) => {
    const rutasParada = getRutasParaParada(parada.id);

    if (rutasParada.length === 0) {
      Alert.alert('Sin rutas', 'Esta parada no tiene rutas asignadas');
      return;
    }

    if (rutasParada.length === 1) {
      // Si solo hay una ruta, navegar al mapa filtrando esa ruta
      const params = new URLSearchParams({
        filterRoute: rutasParada[0].id,
        centerLat: parada.ubicacion.latitud.toString(),
        centerLng: parada.ubicacion.longitud.toString(),
        selectedPlace: parada.nombre,
      });
      router.push(`/map?${params.toString()}`);
    } else {
      // Si hay múltiples rutas, mostrar opciones
      const rutaButtons = rutasParada.map(ruta => ({
        text: `${ruta.numero} - ${ruta.nombre}`,
        onPress: () => {
          const params = new URLSearchParams({
            filterRoute: ruta.id,
            centerLat: parada.ubicacion.latitud.toString(),
            centerLng: parada.ubicacion.longitud.toString(),
            selectedPlace: parada.nombre,
          });
          router.push(`/map?${params.toString()}`);
        }
      }));

      Alert.alert(
        'Seleccionar Ruta',
        `Esta parada tiene ${rutasParada.length} rutas. ¿Cuál quieres ver?`,
        [
          ...rutaButtons,
          { text: 'Ver todas', onPress: () => handleVerEnMapa(parada) },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  }, [getRutasParaParada, handleVerEnMapa]);

  const handleStopPress = useCallback((parada: Parada) => {
    router.push(`/stop-detail?stopId=${parada.id}`);
  }, []);

  // Renderizar item de FlatList
  const renderParada: ListRenderItem<Parada> = useCallback(({ item: parada }) => {
    const rutasParada = getRutasParaParada(parada.id);
    const distanceText = getDistanceText(parada);

    return (
      <Card
        interactive
        variant="outlined"
        padding="lg"
        style={styles.paradaCard}
        onPress={() => handleStopPress(parada)}
        accessibilityLabel={`Parada ${parada.nombre}`}
        accessibilityHint={`${rutasParada.length} ruta${rutasParada.length !== 1 ? 's' : ''} pasan por esta parada. ${distanceText ? `A ${distanceText} de distancia.` : ''} Toca para ver detalles.`}
        accessibilityRole="button"
      >
        <ThemedView style={styles.paradaHeader}>
          <ThemedView style={styles.paradaInfo}>
            <ThemedText variant="subtitle" weight="bold" style={styles.paradaName}>
              {parada.nombre}
            </ThemedText>

            <ThemedView style={styles.paradaDetails}>
              {parada.codigo && (
                <ThemedView style={styles.paradaDetail}>
                  <Icon name="qr-code" color="textSecondary" size="sm" />
                  <ThemedText variant="caption" color="textSecondary">
                    {parada.codigo}
                  </ThemedText>
                </ThemedView>
              )}
              {distanceText && (
                <ThemedView style={styles.paradaDetail}>
                  <Icon name="near-me" color="primary" size="sm" />
                  <ThemedText variant="caption" color="primary">
                    {distanceText}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {rutasParada.length > 0 && (
              <ThemedView style={styles.rutasContainer}>
                <ThemedView style={styles.rutasList}>
                  {rutasParada.slice(0, 3).map((ruta) => (
                    <ThemedView key={ruta.id} style={styles.rutaChipWrapper}>
                      <TouchableOpacity
                        style={styles.rutaChipContainer}
                        onPress={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams({
                            filterRoute: ruta.id,
                            centerLat: parada.ubicacion?.latitud?.toString() || '',
                            centerLng: parada.ubicacion?.longitud?.toString() || '',
                            selectedPlace: parada.nombre,
                          });
                          router.push(`/map?${params.toString()}`);
                        }}
                        activeOpacity={0.7}
                      >
                        <ThemedView
                          style={[
                            styles.rutaChip,
                            { backgroundColor: ruta.color || theme.colors.primary },
                          ]}
                        >
                          <ThemedText variant="caption" weight="bold" style={styles.rutaChipText}>
                            {ruta.numero}
                          </ThemedText>
                        </ThemedView>
                        <ThemedText variant="caption" color="textSecondary" numberOfLines={1} style={styles.rutaName}>
                          {ruta.nombre}
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  ))}
                  {rutasParada.length > 3 && (
                    <ThemedView style={styles.rutaChipMore}>
                      <ThemedText variant="caption" color="textSecondary" weight="bold">
                        +{rutasParada.length - 3}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>

          <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="lg" />
        </ThemedView>
      </Card>
    );
  }, [getRutasParaParada, getDistanceText, handleStopPress, theme.colors.primary]);

  // KeyExtractor para FlatList
  const keyExtractor = useCallback((item: Parada) => item.id, []);

  // Renderizar header de la lista
  const renderListHeader = useCallback(() => (
    <>
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
            Paradas
          </ThemedText>

          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          Encuentra paradas de transporte público
        </ThemedText>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar parada por nombre o código..."
          style={styles.searchInput}
          leftIcon="search"
        />

        <ThemedView style={styles.filterButtons}>
          <ThemedButton
            variant={showNearby ? "primary" : "outline"}
            size="sm"
            onPress={handleLocationToggle}
            style={styles.filterButton}
          >
            <Icon
              name={location ? (showNearby ? "location-on" : "location-off") : "location-disabled"}
              size="sm"
              color={showNearby ? "background" : "primary"}
            />
            <ThemedText color={showNearby ? "background" : "primary"}>
              {" "}Cercanas
            </ThemedText>
          </ThemedButton>
        </ThemedView>
      </ThemedView>

      {/* Contador de resultados */}
      {filteredParadas.length > 0 && (
        <ThemedView style={styles.resultsCountContainer}>
          <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
            {filteredParadas.length} parada{filteredParadas.length !== 1 ? 's' : ''} encontrada{filteredParadas.length !== 1 ? 's' : ''}
          </ThemedText>
        </ThemedView>
      )}
    </>
  ), [searchText, setSearchText, showNearby, location, handleLocationToggle, filteredParadas.length]);

  // Renderizar estado vacío
  const renderEmptyComponent = useCallback(() => {
    if (searchText) {
      return (
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
            No encontramos paradas que coincidan con "{searchText}"
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.emptyState}>
        <Icon name="location-on" color="textSecondary" size="xl2" />
        <ThemedText
          variant="subtitle"
          color="textSecondary"
          weight="bold"
          style={styles.emptyTitle}
        >
          {showNearby ? 'No hay paradas cercanas' : 'Cargando paradas...'}
        </ThemedText>
        <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
          {showNearby
            ? 'No encontramos paradas cerca de tu ubicación'
            : 'Estamos obteniendo la información de las paradas'
          }
        </ThemedText>
        {!location && !showNearby && (
          <ThemedButton
            variant="primary"
            onPress={handleLocationToggle}
            style={styles.emptyButton}
          >
            Activar Ubicación
          </ThemedButton>
        )}
      </ThemedView>
    );
  }, [searchText, showNearby, location, handleLocationToggle]);

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <FlatList
        data={filteredParadas}
        renderItem={renderParada}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={11}
        accessible={true}
        accessibilityLabel="Lista de paradas de transporte"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingLeft: 48,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
  },
  filterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsCountContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCount: {
    marginTop: 4,
  },
  paradaCard: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  paradaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  paradaInfo: {
    flex: 1,
    marginRight: 12,
  },
  paradaName: {
    flex: 1,
    marginBottom: 8,
  },
  paradaDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  paradaDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rutasContainer: {
    marginTop: 8,
  },
  rutasList: {
    flexDirection: 'column',
    gap: 6,
  },
  rutaChipWrapper: {
    width: '100%',
  },
  rutaChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  rutaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  rutaChipText: {
    color: '#FFFFFF',
  },
  rutaName: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  rutaChipMore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
  emptyButton: {
    marginTop: 16,
  },
});