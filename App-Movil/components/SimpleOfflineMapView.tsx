import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useTransport } from '../context/TransportContext';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';

interface SimpleOfflineMapViewProps {
  showStops?: boolean;
  showRoutes?: boolean;
  onStopPress?: (stop: any) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Coordenadas de Loja, Ecuador (centro del mapa)
const LOJA_CENTER = { lat: -3.9929, lng: -79.2045 };

// Constantes para el mapa
const MAP_WIDTH = SCREEN_WIDTH * 3;
const MAP_HEIGHT = SCREEN_HEIGHT * 3;
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export const SimpleOfflineMapView: React.FC<SimpleOfflineMapViewProps> = ({
  showStops = true,
  showRoutes = true,
  onStopPress,
}) => {
  const { theme } = useTheme();
  const { paradas, rutas } = useTransport();
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const scrollViewRef = useRef<ScrollView>(null);

  // Convertir coordenadas geográficas a coordenadas de pantalla
  const geoToScreen = (lat: number, lng: number) => {
    // Rango aproximado de Loja
    const latMin = -4.05;
    const latMax = -3.93;
    const lngMin = -79.25;
    const lngMax = -79.15;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * MAP_WIDTH;
    const y = ((latMax - lat) / (latMax - latMin)) * MAP_HEIGHT;

    return { x, y };
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, MIN_ZOOM));
  };

  const handleResetView = () => {
    setZoom(INITIAL_ZOOM);
    scrollViewRef.current?.scrollTo({
      x: (MAP_WIDTH * zoom - SCREEN_WIDTH) / 2,
      y: (MAP_HEIGHT * zoom - SCREEN_HEIGHT) / 2,
      animated: true,
    });
  };

  // Renderizar rutas como líneas
  const renderRoutes = () => {
    if (!showRoutes || !rutas.length) return null;

    return rutas.map((ruta) => {
      if (!ruta.paradas || ruta.paradas.length < 2) return null;

      const routeStops = ruta.paradas
        .map(paradaId => paradas.find(p => p.id === paradaId))
        .filter(Boolean);

      if (routeStops.length < 2) return null;

      return (
        <Svg
          key={`route-${ruta.id}`}
          style={StyleSheet.absoluteFill}
          width={MAP_WIDTH * zoom}
          height={MAP_HEIGHT * zoom}
        >
          {routeStops.map((stop, index) => {
            if (index === 0 || !stop) return null;
            const prevStop = routeStops[index - 1];
            if (!prevStop) return null;

            const from = geoToScreen(
              prevStop.ubicacion.latitud,
              prevStop.ubicacion.longitud
            );
            const to = geoToScreen(
              stop.ubicacion.latitud,
              stop.ubicacion.longitud
            );

            return (
              <Line
                key={`line-${ruta.id}-${index}`}
                x1={from.x * zoom}
                y1={from.y * zoom}
                x2={to.x * zoom}
                y2={to.y * zoom}
                stroke={ruta.color || theme.colors.primary}
                strokeWidth={3 * zoom}
                opacity={0.7}
              />
            );
          })}
        </Svg>
      );
    });
  };

  // Renderizar paradas como puntos
  const renderStops = () => {
    if (!showStops || !paradas.length) return null;

    return paradas.map((parada) => {
      const { x, y } = geoToScreen(
        parada.ubicacion.latitud,
        parada.ubicacion.longitud
      );

      return (
        <TouchableOpacity
          key={`stop-${parada.id}`}
          style={[
            styles.stopMarker,
            {
              left: x * zoom - 8,
              top: y * zoom - 8,
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.background,
              transform: [{ scale: zoom }],
            },
          ]}
          onPress={() => onStopPress?.(parada)}
          activeOpacity={0.7}
        >
          <View style={styles.stopMarkerInner} />
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          width: MAP_WIDTH * zoom,
          height: MAP_HEIGHT * zoom,
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        bouncesZoom={false}
        minimumZoomScale={MIN_ZOOM}
        maximumZoomScale={MAX_ZOOM}
      >
        <View
          style={[
            styles.mapCanvas,
            {
              width: MAP_WIDTH * zoom,
              height: MAP_HEIGHT * zoom,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Grid de fondo */}
          <View style={styles.gridOverlay}>
            {[...Array(20)].map((_, i) => (
              <View
                key={`grid-h-${i}`}
                style={[
                  styles.gridLine,
                  {
                    top: (i * MAP_HEIGHT * zoom) / 20,
                    width: MAP_WIDTH * zoom,
                    height: 1,
                    backgroundColor: theme.colors.border + '30',
                  },
                ]}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <View
                key={`grid-v-${i}`}
                style={[
                  styles.gridLine,
                  {
                    left: (i * MAP_WIDTH * zoom) / 20,
                    height: MAP_HEIGHT * zoom,
                    width: 1,
                    backgroundColor: theme.colors.border + '30',
                  },
                ]}
              />
            ))}
          </View>

          {/* Rutas */}
          {renderRoutes()}

          {/* Paradas */}
          {renderStops()}
        </View>
      </ScrollView>

      {/* Banner informativo */}
      <View
        style={[
          styles.offlineBanner,
          {
            backgroundColor: theme.colors.warning + '20',
            borderColor: theme.colors.warning,
          },
        ]}
      >
        <Icon name="map-outline" library="ionicons" size={18} color={theme.colors.warning} />
        <ThemedText variant="caption" style={{ color: theme.colors.warning, flex: 1 }}>
          Modo offline - Vista simplificada del mapa
        </ThemedText>
      </View>

      {/* Controles de zoom */}
      <View style={styles.zoomControls}>
        <Card variant="elevated" padding="sm" style={styles.controlsCard}>
          <TouchableOpacity
            style={[styles.zoomButton, { borderBottomWidth: 1, borderColor: theme.colors.border }]}
            onPress={handleZoomIn}
          >
            <Icon name="add" library="ionicons" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Icon name="remove" library="ionicons" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Botón de reset */}
      <View style={styles.resetControl}>
        <Card variant="elevated" padding="sm">
          <TouchableOpacity style={styles.resetButton} onPress={handleResetView}>
            <Icon name="locate" library="ionicons" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <Card variant="elevated" padding="md">
          <ThemedText variant="caption" weight="bold" style={styles.legendTitle}>
            Leyenda
          </ThemedText>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary, borderWidth: 2, borderColor: '#fff' },
              ]}
            />
            <ThemedText variant="caption">Paradas</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.colors.primary }]} />
            <ThemedText variant="caption">Rutas</ThemedText>
          </View>
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 8, fontSize: 10 }}>
            {paradas.length} paradas • {rutas.length} rutas
          </ThemedText>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  mapCanvas: {
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
  },
  stopMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  stopMarkerInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -40,
  },
  controlsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetControl: {
    position: 'absolute',
    right: 16,
    bottom: 120,
  },
  resetButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    position: 'absolute',
    left: 16,
    bottom: 16,
  },
  legendTitle: {
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
});
