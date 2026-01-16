import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedView } from '../ui/ThemedView';
import { ThemedText } from '../ui/ThemedText';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Parada } from '../../lib/types';
import { useStopTimes, formatGTFSTime } from '../../hooks/useStopTimes';

interface StopDetailCardProps {
  stop: Parada;
}

/**
 * Componente que muestra información detallada de una parada incluyendo
 * amenities, operador, accesibilidad y otros campos GTFS
 */
export function StopDetailCard({ stop }: StopDetailCardProps) {
  const hasAmenities = stop.amenities && Object.values(stop.amenities).some(v => v);
  const { stopTimes, loading: loadingTimes } = useStopTimes(stop.id);

  return (
    <Card variant="outlined" padding="lg" style={styles.container}>
      {/* Horarios de Llegada */}
      {stopTimes.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Horarios de Llegada
          </ThemedText>

          <ThemedView style={styles.schedulesContainer}>
            <ThemedView style={styles.schedulesList}>
              {stopTimes.slice(0, 10).map((st, index) => (
                <ThemedView key={`${st.tripId}-${index}`} style={styles.scheduleItem}>
                  <Icon name="schedule" size="sm" color="primary" />
                  <ThemedText variant="body" weight="semibold" color="primary">
                    {formatGTFSTime(st.arrivalTime)}
                  </ThemedText>
                  {st.departureTime !== st.arrivalTime && (
                    <ThemedText variant="caption" color="textSecondary">
                      → {formatGTFSTime(st.departureTime)}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </ThemedView>
            {stopTimes.length > 10 && (
              <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                +{stopTimes.length - 10} horarios más
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      )}

      {/* Información Básica */}
      <ThemedView style={styles.section}>
        <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
          Información Básica
        </ThemedText>

        {stop.codigo && (
          <ThemedView style={styles.infoRow}>
            <Icon name="qr-code" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Código</ThemedText>
              <ThemedText variant="body">{stop.codigo}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {stop.operator && (
          <ThemedView style={styles.infoRow}>
            <Icon name="business" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Operador</ThemedText>
              <ThemedText variant="body">{stop.operator}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {stop.network && (
          <ThemedView style={styles.infoRow}>
            <Icon name="account-tree" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Red</ThemedText>
              <ThemedText variant="body">{stop.network}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {stop.desc && (
          <ThemedView style={styles.infoRow}>
            <Icon name="description" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Descripción</ThemedText>
              <ThemedText variant="body">{stop.desc}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      {/* Accesibilidad */}
      {stop.wheelchairBoarding && stop.wheelchairBoarding !== '0' && (
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Accesibilidad
          </ThemedText>

          <ThemedView style={styles.infoRow}>
            <Icon
              name="accessible"
              size="sm"
              color={stop.wheelchairBoarding === '1' ? 'success' : 'error'}
            />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="body" color={stop.wheelchairBoarding === '1' ? 'success' : 'error'}>
                {stop.wheelchairBoarding === '1'
                  ? 'Accesible para silla de ruedas'
                  : 'No accesible para silla de ruedas'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      {/* Servicios y Comodidades */}
      {hasAmenities && (
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Servicios y Comodidades
          </ThemedText>

          <ThemedView style={styles.amenitiesGrid}>
            {stop.amenities?.shelter && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="home" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">Refugio</ThemedText>
              </ThemedView>
            )}

            {stop.amenities?.bench && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="weekend" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">Banca</ThemedText>
              </ThemedView>
            )}

            {stop.amenities?.lighting && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="lightbulb" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">Iluminación</ThemedText>
              </ThemedView>
            )}

            {stop.amenities?.bin && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="delete" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">Basurero</ThemedText>
              </ThemedView>
            )}

            {stop.amenities?.wifi && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="wifi" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">WiFi</ThemedText>
              </ThemedView>
            )}

            {stop.amenities?.realTimeDisplay && (
              <ThemedView style={styles.amenityItem}>
                <Icon name="monitor" size="md" color="primary" />
                <ThemedText variant="caption" color="textSecondary">Pantalla Info</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      )}

      {/* Ubicación */}
      <ThemedView style={styles.section}>
        <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
          Ubicación
        </ThemedText>

        <ThemedView style={styles.infoRow}>
          <Icon name="place" size="sm" color="textSecondary" />
          <ThemedView style={styles.infoContent}>
            <ThemedText variant="caption" color="textSecondary">Coordenadas</ThemedText>
            <ThemedText variant="body">
              {stop.ubicacion.latitud.toFixed(6)}, {stop.ubicacion.longitud.toFixed(6)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {stop.zoneId && (
          <ThemedView style={styles.infoRow}>
            <Icon name="map" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Zona Tarifaria</ThemedText>
              <ThemedText variant="body">{stop.zoneId}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {stop.platformCode && (
          <ThemedView style={styles.infoRow}>
            <Icon name="confirmation-number" size="sm" color="textSecondary" />
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="caption" color="textSecondary">Plataforma</ThemedText>
              <ThemedText variant="body">{stop.platformCode}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  schedulesContainer: {
    gap: 8,
  },
  schedulesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  scheduleCard: {
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleContent: {
    flex: 1,
    gap: 2,
  },
  scheduleNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
  },
});
