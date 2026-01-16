import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useAccessibleFont } from '../hooks/useAccessibleFont';
import { useTransport } from '../context/TransportContext';
import { OfflineStorageService } from '../lib/offlineStorage';

export function OfflineDataManagerSimple() {
  const { theme } = useTheme();
  const { getPaddingScaled, getMarginScaled } = useAccessibleFont();
  const {
    isOfflineMode,
    downloadOfflineData,
    clearOfflineData,
    hasOfflineData: contextHasOfflineData,
  } = useTransport();

  const [downloading, setDownloading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [storageSize, setStorageSize] = useState<number>(0);

  useEffect(() => {
    loadOfflineInfo();
  }, [contextHasOfflineData]);

  const loadOfflineInfo = async () => {
    const info = await OfflineStorageService.getOfflineInfo();
    setLastUpdate(info.lastUpdate);
    setStorageSize(info.size);
  };

  const handleDownload = async () => {
    if (isOfflineMode) {
      Alert.alert(
        'Sin Conexión',
        'Necesitas conexión a internet para descargar datos offline.'
      );
      return;
    }

    Alert.alert(
      'Descargar Datos Offline',
      'Esta función descargará los datos esenciales del transporte público para uso sin conexión.\n\n• Paradas y rutas\n• Horarios básicos\n• Alertas activas\n\n¿Continuar con la descarga?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descargar',
          onPress: async () => {
            setDownloading(true);
            try {
              await downloadOfflineData();
              await loadOfflineInfo();
              Alert.alert(
                'Descarga Completa',
                'Los datos han sido descargados correctamente. Ahora puedes usar la aplicación sin conexión a internet.'
              );
            } catch (error) {
              console.error('Error downloading data:', error);
              Alert.alert(
                'Error',
                'No se pudieron descargar los datos. Verifica tu conexión e intenta nuevamente.'
              );
            } finally {
              setDownloading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Eliminar datos offline',
      '¿Estás seguro que quieres eliminar todos los datos offline descargados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearOfflineData();
              setLastUpdate(null);
              setStorageSize(0);
              Alert.alert(
                'Datos eliminados',
                'Los datos offline han sido eliminados correctamente.'
              );
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'No se pudieron eliminar los datos offline.');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  const formatSize = (bytes: number): string => {
    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const styles = StyleSheet.create({
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getMarginScaled(8),
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: getPaddingScaled(8),
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: getMarginScaled(8),
      marginTop: getMarginScaled(12),
    },
    buttonFlex: {
      flex: 1,
    },
    networkIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: getMarginScaled(8),
      padding: getPaddingScaled(8),
      backgroundColor: theme.colors.success + '15',
      borderRadius: 6,
    },
  });

  return (
    <Card margin="md">
      <ThemedText variant="subtitle" weight="semibold">
        Modo Offline
      </ThemedText>

      <ThemedText variant="body" color="textSecondary" style={{ marginVertical: getMarginScaled(8) }}>
        Descarga datos para usar funciones básicas sin conexión a internet
      </ThemedText>

      {/* Estado de la red */}
      <View style={[
        styles.networkIndicator,
        { backgroundColor: isOfflineMode ? theme.colors.error + '15' : theme.colors.success + '15' }
      ]}>
        <Icon
          name={isOfflineMode ? 'wifi-off' : 'wifi'}
          color={isOfflineMode ? 'error' : 'success'}
          size="sm"
        />
        <ThemedText
          variant="caption"
          color={isOfflineMode ? 'error' : 'success'}
          style={{ marginLeft: getPaddingScaled(6) }}
        >
          {isOfflineMode ? 'Sin conexión a internet' : 'Conectado a internet'}
        </ThemedText>
      </View>

      {/* Estado de los datos offline */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: contextHasOfflineData ? theme.colors.success : theme.colors.border }
          ]}
        />
        <ThemedText variant="body">
          {contextHasOfflineData ? 'Datos offline disponibles' : 'Sin datos offline'}
        </ThemedText>
      </View>

      {contextHasOfflineData && lastUpdate && (
        <>
          <ThemedText variant="caption" color="textSecondary">
            Última actualización: {formatTimeAgo(lastUpdate)}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">
            Tamaño: {formatSize(storageSize)}
          </ThemedText>
        </>
      )}

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {!contextHasOfflineData ? (
          <ThemedButton
            variant="primary"
            onPress={handleDownload}
            disabled={downloading || isOfflineMode}
            style={styles.buttonFlex}
          >
            {downloading ? (
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.background} size="small" />
                <ThemedText color="background" weight="semibold"> Descargando...</ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="download" color="background" size="sm" />
                <ThemedText color="background" weight="semibold"> Descargar</ThemedText>
              </ThemedView>
            )}
          </ThemedButton>
        ) : (
          <>
            <ThemedButton
              variant="outline"
              onPress={handleDownload}
              disabled={downloading || isOfflineMode}
              style={styles.buttonFlex}
            >
              {downloading ? (
                <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                  <ThemedText color="primary"> Actualizando...</ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="refresh" color="primary" size="sm" />
                  <ThemedText color="primary"> Actualizar</ThemedText>
                </ThemedView>
              )}
            </ThemedButton>
            <ThemedButton
              variant="outline"
              onPress={handleClearData}
              disabled={downloading}
              style={styles.buttonFlex}
            >
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="delete" color="error" size="sm" />
                <ThemedText color="error"> Limpiar</ThemedText>
              </ThemedView>
            </ThemedButton>
          </>
        )}
      </View>
    </Card>
  );
}