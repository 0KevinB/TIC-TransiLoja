import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PROMPT_SHOWN = '@notification_prompt_shown';

interface NotificationPermissionPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

/**
 * Componente que muestra un prompt amigable para solicitar permisos de notificación
 * Se muestra una sola vez al iniciar la app por primera vez
 */
export default function NotificationPermissionPrompt({
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionPromptProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAndShowPrompt();
  }, []);

  const checkAndShowPrompt = async () => {
    try {
      // Verificar si ya se mostró el prompt
      const promptShown = await AsyncStorage.getItem(STORAGE_KEY_PROMPT_SHOWN);
      if (promptShown === 'true') {
        return;
      }

      // Verificar si ya tiene permisos
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        await AsyncStorage.setItem(STORAGE_KEY_PROMPT_SHOWN, 'true');
        return;
      }

      // Mostrar el prompt si no tiene permisos y no se mostró antes
      if (status === 'undetermined') {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        Alert.alert(
          '✅ Notificaciones activadas',
          'Recibirás alertas importantes sobre el transporte público',
          [{ text: 'Entendido', onPress: () => setVisible(false) }]
        );
        await AsyncStorage.setItem(STORAGE_KEY_PROMPT_SHOWN, 'true');
        onPermissionGranted?.();
      } else {
        // Usuario denegó permisos
        Alert.alert(
          '⚠️ Permisos denegados',
          'No recibirás notificaciones sobre alertas, retrasos y actualizaciones del transporte. Puedes activarlas más tarde en la configuración.',
          [
            {
              text: 'Configuración',
              onPress: () => {
                Linking.openSettings();
                setVisible(false);
              },
            },
            {
              text: 'Cerrar',
              onPress: () => setVisible(false),
              style: 'cancel',
            },
          ]
        );
        await AsyncStorage.setItem(STORAGE_KEY_PROMPT_SHOWN, 'true');
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      Alert.alert('Error', 'No se pudieron solicitar los permisos');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      '⚠️ ¿Saltar este paso?',
      'Sin notificaciones no recibirás alertas importantes sobre el transporte. Puedes activarlas más tarde en la configuración.',
      [
        {
          text: 'Activar ahora',
          onPress: handleRequestPermission,
        },
        {
          text: 'Saltar',
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEY_PROMPT_SHOWN, 'true');
            setVisible(false);
            onPermissionDenied?.();
          },
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={64} color="#3B82F6" />
          </View>

          <Text style={styles.title}>Mantente informado</Text>

          <Text style={styles.description}>
            Recibe notificaciones sobre:
          </Text>

          <View style={styles.featuresList}>
            <FeatureItem
              icon="alert-circle-outline"
              text="Alertas de tráfico y cierres de vías"
            />
            <FeatureItem
              icon="time-outline"
              text="Retrasos y cambios en los horarios"
            />
            <FeatureItem
              icon="bus-outline"
              text="Actualizaciones de tus rutas favoritas"
            />
            <FeatureItem
              icon="information-circle-outline"
              text="Avisos importantes del servicio"
            />
          </View>

          <Text style={styles.privacyNote}>
            💡 Puedes cambiar estas preferencias en cualquier momento desde la configuración
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRequestPermission}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Activando...' : '🔔 Activar notificaciones'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color="#10B981" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  privacyNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
