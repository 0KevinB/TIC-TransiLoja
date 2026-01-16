import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useAccessibleFont } from '../hooks/useAccessibleFont';
import { useNetworkStatus } from '../lib/networkService';
import { offlineDataService, DownloadProgress } from '../lib/offlineDataService';

export function OfflineDataManager() {
  const { theme } = useTheme();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  const networkStatus = useNetworkStatus();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [dataInfo, setDataInfo] = useState<{
    hasData: boolean;
    downloadedAt?: Date;
    version?: string;
    size: string;
    itemCounts?: any;
  }>({ hasData: false, size: '0 KB' });

  useEffect(() => {
    loadDataInfo();
  }, []);

  const loadDataInfo = async () => {
    try {
      const info = await offlineDataService.getDownloadInfo();
      setDataInfo(info);
    } catch (error) {
      console.error('Error loading offline data info:', error);
    }
  };

  const handleDownload = async () => {
    if (!networkStatus.isOnline) {
      Alert.alert(
        'Sin conexión',
        'Se requiere conexión a internet para descargar los datos offline.'
      );
      return;
    }

    Alert.alert(
      'Descargar Datos Offline',
      'Esta función descargará TODOS los datos del sistema de transporte para uso sin conexión:\n\n' +
      '✓ Paradas y ubicaciones\n' +
      '✓ Rutas y trayectos\n' +
      '✓ Buses y flota\n' +
      '✓ Conductores\n' +
      '✓ Horarios y calendarios\n' +
      '✓ Servicios y asignaciones\n' +
      '✓ Alertas activas\n' +
      '✓ Municipios\n' +
      '✓ Configuración visual\n\n' +
      'Tamaño aproximado: 2-5 MB\n' +
      '¿Continuar con la descarga?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descargar',
          onPress: async () => {
            setIsDownloading(true);
            setDownloadProgress(null);

            try {
              await offlineDataService.downloadData((progress) => {
                setDownloadProgress(progress);
              });

              await loadDataInfo();

              Alert.alert(
                '✅ Descarga completada',
                `Los datos offline se han descargado correctamente.\n\n` +
                `Datos descargados:\n` +
                `• Paradas, rutas y buses\n` +
                `• Conductores y horarios\n` +
                `• Servicios y asignaciones\n` +
                `• Alertas y configuración\n\n` +
                `Ahora puedes usar la aplicación sin conexión a internet.`
              );
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert(
                '❌ Error en la descarga',
                error instanceof Error ? error.message : 'No se pudieron descargar los datos offline.'
              );
            } finally {
              setIsDownloading(false);
              setDownloadProgress(null);
            }
          }
        }
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Eliminar datos offline',
      '¿Estás seguro que quieres eliminar todos los datos offline descargados?\n\nEsto liberará espacio de almacenamiento pero requerirás conexión a internet para usar la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineDataService.clearOfflineData();
              await loadDataInfo();
              Alert.alert('Datos eliminados', 'Los datos offline han sido eliminados correctamente.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos offline.');
            }
          }
        }
      ]
    );
  };

  const handleRefreshData = async () => {
    if (!networkStatus.isOnline) {
      Alert.alert(
        'Sin conexión',
        'Se requiere conexión a internet para actualizar los datos offline.'
      );
      return;
    }

    Alert.alert(
      'Actualizar datos offline',
      'Esto descargará la versión más reciente de los datos offline. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: () => handleDownload()
        }
      ]
    );
  };

  const formatLastUpdate = (date?: Date): string => {
    if (!date) return 'Nunca';

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const getCollectionDisplayName = (collection: string): string => {
    const names: Record<string, string> = {
      'configuracion': 'Configuración de la app',
      'municipios': 'Municipios',
      'paradas': 'Paradas y ubicaciones',
      'rutas': 'Rutas y trayectos',
      'buses': 'Buses y flota',
      'conductores': 'Conductores',
      'calendarios': 'Horarios y calendarios',
      'asignaciones': 'Servicios y asignaciones',
      'alertas': 'Alertas activas'
    };
    return names[collection] || collection;
  };

  const styles = StyleSheet.create({
    container: {
      gap: getMarginScaled(12),
    },
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
    progressContainer: {
      marginTop: getMarginScaled(16),
      marginBottom: getMarginScaled(8),
      padding: getPaddingScaled(16),
      backgroundColor: theme.colors.primary + '10',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    dataStatsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getMarginScaled(6),
      marginTop: getMarginScaled(12),
      marginBottom: getMarginScaled(4),
    },
    statChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getPaddingScaled(10),
      paddingVertical: getPaddingScaled(6),
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      backgroundColor: networkStatus.isOnline ?
        theme.colors.success + '20' :
        theme.colors.error + '20',
      borderRadius: 6,
    },
  });

  return (
    <Card margin="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <ThemedText variant="subtitle" weight="semibold">
            Modo Offline
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
            Descarga todo el sistema para uso sin internet
          </ThemedText>
        </View>
        {dataInfo.version && (
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}>
            <ThemedText variant="caption" color="textSecondary">
              v{dataInfo.version}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Estado de la red */}
      <View style={styles.networkIndicator}>
        <Icon
          name={networkStatus.isOnline ? "wifi" : "wifi-off"}
          color={networkStatus.isOnline ? "success" : "error"}
          size="sm"
        />
        <ThemedText
          variant="caption"
          color={networkStatus.isOnline ? "success" : "error"}
          style={{ marginLeft: getPaddingScaled(6) }}
        >
          {networkStatus.isOnline ? 'Conectado a internet' : 'Sin conexión a internet'}
        </ThemedText>
      </View>

      {/* Estado de los datos offline */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: dataInfo.hasData ? theme.colors.success : theme.colors.border }
          ]}
        />
        <ThemedText variant="body">
          {dataInfo.hasData ? 'Datos offline disponibles' : 'Sin datos offline'}
        </ThemedText>
      </View>

      {dataInfo.hasData && (
        <>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: getMarginScaled(8),
            paddingVertical: getMarginScaled(8),
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}>
            <View>
              <ThemedText variant="caption" color="textSecondary">
                Última actualización:
              </ThemedText>
              <ThemedText variant="body" weight="semibold" style={{ marginTop: 2 }}>
                {formatLastUpdate(dataInfo.downloadedAt)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText variant="caption" color="textSecondary">
                Tamaño total:
              </ThemedText>
              <ThemedText variant="body" weight="semibold" color="primary" style={{ marginTop: 2 }}>
                {dataInfo.size}
              </ThemedText>
            </View>
          </View>

          {dataInfo.itemCounts && (
            <View style={styles.dataStatsContainer}>
              <View style={styles.statChip}>
                <Icon name="place" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.paradas} paradas
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="route" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.rutas} rutas
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="directions-bus" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.buses} buses
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="person" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.conductores} conductores
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="event" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.calendarios} horarios
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="assignment" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.asignaciones} servicios
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="warning" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.alertas} alertas
                </ThemedText>
              </View>
              <View style={styles.statChip}>
                <Icon name="location-city" size="xs" color="textSecondary" />
                <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                  {dataInfo.itemCounts.municipios} municipios
                </ThemedText>
              </View>
            </View>
          )}
        </>
      )}

      {/* Progreso de descarga mejorado */}
      {isDownloading && downloadProgress && (
        <View style={styles.progressContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText variant="body" weight="semibold">
              Descargando...
            </ThemedText>
            <ThemedText variant="caption" color="primary" weight="bold">
              {Math.round(downloadProgress.progress)}%
            </ThemedText>
          </View>

          <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 8 }}>
            {getCollectionDisplayName(downloadProgress.collection)} ({downloadProgress.current}/{downloadProgress.total})
          </ThemedText>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${downloadProgress.progress}%` }
              ]}
            />
          </View>

          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4, fontStyle: 'italic' }}>
            Por favor no cierres la aplicación
          </ThemedText>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {!dataInfo.hasData ? (
          <ThemedButton
            variant="primary"
            onPress={handleDownload}
            loading={isDownloading}
            disabled={!networkStatus.isOnline}
            style={styles.buttonFlex}
          >
            <Icon name="download" color="background" size="sm" />
            <ThemedText color="background" weight="semibold"> Descargar</ThemedText>
          </ThemedButton>
        ) : (
          <>
            <ThemedButton
              variant="outline"
              onPress={handleRefreshData}
              loading={isDownloading}
              disabled={!networkStatus.isOnline}
              style={styles.buttonFlex}
            >
              <Icon name="refresh" color="primary" size="sm" />
              <ThemedText color="primary"> Actualizar</ThemedText>
            </ThemedButton>
            <ThemedButton
              variant="outline"
              onPress={handleClearData}
              disabled={isDownloading}
              style={styles.buttonFlex}
            >
              <Icon name="delete" color="error" size="sm" />
              <ThemedText color="error"> Limpiar</ThemedText>
            </ThemedButton>
          </>
        )}
      </View>
    </Card>
  );
}