/**
 * Inicialización de servicios nativos de Firebase
 * Performance Monitoring y Crashlytics para React Native
 */

import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import perf from '@react-native-firebase/perf';

/**
 * Inicializar Firebase Performance y Crashlytics
 * Llamar esta función al inicio de la app
 */
export async function initializeFirebaseMonitoring() {
  try {
    console.log('🔥 Inicializando Firebase Monitoring...');

    // Habilitar Performance Monitoring
    await perf().setPerformanceCollectionEnabled(true);
    console.log('✅ Firebase Performance habilitado');

    // Habilitar Crashlytics
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    console.log('✅ Firebase Crashlytics habilitado');

    // Log de inicio de app
    crashlytics().log('App iniciada exitosamente');
    crashlytics().log(`Platform: ${Platform.OS}`);
    crashlytics().log(`Version: ${Platform.Version}`);

    // Atributos iniciales
    await crashlytics().setAttributes({
      platform: Platform.OS,
      platform_version: String(Platform.Version),
      app_version: '1.0.0',
      environment: __DEV__ ? 'development' : 'production',
    });

    // Verificar estado
    const perfEnabled = await perf().isPerformanceCollectionEnabled();
    const crashEnabled = await crashlytics().isCrashlyticsCollectionEnabled();

    console.log(`📊 Performance Monitoring: ${perfEnabled ? 'Activo' : 'Inactivo'}`);
    console.log(`🛡️ Crashlytics: ${crashEnabled ? 'Activo' : 'Inactivo'}`);

    return { perfEnabled, crashEnabled };

  } catch (error) {
    console.error('❌ Error inicializando Firebase Monitoring:', error);
    return { perfEnabled: false, crashEnabled: false };
  }
}

/**
 * Verificar estado de Firebase Monitoring
 */
export async function checkFirebaseMonitoringStatus() {
  try {
    const perfEnabled = await perf().isPerformanceCollectionEnabled();
    const crashEnabled = await crashlytics().isCrashlyticsCollectionEnabled();
    const hasUnsentReports = await crashlytics().checkForUnsentReports();

    return {
      performance: {
        enabled: perfEnabled,
        status: perfEnabled ? 'active' : 'inactive',
      },
      crashlytics: {
        enabled: crashEnabled,
        status: crashEnabled ? 'active' : 'inactive',
        hasUnsentReports,
      },
    };
  } catch (error) {
    console.error('Error verificando estado de Firebase:', error);
    return {
      performance: { enabled: false, status: 'error' },
      crashlytics: { enabled: false, status: 'error', hasUnsentReports: false },
    };
  }
}

/**
 * Habilitar modo debug de Performance (solo desarrollo)
 * Permite ver datos inmediatamente en Firebase Console
 */
export function enablePerformanceDebugMode() {
  if (__DEV__) {
    console.log('🔧 Modo debug de Performance habilitado');
    console.log('Para Android, ejecuta:');
    console.log('adb shell setprop debug.firebase.analytics.app <your-package-name>');
    console.log('adb shell setprop log.tag.FirebasePerformance DEBUG');
  }
}

// Re-exportar para uso directo
export { crashlytics, perf };

// Exportar instancias de servicios
export { default as PerformanceService } from './performanceService';
export { default as CrashlyticsService } from './crashlyticsService';
