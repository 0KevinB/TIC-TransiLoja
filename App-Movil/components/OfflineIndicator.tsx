import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';
import { useNetworkStatus } from '../lib/networkService';
import { useAccessibleFont } from '../hooks/useAccessibleFont';

interface OfflineIndicatorProps {
  dataSource?: 'online' | 'offline' | 'unavailable';
  showWhenOnline?: boolean;
  compact?: boolean;
}

export function OfflineIndicator({
  dataSource,
  showWhenOnline = false,
  compact = false
}: OfflineIndicatorProps) {
  const { theme } = useTheme();
  const networkStatus = useNetworkStatus();
  const { getPaddingScaled } = useAccessibleFont();

  // No mostrar nada si estamos online y no se solicita mostrar
  if (networkStatus.isOnline && !showWhenOnline && dataSource !== 'offline') {
    return null;
  }

  const getIndicatorData = () => {
    if (dataSource === 'offline' || (!networkStatus.isOnline && dataSource !== 'unavailable')) {
      return {
        icon: 'cloud-off',
        text: compact ? 'Offline' : 'Modo offline activo',
        color: theme.colors.warning,
        backgroundColor: theme.colors.warning + '15',
        description: compact ? null : 'Mostrando datos descargados'
      };
    }

    if (dataSource === 'unavailable' || (!networkStatus.isOnline && !dataSource)) {
      return {
        icon: 'cloud-off',
        text: compact ? 'Sin datos' : 'Sin conexión ni datos offline',
        color: theme.colors.error,
        backgroundColor: theme.colors.error + '15',
        description: compact ? null : 'Descarga datos en configuración'
      };
    }

    if (networkStatus.isOnline && showWhenOnline) {
      return {
        icon: 'cloud-done',
        text: compact ? 'Online' : 'Conectado',
        color: theme.colors.success,
        backgroundColor: theme.colors.success + '15',
        description: compact ? null : 'Datos actualizados'
      };
    }

    return null;
  };

  const indicatorData = getIndicatorData();
  if (!indicatorData) return null;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: compact ? getPaddingScaled(6) : getPaddingScaled(8),
      backgroundColor: indicatorData.backgroundColor,
      borderRadius: compact ? 4 : 6,
      marginVertical: compact ? 2 : 4,
    },
    content: {
      flex: 1,
      marginLeft: getPaddingScaled(6),
    },
    text: {
      fontSize: compact ? 12 : 14,
    },
    description: {
      fontSize: 11,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <Icon
        name={indicatorData.icon as any}
        color={indicatorData.color}
        size={compact ? "xs" : "sm"}
      />
      <View style={styles.content}>
        <ThemedText
          variant={compact ? "caption" : "body"}
          style={[styles.text, { color: indicatorData.color }]}
          weight="medium"
        >
          {indicatorData.text}
        </ThemedText>
        {!compact && indicatorData.description && (
          <ThemedText
            variant="caption"
            style={[styles.description, { color: indicatorData.color }]}
          >
            {indicatorData.description}
          </ThemedText>
        )}
      </View>
    </View>
  );
}