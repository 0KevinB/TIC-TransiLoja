import { AccessibilityInfo, Platform } from 'react-native'

/**
 * Utilidades para mejorar la accesibilidad en la aplicación móvil
 */

/**
 * Verifica si un lector de pantalla está activo
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled()
  } catch (error) {
    console.error('Error checking screen reader status:', error)
    return false
  }
}

/**
 * Anuncia un mensaje para lectores de pantalla
 */
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message)
}

/**
 * Verifica si la animación reducida está habilitada
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled()
  } catch (error) {
    console.error('Error checking reduce motion status:', error)
    return false
  }
}

/**
 * Obtiene el tamaño mínimo recomendado para elementos táctiles
 */
export const getMinimumTouchTargetSize = (): number => {
  return Platform.select({
    ios: 44, // Apple HIG
    android: 48, // Material Design
    default: 44,
  })
}

/**
 * Genera una etiqueta de accesibilidad descriptiva para una ruta
 */
export const getRouteAccessibilityLabel = (
  routeNumber: string,
  routeName: string,
  stopsCount: number
): string => {
  return `Ruta ${routeNumber}, ${routeName}, ${stopsCount} paradas`
}

/**
 * Genera una etiqueta de accesibilidad para un bus en tiempo real
 */
export const getBusAccessibilityLabel = (
  busNumber: string,
  routeName: string,
  arrivalMinutes: number
): string => {
  if (arrivalMinutes === 0) {
    return `Bus ${busNumber} de ${routeName} está llegando ahora`
  } else if (arrivalMinutes === 1) {
    return `Bus ${busNumber} de ${routeName} llegará en 1 minuto`
  } else {
    return `Bus ${busNumber} de ${routeName} llegará en ${arrivalMinutes} minutos`
  }
}

/**
 * Genera hint de accesibilidad para acciones comunes
 */
export const getAccessibilityHint = (action: 'tap' | 'doubleTap' | 'swipe'): string => {
  switch (action) {
    case 'tap':
      return 'Toca para seleccionar'
    case 'doubleTap':
      return 'Toca dos veces para activar'
    case 'swipe':
      return 'Desliza para ver más opciones'
    default:
      return ''
  }
}

/**
 * Formatea tiempo de llegada para lectores de pantalla
 */
export const formatArrivalTimeForAccessibility = (minutes: number): string => {
  if (minutes === 0) return 'Llegando ahora'
  if (minutes === 1) return 'Llega en 1 minuto'
  if (minutes < 60) return `Llega en ${minutes} minutos`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1 ? 'Llega en 1 hora' : `Llega en ${hours} horas`
  }

  return `Llega en ${hours} hora${hours > 1 ? 's' : ''} y ${remainingMinutes} minutos`
}

/**
 * Valida que un componente tenga las propiedades de accesibilidad mínimas
 */
export const validateAccessibility = (component: {
  accessibilityLabel?: string
  accessibilityRole?: string
  accessible?: boolean
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!component.accessibilityLabel) {
    errors.push('Missing accessibilityLabel')
  }

  if (!component.accessibilityRole) {
    errors.push('Missing accessibilityRole')
  }

  if (component.accessible === false && !component.accessibilityLabel) {
    errors.push('Component marked as not accessible without label')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Hook de utilidad para manejar focus de accesibilidad
 */
export const setAccessibilityFocus = (ref: any): void => {
  if (ref && ref.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current)
  }
}
