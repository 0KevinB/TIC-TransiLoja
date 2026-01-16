import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detecta si la app está corriendo en Expo Go
 */
export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Detecta si la app está corriendo en un development build
 */
export const isDevelopmentBuild = (): boolean => {
  return Constants.appOwnership === 'standalone' && __DEV__;
};

/**
 * Detecta si la app está corriendo en producción
 */
export const isProduction = (): boolean => {
  return !__DEV__ && Constants.appOwnership === 'standalone';
};

/**
 * Determina si se debe usar Google Maps nativo
 * Solo funciona en development builds y producción, no en Expo Go
 */
export const shouldUseGoogleMaps = (): boolean => {
  // No usar Google Maps en Expo Go
  if (isExpoGo()) {
    return false;
  }
  
  // Usar Google Maps en development builds y producción
  return isDevelopmentBuild() || isProduction();
};

/**
 * Determina qué tipo de mapa usar basado en el entorno
 */
export const getMapProvider = (): 'google' | 'leaflet' => {
  return shouldUseGoogleMaps() ? 'google' : 'leaflet';
};