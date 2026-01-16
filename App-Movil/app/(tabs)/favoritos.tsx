import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTransport } from '../../context/TransportContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { router } from 'expo-router';

type FilterType = 'todas' | 'paradas' | 'rutas';

// Mock de favoritos - en producción esto vendría de Firebase/AsyncStorage
interface FavoriteItem {
  id: string;
  type: 'parada' | 'ruta';
  name: string;
  subtitle?: string;
  color?: string;
  added_at: Date;
}

export default function FavoritosScreen() {
  const { user, signIn, signOut } = useAuth();
  const { paradas, rutas, refreshData } = useTransport();
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { theme } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Filtrar favoritos
  const filteredFavorites = useMemo(() => {
    if (activeFilter === 'todas') return favorites;
    return favorites.filter(f => f.type === (activeFilter === 'paradas' ? 'parada' : 'ruta'));
  }, [favorites, activeFilter]);

  // Contar por tipo
  const counts = useMemo(() => ({
    todas: favorites.length,
    paradas: favorites.filter(f => f.type === 'parada').length,
    rutas: favorites.filter(f => f.type === 'ruta').length,
  }), [favorites]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      // Aquí recargarías los favoritos desde la base de datos
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = (item: FavoriteItem) => {
    Alert.alert(
      'Eliminar favorito',
      `¿Estás seguro de que quieres eliminar "${item.name}" de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromFavorites(item.itemId, item.type);
            if (!success) {
              Alert.alert('Error', 'No se pudo eliminar el favorito');
            }
          }
        }
      ]
    );
  };

  const handleItemPress = (item: FavoriteItem) => {
    if (item.type === 'parada') {
      // Navegar al mapa y centrar en la parada
      router.push(`/map?centerOnStop=${item.itemId}`);
    } else if (item.type === 'ruta') {
      // Navegar al mapa con la ruta filtrada
      router.push(`/map?filterRoute=${item.itemId}`);
    }
  };

  const renderFavoriteItem = (item: FavoriteItem) => (
    <Card
      key={item.id}
      interactive
      variant="outlined"
      padding="md"
      style={styles.favoriteCard}
      onPress={() => handleItemPress(item)}
    >
      <ThemedView style={styles.favoriteHeader}>
        <ThemedView style={[
          styles.favoriteIconContainer,
          { backgroundColor: item.type === 'parada' ? theme.colors.primary + '15' : (item.color || theme.colors.secondary) + '15' }
        ]}>
          {item.type === 'parada' ? (
            <Icon name="location" library="ionicons" color="primary" size="md" />
          ) : (
            <Icon name="bus" library="ionicons" size="md" style={{ color: item.color || theme.colors.secondary }} />
          )}
        </ThemedView>

        <ThemedView style={styles.favoriteInfo}>
          <ThemedText variant="body" weight="semibold" numberOfLines={1}>
            {item.name}
          </ThemedText>
          {item.subtitle && (
            <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
              {item.subtitle}
            </ThemedText>
          )}
        </ThemedView>

        <TouchableOpacity
          onPress={() => handleRemoveFavorite(item)}
          style={styles.removeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="heart" library="ionicons" color="error" size="md" />
        </TouchableOpacity>
      </ThemedView>
    </Card>
  );

  if (!user) {
    // Vista de login requerido
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <ThemedView style={[styles.authPromptContainer, tabBarPadding]}>
          <Icon name="heart-outline" color="textSecondary" size="xl2" />
          <ThemedText variant="title" weight="bold" style={styles.authPromptTitle}>
            Inicia sesión
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.authPromptText}>
            Para guardar tus paradas y rutas favoritas necesitas iniciar sesión
          </ThemedText>
          
          <ThemedButton
            variant="primary"
            size="lg"
            onPress={() => router.push('/auth')}
            style={styles.loginButton}
          >
            <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="person" color="background" size="lg" />
              <ThemedText color="background" weight="semibold"> Iniciar Sesión</ThemedText>
            </ThemedView>
          </ThemedButton>

          <ThemedButton
            variant="outline"
            size="md"
            onPress={() => router.push('/auth?mode=register')}
            style={styles.registerButton}
          >
            <ThemedText color="primary" weight="semibold">Crear cuenta nueva</ThemedText>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    );
  }

  // Vista de favoritos del usuario autenticado
  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header */}
      <PageHeader
        title="Favoritos"
        subtitle="Acceso rápido a tus paradas y rutas"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={tabBarPadding}
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
        {/* Filtros */}
        <ThemedView style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {[
              { key: 'todas', label: 'Todas' },
              { key: 'paradas', label: 'Paradas' },
              { key: 'rutas', label: 'Rutas' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setActiveFilter(filter.key as FilterType)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeFilter === filter.key ? theme.colors.primary : theme.colors.surface,
                    borderColor: activeFilter === filter.key ? theme.colors.primary : theme.colors.border,
                  }
                ]}
              >
                <ThemedText
                  variant="caption"
                  weight="semibold"
                  color={activeFilter === filter.key ? 'background' : 'text'}
                >
                  {filter.label} ({counts[filter.key as FilterType]})
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Lista de favoritos */}
        {filteredFavorites.length > 0 ? (
          <ThemedView style={styles.favoritesSection}>
            {filteredFavorites.map(item => renderFavoriteItem(item))}
          </ThemedView>
        ) : (
          <ThemedView style={styles.emptyState}>
            <Icon name="heart-outline" library="ionicons" color="textSecondary" size="xl" />
            <ThemedText variant="body" color="textSecondary" weight="semibold" style={styles.emptyTitle}>
              {activeFilter === 'todas' ? 'Sin favoritos aún' : `Sin ${activeFilter} favoritas`}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={styles.emptyText}>
              {activeFilter === 'todas'
                ? 'Agrega paradas y rutas desde el mapa'
                : `No tienes ${activeFilter} en favoritos`}
            </ThemedText>

            {activeFilter === 'todas' && (
              <ThemedButton
                variant="primary"
                size="lg"
                onPress={() => router.push('/map')}
                style={styles.exploreButton}
              >
                <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="map" library="ionicons" color="background" size="md" />
                  <ThemedText color="background" weight="semibold"> Explorar Mapa</ThemedText>
                </ThemedView>
              </ThemedButton>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Botón flotante de ayuda */}
      <TouchableOpacity
        style={[styles.helpFab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setHelpModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="help-circle" library="ionicons" color="background" size="md" />
      </TouchableOpacity>

      {/* Modal de ayuda */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <ThemedView style={styles.modalHeader}>
              <ThemedView style={[styles.modalIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="heart" library="ionicons" color="primary" size="lg" />
              </ThemedView>
              <TouchableOpacity
                onPress={() => setHelpModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" library="ionicons" color="textSecondary" size="md" />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText variant="subtitle" weight="bold" style={styles.modalTitle}>
                ¿Cómo agregar favoritos?
              </ThemedText>

              <ThemedView style={styles.helpItem}>
                <ThemedView style={[styles.helpNumber, { backgroundColor: theme.colors.primary }]}>
                  <ThemedText variant="caption" color="background" weight="bold">1</ThemedText>
                </ThemedView>
                <ThemedView style={styles.helpContent}>
                  <ThemedText variant="body" weight="semibold">Desde el mapa</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Toca una parada o ruta en el mapa y presiona el ícono de corazón en la tarjeta de información.
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.helpItem}>
                <ThemedView style={[styles.helpNumber, { backgroundColor: theme.colors.primary }]}>
                  <ThemedText variant="caption" color="background" weight="bold">2</ThemedText>
                </ThemedView>
                <ThemedView style={styles.helpContent}>
                  <ThemedText variant="body" weight="semibold">Desde las listas</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    En la sección de Servicio, navega a Paradas o Rutas y usa el botón de favoritos en cada elemento.
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.helpItem}>
                <ThemedView style={[styles.helpNumber, { backgroundColor: theme.colors.error }]}>
                  <ThemedText variant="caption" color="background" weight="bold">-</ThemedText>
                </ThemedView>
                <ThemedView style={styles.helpContent}>
                  <ThemedText variant="body" weight="semibold">Eliminar favoritos</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Toca el corazón rojo en cualquier favorito para eliminarlo de tu lista.
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ScrollView>

            <ThemedButton
              variant="primary"
              onPress={() => setHelpModalVisible(false)}
              style={styles.modalCloseButton}
            >
              Entendido
            </ThemedButton>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  authPromptTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  authPromptText: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerButton: {
    width: '100%',
  },
  // Filtros
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filtersScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  // Favoritos
  favoritesSection: {
    paddingHorizontal: 16,
  },
  favoriteCard: {
    marginBottom: 8,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteInfo: {
    flex: 1,
    gap: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    marginTop: 8,
  },
  // FAB
  helpFab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalTitle: {
    marginBottom: 20,
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  helpNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpContent: {
    flex: 1,
    gap: 4,
  },
  modalCloseButton: {
    marginTop: 8,
  },
});