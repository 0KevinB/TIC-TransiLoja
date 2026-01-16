import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NotificacionPush } from '../lib/types';

const STORAGE_KEY_TOKEN = '@notification_token';
const STORAGE_KEY_REGISTERED = '@notification_registered';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface UseNotificationsProps {
  userId?: string; // ID del usuario de Firebase
  onNotificationReceived?: (notification: NotificacionPush) => void;
  onNotificationTapped?: (notification: NotificacionPush) => void;
}

export const useNotifications = (props?: UseNotificationsProps) => {
  const { userId, onNotificationReceived, onNotificationTapped } = props || {};

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notifications, setNotifications] = useState<NotificacionPush[]>([]);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // IMPORTANTE: Registrar SIEMPRE para notificaciones push
    // Incluso usuarios anónimos deben recibir alertas públicas
    const initializeNotifications = async () => {
      try {
        console.log('🔔 Inicializando notificaciones...', { userId: userId || 'anónimo' });
        const token = await registerForPushNotificationsAsync(userId);
        if (token) {
          setExpoPushToken(token);
          console.log('✅ Notificaciones inicializadas correctamente');
          console.log('📱 Token:', token.substring(0, 20) + '...');
        } else {
          // Solo mostrar advertencias si es un dispositivo real
          if (Device.isDevice) {
            console.warn('⚠️ No se pudo obtener token de notificación');
            console.warn('⚠️ Posibles causas:');
            console.warn('  - Permisos denegados');
            console.warn('  - Error de configuración de Expo');
          } else {
            // En Expo Go/emulador, esto es esperado, no mostrar alertas
            console.log('ℹ️ Notificaciones no disponibles en emulador (esto es normal)');
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
      }
    };

    initializeNotifications();

    // Listener para cuando se recibe una notificación
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('📬 Notificación recibida:', notification);

      // Parsear y guardar notificación
      const parsed = parseNotificationData(notification);
      if (parsed) {
        setNotifications(prev => [parsed, ...prev]);
        if (onNotificationReceived) {
          onNotificationReceived(parsed);
        }
      }
    });

    // Listener para cuando el usuario interactúa con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó la notificación:', response);
      const parsed = parseNotificationData(response.notification);

      if (parsed && onNotificationTapped) {
        onNotificationTapped(parsed);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }

      // Limpiar token al desmontar
      if (expoPushToken && userId) {
        removeTokenFromFirestore(userId, expoPushToken);
      }
    };
  }, [userId]);

  /**
   * Enviar una notificación local de prueba
   */
  const sendLocalNotification = async (data: NotificationData) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
        sound: true,
      },
      trigger: null, // null significa enviar inmediatamente
    });
  };

  /**
   * Marcar notificación como leída
   */
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id_notificacion === notificationId ? { ...n, read: true } : n
      )
    );
  };

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Notifications.setBadgeCountAsync(0);
  };

  /**
   * Limpiar todas las notificaciones
   */
  const clearAllNotifications = () => {
    setNotifications([]);
    Notifications.setBadgeCountAsync(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    expoPushToken,
    notification,
    notifications,
    unreadCount,
    sendLocalNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  };
};

/**
 * Parsea los datos de una notificación a NotificacionPush
 */
function parseNotificationData(notification: Notifications.Notification): NotificacionPush | null {
  try {
    const { request } = notification;
    const { content } = request;
    const { title, body, data } = content;

    if (!title || !body) {
      return null;
    }

    return {
      id_notificacion: request.identifier,
      titulo: title,
      cuerpo: body,
      tipo: (data?.tipo as any) || 'info',
      datos: data,
      alerta_id: data?.alerta_id,
      ruta_id: data?.ruta_id,
      parada_id: data?.parada_id,
      imagen_url: data?.imagen_url,
      icono: data?.icono,
      read: false,
      received_at: new Date(),
    };
  } catch (error) {
    console.error('Error parseando notificación:', error);
    return null;
  }
}

/**
 * Guarda el token en Firestore
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db(), 'users', userId);
    await updateDoc(userRef, {
      notification_tokens: arrayUnion(token),
      ultima_actividad: Date.now(),
    });
    console.log('✅ Token guardado en Firestore');
  } catch (error) {
    console.error('❌ Error guardando token:', error);
  }
}

/**
 * Guarda el token de un dispositivo anónimo en Firestore
 * MEJORADO: Incluye timestamp y mejor manejo de errores
 */
async function saveAnonymousTokenToFirestore(token: string): Promise<void> {
  try {
    const { setDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
    const tokenRef = doc(db(), 'device_tokens', token);

    // Verificar si ya existe el token
    const tokenDoc = await getDoc(tokenRef);
    const isNewToken = !tokenDoc.exists();

    const tokenData = {
      token,
      platform: Platform.OS,
      device_info: {
        isDevice: Device.isDevice,
        modelName: Device.modelName || 'Unknown',
        osName: Device.osName || Platform.OS,
        osVersion: Device.osVersion || 'Unknown',
      },
      last_active: serverTimestamp(),
      is_anonymous: true,
      // Mantener created_at si ya existe
      ...(isNewToken && { created_at: serverTimestamp() }),
    };

    await setDoc(tokenRef, tokenData, { merge: true });

    if (isNewToken) {
      console.log('✅ Token anónimo guardado en Firestore (nuevo)');
    } else {
      console.log('✅ Token anónimo actualizado en Firestore (existente)');
    }
  } catch (error) {
    console.error('❌ Error guardando token anónimo:', error);
    console.error('❌ Detalles:', error);
    // No lanzar error para no bloquear la app
  }
}

/**
 * Remueve el token de Firestore
 */
async function removeTokenFromFirestore(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db(), 'users', userId);
    await updateDoc(userRef, {
      notification_tokens: arrayRemove(token),
    });
    console.log('✅ Token removido de Firestore');
  } catch (error) {
    console.error('❌ Error removiendo token:', error);
  }
}

/**
 * Registrar el dispositivo para recibir notificaciones push
 * Con persistencia y reintentos automáticos
 */
async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  console.log('🔑 Iniciando registro de notificaciones push...');
  console.log('🆔 UserId:', userId || 'anónimo');

  // Verificar si ya se registró previamente
  try {
    const savedToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
    const isRegistered = await AsyncStorage.getItem(STORAGE_KEY_REGISTERED);

    if (savedToken && isRegistered === 'true') {
      console.log('📱 Token ya existe en AsyncStorage:', savedToken.substring(0, 20) + '...');

      // Re-guardar en Firestore para actualizar last_active
      if (userId) {
        await saveTokenToFirestore(userId, savedToken);
      } else {
        await saveAnonymousTokenToFirestore(savedToken);
      }

      return savedToken;
    } else {
      console.log('📱 No hay token guardado, generando nuevo...');
    }
  } catch (error) {
    console.error('Error leyendo token guardado:', error);
  }

  if (Platform.OS === 'android') {
    // Canales de notificación para Android
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones Generales',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('alertas', {
      name: 'Alertas de Transporte',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('actualizaciones', {
      name: 'Actualizaciones de Rutas',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#0000FF',
    });
  }

  if (Device.isDevice) {
    console.log('✅ Dispositivo físico detectado');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('📋 Estado actual de permisos:', existingStatus);

    if (existingStatus !== 'granted') {
      console.log('🔔 Solicitando permisos de notificación al usuario...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Resultado de solicitud:', status);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permisos de notificación denegados por el usuario');
      console.warn('⚠️ No se podrán recibir notificaciones push');
      // Guardar estado para no volver a pedir
      await AsyncStorage.setItem(STORAGE_KEY_REGISTERED, 'denied');
      return null;
    } else {
      console.log('✅ Permisos de notificación concedidos');
    }

    try {
      // Obtener el token de Expo Push
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      console.log('🔍 Buscando Project ID...');
      console.log('  expoConfig?.extra?.eas?.projectId:', Constants.expoConfig?.extra?.eas?.projectId);
      console.log('  easConfig?.projectId:', Constants.easConfig?.projectId);

      if (!projectId) {
        console.error('❌ Project ID no encontrado en la configuración de Expo');
        console.error('❌ Verifica que app.config.js tenga configurado extra.eas.projectId');
        return null;
      }

      console.log('✅ Project ID encontrado:', projectId);
      console.log('🔄 Obteniendo token de Expo...');

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('✅ Expo Push Token obtenido exitosamente');
      console.log('🔑 Token:', token);

      // Guardar token en Firestore
      if (token) {
        console.log('💾 Guardando token en Firestore...');
        const saveSuccess = await (async () => {
          try {
            if (userId) {
              // Usuario autenticado: guardar en su documento de usuario
              console.log('👤 Guardando para usuario autenticado:', userId);
              await saveTokenToFirestore(userId, token!);
              console.log('✅ Token guardado en colección "users"');
            } else {
              // Usuario anónimo: guardar en colección device_tokens
              console.log('👻 Guardando para usuario anónimo');
              await saveAnonymousTokenToFirestore(token!);
              console.log('✅ Token guardado en colección "device_tokens"');
            }
            return true;
          } catch (error) {
            console.error('❌ Error guardando token en Firestore:', error);
            console.error('❌ Detalles del error:', error);
            return false;
          }
        })();

        // Persistir token localmente SIEMPRE (incluso si Firestore falla)
        // Esto permite reintentos posteriores
        try {
          await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
          await AsyncStorage.setItem(STORAGE_KEY_REGISTERED, saveSuccess ? 'true' : 'partial');
          console.log('💾 Token persistido en AsyncStorage');
        } catch (storageError) {
          console.error('❌ Error guardando en AsyncStorage:', storageError);
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo Expo Push Token:', error);
      console.error('❌ Stack:', (error as Error)?.stack);
      // No lanzar error, solo registrar
    }
  } else {
    // En Expo Go/emulador, esto es esperado, no mostrar advertencias molestas
    console.log('ℹ️ Ejecutando en emulador - notificaciones deshabilitadas');
  }

  return token;
}
