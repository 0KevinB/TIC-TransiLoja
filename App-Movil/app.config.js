// Opcional pero recomendado: Carga las variables de un archivo .env para desarrollo local
require('dotenv').config();

export default {
  expo: {
    name: 'TransiLoja',
    slug: 'transiloja',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'transiloja',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    notification: {
      icon: './assets/images/logo.png',
      color: '#3B82F6',
      iosDisplayInForeground: true,
      androidMode: 'default',
      androidCollapsedTitle: 'Alertas de Transporte',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Esta aplicación necesita acceso a tu ubicación para mostrarte paradas cercanas y calcular rutas de transporte público.',
        NSLocationAlwaysUsageDescription:
          'Esta aplicación necesita acceso a tu ubicación en segundo plano para rastrear el bus durante todo el servicio (solo para conductores).',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Esta aplicación necesita acceso a tu ubicación para mostrarte paradas cercanas, calcular rutas y rastrear buses en tiempo real.',
      },
      config: {
        // Aquí también usamos la variable de entorno
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo.png',
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
      ],
      config: {
        googleMaps: {
          // ¡Este es el cambio clave!
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      package: 'com.transiloja.app',
      versionCode: 1,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/logo.png',
    },
    plugins: [
      'expo-router',
      'expo-location',
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          image: './assets/images/completo splash.png',
          imageWidth: 300,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'cea6d837-92cb-4ffb-83d6-76c84ae6be1c',
      },
    },
  },
};
