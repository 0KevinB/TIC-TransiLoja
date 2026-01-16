import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { ThemedView } from '@/components/ui/ThemedView';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

export default function ServicioScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();

  const serviceOptions: ServiceOption[] = [
    {
      id: 'horarios',
      title: 'Horarios de Operación',
      description: 'Consulta los horarios del sistema de transporte',
      icon: 'time',
      route: '/horarios',
      color: '#06B6D4',
    },
    {
      id: 'buses',
      title: 'Flota de Buses',
      description: 'Consulta la información de todos los buses',
      icon: 'bus',
      route: '/buses',
      color: theme.colors.primary,
    },
    {
      id: 'conductores',
      title: 'Conductores',
      description: 'Directorio de conductores del sistema',
      icon: 'people',
      route: '/conductores',
      color: theme.colors.accent,
    },
    {
      id: 'asignaciones',
      title: 'Programación de Servicio',
      description: 'Horarios y asignaciones de buses y conductores',
      icon: 'calendar',
      route: '/asignaciones',
      color: '#f59e0b',
    },
    {
      id: 'gps-tracking',
      title: 'Control GPS (Conductores)',
      description: 'Inicia y controla el rastreo GPS en tiempo real',
      icon: 'navigate-circle',
      route: '/conductor-tracking',
      color: '#10B981',
    },
    {
      id: 'simulador-bus',
      title: 'Simulador de Bus',
      description: 'Simula el movimiento de un bus en una ruta',
      icon: 'git-network',
      route: '/simulador-bus',
      color: '#8B5CF6',
    },
  ];

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header */}
      <PageHeader
        title="Servicio"
        subtitle="Accede a la información operativa del sistema"
      />

      <ScrollView contentContainerStyle={[styles.content, tabBarPadding]}>
        {serviceOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => handlePress(option.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Icon
                name={option.icon}
                library="ionicons"
                size={32}
                color={option.color}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                {option.title}
              </Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                {option.description}
              </Text>
            </View>

            <Icon
              name="chevron-forward"
              library="ionicons"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Icon name="information-circle" library="ionicons" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Esta sección te permite consultar y gestionar toda la información relacionada con el servicio de transporte público.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoSection: {
    marginTop: 24,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
