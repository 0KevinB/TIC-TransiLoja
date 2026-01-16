import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import type { Alerta } from '../lib/types';

interface AlertCardProps {
  alerta: Alerta;
  isActive: boolean;
  getAlertIcon: (tipo: string) => string;
  getAlertColor: (tipo: string) => string;
  formatDate: (date: any) => string;
}

/**
 * Componente de tarjeta de alerta optimizado con React.memo
 * Solo se re-renderiza si cambian sus props
 */
const AlertCard = memo<AlertCardProps>(({
  alerta,
  isActive,
  getAlertIcon,
  getAlertColor,
  formatDate
}) => {
  return (
    <ThemedView style={styles.alertCardContainer}>
      <Card
        variant="outlined"
        padding="lg"
        style={[
          styles.alertCard,
          !isActive && styles.inactiveAlertCard
        ]}
        accessibilityLabel={`Alerta: ${alerta.titulo}`}
        accessibilityHint={`${isActive ? 'Activa' : 'Finalizada'}. ${alerta.mensaje}`}
        accessibilityRole="text"
      >
        <ThemedView style={styles.alertHeader}>
          <Icon
            name={getAlertIcon(alerta.tipo)}
            library="ionicons"
            size="lg"
            color={getAlertColor(alerta.tipo)}
          />
          <ThemedView style={styles.alertHeaderText}>
            <ThemedText variant="subtitle" weight="bold" style={styles.alertTitle}>
              {alerta.titulo}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {isActive ? 'Activa' : 'Finalizada'} • {formatDate(alerta.fecha_inicio)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedText variant="body" style={styles.alertMessage}>
          {alerta.mensaje}
        </ThemedText>

        {alerta.fecha_fin && (
          <ThemedText variant="caption" color="textSecondary" style={styles.alertDate}>
            Finaliza: {formatDate(alerta.fecha_fin)}
          </ThemedText>
        )}
      </Card>
    </ThemedView>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para optimizar re-renders
  return (
    prevProps.alerta.id === nextProps.alerta.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.alerta.titulo === nextProps.alerta.titulo &&
    prevProps.alerta.mensaje === nextProps.alerta.mensaje
  );
});

AlertCard.displayName = 'AlertCard';

export default AlertCard;

const styles = StyleSheet.create({
  alertCardContainer: {
    paddingHorizontal: 20,
  },
  alertCard: {
    marginBottom: 12,
  },
  inactiveAlertCard: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    marginBottom: 4,
  },
  alertMessage: {
    marginBottom: 8,
    lineHeight: 20,
  },
  alertDate: {
    marginTop: 4,
  },
});
