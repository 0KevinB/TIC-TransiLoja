import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import { useTransport } from '../context/TransportContext';
import { useTheme } from '../context/ThemeContext';

export const OfflineBanner = () => {
  const { isOfflineMode, hasOfflineData } = useTransport();
  const { theme } = useTheme();

  if (!isOfflineMode) return null;

  return (
    <ThemedView
      style={[
        styles.banner,
        {
          backgroundColor: hasOfflineData ? theme.colors.warning + '20' : theme.colors.error + '20',
        },
      ]}
    >
      <Icon
        name={hasOfflineData ? 'cloud-off' : 'wifi-off'}
        color={hasOfflineData ? 'warning' : 'error'}
        size="sm"
      />
      <ThemedText
        variant="caption"
        color={hasOfflineData ? 'warning' : 'error'}
        weight="semibold"
        style={styles.text}
      >
        {hasOfflineData
          ? '📵 Modo Offline - Datos guardados'
          : '❌ Sin conexión - No hay datos offline'}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    flex: 1,
    textAlign: 'center',
  },
});
