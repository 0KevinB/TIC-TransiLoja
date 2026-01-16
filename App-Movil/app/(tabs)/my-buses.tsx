import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, RefreshControl, Switch } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { gpsTracker } from '../../lib/services/gps-tracker';
import { useLiveBuses } from '../../hooks/useLiveBuses';
import { PageHeader } from '../../components/ui/PageHeader';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';

interface AssignedBus {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  capacity: number;
  routeName?: string;
  routeNumber?: string;
  routeColor?: string;
  routeId?: string;
  tripId?: string;
}

export default function MyBusesScreen() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const [assignedBuses, setAssignedBuses] = useState<AssignedBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [activeBusId, setActiveBusId] = useState<string | null>(null);

  // Hook para escuchar actualizaciones en tiempo real de liveBuses
  const { buses: liveBuses, loading: liveBusesLoading } = useLiveBuses();

  useEffect(() => {
    loadAssignedBuses();

    // Verificar si ya hay un seguimiento activo
    if (gpsTracker.isActive()) {
      setIsTracking(true);
      const config = gpsTracker.getConfig();
      if (config?.busId) {
        setActiveBusId(config.busId);
      }
    }

    // Actualizar estado periódicamente
    const interval = setInterval(() => {
      if (gpsTracker.isActive()) {
        setIsTracking(true);
        const config = gpsTracker.getConfig();
        if (config?.busId) {
          setActiveBusId(config.busId);
        }
      } else {
        setIsTracking(false);
        setActiveBusId(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadAssignedBuses = async () => {
    if (!userProfile?.conductorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const database = db();

      if (__DEV__) {
        console.log('[MyBuses] Cargando buses para:', userProfile.conductorId);
      }

      // Buscar viajes asignados a este conductor (igual que en conductor-tracking.tsx)
      const tripsQuery = query(
        collection(database, 'trips'),
        where('conductorId', '==', userProfile.conductorId)
      );

      const tripsSnapshot = await getDocs(tripsQuery);
      if (__DEV__) {
        console.log('[MyBuses] Viajes:', tripsSnapshot.size);
      }

      const buses: AssignedBus[] = [];
      const busIds: Set<string> = new Set();

      // Mapear viajes a buses
      const tripsByBusId = new Map<string, any>();
      tripsSnapshot.forEach((tripDoc) => {
        const tripData = tripDoc.data();
        busIds.add(tripData.busId);
        tripsByBusId.set(tripData.busId, {
          tripId: tripDoc.id,
          routeId: tripData.routeId,
          headsign: tripData.headsign,
        });
      });

      // Cargar información de cada bus
      for (const busId of busIds) {
        const busDoc = await getDoc(doc(database, 'buses', busId));

        if (busDoc.exists()) {
          const busData = busDoc.data();
          const tripInfo = tripsByBusId.get(busId);

          // Obtener información de la ruta si existe
          let routeName, routeNumber, routeColor;
          if (tripInfo?.routeId) {
            const routeDoc = await getDoc(doc(database, 'routes', tripInfo.routeId));

            if (routeDoc.exists()) {
              const routeData = routeDoc.data();
              routeName = routeData.route_long_name || routeData.name || 'Sin nombre';
              routeNumber = routeData.route_short_name || routeData.shortName || 'N/A';
              routeColor = routeData.route_color || routeData.color || '3B82F6';
            }
          }

          buses.push({
            id: busDoc.id,
            plateNumber: busData.plateNumber || busData.licensePlate || 'Sin placa',
            model: busData.model || 'Modelo desconocido',
            year: busData.year || new Date().getFullYear(),
            capacity: busData.capacity || 40,
            routeName,
            routeNumber,
            routeColor,
            routeId: tripInfo?.routeId,
            tripId: tripInfo?.tripId,
          });
        }
      }

      if (__DEV__) {
        console.log(`[MyBuses] Buses cargados: ${buses.length}`);
      }
      setAssignedBuses(buses);
    } catch (error) {
      console.error('[MyBuses] Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los buses asignados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleTracking = async (bus: AssignedBus) => {
    if (!userProfile?.conductorId) {
      Alert.alert('Error', 'No se pudo identificar el conductor');
      return;
    }

    if (isTracking && activeBusId === bus.id) {
      // Detener seguimiento
      Alert.alert(
        'Detener seguimiento',
        '¿Deseas detener el seguimiento GPS?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Detener',
            style: 'destructive',
            onPress: async () => {
              try {
                await gpsTracker.stopTracking();
                setIsTracking(false);
                setActiveBusId(null);
                Alert.alert('Éxito', 'Seguimiento GPS detenido');
                if (__DEV__) {
                  console.log('[MyBuses] GPS detenido');
                }
              } catch (error) {
                console.error('[MyBuses] Error al detener:', error);
                Alert.alert('Error', 'No se pudo detener el seguimiento');
              }
            },
          },
        ]
      );
    } else {
      // Iniciar seguimiento
      Alert.alert(
        'Iniciar seguimiento',
        `¿Deseas iniciar el seguimiento GPS para el bus ${bus.plateNumber}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar',
            onPress: async () => {
              try {
                const config: any = {
                  busId: bus.id,
                  // updateInterval se omite para usar el valor optimizado del servicio (12s)
                };

                // Agregar routeId y tripId si existen
                if (bus.routeId) {
                  config.routeId = bus.routeId;
                }
                if (bus.tripId) {
                  config.tripId = bus.tripId;
                }

                const success = await gpsTracker.startTracking(config);

                if (success) {
                  setIsTracking(true);
                  setActiveBusId(bus.id);
                  Alert.alert(
                    'Seguimiento activo',
                    'Tu ubicación se está compartiendo en tiempo real. Recuerda desactivar el seguimiento al finalizar tu turno.'
                  );
                  if (__DEV__) {
                    console.log('[MyBuses] GPS iniciado');
                  }
                } else {
                  Alert.alert(
                    'Error',
                    'No se pudo iniciar el seguimiento GPS. Verifica que los permisos de ubicación estén habilitados.'
                  );
                }
              } catch (error) {
                console.error('[MyBuses] Error al iniciar seguimiento:', error);
                Alert.alert('Error', 'Ocurrió un error al iniciar el seguimiento');
              }
            },
          },
        ]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignedBuses();
  };

  // Obtener el estado en tiempo real de un bus desde liveBuses
  const getLiveBusData = (busId: string) => {
    // El busId puede coincidir con liveBus.id o liveBus.busId
    return liveBuses.find(liveBus => liveBus.busId === busId || liveBus.id === busId);
  };

  if (!userProfile || userProfile.role !== 'conductor') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centered}>
          <Icon name="block" size="xl" color="error" />
          <ThemedText variant="h2" style={styles.title}>
            Acceso Denegado
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.message}>
            Esta sección es solo para conductores
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!userProfile.conductorId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centered}>
          <Icon name="error" size="xl" color="warning" />
          <ThemedText variant="h2" style={styles.title}>
            Perfil Incompleto
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.message}>
            No tienes un perfil de conductor asociado. Contacta al administrador.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <PageHeader
        title="Mis Buses"
        subtitle="Buses asignados a tu perfil de conductor"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, tabBarPadding]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemedView style={styles.centered}>
            <ThemedText>Cargando buses...</ThemedText>
          </ThemedView>
        ) : assignedBuses.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Icon name="directions-bus" size="xl" color="textSecondary" />
            <ThemedText variant="h3" style={styles.emptyTitle}>
              Sin buses asignados
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.emptyMessage}>
              Actualmente no tienes buses asignados. Contacta al administrador para obtener una asignación.
            </ThemedText>
          </ThemedView>
        ) : (
          assignedBuses.map((bus) => {
            const isActive = isTracking && activeBusId === bus.id;
            const liveBusData = getLiveBusData(bus.id);
            const hasLiveData = !!liveBusData;

            return (
              <Card key={bus.id} style={[styles.busCard, isActive && styles.busCardActive]}>
                <ThemedView style={styles.busHeader}>
                  <ThemedView style={styles.busInfo}>
                    <ThemedView style={styles.busPlateContainer}>
                      <Icon name="directions-bus" size="lg" color="primary" />
                      <ThemedText variant="h3" style={styles.busPlate}>
                        {bus.plateNumber}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText variant="body" color="textSecondary">
                      {bus.model} ({bus.year})
                    </ThemedText>
                  </ThemedView>

                  {hasLiveData && (
                    <ThemedView style={[styles.statusBadge, { backgroundColor: `${theme.colors.success}20` }]}>
                      <ThemedView style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                      <ThemedText variant="caption" style={{ color: theme.colors.success }} weight="medium">
                        {liveBusData.status === 'moving' ? 'En movimiento' : 'Detenido'}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>

                {bus.routeName && (
                  <ThemedView style={styles.routeInfo}>
                    <ThemedView
                      style={[
                        styles.routeBadge,
                        {
                          backgroundColor: bus.routeColor
                            ? (bus.routeColor.startsWith('#') ? bus.routeColor : `#${bus.routeColor}`)
                            : theme.colors.primary
                        }
                      ]}
                    >
                      <ThemedText variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>
                        {bus.routeNumber}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText variant="body" style={styles.routeName}>
                      {bus.routeName}
                    </ThemedText>
                  </ThemedView>
                )}

                <ThemedView style={styles.busDetails}>
                  <ThemedView style={styles.detailItem}>
                    <Icon name="people" size="sm" color="textSecondary" />
                    <ThemedText variant="caption" color="textSecondary">
                      Capacidad: {bus.capacity} pasajeros
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {hasLiveData && (
                  <ThemedView style={styles.liveDataContainer}>
                    <ThemedView style={styles.liveDataRow}>
                      <Icon name="speed" size="sm" color="textSecondary" />
                      <ThemedText variant="caption" color="textSecondary">
                        Velocidad: {liveBusData.speed} km/h
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.liveDataRow}>
                      <Icon name="schedule" size="sm" color="textSecondary" />
                      <ThemedText variant="caption" color="textSecondary">
                        Última actualización: {new Date(liveBusData.timestamp).toLocaleTimeString('es-EC', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                )}

                <ThemedView style={styles.trackingControl}>
                  <ThemedView style={styles.trackingInfo}>
                    <Icon name="my-location" size="md" color={hasLiveData ? 'success' : 'textSecondary'} />
                    <ThemedView style={styles.trackingText}>
                      <ThemedText variant="body" weight="medium">
                        Seguimiento GPS
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {hasLiveData ? 'Compartiendo ubicación en tiempo real' : 'Inactivo'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedButton
                    variant={isActive ? 'destructive' : 'primary'}
                    onPress={() => handleToggleTracking(bus)}
                    style={styles.trackingButton}
                  >
                    {isActive ? 'Detener' : 'Iniciar'}
                  </ThemedButton>
                </ThemedView>

                {isActive && (
                  <ThemedView style={[styles.activeWarning, { backgroundColor: `${theme.colors.warning}15` }]}>
                    <Icon name="info" size="sm" color="warning" />
                    <ThemedText variant="caption" color="warning" style={styles.warningText}>
                      Tu ubicación se está compartiendo. No olvides detener el seguimiento al finalizar.
                    </ThemedText>
                  </ThemedView>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    maxWidth: 300,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    maxWidth: 300,
  },
  busCard: {
    marginBottom: 16,
    padding: 16,
  },
  busCardActive: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busInfo: {
    flex: 1,
  },
  busPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  busPlate: {
    fontSize: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  routeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeName: {
    flex: 1,
  },
  busDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trackingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trackingText: {
    flex: 1,
  },
  trackingButton: {
    paddingHorizontal: 20,
  },
  activeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
  },
  liveDataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  liveDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
