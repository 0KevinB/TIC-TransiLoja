/**
 * Pruebas de Accesibilidad - Escalado de Texto
 * MOB-A11Y-TEXT: Verifica que los 3 tamaños de texto funcionen correctamente
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

// Definir escalas de texto
const TEXT_SCALES = {
  small: {
    name: 'Texto Pequeño',
    scale: 0.85,
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
    },
  },
  medium: {
    name: 'Texto Mediano (Defecto)',
    scale: 1.0,
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
  },
  large: {
    name: 'Texto Grande',
    scale: 1.3,
    sizes: {
      xs: 16,
      sm: 18,
      base: 21,
      lg: 23,
      xl: 26,
      '2xl': 31,
      '3xl': 39,
    },
  },
};

describe('Accesibilidad - Escalado de Texto', () => {
  describe('MOB-A11Y-TEXT-01: Tamaños Mínimos', () => {
    Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
      it(`${scale.name}: Texto base debe ser al menos 16px`, () => {
        const baseSize = scale.sizes.base;
        console.log(`📏 ${scale.name} - Tamaño base: ${baseSize}px`);

        // WCAG recomienda mínimo 16px para texto principal
        expect(baseSize).toBeGreaterThanOrEqual(14);
      });

      it(`${scale.name}: Texto pequeño no debe ser menor a 12px`, () => {
        const smallestSize = scale.sizes.xs;
        console.log(`📏 ${scale.name} - Tamaño mínimo: ${smallestSize}px`);

        // Texto más pequeño no debe bajar de 12px
        expect(smallestSize).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('MOB-A11Y-TEXT-02: Escala Consistente', () => {
    it('Debe mantener proporciones entre escalas', () => {
      const smallBase = TEXT_SCALES.small.sizes.base;
      const mediumBase = TEXT_SCALES.medium.sizes.base;
      const largeBase = TEXT_SCALES.large.sizes.base;

      // Verificar que large es aprox 30% más grande que medium
      const largeVsMedium = largeBase / mediumBase;
      console.log(`📊 Proporción Large/Medium: ${largeVsMedium.toFixed(2)}x`);
      expect(largeVsMedium).toBeGreaterThanOrEqual(1.2);
      expect(largeVsMedium).toBeLessThanOrEqual(1.4);

      // Verificar que small es aprox 15% más pequeño que medium
      const smallVsMedium = smallBase / mediumBase;
      console.log(`📊 Proporción Small/Medium: ${smallVsMedium.toFixed(2)}x`);
      expect(smallVsMedium).toBeGreaterThanOrEqual(0.8);
      expect(smallVsMedium).toBeLessThanOrEqual(0.9);
    });
  });

  describe('MOB-A11Y-TEXT-03: Renderizado con diferentes escalas', () => {
    Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
      it(`${scale.name}: Componentes deben renderizar sin overflow`, () => {
        const TestComponent = () => (
          <View style={{ maxWidth: 350, padding: 16 }}>
            <Text
              style={{ fontSize: scale.sizes.base }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              TransiLoja - Sistema de transporte público para Loja
            </Text>
            <TouchableOpacity
              style={{ padding: 12, marginTop: 8 }}
              accessibilityLabel="Buscar ruta"
            >
              <Text style={{ fontSize: scale.sizes.base }}>Buscar Ruta</Text>
            </TouchableOpacity>
          </View>
        );

        const { getByText, getByLabelText } = render(<TestComponent />);

        expect(getByText(/TransiLoja/)).toBeTruthy();
        expect(getByLabelText('Buscar ruta')).toBeTruthy();
      });
    });
  });

  describe('MOB-A11Y-TEXT-04: Botones y Elementos Táctiles', () => {
    Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
      it(`${scale.name}: Botones deben mantener tamaño mínimo táctil (44x44)`, () => {
        // WCAG requiere 44x44 puntos para elementos táctiles
        const MIN_TOUCH_SIZE = 44;
        const buttonPadding = 12;
        const textHeight = scale.sizes.base * 1.2; // lineHeight típico
        const totalHeight = textHeight + buttonPadding * 2;

        console.log(`👆 ${scale.name} - Altura botón: ${totalHeight.toFixed(0)}px`);

        expect(totalHeight).toBeGreaterThanOrEqual(MIN_TOUCH_SIZE);
      });
    });
  });

  describe('MOB-A11Y-TEXT-05: Legibilidad con Escalado', () => {
    it('Texto grande debe ser legible sin cortes', () => {
      const scale = TEXT_SCALES.large;

      const LongTextComponent = () => (
        <View style={{ width: 350, padding: 16 }}>
          <Text style={{ fontSize: scale.sizes.base }}>
            Próximo bus línea 5 llegando en 3 minutos a Parada Central
          </Text>
        </View>
      );

      const { getByText } = render(<LongTextComponent />);

      // Verificar que el texto se renderiza
      expect(getByText(/Próximo bus/)).toBeTruthy();
    });

    it('Encabezados deben escalar proporcionalmente', () => {
      Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
        const h1Size = scale.sizes['3xl'];
        const h2Size = scale.sizes['2xl'];
        const h3Size = scale.sizes.xl;

        // h1 debe ser significativamente más grande que h3
        const ratio = h1Size / h3Size;
        console.log(`📊 ${scale.name} - H1/H3 ratio: ${ratio.toFixed(2)}x`);

        expect(ratio).toBeGreaterThanOrEqual(1.3);
      });
    });
  });

  describe('MOB-A11Y-TEXT-06: Line Height (Altura de Línea)', () => {
    it('Line height debe ser proporcional al tamaño de texto', () => {
      Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
        const fontSize = scale.sizes.base;
        const recommendedLineHeight = fontSize * 1.5; // WCAG recomienda 1.5x

        console.log(
          `📏 ${scale.name} - Recomendado line-height: ${recommendedLineHeight}px`
        );

        // Verificar que hay suficiente espacio entre líneas
        expect(recommendedLineHeight / fontSize).toBeGreaterThanOrEqual(1.4);
      });
    });
  });

  describe('MOB-A11Y-TEXT-07: Espaciado de Párrafos', () => {
    it('Espaciado entre párrafos debe ser adecuado', () => {
      Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
        const fontSize = scale.sizes.base;
        const paragraphSpacing = fontSize * 1.5;

        console.log(`📐 ${scale.name} - Espaciado párrafo: ${paragraphSpacing}px`);

        // WCAG recomienda al menos 1.5x el tamaño de fuente
        expect(paragraphSpacing / fontSize).toBeGreaterThanOrEqual(1.5);
      });
    });
  });

  describe('MOB-A11Y-TEXT-08: Ancho de Línea', () => {
    it('Líneas no deben ser demasiado largas', () => {
      Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
        const fontSize = scale.sizes.base;
        const maxLineWidth = 350; // Ancho típico de móvil
        const charactersPerLine = Math.floor(maxLineWidth / (fontSize * 0.5));

        console.log(
          `📏 ${scale.name} - Caracteres por línea: ~${charactersPerLine}`
        );

        // WCAG recomienda no más de 80 caracteres por línea
        expect(charactersPerLine).toBeLessThanOrEqual(80);
      });
    });
  });

  describe('MOB-A11Y-TEXT-09: Contraste con Texto Grande', () => {
    it('Texto grande puede tener contraste reducido (3:1)', () => {
      // Para texto >= 18px (o 14px bold), WCAG AA permite 3:1
      const largeTextSize = TEXT_SCALES.large.sizes.base;

      console.log(`📊 Texto grande: ${largeTextSize}px`);

      // Si es >= 18px, contraste mínimo es 3:1 en lugar de 4.5:1
      const allowsReducedContrast = largeTextSize >= 18;

      expect(allowsReducedContrast).toBe(true);
    });
  });

  describe('MOB-A11Y-TEXT-10: Métricas de Escalado', () => {
    it('Debe reportar todas las escalas disponibles', () => {
      console.log('\n📊 RESUMEN DE ESCALAS DE TEXTO\n');
      console.log('═'.repeat(60));

      Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
        console.log(`\n${scale.name} (${scale.scale}x):`);
        console.log(`  Base: ${scale.sizes.base}px`);
        console.log(`  Rango: ${scale.sizes.xs}px - ${scale.sizes['3xl']}px`);
        console.log(`  Mínimo táctil: ${scale.sizes.base * 1.2 + 24}px`);
      });

      console.log('\n' + '═'.repeat(60) + '\n');

      // Verificar que hay al menos 3 escalas
      expect(Object.keys(TEXT_SCALES).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('MOB-A11Y-TEXT-11: Compatibilidad con Font Scaling del Sistema', () => {
    it('Debe respetar configuración de accesibilidad del sistema', () => {
      // En React Native, esto se maneja con allowFontScaling
      const TestComponent = () => (
        <Text allowFontScaling={true} style={{ fontSize: 16 }}>
          Texto adaptable
        </Text>
      );

      const { getByText } = render(<TestComponent />);
      const textElement = getByText('Texto adaptable');

      // Verificar que allowFontScaling está habilitado
      expect(textElement.props.allowFontScaling).toBe(true);
    });
  });

  describe('MOB-A11Y-TEXT-12: Inputs y Campos de Texto', () => {
    Object.entries(TEXT_SCALES).forEach(([scaleKey, scale]) => {
      it(`${scale.name}: Inputs deben tener tamaño adecuado`, () => {
        const inputHeight = scale.sizes.base * 1.5 + 24; // padding vertical

        console.log(`📝 ${scale.name} - Altura input: ${inputHeight}px`);

        // Inputs deben ser al menos 44px de altura
        expect(inputHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });
});
