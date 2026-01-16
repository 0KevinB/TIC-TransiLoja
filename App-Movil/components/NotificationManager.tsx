import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Componente que gestiona las notificaciones push
 * Se encarga de:
 * 1. Obtener el token de notificaciones push
 * 2. Guardarlo en Firebase cuando el usuario está autenticado
 * 3. Manejar navegación cuando el usuario toca una notificación
 */
export const NotificationManager = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const { expoPushToken, notification } = useNotifications({
    userId: user?.uid,
    onNotificationReceived: (notification) => {
      console.log('📬 Notificación recibida:', notification.titulo);
    },
    onNotificationTapped: (notification) => {
      console.log('👆 Usuario tocó notificación:', notification.titulo);

      // Navegar según el tipo de notificación
      if (notification.alerta_id) {
        // TODO: Implementar navegación a detalle de alerta
        console.log('Navegar a alerta:', notification.alerta_id);
      } else if (notification.ruta_id) {
        // TODO: Implementar navegación a detalle de ruta
        console.log('Navegar a ruta:', notification.ruta_id);
      } else if (notification.parada_id) {
        // TODO: Implementar navegación a detalle de parada
        console.log('Navegar a parada:', notification.parada_id);
      }
    },
  });

  useEffect(() => {
    // El token ya se guarda automáticamente en el hook useNotifications
    // Solo loggeamos para debugging
    if (isAuthenticated && expoPushToken) {
      console.log('✅ Token de notificaciones registrado:', expoPushToken);
    }
  }, [isAuthenticated, expoPushToken]);

  // Este componente no renderiza nada
  return null;
};
