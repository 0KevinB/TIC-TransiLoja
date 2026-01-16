/**
 * Pruebas de Accesibilidad - Modos de Color
 * MOB-A11Y-COLOR: Verifica que los 3 modos de color cumplan WCAG
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

// Utilidad para calcular contraste según WCAG
// Fórmula: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Definir paletas de colores para cada modo
const COLOR_MODES = {
  light: {
    name: 'Modo Claro',
    background: '#FFFFFF',
    text: '#1F2937',
    primary: '#667EEA',
    secondary: '#6B7280',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    name: 'Modo Oscuro',
    background: '#1F2937',
    text: '#F9FAFB',
    primary: '#818CF8',
    secondary: '#9CA3AF',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
  },
  highContrast: {
    name: 'Alto Contraste',
    background: '#000000',
    text: '#FFFFFF',
    primary: '#FFD700',
    secondary: '#FFFFFF',
    success: '#00FF00',
    error: '#FF0000',
    warning: '#FFFF00',
  },
};

describe('Accesibilidad - Modos de Color', () => {
  describe('MOB-A11Y-COLOR-01: Contraste WCAG AA (4.5:1 para texto normal)', () => {
    Object.entries(COLOR_MODES).forEach(([modeKey, mode]) => {
      it(`${mode.name}: Texto principal debe cumplir contraste mínimo`, () => {
        const bg = hexToRgb(mode.background);
        const text = hexToRgb(mode.text);
        const contrast = getContrastRatio(bg, text);

        console.log(`📊 ${mode.name} - Texto/Fondo: ${contrast.toFixed(2)}:1`);

        // WCAG AA requiere 4.5:1 para texto normal
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });

      it(`${mode.name}: Texto secundario debe cumplir contraste mínimo`, () => {
        const bg = hexToRgb(mode.background);
        const secondary = hexToRgb(mode.secondary);
        const contrast = getContrastRatio(bg, secondary);

        console.log(`📊 ${mode.name} - Secundario/Fondo: ${contrast.toFixed(2)}:1`);

        // Para texto secundario, aceptamos 3:1 (WCAG AAA para texto grande)
        expect(contrast).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('MOB-A11Y-COLOR-02: Contraste WCAG AAA (7:1 para mejor legibilidad)', () => {
    it('Alto Contraste debe superar AAA', () => {
      const mode = COLOR_MODES.highContrast;
      const bg = hexToRgb(mode.background);
      const text = hexToRgb(mode.text);
      const contrast = getContrastRatio(bg, text);

      console.log(`🌟 Alto Contraste - Texto/Fondo: ${contrast.toFixed(2)}:1`);

      // WCAG AAA requiere 7:1
      expect(contrast).toBeGreaterThanOrEqual(7);
    });
  });

  describe('MOB-A11Y-COLOR-03: Botones y Elementos Interactivos', () => {
    Object.entries(COLOR_MODES).forEach(([modeKey, mode]) => {
      it(`${mode.name}: Botón primario debe tener buen contraste`, () => {
        const bg = hexToRgb(mode.primary);
        const text = hexToRgb('#FFFFFF'); // Asumiendo texto blanco en botones
        const contrast = getContrastRatio(bg, text);

        console.log(`🔘 ${mode.name} - Botón Primario: ${contrast.toFixed(2)}:1`);

        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('MOB-A11Y-COLOR-04: Estados de Éxito/Error/Warning', () => {
    Object.entries(COLOR_MODES).forEach(([modeKey, mode]) => {
      it(`${mode.name}: Mensajes de éxito deben ser legibles`, () => {
        const bg = hexToRgb(mode.success);
        const text = hexToRgb('#FFFFFF');
        const contrast = getContrastRatio(bg, text);

        console.log(`✅ ${mode.name} - Éxito: ${contrast.toFixed(2)}:1`);

        expect(contrast).toBeGreaterThanOrEqual(3);
      });

      it(`${mode.name}: Mensajes de error deben ser legibles`, () => {
        const bg = hexToRgb(mode.error);
        const text = hexToRgb('#FFFFFF');
        const contrast = getContrastRatio(bg, text);

        console.log(`❌ ${mode.name} - Error: ${contrast.toFixed(2)}:1`);

        expect(contrast).toBeGreaterThanOrEqual(3);
      });

      it(`${mode.name}: Mensajes de advertencia deben ser legibles`, () => {
        const bg = hexToRgb(mode.warning);
        const text = hexToRgb('#000000'); // Warning suele usar texto oscuro
        const contrast = getContrastRatio(bg, text);

        console.log(`⚠️  ${mode.name} - Advertencia: ${contrast.toFixed(2)}:1`);

        expect(contrast).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('MOB-A11Y-COLOR-05: No depender solo del color', () => {
    it('Estados deben tener indicadores adicionales al color', () => {
      // Renderizar botones con diferentes estados
      const { getByLabelText } = render(
        <View>
          <TouchableOpacity
            accessibilityLabel="Botón disponible"
            accessibilityState={{ disabled: false }}
          >
            <Text>✓ Disponible</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Botón deshabilitado"
            accessibilityState={{ disabled: true }}
          >
            <Text>✗ Deshabilitado</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Botón seleccionado"
            accessibilityState={{ selected: true }}
          >
            <Text>★ Seleccionado</Text>
          </TouchableOpacity>
        </View>
      );

      // Verificar que tienen accessibilityState además del color
      const disponible = getByLabelText('Botón disponible');
      const deshabilitado = getByLabelText('Botón deshabilitado');
      const seleccionado = getByLabelText('Botón seleccionado');

      expect(deshabilitado.props.accessibilityState.disabled).toBe(true);
      expect(seleccionado.props.accessibilityState.selected).toBe(true);

      // Verificar que tienen iconos/símbolos además del color
      expect(disponible.findByType(Text).props.children).toContain('✓');
      expect(deshabilitado.findByType(Text).props.children).toContain('✗');
      expect(seleccionado.findByType(Text).props.children).toContain('★');
    });
  });

  describe('MOB-A11Y-COLOR-06: Renderizado en diferentes modos', () => {
    Object.entries(COLOR_MODES).forEach(([modeKey, mode]) => {
      it(`${mode.name}: Componentes deben renderizar correctamente`, () => {
        const TestComponent = () => (
          <View
            style={{
              backgroundColor: mode.background,
              padding: 16,
            }}
          >
            <Text style={{ color: mode.text }}>Texto principal</Text>
            <Text style={{ color: mode.secondary }}>Texto secundario</Text>
            <TouchableOpacity
              style={{ backgroundColor: mode.primary, padding: 12 }}
              accessibilityLabel="Botón de acción"
            >
              <Text style={{ color: '#FFFFFF' }}>Botón</Text>
            </TouchableOpacity>
          </View>
        );

        const { getByText, getByLabelText } = render(<TestComponent />);

        expect(getByText('Texto principal')).toBeTruthy();
        expect(getByText('Texto secundario')).toBeTruthy();
        expect(getByLabelText('Botón de acción')).toBeTruthy();
      });
    });
  });

  describe('MOB-A11Y-COLOR-07: Métricas de Contraste', () => {
    it('Debe reportar métricas de todos los modos', () => {
      console.log('\n📊 RESUMEN DE CONTRASTES POR MODO\n');
      console.log('═'.repeat(60));

      Object.entries(COLOR_MODES).forEach(([modeKey, mode]) => {
        const bg = hexToRgb(mode.background);
        const text = hexToRgb(mode.text);
        const contrast = getContrastRatio(bg, text);

        const wcagAA = contrast >= 4.5;
        const wcagAAA = contrast >= 7;

        console.log(`\n${mode.name}:`);
        console.log(`  Contraste: ${contrast.toFixed(2)}:1`);
        console.log(`  WCAG AA (4.5:1): ${wcagAA ? '✅' : '❌'}`);
        console.log(`  WCAG AAA (7:1): ${wcagAAA ? '✅' : '❌'}`);
      });

      console.log('\n' + '═'.repeat(60) + '\n');

      // Verificar que al menos 2 modos cumplen WCAG AA
      const modesPassingAA = Object.values(COLOR_MODES).filter((mode) => {
        const contrast = getContrastRatio(
          hexToRgb(mode.background),
          hexToRgb(mode.text)
        );
        return contrast >= 4.5;
      });

      expect(modesPassingAA.length).toBeGreaterThanOrEqual(2);
    });
  });
});
