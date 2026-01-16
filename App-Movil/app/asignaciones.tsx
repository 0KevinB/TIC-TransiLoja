import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { router, Stack } from 'expo-router';
import { db } from '@/lib/firebase';
import { AsignacionServicio, Bus, Conductor, Ruta } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { useOfflineServices } from '@/hooks/useOfflineServices';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { OptimizedFlatList } from '@/components/optimized/OptimizedFlatList';
import { Icon } from '@/components/ui/Icon';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Card } from '@/components/ui/Card';

interface AsignacionExtendida extends AsignacionServicio {
  routeName?: string;
  busPlate?: string;
  conductorName?: string;
}

export default function AsignacionesScreen() {
  const { theme } = useTheme();
  const { asignaciones: offlineAsignaciones, isOffline } = useOfflineServices();
  const [asignaciones, setAsignaciones] = useState<AsignacionExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hook optimizado de búsqueda
  const { query: searchQuery, setQuery: setSearchQuery, filteredData: filteredAsignaciones, isSearching } = useOptimizedSearch({
    data: asignaciones,
    searchKeys: ['routeName', 'busPlate', 'conductorName', 'headsign'],
    debounceMs: 300,
  });

  const fetchAsignaciones = async () => {
    try {
      // Si hay datos offline, usarlos primero (ya vienen con nombres enriquecidos)
      if (offlineAsignaciones.length > 0) {
        setAsignaciones(offlineAsignaciones as AsignacionExtendida[]);
        console.log('📱 Usando asignaciones desde caché offline');
      }

      // Intentar actualizar desde Firebase si hay conexión
      if (!isOffline) {
        // Obtener todos los trips/viajes
        const tripsRef = collection(db(), 'trips');
        const q = query(tripsRef);
        const querySnapshot = await getDocs(q);

        const asignacionesData: AsignacionExtendida[] = await Promise.all(
          querySnapshot.docs.map(async (tripDoc) => {
            const tripData = tripDoc.data();

            // Obtener información de la ruta
            let routeName = 'Ruta desconocida';
            if (tripData.routeId) {
              try {
                const routeDoc = await getDoc(doc(db(), 'routes', tripData.routeId));
                if (routeDoc.exists()) {
                  const routeData = routeDoc.data();
                  routeName = routeData.name || routeData.nombre || routeData.shortName || tripData.routeId;
                }
              } catch (error) {
                console.error('Error fetching route:', error);
              }
            }

            // Obtener información del bus
            let busPlate = 'Bus desconocido';
            if (tripData.busId) {
              try {
                const busDoc = await getDoc(doc(db(), 'buses', tripData.busId));
                if (busDoc.exists()) {
                  const busData = busDoc.data();
                  busPlate = busData.plateNumber || busData.numero_placa || tripData.busId;
                }
              } catch (error) {
                console.error('Error fetching bus:', error);
              }
            }

            // Obtener información del conductor
            let conductorName = 'Conductor desconocido';
            if (tripData.conductorId) {
              try {
                const conductorDoc = await getDoc(doc(db(), 'conductores', tripData.conductorId));
                if (conductorDoc.exists()) {
                  const conductorData = conductorDoc.data();
                  conductorName = `${conductorData.nombre} ${conductorData.apellidos || conductorData.apellido || ''}`.trim();
                }
              } catch (error) {
                console.error('Error fetching conductor:', error);
              }
            }

            return {
              id: tripDoc.id,
              routeId: tripData.routeId,
              routeName,
              busId: tripData.busId,
              busPlate,
              conductorId: tripData.conductorId,
              conductorName,
              calendarId: tripData.calendarId,
              headsign: tripData.headsign,
              direction: tripData.direction,
              startTime: tripData.frequency?.startTime || tripData.startTime || '00:00',
              endTime: tripData.frequency?.endTime || tripData.endTime || '23:59',
              frequency: tripData.frequency?.headwaySecs ? Math.round(tripData.frequency.headwaySecs / 60) : undefined,
              createdAt: tripData.createdAt,
              updatedAt: tripData.updatedAt,
            } as AsignacionExtendida;
          })
        );

        setAsignaciones(asignacionesData);
        console.log('🌐 Asignaciones actualizadas desde Firebase');
      }
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
      // Si falla Firebase pero hay datos offline, mantenerlos
      if (offlineAsignaciones.length > 0) {
        console.log('⚠️ Error en Firebase, usando datos offline');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
  }, [offlineAsignaciones, isOffline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAsignaciones();
  };

  const getDirectionIcon = (direction?: number) => {
    if (direction === 0) return 'arrow-forward';
    if (direction === 1) return 'arrow-back';
    return 'swap-horizontal';
  };

  const getDirectionText = (direction?: number) => {
    if (direction === 0) return 'Ida';
    if (direction === 1) return 'Vuelta';
    return 'Ambas direcciones';
  };

  // Memoizar renderAsignacionItem para evitar re-renders innecesarios
  const renderAsignacionItem = useCallback(({ item }: { item: AsignacionExtendida }) => (
    <View style={[styles.asignacionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header con ruta y dirección */}
      <View style={styles.asignacionHeader}>
        <View style={styles.routeInfo}>
          <Icon name="navigate" library="ionicons" size={24} color={theme.colors.primary} />
          <View style={styles.routeDetails}>
            <Text style={[styles.routeName, { color: theme.colors.text }]}>
              {item.routeName}
            </Text>
            {item.headsign && (
              <Text style={[styles.headsign, { color: theme.colors.textSecondary }]}>
                Destino: {item.headsign}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.directionBadge, { backgroundColor: theme.colors.accent + '20' }]}>
          <Icon name={getDirectionIcon(item.direction)} library="ionicons" size={14} color={theme.colors.accent} />
          <Text style={[styles.directionText, { color: theme.colors.accent }]}>
            {getDirectionText(item.direction)}
          </Text>
        </View>
      </View>

      {/* Información del bus */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="bus" library="ionicons" size={20} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Bus</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {item.busPlate}
            </Text>
          </View>
        </View>

        {/* Información del conductor */}
        <View style={styles.infoRow}>
          <Icon name="person" library="ionicons" size={20} color={theme.colors.accent} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Conductor</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {item.conductorName}
            </Text>
          </View>
        </View>
      </View>

      {/* Horarios */}
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Icon name="time" library="ionicons" size={18} color={theme.colors.primary} />
            <View>
              <Text style={[styles.scheduleLabel, { color: theme.colors.textSecondary }]}>Inicio</Text>
              <Text style={[styles.scheduleTime, { color: theme.colors.text }]}>
                {item.startTime || 'N/A'}
              </Text>
            </View>
          </View>

          <Icon name="arrow-forward" library="ionicons" size={16} color={theme.colors.textSecondary} />

          <View style={styles.scheduleItem}>
            <Icon name="time-outline" library="ionicons" size={18} color={theme.colors.accent} />
            <View>
              <Text style={[styles.scheduleLabel, { color: theme.colors.textSecondary }]}>Fin</Text>
              <Text style={[styles.scheduleTime, { color: theme.colors.text }]}>
                {item.endTime || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {item.frequency && item.frequency > 0 && (
          <View style={[styles.frequencyBadge, { backgroundColor: theme.colors.primary + '10' }]}>
            <Icon name="repeat" library="ionicons" size={14} color={theme.colors.primary} />
            <Text style={[styles.frequencyText, { color: theme.colors.primary }]}>
              Frecuencia: cada {item.frequency} min
            </Text>
          </View>
        )}
      </View>
    </View>
  ), [theme.colors]);

  // Key extractor memoizado
  const keyExtractor = useCallback((item: AsignacionExtendida) => item.id, []);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer} backgroundColor="background">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText variant="body" color="textSecondary" style={styles.loadingText}>
          Cargando asignaciones de servicio...
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
            Asignaciones
          </ThemedText>

          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          Servicios programados
        </ThemedText>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por ruta, bus o conductor..."
          style={styles.searchInput}
          leftIcon="search"
        />
      </ThemedView>

      {/* Lista de asignaciones optimizada */}
      {filteredAsignaciones.length > 0 ? (
        <ThemedView style={styles.listContainer}>
          <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
            {filteredAsignaciones.length} asignación{filteredAsignaciones.length !== 1 ? 'es' : ''} encontrada{filteredAsignaciones.length !== 1 ? 's' : ''}
          </ThemedText>
          <OptimizedFlatList
            data={filteredAsignaciones}
            renderItem={renderAsignacionItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={220}
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
          <Icon name="calendar-outline" library="ionicons" color="textSecondary" size="xl2" />
          <ThemedText variant="subtitle" color="textSecondary" weight="bold" style={styles.emptyTitle}>
            {searchQuery ? 'Sin resultados' : 'No hay asignaciones'}
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            {searchQuery ? `No encontramos asignaciones que coincidan con "${searchQuery}"` : 'No hay asignaciones de servicio registradas'}
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
  asignacionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  asignacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  routeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headsign: {
    fontSize: 13,
    marginTop: 2,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleSection: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleLabel: {
    fontSize: 11,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
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
