import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../ui/ThemedView';
import { ThemedText } from '../ui/ThemedText';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Ruta } from '../../lib/types';

interface RouteDetailCardProps {
  route: Ruta;
}

/**
 * Componente que muestra información detallada de una ruta incluyendo
 * horarios, tipo de transporte, operador y otros campos GTFS
 */
export function RouteDetailCard({ route }: RouteDetailCardProps) {
  const getRouteTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      bus: 'Autobús',
      metro: 'Metro',
      tram: 'Tranvía',
      ferry: 'Ferry',
      cable_car: 'Teleférico',
      gondola: 'Góndola',
      funicular: 'Funicular',
      trolleybus: 'Trolebús',
      monorail: 'Monoriel',
    };
    return types[type || 'bus'] || 'Autobús';
  };

  const getRouteTypeIcon = (type?: string) => {
    const icons: Record<string, string> = {
      bus: 'directions-bus',
      metro: 'directions-subway',
      tram: 'tram',
      ferry: 'directions-boat',
      cable_car: 'cable',
      gondola: 'cable',
      funicular: 'cable',
      trolleybus: 'directions-bus',
      monorail: 'train',
    };
    return icons[type || 'bus'] || 'directions-bus';
  };

  return (
    <Card variant="outlined" padding="lg" style={styles.container}>
      {/* Información Básica */}
      <ThemedView style={styles.section}>
        <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
          Información Básica
        </ThemedText>

        <ThemedView style={styles.infoRow}>
          <ThemedView
            style={[styles.colorBox, { backgroundColor: route.color || '#FF0000' }]}
          />
          <ThemedView style={styles.infoContent}>
            <ThemedText variant="caption" color="textSecondary">Color de Ruta</ThemedText>
            <ThemedText variant="body">{route.color || '#FF0000'}</ThemedText>
          </ThemedView>
        </ThemedView>

        {route.shortName && (
          <ThemedView style={styles.infoRow}>
            <Icon name="tag" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Nombre Corto</ThemedText>
              <ThemedText variant="body">{route.shortName}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {route.description && (
          <ThemedView style={styles.infoRow}>
            <Icon name="description" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Descripción</ThemedText>
              <ThemedText variant="body">{route.description}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.infoRow}>
          <Icon name={getRouteTypeIcon(route.type)} size="sm" color="textSecondary" />
          <ThemedView style={styles.infoContent}>
            <ThemedText variant="caption" color="textSecondary">Tipo de Transporte</ThemedText>
            <ThemedText variant="body">{getRouteTypeLabel(route.type)}</ThemedText>
          </ThemedView>
        </ThemedView>

        {route.agencyId && (
          <ThemedView style={styles.infoRow}>
            <Icon name="business" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Agencia</ThemedText>
              <ThemedText variant="body">{route.agencyId}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {route.network && (
          <ThemedView style={styles.infoRow}>
            <Icon name="account-tree" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Red</ThemedText>
              <ThemedText variant="body">{route.network}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      {/* Horarios y Operación */}
      {(route.operatingStartTime || route.operatingEndTime || route.frequency) && (
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Horarios y Operación
          </ThemedText>

          {route.operatingStartTime && route.operatingEndTime && (
            <ThemedView style={styles.infoRow}>
              <Icon name="schedule" size="sm" color="textSecondary" />
              <ThemedView style={styles.infoContent}>
                <ThemedText variant="caption" color="textSecondary">Horario de Operación</ThemedText>
                <ThemedText variant="body">
                  {route.operatingStartTime} - {route.operatingEndTime}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {route.frequency && (
            <ThemedView style={styles.infoRow}>
              <Icon name="timer" size="sm" color="textSecondary" />
              <ThemedView style={styles.infoContent}>
                <ThemedText variant="caption" color="textSecondary">Frecuencia</ThemedText>
                <ThemedText variant="body">Cada {route.frequency} minutos</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {route.averageTravelTime && (
            <ThemedView style={styles.infoRow}>
              <Icon name="access-time" size="sm" color="textSecondary" />
              <ThemedView style={styles.infoContent}>
                <ThemedText variant="caption" color="textSecondary">Tiempo Promedio de Viaje</ThemedText>
                <ThemedText variant="body">{route.averageTravelTime} minutos</ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      )}

      {/* Paradas */}
      <ThemedView style={styles.section}>
        <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
          Recorrido
        </ThemedText>

        <ThemedView style={styles.infoRow}>
          <Icon name="location-on" size="sm" color="textSecondary" />
          <ThemedView style={styles.infoContent}>
            <ThemedText variant="caption" color="textSecondary">Número de Paradas</ThemedText>
            <ThemedText variant="body">
              {(route.stopIds || route.paradas || []).length} paradas
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Políticas de Servicio */}
      {(route.continuousPickup || route.continuousDropOff) && (
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Políticas de Servicio
          </ThemedText>

          {route.continuousPickup && route.continuousPickup !== '0' && (
            <ThemedView style={styles.infoRow}>
              <Icon name="pan-tool" size="sm" color="success" />
              <ThemedView style={styles.infoContent}>
                <ThemedText variant="body" color="success">
                  {route.continuousPickup === '1' ? 'Recogida continua disponible' : 'Consultar recogida continua'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {route.continuousDropOff && route.continuousDropOff !== '0' && (
            <ThemedView style={styles.infoRow}>
              <Icon name="exit-to-app" size="sm" color="success" />
              <ThemedView style={styles.infoContent}>
                <ThemedText variant="body" color="success">
                  {route.continuousDropOff === '1' ? 'Bajada continua disponible' : 'Consultar bajada continua'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      )}

      {/* Estado */}
      <ThemedView style={styles.section}>
        <ThemedView style={styles.infoRow}>
          <Icon
            name={route.activa ? 'check-circle' : 'cancel'}
            size="sm"
            color={route.activa ? 'success' : 'error'}
          />
          <ThemedView style={styles.infoContent}>
            <ThemedText variant="body" color={route.activa ? 'success' : 'error'}>
              {route.activa ? 'Ruta Activa' : 'Ruta Inactiva'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginTop: 4,
  },
});
