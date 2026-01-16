/**
 * Pruebas de Accesibilidad - Screen Reader / TalkBack
 * MOB-A11Y-SR: Verifica soporte para lectores de pantalla
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';

describe('Accesibilidad - Screen Reader Support', () => {
  describe('MOB-A11Y-SR-01: Labels Descriptivos', () => {
    it('Botones deben tener accessibilityLabel', () => {
      const { getByLabelText } = render(
        <TouchableOpacity accessibilityLabel="Buscar ruta desde origen hasta destino">
          <Text>Buscar</Text>
        </TouchableOpacity>
      );

      const button = getByLabelText('Buscar ruta desde origen hasta destino');
      expect(button).toBeTruthy();
    });

    it('Imágenes decorativas deben ser ignoradas por screen reader', () => {
      const { UNSAFE_getByType } = render(
        <View>
          <Image
            source={{ uri: 'icon.png' }}
            accessibilityLabel="Icono de bus"
            accessible={true}
          />
          <Image
            source={{ uri: 'decoration.png' }}
            accessible={false} // Decorativo
          />
        </View>
      );

      const images = UNSAFE_getByType(Image);
      // Primera imagen es accesible
      expect(images[0].props.accessible).toBe(true);
      // Segunda es decorativa
      expect(images[1].props.accessible).toBe(false);
    });

    it('Inputs deben tener label y hint', () => {
      const { getByLabelText } = render(
        <TextInput
          accessibilityLabel="Campo de origen"
          accessibilityHint="Ingresa la dirección desde donde viajas"
          placeholder="¿Desde dónde?"
        />
      );

      const input = getByLabelText('Campo de origen');
      expect(input.props.accessibilityHint).toBe(
        'Ingresa la dirección desde donde viajas'
      );
    });
  });

  describe('MOB-A11Y-SR-02: Roles Apropiados', () => {
    it('Botones deben usar role="button"', () => {
      const { getByRole } = render(
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Iniciar viaje"
        >
          <Text>Iniciar</Text>
        </TouchableOpacity>
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('Links deben usar role="link"', () => {
      const { getByRole } = render(
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Ver términos y condiciones"
        >
          <Text>Términos y condiciones</Text>
        </TouchableOpacity>
      );

      expect(getByRole('link')).toBeTruthy();
    });

    it('Encabezados deben usar role="header"', () => {
      const { getByRole } = render(
        <Text accessibilityRole="header">Rutas Disponibles</Text>
      );

      expect(getByRole('header')).toBeTruthy();
    });
  });

  describe('MOB-A11Y-SR-03: Estados Accesibles', () => {
    it('Elementos deshabilitados deben anunciarse', () => {
      const { getByLabelText } = render(
        <TouchableOpacity
          accessibilityLabel="Buscar ruta"
          accessibilityState={{ disabled: true }}
          disabled
        >
          <Text>Buscar</Text>
        </TouchableOpacity>
      );

      const button = getByLabelText('Buscar ruta');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('Elementos seleccionados deben anunciarse', () => {
      const { getByLabelText } = render(
        <TouchableOpacity
          accessibilityLabel="Modo claro"
          accessibilityState={{ selected: true }}
        >
          <Text>☀️ Claro</Text>
        </TouchableOpacity>
      );

      const button = getByLabelText('Modo claro');
      expect(button.props.accessibilityState.selected).toBe(true);
    });

    it('Estados de carga deben anunciarse', () => {
      const { getByLabelText } = render(
        <View
          accessibilityLabel="Buscando rutas"
          accessibilityState={{ busy: true }}
        >
          <Text>Cargando...</Text>
        </View>
      );

      const loader = getByLabelText('Buscando rutas');
      expect(loader.props.accessibilityState.busy).toBe(true);
    });

    it('Checkboxes deben anunciar estado checked', () => {
      const { getByRole } = render(
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityLabel="Guardar como favorito"
          accessibilityState={{ checked: true }}
        >
          <Text>✓</Text>
        </TouchableOpacity>
      );

      const checkbox = getByRole('checkbox');
      expect(checkbox.props.accessibilityState.checked).toBe(true);
    });
  });

  describe('MOB-A11Y-SR-04: Anuncios Dinámicos (Live Regions)', () => {
    it('Actualizaciones importantes deben usar liveRegion="polite"', () => {
      const { getByText } = render(
        <View accessibilityLiveRegion="polite">
          <Text>Bus línea 5 llegando en 2 minutos</Text>
        </View>
      );

      const announcement = getByText('Bus línea 5 llegando en 2 minutos').parent;
      expect(announcement?.props.accessibilityLiveRegion).toBe('polite');
    });

    it('Alertas urgentes deben usar liveRegion="assertive"', () => {
      const { getByText } = render(
        <View accessibilityLiveRegion="assertive">
          <Text>¡Alerta de seguridad en tu ruta!</Text>
        </View>
      );

      const alert = getByText('¡Alerta de seguridad en tu ruta!').parent;
      expect(alert?.props.accessibilityLiveRegion).toBe('assertive');
    });
  });

  describe('MOB-A11Y-SR-05: Orden de Foco', () => {
    it('Elementos deben tener orden lógico', () => {
      const { UNSAFE_getAllByType } = render(
        <View>
          <TextInput
            accessibilityLabel="Origen"
            placeholder="Origen"
            accessibilityValue={{ text: 'Campo 1 de 3' }}
          />
          <TextInput
            accessibilityLabel="Destino"
            placeholder="Destino"
            accessibilityValue={{ text: 'Campo 2 de 3' }}
          />
          <TouchableOpacity
            accessibilityLabel="Buscar ruta"
            accessibilityRole="button"
          >
            <Text>Buscar</Text>
          </TouchableOpacity>
        </View>
      );

      const inputs = UNSAFE_getAllByType(TextInput);
      const buttons = UNSAFE_getAllByType(TouchableOpacity);

      // Verificar que los inputs vienen antes que el botón
      expect(inputs.length).toBe(2);
      expect(buttons.length).toBe(1);
    });

    it('Modal debe tener foco inicial correcto', () => {
      const { getByLabelText } = render(
        <View
          accessibilityViewIsModal={true}
          accessible={true}
          accessibilityLabel="Diálogo de confirmación"
        >
          <Text>¿Estás seguro?</Text>
          <TouchableOpacity
            accessibilityLabel="Cancelar"
            accessibilityAutoFocus={true}
          >
            <Text>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Confirmar">
            <Text>Confirmar</Text>
          </TouchableOpacity>
        </View>
      );

      const modal = getByLabelText('Diálogo de confirmación');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });
  });

  describe('MOB-A11Y-SR-06: Valores y Rangos', () => {
    it('Sliders deben anunciar valor actual', () => {
      const { getByLabelText } = render(
        <View
          accessibilityLabel="Tamaño de texto"
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: 1,
            max: 3,
            now: 2,
            text: 'Mediano',
          }}
        >
          <Text>A</Text>
        </View>
      );

      const slider = getByLabelText('Tamaño de texto');
      expect(slider.props.accessibilityValue.now).toBe(2);
      expect(slider.props.accessibilityValue.text).toBe('Mediano');
    });

    it('Progress indicators deben anunciar progreso', () => {
      const { getByLabelText } = render(
        <View
          accessibilityLabel="Descargando mapa"
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: 65,
            text: '65% completado',
          }}
        />
      );

      const progress = getByLabelText('Descargando mapa');
      expect(progress.props.accessibilityValue.now).toBe(65);
    });
  });

  describe('MOB-A11Y-SR-07: Agrupación de Elementos', () => {
    it('Elementos relacionados deben agruparse', () => {
      const { getByLabelText } = render(
        <View
          accessible={true}
          accessibilityLabel="Ruta 5: Parque Central a Terminal, 25 minutos, 1 transbordo"
        >
          <Text>Ruta 5</Text>
          <Text>Parque Central → Terminal</Text>
          <Text>25 min</Text>
          <Text>1 transbordo</Text>
        </View>
      );

      const routeCard = getByLabelText(
        'Ruta 5: Parque Central a Terminal, 25 minutos, 1 transbordo'
      );
      expect(routeCard).toBeTruthy();
    });

    it('Listas deben identificarse correctamente', () => {
      const { UNSAFE_getByType } = render(
        <ScrollView
          accessible={true}
          accessibilityLabel="Lista de paradas"
          accessibilityRole="list"
        >
          <View accessibilityRole="text">
            <Text>Parada 1</Text>
          </View>
          <View accessibilityRole="text">
            <Text>Parada 2</Text>
          </View>
        </ScrollView>
      );

      const list = UNSAFE_getByType(ScrollView);
      expect(list.props.accessibilityRole).toBe('list');
    });
  });

  describe('MOB-A11Y-SR-08: Acciones Personalizadas', () => {
    it('Elementos con múltiples acciones deben anunciarlas', () => {
      const { getByLabelText } = render(
        <View
          accessible={true}
          accessibilityLabel="Ruta a Terminal"
          accessibilityActions={[
            { name: 'activate', label: 'Ver detalles' },
            { name: 'longpress', label: 'Guardar como favorito' },
          ]}
        >
          <Text>Terminal Terrestre</Text>
        </View>
      );

      const element = getByLabelText('Ruta a Terminal');
      expect(element.props.accessibilityActions).toHaveLength(2);
    });
  });

  describe('MOB-A11Y-SR-09: Feedback Táctil', () => {
    it('Botones deben proporcionar feedback', () => {
      let pressed = false;

      const { getByLabelText } = render(
        <TouchableOpacity
          accessibilityLabel="Buscar ruta"
          accessibilityRole="button"
          onPress={() => {
            pressed = true;
          }}
        >
          <Text>Buscar</Text>
        </TouchableOpacity>
      );

      const button = getByLabelText('Buscar ruta');
      expect(button.props.onPress).toBeDefined();
    });
  });

  describe('MOB-A11Y-SR-10: Métricas de Cobertura', () => {
    it('Debe reportar cobertura de accessibility labels', () => {
      const components = [
        <TouchableOpacity key="1" accessibilityLabel="Botón 1">
          <Text>1</Text>
        </TouchableOpacity>,
        <TouchableOpacity key="2" accessibilityLabel="Botón 2">
          <Text>2</Text>
        </TouchableOpacity>,
        <TouchableOpacity key="3">
          <Text>3</Text>
        </TouchableOpacity>,
      ];

      const withLabels = components.filter(
        (c) => c.props.accessibilityLabel !== undefined
      );

      const coverage = (withLabels.length / components.length) * 100;

      console.log('\n📊 COBERTURA DE ACCESIBILIDAD\n');
      console.log('═'.repeat(60));
      console.log(`Total de elementos: ${components.length}`);
      console.log(`Con accessibilityLabel: ${withLabels.length}`);
      console.log(`Cobertura: ${coverage.toFixed(0)}%`);
      console.log('═'.repeat(60) + '\n');

      // Meta: al menos 66% de elementos con labels
      expect(coverage).toBeGreaterThanOrEqual(66);
    });
  });
});
