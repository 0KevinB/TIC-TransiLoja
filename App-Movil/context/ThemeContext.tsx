import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, ThemeColors } from '../lib/types';
import { useAppConfiguration } from '../hooks/useAppConfiguration';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: (mode: 'system' | 'light' | 'dark' | 'high-contrast') => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
  setMunicipalityColors: (colors: { primary: string; secondary: string; accent: string }) => void;
  syncWithUserProfile: (userProfile: any) => Promise<void>;
  appName: string;
  appLogo: string;
  isLoadingConfig: boolean;
  currentThemeMode: 'system' | 'light' | 'dark' | 'high-contrast';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Colores base del sistema con mejores contrastes WCAG AA
const lightColors: ThemeColors = {
  primary: '#1D4ED8', // Azul más intenso para mejor contraste
  secondary: '#2563EB',
  accent: '#3B82F6',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#111827', // Texto más oscuro para mejor contraste
  textSecondary: '#4B5563', // Gris más oscuro para legibilidad
  border: '#D1D5DB',
  error: '#DC2626', // Rojo más intenso
  warning: '#D97706', // Amarillo más oscuro
  success: '#059669', // Verde más intenso
};

const darkColors: ThemeColors = {
  primary: '#60A5FA', // Azul más claro para modo oscuro
  secondary: '#93C5FD',
  accent: '#DBEAFE',
  background: '#0F172A', // Fondo más oscuro
  surface: '#1E293B',
  text: '#F8FAFC', // Texto más claro
  textSecondary: '#CBD5E1', // Gris más claro para legibilidad
  border: '#334155',
  error: '#F87171',
  warning: '#FCD34D',
  success: '#6EE7B7',
};

const highContrastColors: ThemeColors = {
  primary: '#0000FF', // Azul puro para máximo contraste
  secondary: '#000000',
  accent: '#FF00FF', // Magenta para destacar
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#000000', // Negro para máximo contraste
  border: '#000000',
  error: '#CC0000', // Rojo más oscuro
  warning: '#FF6600', // Naranja para advertencias
  success: '#006600', // Verde más oscuro
};

const getThemeColors = (
  mode: 'light' | 'dark' | 'high-contrast', 
  municipalityColors?: { primary: string; secondary: string; accent: string },
  appColors?: { primary: string; secondary: string }
): ThemeColors => {
  let baseColors: ThemeColors;
  
  switch (mode) {
    case 'dark':
      baseColors = darkColors;
      break;
    case 'high-contrast':
      baseColors = highContrastColors;
      break;
    default:
      baseColors = lightColors;
  }

  // Prioridad: colores del municipio > colores de la app > colores base
  if (municipalityColors && mode !== 'high-contrast') {
    return {
      ...baseColors,
      primary: municipalityColors.primary,
      secondary: municipalityColors.secondary,
      accent: municipalityColors.accent,
    };
  } else if (appColors && mode !== 'high-contrast') {
    // Usar colores de la configuración de la app
    return {
      ...baseColors,
      primary: appColors.primary,
      secondary: appColors.secondary,
      accent: appColors.primary, // usar color primario como accent si no hay accent específico
    };
  }

  return baseColors;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [userThemeMode, setUserThemeMode] = useState<'system' | 'light' | 'dark' | 'high-contrast'>('system');
  const [fontScale, setFontScaleState] = useState<number>(1);
  const [municipalityColors, setMunicipalityColorsState] = useState<{ primary: string; secondary: string; accent: string } | undefined>();
  
  // Hook para cargar configuración desde la base de datos
  const { configuracion, isLoading: isLoadingConfig } = useAppConfiguration();

  // Determinar el modo de tema efectivo
  const effectiveThemeMode = userThemeMode === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : userThemeMode;

  // Cargar configuración guardada
  useEffect(() => {
    loadThemeSettings();
  }, []);

  // El tema del sistema se maneja automáticamente a través de effectiveThemeMode

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      const savedFontScale = await AsyncStorage.getItem('font_scale');
      const savedMunicipalityColors = await AsyncStorage.getItem('municipality_colors');

      if (savedTheme) {
        setUserThemeMode(savedTheme as 'system' | 'light' | 'dark' | 'high-contrast');
      }
      if (savedFontScale) {
        setFontScaleState(parseFloat(savedFontScale));
      }
      if (savedMunicipalityColors) {
        setMunicipalityColorsState(JSON.parse(savedMunicipalityColors));
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const toggleTheme = async (mode: 'system' | 'light' | 'dark' | 'high-contrast') => {
    setUserThemeMode(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const setFontScale = async (scale: number) => {
    setFontScaleState(scale);
    try {
      await AsyncStorage.setItem('font_scale', scale.toString());
    } catch (error) {
      console.error('Error saving font scale:', error);
    }
  };

  const setMunicipalityColors = async (colors: { primary: string; secondary: string; accent: string }) => {
    setMunicipalityColorsState(colors);
    try {
      await AsyncStorage.setItem('municipality_colors', JSON.stringify(colors));
    } catch (error) {
      console.error('Error saving municipality colors:', error);
    }
  };

  const syncWithUserProfile = async (userProfile: any) => {
    if (userProfile?.preferences) {
      const { theme: userTheme, fontScale: userFontScale } = userProfile.preferences;
      
      if (userTheme) {
        setUserThemeMode(userTheme);
        try {
          await AsyncStorage.setItem('theme_mode', userTheme);
        } catch (error) {
          console.error('Error syncing theme to AsyncStorage:', error);
        }
      }
      
      if (userFontScale && typeof userFontScale === 'number') {
        setFontScaleState(userFontScale);
        try {
          await AsyncStorage.setItem('font_scale', userFontScale.toString());
        } catch (error) {
          console.error('Error syncing font scale to AsyncStorage:', error);
        }
      }
    }
  };

  // Preparar colores de la configuración de la app
  const appColors = configuracion ? {
    primary: configuracion.color_primario,
    secondary: configuracion.color_secundario,
  } : undefined;

  const theme: AppTheme = {
    mode: effectiveThemeMode,
    colors: getThemeColors(effectiveThemeMode, municipalityColors, appColors),
    fontScale,
    municipalityColors,
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setFontScale,
      setMunicipalityColors,
      syncWithUserProfile,
      appName: configuracion?.nombre_app || "TransiLoja",
      appLogo: configuracion?.logo_url || "",
      isLoadingConfig,
      currentThemeMode: userThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};