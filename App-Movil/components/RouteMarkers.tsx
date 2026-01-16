import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import { LatLng } from '../lib/googleMaps';

interface RouteMarkersProps {
  plannedRoute: any;
  getCoordinatesFromId: (id: string) => LatLng | null;
  origin?: { latitude: number; longitude: number; name?: string };
  destination?: { latitude: number; longitude: number; name?: string };
  onMarkerPress?: (segmentIndex: number) => void;
}

export const RouteMarkers: React.FC<RouteMarkersProps> = ({
  plannedRoute,
  getCoordinatesFromId,
  origin,
  destination,
  onMarkerPress
}) => {
  if (!plannedRoute?.segmentos) return null;

  const markers = [];

  // Marcador de origen mejorado
  if (origin) {
    markers.push(
      <Marker
        key="enhanced-origin"
        coordinate={origin}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={false}
      >
        <View style={[styles.customMarker, styles.originMarker]}>
          <Icon name="radio-button-checked" size="lg" color="background" />
        </View>
        <Callout>
          <ThemedView style={styles.calloutContainer}>
            <ThemedText variant="body" weight="bold" color="primary">
              📍 Origen
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {origin.name || 'Punto de inicio'}
            </ThemedText>
          </ThemedView>
        </Callout>
      </Marker>
    );
  }

  // Marcador de destino mejorado
  if (destination) {
    markers.push(
      <Marker
        key="enhanced-destination"
        coordinate={destination}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={false}
      >
        <View style={[styles.customMarker, styles.destinationMarker]}>
          <Icon name="location-on" size="lg" color="background" />
        </View>
        <Callout>
          <ThemedView style={styles.calloutContainer}>
            <ThemedText variant="body" weight="bold" color="secondary">
              🎯 Destino
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {destination.name || 'Punto de llegada'}
            </ThemedText>
          </ThemedView>
        </Callout>
      </Marker>
    );
  }

  // Marcadores para puntos de transferencia
  const transferPoints = new Set<string>();
  let lastBusSegment: any = null;

  plannedRoute.segmentos.forEach((segmento: any, index: number) => {
    if (segmento.tipo === 'autobus') {
      // Si hay un segmento de bus anterior y es diferente, es un punto de transferencia
      if (lastBusSegment && lastBusSegment.id_ruta !== segmento.id_ruta) {
        transferPoints.add(segmento.desde);
      }
      lastBusSegment = segmento;
    }
  });

  // Agregar marcadores de transferencia
  transferPoints.forEach((stopId, index) => {
    const coords = getCoordinatesFromId(stopId);
    if (coords) {
      markers.push(
        <Marker
          key={`transfer-${stopId}`}
          coordinate={coords}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          onPress={() => onMarkerPress?.(index)}
        >
          <View style={[styles.customMarker, styles.transferMarker]}>
            <Icon name="sync" size="md" color="background" />
          </View>
          <Callout>
            <ThemedView style={styles.calloutContainer}>
              <ThemedText variant="body" weight="bold" color="accent">
                🔄 Transferencia
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Cambio de línea de transporte
              </ThemedText>
            </ThemedView>
          </Callout>
        </Marker>
      );
    }
  });

  // Marcadores para paradas de bus importantes
  const busStops = new Set<string>();
  plannedRoute.segmentos.forEach((segmento: any) => {
    if (segmento.tipo === 'autobus') {
      busStops.add(segmento.desde);
      busStops.add(segmento.hasta);
    }
  });

  busStops.forEach((stopId) => {
    if (transferPoints.has(stopId)) return; // Ya se agregó como transferencia

    const coords = getCoordinatesFromId(stopId);
    if (coords && stopId !== 'origen' && stopId !== 'destino') {
      markers.push(
        <Marker
          key={`bus-stop-${stopId}`}
          coordinate={coords}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={[styles.customMarker, styles.busStopMarker]}>
            <Icon name="directions-bus" size="sm" color="background" />
          </View>
          <Callout>
            <ThemedView style={styles.calloutContainer}>
              <ThemedText variant="body" weight="bold" color="primary">
                🚏 Parada
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Parada de bus en tu ruta
              </ThemedText>
            </ThemedView>
          </Callout>
        </Marker>
      );
    }
  });

  // Marcadores numerados para los pasos principales
  const mainSteps = plannedRoute.segmentos.filter((s: any) =>
    s.tipo === 'caminar' || s.tipo === 'autobus'
  );

  mainSteps.forEach((segmento: any, index: number) => {
    const coords = getCoordinatesFromId(segmento.desde);
    if (coords && segmento.desde !== 'origen') {
      markers.push(
        <Marker
          key={`step-${index}`}
          coordinate={coords}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={[styles.customMarker, styles.stepMarker]}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
        </Marker>
      );
    }
  });

  return <>{markers}</>;
};

const styles = StyleSheet.create({
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  originMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#10B981',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#EF4444',
  },
  transferMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#F59E0B',
  },
  busStopMarker: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
  },
  stepMarker: {
    width: 28,
    height: 28,
    backgroundColor: '#8B5CF6',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutContainer: {
    padding: 12,
    minWidth: 150,
    maxWidth: 200,
    borderRadius: 8,
  },
});

export default RouteMarkers;