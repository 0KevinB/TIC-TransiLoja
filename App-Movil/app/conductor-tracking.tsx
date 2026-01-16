/**
 * Pantalla para Conductores - Control de Rastreo GPS
 * Permite a los conductores iniciar/detener el rastreo de su ubicación
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gpsTracker } from '@/lib/services/gps-tracker';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db as getDB } from '@/lib/firebase';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  tripId?: string; // ID del viaje asociado
  routeId?: string; // ID de la ruta del viaje
  routeName?: string; // Nombre de la ruta
}

interface Route {
  id: string;
  name: string;
  shortName: string;
}

interface Trip {
  id: string;
  routeId: string;
  headsign: string;
  busId: string;
  conductorId: string;
}

export default function ConductorTrackingScreen() {
  const { userProfile } = useAuth(); // Obtener el perfil del conductor
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Datos de selección
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Selecciones
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
    checkTrackingStatus();

    // Actualizar último update cada segundo
    const interval = setInterval(() => {
      if (gpsTracker.isActive()) {
        setLastUpdate(gpsTracker.getLastUpdate());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cargar viajes cuando se selecciona una ruta
  useEffect(() => {
    if (selectedRouteId) {
      loadTrips(selectedRouteId);
    } else {
      setTrips([]);
      setSelectedTripId('');
    }
  }, [selectedRouteId]);

  const loadData = async () => {
    try {
      const db = getDB();

      console.log('🔍 Iniciando carga de datos...');
      console.log('👤 UserProfile:', userProfile);
      console.log('🆔 ConductorId:', userProfile?.conductorId);

      // Verificar que el conductor esté autenticado
      if (!userProfile?.conductorId) {
        console.log('❌ No hay conductorId en el perfil');
        Alert.alert(
          'Acceso restringido',
          'Solo los conductores pueden acceder a esta funcionalidad. Tu cuenta no está asociada a un conductor.'
        );
        return;
      }

      // Cargar viajes asignados al conductor
      console.log(`🔎 Buscando viajes para conductorId: ${userProfile.conductorId}`);
      console.log(`🔎 Tipo de conductorId: ${typeof userProfile.conductorId}`);

      const tripsSnapshot = await getDocs(
        query(
          collection(db, 'trips'),
          where('conductorId', '==', userProfile.conductorId)
        )
      );

      console.log(`📦 Viajes encontrados: ${tripsSnapshot.size}`);

      // Cargar TODOS los viajes para debug (primeros 10)
      console.log('🔍 DEBUG: Cargando todos los viajes para comparar...');
      const allTripsSnapshot = await getDocs(
        query(collection(db, 'trips'), limit(10))
      );
      console.log(`📋 Total de viajes en DB (máx 10): ${allTripsSnapshot.size}`);
      allTripsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 Viaje ID: ${doc.id}`);
        console.log(`      - conductorId en DB: "${data.conductorId}" (tipo: ${typeof data.conductorId})`);
        console.log(`      - busId: ${data.busId}`);
        console.log(`      - Match con mi conductorId? ${data.conductorId === userProfile.conductorId}`);
      });

      const tripsData: Trip[] = [];
      const busIds: Set<string> = new Set();
      const routeIds: Set<string> = new Set();

      tripsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('✅ Viaje asignado a mí:', { id: doc.id, busId: data.busId, routeId: data.routeId, conductorId: data.conductorId });
        tripsData.push({
          id: doc.id,
          routeId: data.routeId,
          headsign: data.headsign,
          busId: data.busId,
          conductorId: data.conductorId,
        });
        busIds.add(data.busId);
        routeIds.add(data.routeId);
      });

      // Si no hay viajes asignados
      if (tripsData.length === 0) {
        console.log('⚠️ No se encontraron viajes asignados');
        Alert.alert(
          'Sin viajes asignados',
          'No tienes viajes asignados actualmente. Contacta con el administrador para que te asigne un viaje.'
        );
        setBuses([]);
        setRoutes([]);
        setTrips([]);
        return;
      }

      console.log(`🚌 BusIds a cargar:`, Array.from(busIds));

      // Cargar información de los buses asignados
      const busesData: Bus[] = [];
      for (const busId of busIds) {
        console.log(`📥 Cargando bus: ${busId}`);
        const busDoc = await getDocs(
          query(collection(db, 'buses'), where('__name__', '==', busId))
        );

        console.log(`   Bus ${busId} - Documentos encontrados: ${busDoc.size}`);

        busDoc.forEach((doc) => {
          const data = doc.data();
          const tripForBus = tripsData.find(t => t.busId === doc.id);
          console.log(`   ✅ Bus cargado:`, {
            id: doc.id,
            plateNumber: data.plateNumber,
            model: data.model,
            tripId: tripForBus?.id
          });
          busesData.push({
            id: doc.id,
            plateNumber: data.plateNumber || 'Sin placa',
            model: data.model || 'Sin modelo',
            tripId: tripForBus?.id,
            routeId: tripForBus?.routeId,
          });
        });
      }

      console.log(`📊 Total buses cargados: ${busesData.length}`);

      // Cargar información de las rutas
      const routesData: Route[] = [];
      for (const routeId of routeIds) {
        const routeDoc = await getDocs(
          query(collection(db, 'routes'), where('__name__', '==', routeId))
        );
        routeDoc.forEach((doc) => {
          const data = doc.data();
          routesData.push({
            id: doc.id,
            name: data.name || data.route_long_name || 'Sin nombre',
            shortName: data.shortName || data.route_short_name || 'N/A',
          });
        });
      }

      // Enriquecer buses con nombre de ruta
      busesData.forEach(bus => {
        const route = routesData.find(r => r.id === bus.routeId);
        if (route) {
          bus.routeName = `${route.shortName} - ${route.name}`;
        }
      });

      setBuses(busesData);
      setRoutes(routesData);
      setTrips(tripsData);

      console.log(`✅ Datos cargados exitosamente:`);
      console.log(`   - ${busesData.length} buses`);
      console.log(`   - ${routesData.length} rutas`);
      console.log(`   - ${tripsData.length} viajes`);

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const loadTrips = async (routeId: string) => {
    try {
      const db = getDB();
      const tripsSnapshot = await getDocs(
        query(collection(db, 'trips'), where('routeId', '==', routeId))
      );
      const tripsData: Trip[] = [];
      tripsSnapshot.forEach((doc) => {
        const data = doc.data();
        tripsData.push({
          id: doc.id,
          routeId: data.routeId,
          headsign: data.headsign,
        });
      });
      setTrips(tripsData);
    } catch (error) {
      console.error('Error al cargar viajes:', error);
    }
  };

  const checkTrackingStatus = () => {
    setIsTracking(gpsTracker.isActive());
    setLastUpdate(gpsTracker.getLastUpdate());
  };

  const handleStartTracking = async () => {
    // Validar que se haya seleccionado al menos el bus
    if (!selectedBusId) {
      Alert.alert(
        'Datos incompletos',
        'Por favor selecciona el bus antes de iniciar el rastreo'
      );
      return;
    }

    setLoading(true);

    try {
      const config: any = {
        busId: selectedBusId,
        // updateInterval se omite para usar el valor optimizado del servicio (12s)
      };

      // Agregar ruta y viaje solo si están seleccionados
      if (selectedRouteId) {
        config.routeId = selectedRouteId;
      }
      if (selectedTripId) {
        config.tripId = selectedTripId;
      }

      const success = await gpsTracker.startTracking(config);

      if (success) {
        setIsTracking(true);
        Alert.alert(
          'Rastreo iniciado',
          'Tu ubicación GPS está siendo compartida en tiempo real'
        );
      } else {
        Alert.alert(
          'Error',
          'No se pudo iniciar el rastreo. Verifica los permisos de ubicación'
        );
      }
    } catch (error) {
      console.error('Error al iniciar rastreo:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar el rastreo');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = async () => {
    Alert.alert(
      'Detener rastreo',
      '¿Estás seguro de que deseas detener el rastreo GPS?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Detener',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await gpsTracker.stopTracking();
              setIsTracking(false);
              setLastUpdate(null);
              Alert.alert('Rastreo detenido', 'El rastreo GPS ha sido detenido');
            } catch (error) {
              console.error('Error al detener rastreo:', error);
              Alert.alert('Error', 'Ocurrió un error al detener el rastreo');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getTimeSinceUpdate = (): string => {
    if (!lastUpdate) return 'Nunca';

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

    if (diff < 60) return `Hace ${diff}s`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    return `Hace ${Math.floor(diff / 3600)}h`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Control GPS', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="navigate-circle" size={48} color="#61d45d" />
          <Text style={styles.title}>Rastreo GPS</Text>
          <Text style={styles.subtitle}>
            {isTracking ? 'En operación' : 'Inactivo'}
          </Text>
        </View>

        {/* Estado actual */}
        <View style={[styles.statusCard, isTracking ? styles.statusActive : styles.statusInactive]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isTracking ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={isTracking ? '#10B981' : '#6B7280'}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isTracking ? 'Rastreo Activo' : 'Rastreo Inactivo'}
              </Text>
              {isTracking && (
                <Text style={styles.statusSubtitle}>
                  Última actualización: {getTimeSinceUpdate()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Formulario de selección (solo si no está tracking) */}
        {!isTracking && (
          <View style={styles.form}>
            {/* Seleccionar Bus */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="bus" size={16} /> Bus Asignado <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedBusId}
                  onValueChange={(value) => {
                    setSelectedBusId(value);
                    // Auto-seleccionar la ruta y viaje correspondientes
                    const selectedBus = buses.find(b => b.id === value);
                    if (selectedBus) {
                      setSelectedRouteId(selectedBus.routeId || '');
                      setSelectedTripId(selectedBus.tripId || '');
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona tu bus" value="" />
                  {buses.map((bus) => (
                    <Picker.Item
                      key={bus.id}
                      label={`${bus.plateNumber} - ${bus.model}${bus.routeName ? ` (${bus.routeName})` : ''}`}
                      value={bus.id}
                    />
                  ))}
                </Picker>
              </View>
              {buses.length === 0 && (
                <Text style={styles.infoText}>
                  No tienes buses asignados. El administrador debe asignarte un viaje.
                </Text>
              )}
            </View>

            {/* Información del viaje asignado */}
            {selectedBusId && (
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentTitle}>📋 Viaje Asignado</Text>
                {selectedRouteId && (
                  <View style={styles.assignmentRow}>
                    <Ionicons name="git-branch" size={16} color="#6B7280" />
                    <Text style={styles.assignmentLabel}>Ruta:</Text>
                    <Text style={styles.assignmentValue}>
                      {routes.find(r => r.id === selectedRouteId)?.shortName || 'N/A'}
                    </Text>
                  </View>
                )}
                {selectedTripId && (
                  <View style={styles.assignmentRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.assignmentLabel}>Viaje:</Text>
                    <Text style={styles.assignmentValue}>
                      {trips.find(t => t.id === selectedTripId)?.headsign || 'N/A'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Información del viaje actual */}
        {isTracking && (
          <View style={styles.tripInfo}>
            <Text style={styles.tripInfoTitle}>Información del viaje</Text>
            {gpsTracker.getConfig() && (
              <>
                <View style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>Bus:</Text>
                  <Text style={styles.tripInfoValue}>{gpsTracker.getConfig()?.busId}</Text>
                </View>
                <View style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>Ruta:</Text>
                  <Text style={styles.tripInfoValue}>{gpsTracker.getConfig()?.routeId}</Text>
                </View>
                <View style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>Viaje:</Text>
                  <Text style={styles.tripInfoValue}>{gpsTracker.getConfig()?.tripId}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Botón de acción */}
        <TouchableOpacity
          style={[
            styles.button,
            isTracking ? styles.buttonStop : styles.buttonStart,
            loading && styles.buttonDisabled,
          ]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons
                name={isTracking ? 'stop-circle' : 'play-circle'}
                size={24}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isTracking ? 'Detener Rastreo' : 'Iniciar Rastreo'}
              </Text>
            </>
          )}  
        </TouchableOpacity>

        {/* Advertencia */}
        <View style={styles.warning}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            El rastreo GPS consume batería. Asegúrate de tener tu dispositivo cargado durante el servicio.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  tripInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  tripInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tripInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonStart: {
    backgroundColor: '#61d45d',
  },
  buttonStop: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
  },
  optional: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  assignmentInfo: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  assignmentLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  assignmentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
