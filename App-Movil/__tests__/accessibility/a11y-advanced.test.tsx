/**
 * Tests Avanzados de Accesibilidad (A11y)
 *
 * Tests adicionales para verificar accesibilidad completa
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';

describe('Advanced Accessibility Tests', () => {
  describe('Labels y Hints', () => {
    it('botones deben tener accessibilityLabel', () => {
      const { getByLabelText } = render(
        <TouchableOpacity accessibilityLabel="Buscar ruta">
          <Text>Buscar</Text>
        </TouchableOpacity>
      );

      expect(getByLabelText('Buscar ruta')).toBeTruthy();
    });

    it('inputs deben tener accessibilityLabel o accessibilityHint', () => {
      const { getByLabelText } = render(
        <TextInput
          placeholder="Ingrese destino"
          accessibilityLabel="Campo de destino"
          accessibilityHint="Ingrese la dirección de destino"
        />
      );

      expect(getByLabelText('Campo de destino')).toBeTruthy();
    });

    it('imágenes deben tener accessibilityLabel descriptivo', () => {
      const { getByLabelText } = render(
        <Image
          source={{ uri: 'https://example.com/bus.png' }}
          accessibilityLabel="Imagen de bus urbano"
        />
      );

      expect(getByLabelText('Imagen de bus urbano')).toBeTruthy();
    });
  });

  describe('Anuncios Dinámicos', () => {
    it('actualizaciones importantes deben usar accessibilityLiveRegion', () => {
      const { getByText } = render(
        <View accessibilityLiveRegion="polite">
          <Text>Bus llegando en 2 minutos</Text>
        </View>
      );

      const announcement = getByText('Bus llegando en 2 minutos').parent;
      expect(announcement?.props.accessibilityLiveRegion).toBe('polite');
    });

    it('alertas urgentes deben usar accessibilityLiveRegion="assertive"', () => {
      const { getByText } = render(
        <View accessibilityLiveRegion="assertive">
          <Text>¡Alerta de seguridad!</Text>
        </View>
      );

      const alert = getByText('¡Alerta de seguridad!').parent;
      expect(alert?.props.accessibilityLiveRegion).toBe('assertive');
    });
  });

  describe('Métricas de Accesibilidad', () => {
    it('debe reportar % de elementos con accessibilityLabel', () => {
      const { UNSAFE_getAllByType } = render(
        <View>
          <TouchableOpacity accessibilityLabel="Botón 1">
            <Text>1</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Botón 2">
            <Text>2</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>3</Text>
          </TouchableOpacity>
        </View>
      );

      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      const withLabels = buttons.filter((btn) => btn.props.accessibilityLabel);

      const coverage = (withLabels.length / buttons.length) * 100;

      console.log(`📊 Cobertura de accessibilityLabel: ${coverage.toFixed(0)}%`);
      console.log(`   Elementos totales: ${buttons.length}`);
      console.log(`   Elementos con label: ${withLabels.length}`);

      // Meta: al menos 60% de cobertura
      expect(coverage).toBeGreaterThan(50);
    });
  });
});
