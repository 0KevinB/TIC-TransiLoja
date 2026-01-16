import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Dimensions, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTabButton } from '@/components/AnimatedTabButton';
import { Icon } from '@/components/ui/Icon';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { useTransport } from '../../context/TransportContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { getScaledSize, getMinTouchTarget, isLargeText } = useAccessibleFont();
  const { getUnviewedAlertsCount } = useTransport();

  const unviewedAlertsCount = getUnviewedAlertsCount();
  const isConductor = userProfile?.role === 'conductor';

  // Obtener dimensiones de pantalla para detectar gestos home
  const screenHeight = Dimensions.get('window').height;
  const hasHomeIndicator = Platform.OS === 'ios' && screenHeight >= 812;

  // Calcular altura de tab bar adaptativa
  const getTabBarHeight = () => {
    const baseHeight = isLargeText ? 75 : 65;
    // Incluir el inset bottom para iOS con home indicator
    return baseHeight + insets.bottom;
  };

  const tabBarHeight = getTabBarHeight();
  const minTouchTarget = getMinTouchTarget();
  const scaledFontSize = getScaledSize(11);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        tabBarButton: AnimatedTabButton,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: scaledFontSize,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 2 : 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: isLargeText ? 12 : 8,
          paddingBottom: Platform.OS === 'ios' ? 0 : 8, // Sin padding inferior en iOS
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          minHeight: minTouchTarget,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 26, justifyContent: 'center', alignItems: 'center' }}>
              <Icon
                name={focused ? "home" : "home-outline"}
                library="ionicons"
                size={focused ? 26 : 24}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 26, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Icon
                  name={focused ? "notifications" : "notifications-outline"}
                  library="ionicons"
                  size={focused ? 26 : 24}
                  color={focused ? theme.colors.primary : theme.colors.textSecondary}
                />
                {unviewedAlertsCount > 0 && (
                  <View style={badgeStyles.badge}>
                    <Text style={badgeStyles.badgeText}>
                      {unviewedAlertsCount > 9 ? '9+' : unviewedAlertsCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="servicio"
        options={{
          title: 'Servicio',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 26, justifyContent: 'center', alignItems: 'center' }}>
              <Icon
                name={focused ? "briefcase" : "briefcase-outline"}
                library="ionicons"
                size={focused ? 26 : 24}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ height: 26, justifyContent: 'center', alignItems: 'center' }}>
              <Icon
                name={focused ? "heart" : "heart-outline"}
                library="ionicons"
                size={focused ? 26 : 24}
                color={focused ? theme.colors.accent : theme.colors.textSecondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="my-buses"
        options={{
          href: null, // Oculto, accesible desde Ajustes
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});