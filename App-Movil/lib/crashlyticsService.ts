/**
 * Servicio de Firebase Crashlytics
 * Monitorea crashes y errores en tiempo real
 */

import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Wrapper para Firebase Crashlytics
 */
export class CrashlyticsService {
  private static instance: CrashlyticsService;

  private constructor() {}

  static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  /**
   * Habilitar/deshabilitar crash collection
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (error) {
      console.warn('Error configurando Crashlytics collection:', error);
    }
  }

  /**
   * Verificar si Crashlytics está habilitado
   */
  async isCrashlyticsCollectionEnabled(): Promise<boolean> {
    try {
      return await crashlytics().isCrashlyticsCollectionEnabled();
    } catch (error) {
      console.warn('Error verificando Crashlytics collection:', error);
      return false;
    }
  }

  /**
   * Registrar un error no fatal
   */
  recordError(error: Error, context?: string): void {
    try {
      if (context) {
        crashlytics().log(`Error context: ${context}`);
      }
      crashlytics().recordError(error);
    } catch (e) {
      console.warn('Error registrando error en Crashlytics:', e);
    }
  }

  /**
   * Registrar un log
   */
  log(message: string): void {
    try {
      crashlytics().log(message);
    } catch (error) {
      console.warn('Error registrando log en Crashlytics:', error);
    }
  }

  /**
   * Establecer ID de usuario
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await crashlytics().setUserId(userId);
    } catch (error) {
      console.warn('Error estableciendo user ID en Crashlytics:', error);
    }
  }

  /**
   * Establecer atributo personalizado
   */
  async setAttribute(key: string, value: string): Promise<void> {
    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.warn(`Error estableciendo atributo ${key} en Crashlytics:`, error);
    }
  }

  /**
   * Establecer múltiples atributos
   */
  async setAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      await crashlytics().setAttributes(attributes);
    } catch (error) {
      console.warn('Error estableciendo atributos en Crashlytics:', error);
    }
  }

  /**
   * Forzar un crash para pruebas (SOLO EN DESARROLLO)
   */
  crash(): void {
    if (__DEV__) {
      console.warn('⚠️  Forzando crash para pruebas...');
      crashlytics().crash();
    } else {
      console.warn('⚠️  crash() solo disponible en modo desarrollo');
    }
  }

  /**
   * Verificar si un crash ocurrió en la sesión anterior
   */
  async checkForUnsentReports(): Promise<boolean> {
    try {
      return await crashlytics().checkForUnsentReports();
    } catch (error) {
      console.warn('Error verificando reportes no enviados:', error);
      return false;
    }
  }

  /**
   * Enviar reportes no enviados
   */
  async sendUnsentReports(): Promise<void> {
    try {
      await crashlytics().sendUnsentReports();
    } catch (error) {
      console.warn('Error enviando reportes no enviados:', error);
    }
  }

  /**
   * Eliminar reportes no enviados
   */
  async deleteUnsentReports(): Promise<void> {
    try {
      await crashlytics().deleteUnsentReports();
    } catch (error) {
      console.warn('Error eliminando reportes no enviados:', error);
    }
  }

  /**
   * Establecer contexto de error personalizado
   */
  setCustomContext(context: {
    screen?: string;
    action?: string;
    userId?: string;
    deviceInfo?: Record<string, string>;
  }): void {
    try {
      if (context.screen) {
        this.log(`Current screen: ${context.screen}`);
        this.setAttribute('last_screen', context.screen);
      }
      if (context.action) {
        this.log(`User action: ${context.action}`);
        this.setAttribute('last_action', context.action);
      }
      if (context.userId) {
        this.setUserId(context.userId);
      }
      if (context.deviceInfo) {
        this.setAttributes(context.deviceInfo);
      }
    } catch (error) {
      console.warn('Error estableciendo contexto personalizado:', error);
    }
  }

  /**
   * Registrar error con información contextual completa
   */
  recordErrorWithContext(
    error: Error,
    context: {
      screen?: string;
      action?: string;
      additionalData?: Record<string, any>;
    }
  ): void {
    try {
      // Registrar contexto
      if (context.screen) {
        this.log(`Error on screen: ${context.screen}`);
      }
      if (context.action) {
        this.log(`Error during action: ${context.action}`);
      }
      if (context.additionalData) {
        this.log(`Additional data: ${JSON.stringify(context.additionalData)}`);
      }

      // Registrar error
      this.recordError(error, JSON.stringify(context));
    } catch (e) {
      console.warn('Error registrando error con contexto:', e);
    }
  }

  /**
   * Registrar evento de disponibilidad (uptime)
   */
  recordAvailabilityEvent(
    eventType: 'app_start' | 'app_background' | 'app_foreground' | 'app_crash' | 'network_error',
    success: boolean,
    duration?: number
  ): void {
    try {
      this.log(`Availability event: ${eventType} - Success: ${success}`);

      if (duration !== undefined) {
        this.log(`Duration: ${duration}ms`);
      }

      // Establecer atributos para análisis
      this.setAttribute(`last_${eventType}`, success ? 'success' : 'failure');

      if (!success) {
        // Si el evento falló, registrarlo como error no fatal
        const error = new Error(`Availability event failed: ${eventType}`);
        this.recordError(error, `Event: ${eventType}, Duration: ${duration}ms`);
      }
    } catch (error) {
      console.warn('Error registrando evento de disponibilidad:', error);
    }
  }

  /**
   * Monitorear disponibilidad de la app
   */
  async monitorAvailability(): Promise<{
    isEnabled: boolean;
    hasUnsentReports: boolean;
  }> {
    try {
      const isEnabled = await this.isCrashlyticsCollectionEnabled();
      const hasUnsentReports = await this.checkForUnsentReports();

      this.log(`Crashlytics monitoring: enabled=${isEnabled}, unsent=${hasUnsentReports}`);

      return { isEnabled, hasUnsentReports };
    } catch (error) {
      console.warn('Error monitoreando disponibilidad:', error);
      return { isEnabled: false, hasUnsentReports: false };
    }
  }
}

export default CrashlyticsService.getInstance();
