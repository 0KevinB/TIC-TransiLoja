import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

// Ignorar TODAS las alertas visuales en desarrollo
LogBox.ignoreAllLogs(true);

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { TransportProvider } from '../context/TransportContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UserPreferencesSync } from '../components/UserPreferencesSync';
import { NotificationManager } from '../components/NotificationManager';
import { CacheManager } from '../components/CacheManager';

// Componente interno que tiene acceso al tema
function AppContent() {
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  
  // Crear tema de navegación personalizado basado en nuestro tema
  const navigationTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserPreferencesSync />
        <NotificationManager />
        <CacheManager />
        <FavoritesProvider>
          <ErrorBoundary>
            <TransportProvider>
              <NavigationThemeProvider value={navigationTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/index" options={{ headerShown: false }} />
                <Stack.Screen name="map" options={{ headerShown: false }} />
                <Stack.Screen name="routes-list" options={{ headerShown: false }} />
                <Stack.Screen name="horarios" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar
                style={theme.mode === 'dark' ? 'light' : 'dark'}
              />
            </NavigationThemeProvider>
          </TransportProvider>
        </ErrorBoundary>
      </FavoritesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
