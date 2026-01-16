/**
 * Hook para obtener colores del tema actual, con soporte para configuración dinámica
 */

import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors } from '@/lib/types';

export function useThemeColor(
  props: { light?: string; dark?: string; 'high-contrast'?: string },
  colorName?: keyof ThemeColors
) {
  const { theme } = useTheme();
  
  // Si se especifica un color para el modo actual, usarlo
  const colorFromProps = props[theme.mode as keyof typeof props];
  
  if (colorFromProps) {
    return colorFromProps;
  }

  // Si se especifica un nombre de color del tema, usarlo
  if (colorName && theme.colors[colorName]) {
    return theme.colors[colorName];
  }

  // Fallback a colores legacy si existe el colorName
  if (colorName && typeof colorName === 'string') {
    const legacyColorName = colorName as keyof typeof Colors.light & keyof typeof Colors.dark;
    if (Colors.light[legacyColorName] && Colors.dark[legacyColorName]) {
      const legacyTheme = theme.mode === 'high-contrast' ? 'light' : theme.mode;
      return Colors[legacyTheme][legacyColorName];
    }
  }

  // Fallback final
  return theme.colors.text;
}

// Hook simplificado para acceder directamente a los colores del tema
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
}
