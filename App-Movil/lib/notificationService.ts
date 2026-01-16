import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import type { NotificacionPush } from './types';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra el dispositivo para recibir notificaciones push
 * @param userId ID del usuario de Firebase (opcional para usuarios anónimos)
 * @returns Token de notificación o null si falla
 */
export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  let token: string | null = null;

  // Verificar que sea un dispositivo físico
  if (!Device.isDevice) {
    console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
    return null;
  }

  try {
    // Validar que el projectId esté configurado
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      console.error('❌ ERROR CRÍTICO: EXPO_PUBLIC_PROJECT_ID no está configurado en .env');
      console.error('Por favor agrega: EXPO_PUBLIC_PROJECT_ID=cea6d837-92cb-4ffb-83d6-76c84ae6be1c');
      return null;
    }

    console.log('📱 Iniciando registro de notificaciones push...');
    console.log('👤 Usuario:', userId || 'Anónimo');
    console.log('🔑 Project ID:', projectId);

    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('🔐 Estado de permisos actual:', existingStatus);

    if (existingStatus !== 'granted') {
      console.log('🔔 Solicitando permisos de notificación...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 Resultado de solicitud:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permisos de notificaciones no concedidos');
      return null;
    }

    // Obtener token
    console.log('🎫 Obteniendo token de Expo Push...');
    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;

    console.log('✅ Token de notificación obtenido exitosamente:', token);

    // Configuración específica de Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alertas de Transporte',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('alertas', {
        name: 'Alertas Críticas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF0000',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('actualizaciones', {
        name: 'Actualizaciones de Servicio',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#0000FF',
      });
    }

    // Guardar token en Firestore
    if (token) {
      console.log('💾 Guardando token en Firestore...');
      if (userId) {
        // Usuario autenticado: guardar en su documento de usuario
        console.log('💾 Guardando en colección users para usuario:', userId);
        await saveTokenToFirestore(userId, token);
      } else {
        // Usuario anónimo: guardar en colección device_tokens
        console.log('💾 Guardando en colección device_tokens (anónimo)');
        await saveAnonymousTokenToFirestore(token);
      }
      console.log('✅ Registro de notificaciones completado exitosamente');
    }

    return token;
  } catch (error) {
    console.error('❌ Error crítico registrando notificaciones push:', error);
    console.error('Detalles del error:', JSON.stringify(error, null, 2));
    return null;
  }
}

/**
 * Guarda el token de notificación en Firestore
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db(), 'users', userId);
    await updateDoc(userRef, {
      notification_tokens: arrayUnion(token),
      ultima_actividad: Date.now(),
    });
    console.log('✅ Token guardado exitosamente en users/' + userId);
  } catch (error) {
    console.error('❌ Error guardando token en Firestore para usuario ' + userId + ':', error);
    throw error;
  }
}

/**
 * Guarda el token de un dispositivo anónimo en Firestore
 */
async function saveAnonymousTokenToFirestore(token: string): Promise<void> {
  try {
    const { setDoc, serverTimestamp } = await import('firebase/firestore');
    const tokenRef = doc(db(), 'device_tokens', token);
    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      device_info: {
        isDevice: Device.isDevice,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      },
      created_at: serverTimestamp(),
      last_active: serverTimestamp(),
      is_anonymous: true,
    }, { merge: true });
    console.log('✅ Token anónimo guardado exitosamente en device_tokens/' + token.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Error guardando token anónimo en Firestore:', error);
    throw error;
  }
}

/**
 * Remueve el token de notificación de Firestore
 */
export async function removeTokenFromFirestore(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db(), 'users', userId);
    await updateDoc(userRef, {
      notification_tokens: arrayRemove(token),
    });
    console.log('Token removido de Firestore');
  } catch (error) {
    console.error('Error removiendo token de Firestore:', error);
  }
}

/**
 * Maneja notificaciones recibidas cuando la app está en primer plano
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Maneja cuando el usuario toca una notificación
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Programa una notificación local
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = inmediato
    });
    return id;
  } catch (error) {
    console.error('Error programando notificación local:', error);
    throw error;
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Obtiene el badge count actual
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Establece el badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Parsea los datos de una notificación push a NotificacionPush
 */
export function parseNotificationData(
  notification: Notifications.Notification
): NotificacionPush | null {
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
    console.error('Error parseando datos de notificación:', error);
    return null;
  }
}

/**
 * Solicita permisos de notificación explícitamente
 */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Verifica si los permisos están concedidos
 */
export async function checkPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Maneja deep linking desde notificaciones
 */
export function handleNotificationNavigation(
  data: any,
  navigation: any
): void {
  try {
    if (data?.alerta_id) {
      // Navegar a la pantalla de alertas con el ID específico
      navigation.navigate('Alerts', { alertId: data.alerta_id });
    } else if (data?.ruta_id) {
      // Navegar a la pantalla de rutas con el ID específico
      navigation.navigate('Routes', { routeId: data.ruta_id });
    } else if (data?.parada_id) {
      // Navegar a la pantalla de paradas con el ID específico
      navigation.navigate('Stops', { stopId: data.parada_id });
    } else if (data?.screen) {
      // Navegación personalizada
      navigation.navigate(data.screen, data.params || {});
    }
  } catch (error) {
    console.error('Error navegando desde notificación:', error);
  }
}
