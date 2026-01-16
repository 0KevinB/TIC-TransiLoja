import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { collection, getDocs, query } from 'firebase/firestore';
import { router, Stack } from 'expo-router';
import { db } from '@/lib/firebase';
import { Bus } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { OptimizedFlatList } from '@/components/optimized/OptimizedFlatList';
import { Icon } from '@/components/ui/Icon';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Card } from '@/components/ui/Card';

export default function BusesScreen() {
  const { theme } = useTheme();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hook optimizado de búsqueda
  const { query: searchQuery, setQuery: setSearchQuery, filteredData: filteredBuses, isSearching } = useOptimizedSearch({
    data: buses,
    searchKeys: ['plateNumber', 'numero_placa', 'model'],
    debounceMs: 300,
  });

  const fetchBuses = async () => {
    try {
      const busesRef = collection(db(), 'buses');
      const q = query(busesRef);
      const querySnapshot = await getDocs(q);

      const busesData: Bus[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Bus));

      setBuses(busesData);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuses();
  };

  const getStatusColor = (status?: string, estado?: string) => {
    const currentStatus = status || estado;
    switch (currentStatus) {
      case 'active':
      case 'activo':
        return '#10b981';
      case 'inactive':
      case 'inactivo':
        return '#6b7280';
      case 'maintenance':
      case 'mantenimiento':
        return '#f59e0b';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status?: string, estado?: string) => {
    const currentStatus = status || estado;
    switch (currentStatus) {
      case 'active':
      case 'activo':
        return 'Activo';
      case 'inactive':
      case 'inactivo':
        return 'Inactivo';
      case 'maintenance':
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  // Memoizar renderBusItem para evitar re-renders innecesarios
  const renderBusItem = useCallback(({ item }: { item: Bus }) => (
    <View style={[styles.busCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.busHeader}>
        <View style={styles.busMainInfo}>
          <Icon name="bus" library="ionicons" size={32} color={theme.colors.primary} />
          <View style={styles.busDetails}>
            <Text style={[styles.busPlate, { color: theme.colors.text }]}>
              {item.plateNumber || item.numero_placa || 'Sin placa'}
            </Text>
            {item.model && (
              <Text style={[styles.busModel, { color: theme.colors.textSecondary }]}>
                {item.model} {item.year ? `(${item.year})` : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.estado) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status, item.estado) }]}>
            {getStatusText(item.status, item.estado)}
          </Text>
        </View>
      </View>

      <View style={styles.busInfo}>
        {item.capacity && (
          <View style={styles.infoRow}>
            <Icon name="people" library="ionicons" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Capacidad: {item.capacity} pasajeros
            </Text>
          </View>
        )}

        {item.features && (
          <View style={styles.featuresContainer}>
            {item.features.airConditioning && (
              <View style={styles.feature}>
                <Icon name="snow" library="ionicons" size={14} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>A/C</Text>
              </View>
            )}
            {item.features.wheelchair && (
              <View style={styles.feature}>
                <Icon name="accessibility" library="ionicons" size={14} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Accesible</Text>
              </View>
            )}
            {item.features.wifi && (
              <View style={styles.feature}>
                <Icon name="wifi" library="ionicons" size={14} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>WiFi</Text>
              </View>
            )}
            {item.features.gps && (
              <View style={styles.feature}>
                <Icon name="navigate" library="ionicons" size={14} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>GPS</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  ), [theme.colors]);

  // Key extractor memoizado
  const keyExtractor = useCallback((item: Bus) => item.id, []);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer} backgroundColor="background">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText variant="body" color="textSecondary" style={styles.loadingText}>
          Cargando buses...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <Stack.Screen options={{ headerShown: false }} />
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
            Buses
          </ThemedText>

          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          Flota de transporte
        </ThemedText>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por placa o modelo..."
          style={styles.searchInput}
          leftIcon="search"
        />
      </ThemedView>

      {/* Lista de buses optimizada */}
      {filteredBuses.length > 0 ? (
        <ThemedView style={styles.listContainer}>
          <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
            {filteredBuses.length} bus{filteredBuses.length !== 1 ? 'es' : ''} encontrado{filteredBuses.length !== 1 ? 's' : ''}
          </ThemedText>
          <OptimizedFlatList
            data={filteredBuses}
            renderItem={renderBusItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={140}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.emptyState}>
          <Icon name="bus-outline" library="ionicons" color="textSecondary" size="xl2" />
          <ThemedText variant="subtitle" color="textSecondary" weight="bold" style={styles.emptyTitle}>
            {searchQuery ? 'Sin resultados' : 'No hay buses'}
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            {searchQuery ? `No encontramos buses que coincidan con "${searchQuery}"` : 'No hay buses registrados en el sistema'}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    flex: 1,
  },
  resultsCount: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  busCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busDetails: {
    marginLeft: 12,
    flex: 1,
  },
  busPlate: {
    fontSize: 18,
    fontWeight: '600',
  },
  busModel: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  busInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
  },
  loadingText: {
    marginTop: 12,
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
