import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
} from 'react-native';
import { collection, getDocs, query } from 'firebase/firestore';
import { router, Stack } from 'expo-router';
import { db } from '@/lib/firebase';
import { Conductor } from '@/lib/types';
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

export default function ConductoresScreen() {
  const { theme } = useTheme();
  const { conductores: offlineConductores, isOffline } = useOfflineServices();
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hook optimizado de búsqueda
  const { query: searchQuery, setQuery: setSearchQuery, filteredData: filteredConductores, isSearching } = useOptimizedSearch({
    data: conductores,
    searchKeys: ['nombre', 'apellidos', 'apellido', 'cedula', 'telefono'],
    debounceMs: 300,
  });

  const fetchConductores = async () => {
    try {
      // Si hay datos offline, usarlos primero
      if (offlineConductores.length > 0) {
        setConductores(offlineConductores);
        console.log('📱 Usando conductores desde caché offline');
      }

      // Intentar actualizar desde Firebase si hay conexión
      if (!isOffline) {
        const conductoresRef = collection(db(), 'conductores');
        const q = query(conductoresRef);
        const querySnapshot = await getDocs(q);

        const conductoresData: Conductor[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Conductor)
        );

        setConductores(conductoresData);
        console.log('🌐 Conductores actualizados desde Firebase');
      }
    } catch (error) {
      console.error('Error fetching conductores:', error);
      // Si falla Firebase pero hay datos offline, mantenerlos
      if (offlineConductores.length > 0) {
        console.log('⚠️ Error en Firebase, usando datos offline');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConductores();
  }, [offlineConductores, isOffline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConductores();
  };

  const getStatusColor = (status?: string, activo?: boolean) => {
    if (status === 'activo' || activo) {
      return '#10b981';
    } else if (status === 'inactivo' || activo === false) {
      return '#6b7280';
    }
    return theme.colors.textSecondary;
  };

  const getStatusText = (status?: string, activo?: boolean) => {
    if (status === 'activo' || activo) {
      return 'Activo';
    } else if (status === 'inactivo' || activo === false) {
      return 'Inactivo';
    }
    return 'Desconocido';
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // Memoizar renderConductorItem para evitar re-renders innecesarios
  const renderConductorItem = useCallback(({ item }: { item: Conductor }) => (
    <View
      style={[
        styles.conductorCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.conductorHeader}>
        <View style={styles.conductorMainInfo}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Icon name="person" library="ionicons" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.conductorDetails}>
            <Text style={[styles.conductorName, { color: theme.colors.text }]}>
              {item.nombre} {item.apellidos || item.apellido || ''}
            </Text>
            <Text style={[styles.conductorCedula, { color: theme.colors.textSecondary }]}>
              CI: {item.cedula}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.estado, item.activo) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.estado, item.activo) }]}>
            {getStatusText(item.estado, item.activo)}
          </Text>
        </View>
      </View>

      <View style={styles.conductorInfo}>
        {item.tipo_licencia && (
          <View style={styles.infoRow}>
            <Icon name="card" library="ionicons" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Licencia tipo: {item.tipo_licencia}
            </Text>
          </View>
        )}

        {item.experiencia_anos && (
          <View style={styles.infoRow}>
            <Icon name="time" library="ionicons" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Experiencia: {item.experiencia_anos} años
            </Text>
          </View>
        )}

        {item.direccion && (
          <View style={styles.infoRow}>
            <Icon name="location" library="ionicons" size={16} color={theme.colors.textSecondary} />
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.direccion}
            </Text>
          </View>
        )}
      </View>

      {(item.telefono || item.email) && (
        <View style={styles.contactActions}>
          {item.telefono && (
            <TouchableOpacity
              style={[
                styles.contactButton,
                { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
              ]}
              onPress={() => handleCall(item.telefono)}
            >
              <Icon name="call" library="ionicons" size={18} color={theme.colors.primary} />
              <Text style={[styles.contactButtonText, { color: theme.colors.primary }]}>
                {item.telefono}
              </Text>
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity
              style={[
                styles.contactButton,
                { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent },
              ]}
              onPress={() => handleEmail(item.email)}
            >
              <Icon name="mail" library="ionicons" size={18} color={theme.colors.accent} />
              <Text
                style={[styles.contactButtonText, { color: theme.colors.accent }]}
                numberOfLines={1}
              >
                Email
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  ), [theme.colors, handleCall, handleEmail]);

  // Key extractor memoizado
  const keyExtractor = useCallback((item: Conductor) => item.id, []);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer} backgroundColor="background">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText variant="body" color="textSecondary" style={styles.loadingText}>
          Cargando conductores...
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
            Conductores
          </ThemedText>

          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          Directorio de conductores
        </ThemedText>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre, cédula o teléfono..."
          style={styles.searchInput}
          leftIcon="search"
        />
      </ThemedView>

      {/* Lista de conductores optimizada */}
      {filteredConductores.length > 0 ? (
        <ThemedView style={styles.listContainer}>
          <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
            {filteredConductores.length} conductor{filteredConductores.length !== 1 ? 'es' : ''}{' '}
            encontrado{filteredConductores.length !== 1 ? 's' : ''}
          </ThemedText>
          <OptimizedFlatList
            data={filteredConductores}
            renderItem={renderConductorItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={200}
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
          <Icon name="people-outline" library="ionicons" color="textSecondary" size="xl2" />
          <ThemedText
            variant="subtitle"
            color="textSecondary"
            weight="bold"
            style={styles.emptyTitle}
          >
            {searchQuery ? 'Sin resultados' : 'No hay conductores'}
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            {searchQuery
              ? `No encontramos conductores que coincidan con "${searchQuery}"`
              : 'No hay conductores registrados en el sistema'}
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
  conductorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  conductorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  conductorMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conductorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  conductorName: {
    fontSize: 18,
    fontWeight: '600',
  },
  conductorCedula: {
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
  conductorInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 13,
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
