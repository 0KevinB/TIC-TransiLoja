import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { ThemeSelector } from './ui/ThemeSelector';

export const ColorPreviewDemo: React.FC = () => {
  const { theme, appName, appLogo, isLoadingConfig, currentThemeMode } = useTheme();

  return (
    <ScrollView style={styles.container}>
      <ThemedView backgroundColor="background" style={styles.content}>
        {/* Header con información de la app */}
        <Card padding="md" margin="md">
          <ThemedText variant="title" color="text" style={styles.title}>
            {appName}
          </ThemedText>
          
          {appLogo ? (
            <ThemedText variant="body" color="textSecondary">
              Logo configurado: {appLogo.substring(0, 50)}...
            </ThemedText>
          ) : (
            <ThemedText variant="body" color="textSecondary">
              Sin logo configurado
            </ThemedText>
          )}

          <ThemedText variant="caption" color="textSecondary" style={styles.configStatus}>
            {isLoadingConfig ? 'Cargando configuración...' : 'Configuración cargada'}
          </ThemedText>
        </Card>

        {/* Selector de tema */}
        <ThemedView style={styles.section}>
          <ThemeSelector />
        </ThemedView>

        {/* Demostración de colores */}
        <Card padding="md" margin="md">
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            Paleta de Colores Actual
          </ThemedText>
          
          <ThemedText variant="body" color="textSecondary" style={styles.description}>
            Modo efectivo: {theme.mode} 
            {currentThemeMode === 'system' && ' (automático)'}
          </ThemedText>

          {/* Colores principales */}
          <ThemedView style={styles.colorGrid}>
            <ThemedView style={[styles.colorBox, { backgroundColor: theme.colors.primary }]}>
              <ThemedText style={[styles.colorLabel, { color: '#FFFFFF' }]}>
                Primario
              </ThemedText>
              <ThemedText style={[styles.colorCode, { color: '#FFFFFF' }]}>
                {theme.colors.primary}
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.colorBox, { backgroundColor: theme.colors.secondary }]}>
              <ThemedText style={[styles.colorLabel, { color: '#FFFFFF' }]}>
                Secundario
              </ThemedText>
              <ThemedText style={[styles.colorCode, { color: '#FFFFFF' }]}>
                {theme.colors.secondary}
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.colorBox, { backgroundColor: theme.colors.accent }]}>
              <ThemedText style={[styles.colorLabel, { color: '#FFFFFF' }]}>
                Acento
              </ThemedText>
              <ThemedText style={[styles.colorCode, { color: '#FFFFFF' }]}>
                {theme.colors.accent}
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.colorBox, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}>
              <ThemedText style={[styles.colorLabel, { color: theme.colors.text }]}>
                Superficie
              </ThemedText>
              <ThemedText style={[styles.colorCode, { color: theme.colors.textSecondary }]}>
                {theme.colors.surface}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Colores de estado */}
          <ThemedText variant="body" weight="medium" style={styles.subsectionTitle}>
            Colores de Estado
          </ThemedText>

          <ThemedView style={styles.statusGrid}>
            <ThemedView style={[styles.statusBox, { backgroundColor: theme.colors.success }]}>
              <ThemedText style={[styles.statusLabel, { color: '#FFFFFF' }]}>
                Éxito
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.statusBox, { backgroundColor: theme.colors.warning }]}>
              <ThemedText style={[styles.statusLabel, { color: '#FFFFFF' }]}>
                Advertencia
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.statusBox, { backgroundColor: theme.colors.error }]}>
              <ThemedText style={[styles.statusLabel, { color: '#FFFFFF' }]}>
                Error
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Ejemplos de componentes */}
        <Card padding="md" margin="md">
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            Componentes de Ejemplo
          </ThemedText>

          <ThemedView style={styles.buttonGrid}>
            <ThemedButton variant="primary" size="md">
              <ThemedText color="background">Primario</ThemedText>
            </ThemedButton>

            <ThemedButton variant="secondary" size="md">
              <ThemedText>Secundario</ThemedText>
            </ThemedButton>

            <ThemedButton variant="outline" size="md">
              <ThemedText>Outlined</ThemedText>
            </ThemedButton>
          </ThemedView>

          <Card variant="outlined" padding="sm" margin="xs">
            <ThemedText variant="body">
              Ejemplo de tarjeta con bordes que se adapta al tema actual.
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
              Los colores se ajustan automáticamente según la configuración de la base de datos.
            </ThemedText>
          </Card>
        </Card>
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  configStatus: {
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
  },
  subsectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorBox: {
    flex: 1,
    minWidth: 120,
    height: 80,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  colorCode: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBox: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
});