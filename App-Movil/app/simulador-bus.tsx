/**
 * Pantalla de Simulador de Bus
 * Permite simular el movimiento de un bus en una ruta
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
import { busSimulator } from '@/lib/services/bus-simulator';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as getDB } from '@/lib/firebase';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

interface Bus {
  id: string;
  plateNumber: string;
  model: string;
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
}

export default function SimuladorBusScreen() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({
    currentStop: 0,
    totalStops: 0,
    progress: 0,
    currentPosition: { lat: 0, lng: 0 },
  });

  // Datos de selección
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Selecciones
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(30);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
    checkSimulationStatus();

    // Actualizar progreso cada segundo
    const interval = setInterval(() => {
      if (busSimulator.isActive()) {
        setProgress(busSimulator.getProgress());
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

      // Cargar buses
      const busesSnapshot = await getDocs(
        query(collection(db, 'buses'), where('status', '==', 'active'))
      );
      const busesData: Bus[] = [];
      busesSnapshot.forEach((doc) => {
        const data = doc.data();
        busesData.push({
          id: doc.id,
          plateNumber: data.plateNumber,
          model: data.model,
        });
      });
      setBuses(busesData);

      // Cargar rutas
      const routesSnapshot = await getDocs(collection(db, 'routes'));
      const routesData: Route[] = [];
      routesSnapshot.forEach((doc) => {
        const data = doc.data();
        routesData.push({
          id: doc.id,
          name: data.name,
          shortName: data.shortName,
        });
      });
      setRoutes(routesData);

    } catch (error) {
      console.error('Error al cargar datos:', error);
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

  const checkSimulationStatus = () => {
    setIsSimulating(busSimulator.isActive());
    if (busSimulator.isActive()) {
      setProgress(busSimulator.getProgress());
    }
  };

  const handleStartSimulation = async () => {
    // Validar que se hayan seleccionado todos los campos
    if (!selectedBusId || !selectedRouteId || !selectedTripId) {
      Alert.alert(
        'Datos incompletos',
        'Por favor selecciona el bus, ruta y viaje antes de iniciar la simulación'
      );
      return;
    }

    setLoading(true);

    try {
      const success = await busSimulator.startSimulation({
        busId: selectedBusId,
        routeId: selectedRouteId,
        tripId: selectedTripId,
        speed: selectedSpeed,
        updateInterval: 3000, // 3 segundos
      });

      if (success) {
        setIsSimulating(true);
        Alert.alert(
          'Simulación iniciada',
          `El bus ${selectedBusId} está siendo simulado a ${selectedSpeed} km/h`
        );
      } else {
        Alert.alert(
          'Error',
          'No se pudo iniciar la simulación. Verifica que la ruta tenga paradas configuradas.'
        );
      }
    } catch (error) {
      console.error('Error al iniciar simulación:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar la simulación');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    Alert.alert(
      'Detener simulación',
      '¿Estás seguro de que deseas detener la simulación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Detener',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await busSimulator.stopSimulation();
              setIsSimulating(false);
              setProgress({
                currentStop: 0,
                totalStops: 0,
                progress: 0,
                currentPosition: { lat: 0, lng: 0 },
              });
              Alert.alert('Simulación detenida', 'La simulación ha sido detenida');
            } catch (error) {
              console.error('Error al detener simulación:', error);
              Alert.alert('Error', 'Ocurrió un error al detener la simulación');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Simulador de Bus', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="git-network" size={48} color="#8B5CF6" />
          <Text style={styles.title}>Simulador de Bus</Text>
          <Text style={styles.subtitle}>
            {isSimulating ? 'Simulación en curso' : 'Modo prueba'}
          </Text>
        </View>

        {/* Estado actual */}
        <View style={[styles.statusCard, isSimulating ? styles.statusActive : styles.statusInactive]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isSimulating ? 'play-circle' : 'pause-circle'}
              size={32}
              color={isSimulating ? '#8B5CF6' : '#6B7280'}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isSimulating ? 'Simulación Activa' : 'Simulación Detenida'}
              </Text>
              {isSimulating && (
                <Text style={styles.statusSubtitle}>
                  Parada {progress.currentStop} de {progress.totalStops}
                </Text>
              )}
            </View>
          </View>

          {/* Progreso */}
          {isSimulating && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress.progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress.progress * 100)}% hacia la siguiente parada
              </Text>
            </View>
          )}
        </View>

        {/* Formulario de configuración (solo si no está simulando) */}
        {!isSimulating && (
          <View style={styles.form}>
            {/* Seleccionar Bus */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="bus" size={16} /> Bus
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedBusId}
                  onValueChange={setSelectedBusId}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona un bus" value="" />
                  {buses.map((bus) => (
                    <Picker.Item
                      key={bus.id}
                      label={`${bus.plateNumber} - ${bus.model}`}
                      value={bus.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Seleccionar Ruta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="git-branch" size={16} /> Ruta
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedRouteId}
                  onValueChange={setSelectedRouteId}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona una ruta" value="" />
                  {routes.map((route) => (
                    <Picker.Item
                      key={route.id}
                      label={`${route.shortName} - ${route.name}`}
                      value={route.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Seleccionar Viaje */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="calendar" size={16} /> Viaje
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTripId}
                  onValueChange={setSelectedTripId}
                  style={styles.picker}
                  enabled={trips.length > 0}
                >
                  <Picker.Item
                    label={trips.length > 0 ? 'Selecciona un viaje' : 'Primero selecciona una ruta'}
                    value=""
                  />
                  {trips.map((trip) => (
                    <Picker.Item
                      key={trip.id}
                      label={trip.headsign}
                      value={trip.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Seleccionar Velocidad */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="speedometer" size={16} /> Velocidad (km/h)
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSpeed}
                  onValueChange={(value) => setSelectedSpeed(Number(value))}
                  style={styles.picker}
                >
                  <Picker.Item label="10 km/h (Muy lento)" value={10} />
                  <Picker.Item label="20 km/h (Lento)" value={20} />
                  <Picker.Item label="30 km/h (Normal)" value={30} />
                  <Picker.Item label="40 km/h (Rápido)" value={40} />
                  <Picker.Item label="50 km/h (Muy rápido)" value={50} />
                </Picker>
              </View>
            </View>
          </View>
        )}

        {/* Información de la simulación actual */}
        {isSimulating && (
          <View style={styles.simulationInfo}>
            <Text style={styles.simulationInfoTitle}>Información de la simulación</Text>
            {busSimulator.getConfig() && (
              <>
                <View style={styles.simulationInfoRow}>
                  <Text style={styles.simulationInfoLabel}>Bus:</Text>
                  <Text style={styles.simulationInfoValue}>{busSimulator.getConfig()?.busId}</Text>
                </View>
                <View style={styles.simulationInfoRow}>
                  <Text style={styles.simulationInfoLabel}>Ruta:</Text>
                  <Text style={styles.simulationInfoValue}>{busSimulator.getConfig()?.routeId}</Text>
                </View>
                <View style={styles.simulationInfoRow}>
                  <Text style={styles.simulationInfoLabel}>Velocidad:</Text>
                  <Text style={styles.simulationInfoValue}>{busSimulator.getConfig()?.speed} km/h</Text>
                </View>
                <View style={styles.simulationInfoRow}>
                  <Text style={styles.simulationInfoLabel}>Posición actual:</Text>
                  <Text style={styles.simulationInfoValue}>
                    {progress.currentPosition.lat.toFixed(6)}, {progress.currentPosition.lng.toFixed(6)}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Botón de acción */}
        <TouchableOpacity
          style={[
            styles.button,
            isSimulating ? styles.buttonStop : styles.buttonStart,
            loading && styles.buttonDisabled,
          ]}
          onPress={isSimulating ? handleStopSimulation : handleStartSimulation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons
                name={isSimulating ? 'stop-circle' : 'play-circle'}
                size={24}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isSimulating ? 'Detener Simulación' : 'Iniciar Simulación'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Información */}
        <View style={styles.info}>
          <Ionicons name="information-circle" size={20} color="#8B5CF6" />
          <Text style={styles.infoText}>
            El simulador moverá el bus virtualmente a través de las paradas de la ruta.
            Podrás ver el movimiento en tiempo real en la pantalla "Buses en Vivo".
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
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#8B5CF6',
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
  progressContainer: {
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  simulationInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  simulationInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  simulationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simulationInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  simulationInfoValue: {
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
    backgroundColor: '#8B5CF6',
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
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EDE9FE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 20,
  },
});
