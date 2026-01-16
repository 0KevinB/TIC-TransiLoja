import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, ListRenderItem, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTransport } from '../../context/TransportContext';
import { useFocusEffect } from 'expo-router';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import type { Alerta } from '../../lib/types';

type FilterType = 'todas' | 'activas' | 'proximas' | 'finalizadas';

export default function AlertasScreen() {
  const { alertas, getAlertasActivas, refreshData, loading, markAlertsAsViewed, viewedAlertIds, rutas, paradas } = useTransport();
  const { theme } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');

  // Funciones auxiliares para obtener nombres
  const getRouteName = (routeId: string) => {
    // Buscar por id (ID del documento de Firestore) o por id_ruta (campo GTFS route_id)
    const ruta = rutas.find(r => r.id === routeId || r.id_ruta === routeId);
    return ruta ? `${ruta.numero} - ${ruta.nombre}` : `Ruta ${routeId}`;
  };

  const getStopName = (stopId: string) => {
    // Buscar por id (ID del documento de Firestore) o por id_parada (campo GTFS stop_id)
    const parada = paradas.find(p => p.id === stopId || p.id_parada === stopId);
    return parada ? parada.nombre : `Parada ${stopId}`;
  };

  // Marcar alertas como vistas cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      markAlertsAsViewed();
    }, [markAlertsAsViewed])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleAlertPress = (alerta: Alerta) => {
    setSelectedAlert(alerta);
    setModalVisible(true);
  };

  // Categorizar alertas
  const categorizedAlerts = useMemo(() => {
    const now = new Date();

    const activas: Alerta[] = [];
    const proximas: Alerta[] = [];
    const finalizadas: Alerta[] = [];

    alertas.forEach(alerta => {
      if (!alerta.activa) {
        finalizadas.push(alerta);
      } else if (alerta.fecha_inicio > now) {
        proximas.push(alerta);
      } else if (alerta.fecha_fin && alerta.fecha_fin < now) {
        finalizadas.push(alerta);
      } else {
        activas.push(alerta);
      }
    });

    return { activas, proximas, finalizadas };
  }, [alertas]);

  // Alertas activas para el contexto (badge, etc)
  const alertasActivas = categorizedAlerts.activas;

  // Filtrar según el filtro activo
  const alertasData = useMemo(() => {
    const sections: Array<{type: 'header' | 'alert' | 'filters', data?: Alerta, title?: string, count?: number, isEmpty?: boolean, category?: string}> = [];

    // Agregar filtros
    sections.push({ type: 'filters' });

    if (activeFilter === 'todas') {
      // Mostrar todas las categorías
      if (categorizedAlerts.activas.length > 0) {
        sections.push({ type: 'header', title: 'Activas', count: categorizedAlerts.activas.length });
        categorizedAlerts.activas.forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'activa' }));
      }

      if (categorizedAlerts.proximas.length > 0) {
        sections.push({ type: 'header', title: 'Próximas' });
        categorizedAlerts.proximas.forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'proxima' }));
      }

      if (categorizedAlerts.finalizadas.length > 0) {
        sections.push({ type: 'header', title: 'Finalizadas' });
        categorizedAlerts.finalizadas.slice(0, 5).forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'finalizada' }));
      }

      // Estado vacío si no hay alertas
      if (alertas.length === 0) {
        sections.push({ type: 'header', title: 'Alertas', isEmpty: true });
      }
    } else if (activeFilter === 'activas') {
      if (categorizedAlerts.activas.length > 0) {
        sections.push({ type: 'header', title: 'Activas', count: categorizedAlerts.activas.length });
        categorizedAlerts.activas.forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'activa' }));
      } else {
        sections.push({ type: 'header', title: 'Activas', isEmpty: true });
      }
    } else if (activeFilter === 'proximas') {
      if (categorizedAlerts.proximas.length > 0) {
        sections.push({ type: 'header', title: 'Próximas', count: categorizedAlerts.proximas.length });
        categorizedAlerts.proximas.forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'proxima' }));
      } else {
        sections.push({ type: 'header', title: 'Próximas', isEmpty: true });
      }
    } else if (activeFilter === 'finalizadas') {
      if (categorizedAlerts.finalizadas.length > 0) {
        sections.push({ type: 'header', title: 'Finalizadas', count: categorizedAlerts.finalizadas.length });
        categorizedAlerts.finalizadas.forEach(alerta => sections.push({ type: 'alert', data: alerta, category: 'finalizada' }));
      } else {
        sections.push({ type: 'header', title: 'Finalizadas', isEmpty: true });
      }
    }

    return sections;
  }, [categorizedAlerts, activeFilter, alertas.length]);

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'critica':
        return 'warning';
      case 'advertencia':
        return 'alert-circle';
      case 'informacion':
      default:
        return 'information-circle-outline';
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'critica':
        return '#EF4444';
      case 'advertencia':
        return '#F59E0B';
      case 'informacion':
      default:
        return theme.colors.primary;
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';

    try {
      // Si es un string, convertir a Date
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // Verificar que sea una fecha válida
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }

      return 'Fecha inválida';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Renderizar filtros
  const renderFilters = () => (
    <ThemedView style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'activas', label: 'Activas' },
          { key: 'proximas', label: 'Próximas' },
          { key: 'finalizadas', label: 'Finalizadas' },
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
              {filter.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );

  // Renderizar item de FlatList (memoizado)
  const renderItem: ListRenderItem<typeof alertasData[0]> = useCallback(({ item }) => {
    if (item.type === 'filters') {
      return renderFilters();
    }

    if (item.type === 'header') {
      if (item.isEmpty) {
        // Estado vacío
        const emptyMessages: Record<string, { icon: string; title: string; message: string }> = {
          'Activas': { icon: 'check-circle', title: 'Sin alertas activas', message: 'El sistema funciona con normalidad' },
          'Próximas': { icon: 'calendar-outline', title: 'Sin alertas próximas', message: 'No hay alertas programadas' },
          'Finalizadas': { icon: 'archive-outline', title: 'Sin alertas finalizadas', message: 'No hay historial de alertas' },
          'Alertas': { icon: 'notifications-off-outline', title: 'Sin alertas', message: 'No hay alertas en el sistema' },
        };
        const msg = emptyMessages[item.title || 'Alertas'] || emptyMessages['Alertas'];

        return (
          <ThemedView style={styles.emptyState}>
            <Icon name={msg.icon} library="ionicons" color="textSecondary" size="xl" />
            <ThemedText variant="body" color="textSecondary" weight="semibold" style={styles.emptyTitle}>
              {msg.title}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={styles.emptyText}>
              {msg.message}
            </ThemedText>
          </ThemedView>
        );
      }

      // Header de sección
      return (
        <ThemedView style={styles.section}>
          <ThemedText variant="body" weight="bold" style={styles.sectionTitle}>
            {item.title} {item.count ? `(${item.count})` : ''}
          </ThemedText>
        </ThemedView>
      );
    }

    // Renderizar alerta compacta
    const alerta = item.data!;
    const category = item.category || 'activa';
    const isNew = !viewedAlertIds.includes(alerta.id) && category === 'activa';
    const isFinalized = category === 'finalizada';
    const isUpcoming = category === 'proxima';

    return (
      <ThemedView style={styles.alertCardContainer}>
        <TouchableOpacity
          onPress={() => handleAlertPress(alerta)}
          activeOpacity={0.7}
          accessibilityLabel={`Alerta: ${alerta.titulo}`}
          accessibilityHint={`Toca para ver más detalles`}
          accessibilityRole="button"
        >
          <Card
            variant="outlined"
            padding="md"
            style={[
              styles.alertCard,
              isFinalized && styles.inactiveAlertCard,
              isNew && { borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
              isUpcoming && { borderLeftWidth: 3, borderLeftColor: theme.colors.warning || '#F59E0B' }
            ]}
          >
            <ThemedView style={styles.alertHeader}>
              <ThemedView style={[
                styles.alertIconContainer,
                { backgroundColor: getAlertColor(alerta.tipo) + '15' }
              ]}>
                <Icon
                  name={getAlertIcon(alerta.tipo)}
                  library="ionicons"
                  size="sm"
                  color={getAlertColor(alerta.tipo)}
                />
              </ThemedView>
              <ThemedView style={styles.alertHeaderText}>
                <ThemedView style={styles.alertTitleRow}>
                  <ThemedText
                    variant="body"
                    weight="semibold"
                    style={styles.alertTitle}
                    numberOfLines={1}
                  >
                    {alerta.titulo}
                  </ThemedText>
                  {isNew && (
                    <ThemedView style={[styles.newBadge, { backgroundColor: theme.colors.primary }]}>
                      <ThemedText variant="caption" color="background" style={styles.newBadgeText}>
                        Nueva
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
                <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                  {formatDate(alerta.fecha_inicio)}
                </ThemedText>
              </ThemedView>
              <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
            </ThemedView>
          </Card>
        </TouchableOpacity>
      </ThemedView>
    );
  }, [viewedAlertIds, getAlertIcon, getAlertColor, formatDate, theme.colors.primary, theme.colors.warning, handleAlertPress, activeFilter]);

  // KeyExtractor para FlatList
  const keyExtractor = useCallback((item: typeof alertasData[0], index: number) => {
    if (item.type === 'filters') {
      return 'filters';
    }
    if (item.type === 'header') {
      return `header-${item.title}-${index}`;
    }
    if (item.data) {
      return `alert-${item.data.id}`;
    }
    return `item-${index}`;
  }, []);

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <FlatList
        data={alertasData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <PageHeader
            title="Alertas"
            subtitle="Mantente informado sobre el estado del transporte, nuestras alertas te mantienen al día"
          />
        }
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={11}
        accessible={true}
        accessibilityLabel="Lista de alertas de transporte"
      />

      {/* Modal de detalle de alerta */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            {selectedAlert && (
              <>
                <ThemedView style={styles.modalHeader}>
                  <ThemedView style={[
                    styles.modalIconContainer,
                    { backgroundColor: getAlertColor(selectedAlert.tipo) + '15' }
                  ]}>
                    <Icon
                      name={getAlertIcon(selectedAlert.tipo)}
                      library="ionicons"
                      size="lg"
                      color={getAlertColor(selectedAlert.tipo)}
                    />
                  </ThemedView>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" library="ionicons" color="textSecondary" size="md" />
                  </TouchableOpacity>
                </ThemedView>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <ThemedText variant="subtitle" weight="bold" style={styles.modalTitle}>
                    {selectedAlert.titulo}
                  </ThemedText>

                  <ThemedView style={styles.modalMeta}>
                    {(() => {
                      const now = new Date();
                      let status = 'Finalizada';
                      let color = theme.colors.textSecondary;

                      if (selectedAlert.activa && selectedAlert.fecha_inicio <= now && (!selectedAlert.fecha_fin || selectedAlert.fecha_fin >= now)) {
                        status = 'Activa';
                        color = theme.colors.success;
                      } else if (selectedAlert.activa && selectedAlert.fecha_inicio > now) {
                        status = 'Próxima';
                        color = theme.colors.warning || '#F59E0B';
                      }

                      return (
                        <ThemedView style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                          <ThemedText variant="caption" style={{ color }} weight="semibold">
                            {status}
                          </ThemedText>
                        </ThemedView>
                      );
                    })()}
                    <ThemedText variant="caption" color="textSecondary">
                      {formatDate(selectedAlert.fecha_inicio)}
                    </ThemedText>
                  </ThemedView>

                  <ThemedText variant="body" style={styles.modalMessage}>
                    {selectedAlert.mensaje}
                  </ThemedText>

                  {/* Rutas afectadas */}
                  {selectedAlert.ruta_ids && selectedAlert.ruta_ids.length > 0 && (
                    <ThemedView style={styles.affectedSection}>
                      <ThemedView style={styles.affectedHeader}>
                        <Icon name="bus" library="ionicons" color="primary" size="sm" />
                        <ThemedText variant="body" weight="semibold" style={{ marginLeft: 6 }}>
                          Rutas afectadas
                        </ThemedText>
                      </ThemedView>
                      {selectedAlert.ruta_ids.map((routeId, index) => (
                        <ThemedView key={routeId} style={styles.affectedItem}>
                          <ThemedView style={[styles.affectedDot, { backgroundColor: theme.colors.primary }]} />
                          <ThemedText variant="caption" color="textSecondary">
                            {getRouteName(routeId)}
                          </ThemedText>
                        </ThemedView>
                      ))}
                    </ThemedView>
                  )}

                  {/* Paradas afectadas */}
                  {selectedAlert.parada_ids && selectedAlert.parada_ids.length > 0 && (
                    <ThemedView style={styles.affectedSection}>
                      <ThemedView style={styles.affectedHeader}>
                        <Icon name="location" library="ionicons" color="error" size="sm" />
                        <ThemedText variant="body" weight="semibold" style={{ marginLeft: 6 }}>
                          Paradas afectadas
                        </ThemedText>
                      </ThemedView>
                      {selectedAlert.parada_ids.map((stopId, index) => (
                        <ThemedView key={stopId} style={styles.affectedItem}>
                          <ThemedView style={[styles.affectedDot, { backgroundColor: theme.colors.error }]} />
                          <ThemedText variant="caption" color="textSecondary">
                            {getStopName(stopId)}
                          </ThemedText>
                        </ThemedView>
                      ))}
                    </ThemedView>
                  )}

                  {/* Ruta alternativa */}
                  {selectedAlert.alternativeRoute && (
                    <ThemedView style={styles.affectedSection}>
                      <ThemedView style={styles.affectedHeader}>
                        <Icon name="swap-horizontal" library="ionicons" color="success" size="sm" />
                        <ThemedText variant="body" weight="semibold" style={{ marginLeft: 6 }}>
                          Ruta alternativa
                        </ThemedText>
                      </ThemedView>
                      <ThemedText variant="caption" color="textSecondary" style={{ paddingLeft: 8 }}>
                        {selectedAlert.alternativeRoute}
                      </ThemedText>
                    </ThemedView>
                  )}

                  {selectedAlert.fecha_fin && (
                    <ThemedView style={styles.modalDateInfo}>
                      <Icon name="time-outline" library="ionicons" color="textSecondary" size="sm" />
                      <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                        Finaliza: {formatDate(selectedAlert.fecha_fin)}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ScrollView>

                <ThemedButton
                  variant="primary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  Entendido
                </ThemedButton>
              </>
            )}
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
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filtersScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  alertCardContainer: {
    paddingHorizontal: 16,
  },
  alertCard: {
    marginBottom: 8,
  },
  inactiveAlertCard: {
    opacity: 0.5,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  // Modal styles
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
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalMessage: {
    lineHeight: 22,
    marginBottom: 12,
  },
  modalDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseButton: {
    marginTop: 8,
  },
  // Affected routes/stops styles
  affectedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  affectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  affectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  affectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
});