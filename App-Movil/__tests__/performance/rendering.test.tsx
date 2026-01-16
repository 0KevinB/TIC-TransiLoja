/**
 * Tests de Rendimiento - Renderizado
 *
 * Tests para medir el rendimiento de renderizado de componentes
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, FlatList } from 'react-native';

describe('Performance Tests - Renderizado', () => {
  describe('Componentes Simples', () => {
    it('debe renderizar componente simple rápidamente', () => {
      const startTime = performance.now();

      render(
        <View>
          <Text>Hello World</Text>
        </View>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`⏱️ Render tiempo componente simple: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    it('debe renderizar lista de 10 items rápidamente', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: i.toString(),
        title: `Item ${i}`,
      }));

      const startTime = performance.now();

      render(
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View key={item.id}>
              <Text>{item.title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`⏱️ Render FlatList (10 items): ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Componentes Complejos', () => {
    const ComplexComponent = ({ itemCount }: { itemCount: number }) => {
      const items = Array.from({ length: itemCount }, (_, i) => i);

      return (
        <View>
          <Text>Header</Text>
          {items.map((i) => (
            <View key={i}>
              <Text>Item {i}</Text>
              <Text>Description for item {i}</Text>
            </View>
          ))}
          <Text>Footer</Text>
        </View>
      );
    };

    it('debe renderizar 50 items en menos de 500ms', () => {
      const startTime = performance.now();

      render(<ComplexComponent itemCount={50} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`⏱️ Render componente complejo (50 items): ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(500);
    });

    it('debe renderizar 100 items en menos de 1000ms', () => {
      const startTime = performance.now();

      render(<ComplexComponent itemCount={100} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`⏱️ Render componente complejo (100 items): ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Re-renders', () => {
    const Counter = ({ initialCount = 0 }: { initialCount?: number }) => {
      const [count, setCount] = React.useState(initialCount);

      React.useEffect(() => {
        if (count < 10) {
          setCount(count + 1);
        }
      }, [count]);

      return (
        <View>
          <Text>Count: {count}</Text>
        </View>
      );
    };

    it('debe manejar múltiples re-renders eficientemente', async () => {
      const startTime = performance.now();

      const { findByText } = render(<Counter />);

      // Esperar a que llegue a 10
      await findByText('Count: 10', {}, { timeout: 3000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`⏱️ 10 re-renders: ${totalTime.toFixed(2)}ms`);
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Listas Grandes', () => {
    it('debe renderizar lista de 100 items con FlatList', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        title: `Parada ${i}`,
        subtitle: `Descripción de la parada ${i}`,
      }));

      const startTime = performance.now();

      render(
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View>
              <Text>{item.title}</Text>
              <Text>{item.subtitle}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`⏱️ FlatList (100 items, optimizado): ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Métricas de Memoria (si disponible)', () => {
    it('debe tener uso de memoria razonable', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        data: `Item ${i}`,
      }));

      const initialMemory =
        typeof (performance as any).memory !== 'undefined'
          ? (performance as any).memory.usedJSHeapSize
          : 0;

      render(
        <FlatList
          data={items}
          renderItem={({ item }) => <Text key={item.id}>{item.data}</Text>}
          keyExtractor={(item) => item.id}
          initialNumToRender={20}
        />
      );

      const finalMemory =
        typeof (performance as any).memory !== 'undefined'
          ? (performance as any).memory.usedJSHeapSize
          : 0;

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryUsed = (finalMemory - initialMemory) / 1048576; // MB
        console.log(`💾 Memoria usada: ${memoryUsed.toFixed(2)}MB`);

        expect(memoryUsed).toBeLessThan(50); // < 50MB
      }
    });
  });
});
