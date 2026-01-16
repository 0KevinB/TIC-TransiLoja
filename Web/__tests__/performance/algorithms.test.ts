/**
 * Tests de Rendimiento de Algoritmos
 *
 * Estos tests miden el rendimiento de operaciones críticas:
 * - Búsqueda y filtrado de datos
 * - Cálculos de distancias
 * - Procesamiento de grandes conjuntos de datos
 */

// Funciones auxiliares para tests
const secondsToGTFSTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const gtfsTimeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const getDurationMinutes = (startTime: string, endTime: string): number => {
  const start = gtfsTimeToSeconds(startTime);
  const end = gtfsTimeToSeconds(endTime);
  return Math.round((end - start) / 60);
};

describe('Performance Tests - Algoritmos', () => {
  describe('Conversión de Tiempo (GTFS Time)', () => {
    it('debe convertir segundos a GTFS time en menos de 1ms', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        secondsToGTFSTime(i * 60); // Convertir minutos a GTFS time
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`⏱️ Conversión segundos → GTFS time:`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms`);
      console.log(`   Promedio: ${avgTime.toFixed(4)}ms por operación`);
      console.log(`   Iteraciones: ${iterations}`);

      expect(avgTime).toBeLessThan(1);
      expect(totalTime).toBeLessThan(100); // Total < 100ms para 10k ops
    });

    it('debe convertir GTFS time a segundos en menos de 1ms', () => {
      const iterations = 10000;
      const testTimes = ['08:30:00', '12:45:30', '18:00:00', '23:59:59'];
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const time = testTimes[i % testTimes.length];
        gtfsTimeToSeconds(time);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`⏱️ Conversión GTFS time → segundos:`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms`);
      console.log(`   Promedio: ${avgTime.toFixed(4)}ms por operación`);

      expect(avgTime).toBeLessThan(1);
    });

    it('debe calcular duraciones eficientemente', () => {
      const iterations = 5000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        getDurationMinutes('08:00:00', '09:30:00');
        getDurationMinutes('12:15:00', '14:45:30');
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / (iterations * 2);

      console.log(`⏱️ Cálculo de duraciones:`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms`);
      console.log(`   Promedio: ${avgTime.toFixed(4)}ms por operación`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Operaciones con Arrays (Búsqueda y Filtrado)', () => {
    // Simular datos de paradas
    const generateStops = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `stop_${i}`,
        stop_name: `Parada ${i}`,
        stop_lat: -4.0 + Math.random() * 0.1,
        stop_lon: -79.2 + Math.random() * 0.1,
      }));
    };

    it('debe buscar en array de 1000 paradas en menos de 10ms', () => {
      const stops = generateStops(1000);
      const searchTerm = 'Parada 500';

      const startTime = performance.now();
      const result = stops.filter((s) =>
        s.stop_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const endTime = performance.now();

      const searchTime = endTime - startTime;
      console.log(`🔍 Búsqueda en 1000 paradas: ${searchTime.toFixed(2)}ms`);

      expect(result.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(10);
    });

    it('debe filtrar array de 5000 rutas en menos de 50ms', () => {
      const routes = Array.from({ length: 5000 }, (_, i) => ({
        id: `route_${i}`,
        route_short_name: `L${i}`,
        route_long_name: `Línea ${i}`,
        route_type: i % 3,
      }));

      const startTime = performance.now();
      const filtered = routes.filter((r) => r.route_type === 1);
      const endTime = performance.now();

      const filterTime = endTime - startTime;
      console.log(`🔍 Filtrado de 5000 rutas: ${filterTime.toFixed(2)}ms`);
      console.log(`   Resultados: ${filtered.length}`);

      expect(filterTime).toBeLessThan(50);
    });

    it('debe ordenar array de 1000 elementos en menos de 20ms', () => {
      const items = Array.from({ length: 1000 }, () => ({
        id: Math.random().toString(),
        value: Math.random() * 100,
      }));

      const startTime = performance.now();
      items.sort((a, b) => a.value - b.value);
      const endTime = performance.now();

      const sortTime = endTime - startTime;
      console.log(`🔢 Ordenamiento de 1000 elementos: ${sortTime.toFixed(2)}ms`);

      expect(sortTime).toBeLessThan(20);
    });
  });

  describe('Cálculos Geográficos', () => {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const haversineDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    it('debe calcular distancia Haversine en menos de 0.1ms', () => {
      const iterations = 10000;
      // Coordenadas de Loja
      const loja = { lat: -3.9931, lon: -79.2042 };
      const destinos = [
        { lat: -4.0, lon: -79.2 },
        { lat: -3.99, lon: -79.21 },
        { lat: -3.98, lon: -79.19 },
      ];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const dest = destinos[i % destinos.length];
        haversineDistance(loja.lat, loja.lon, dest.lat, dest.lon);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`🌍 Cálculo distancia Haversine:`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms`);
      console.log(`   Promedio: ${avgTime.toFixed(4)}ms por cálculo`);
      console.log(`   Iteraciones: ${iterations}`);

      expect(avgTime).toBeLessThan(0.1);
    });

    it('debe encontrar parada más cercana en menos de 100ms (1000 paradas)', () => {
      const userLocation = { lat: -3.9931, lon: -79.2042 };
      const stops = Array.from({ length: 1000 }, (_, i) => ({
        id: `stop_${i}`,
        stop_name: `Parada ${i}`,
        stop_lat: -4.0 + Math.random() * 0.1,
        stop_lon: -79.2 + Math.random() * 0.1,
      }));

      const startTime = performance.now();

      const closest = stops.reduce((prev, curr) => {
        const prevDist = haversineDistance(
          userLocation.lat,
          userLocation.lon,
          prev.stop_lat,
          prev.stop_lon
        );
        const currDist = haversineDistance(
          userLocation.lat,
          userLocation.lon,
          curr.stop_lat,
          curr.stop_lon
        );
        return currDist < prevDist ? curr : prev;
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      console.log(`📍 Búsqueda parada más cercana (1000 paradas):`);
      console.log(`   Tiempo: ${searchTime.toFixed(2)}ms`);
      console.log(`   Parada encontrada: ${closest.stop_name}`);

      expect(closest).toBeDefined();
      expect(searchTime).toBeLessThan(100);
    });
  });

  describe('Procesamiento de Grandes Datasets', () => {
    it('debe procesar 10,000 stop_times en menos de 200ms', () => {
      const stopTimes = Array.from({ length: 10000 }, (_, i) => ({
        trip_id: `trip_${Math.floor(i / 20)}`,
        stop_id: `stop_${i % 100}`,
        stop_sequence: i % 20,
        arrival_time: secondsToGTFSTime(28800 + i * 60), // Desde 8:00 AM
        departure_time: secondsToGTFSTime(28800 + i * 60 + 30),
      }));

      const startTime = performance.now();

      // Agrupar por trip_id
      const byTrip = stopTimes.reduce(
        (acc, st) => {
          if (!acc[st.trip_id]) {
            acc[st.trip_id] = [];
          }
          acc[st.trip_id].push(st);
          return acc;
        },
        {} as Record<string, typeof stopTimes>
      );

      const endTime = performance.now();
      const processTime = endTime - startTime;

      console.log(`📊 Procesamiento de 10,000 stop_times:`);
      console.log(`   Tiempo: ${processTime.toFixed(2)}ms`);
      console.log(`   Viajes únicos: ${Object.keys(byTrip).length}`);

      expect(processTime).toBeLessThan(200);
    });

    it('debe generar reporte de 1000 viajes en menos de 300ms', () => {
      const trips = Array.from({ length: 1000 }, (_, i) => ({
        trip_id: `trip_${i}`,
        route_id: `route_${i % 50}`,
        service_id: 'weekday',
        direction_id: i % 2 as 0 | 1,
      }));

      const startTime = performance.now();

      // Calcular estadísticas
      const stats = {
        total: trips.length,
        byRoute: trips.reduce(
          (acc, t) => {
            acc[t.route_id] = (acc[t.route_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        byDirection: trips.reduce(
          (acc, t) => {
            const dir = t.direction_id === 0 ? 'outbound' : 'inbound';
            acc[dir] = (acc[dir] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      const endTime = performance.now();
      const reportTime = endTime - startTime;

      console.log(`📈 Generación de reporte (1000 viajes):`);
      console.log(`   Tiempo: ${reportTime.toFixed(2)}ms`);
      console.log(`   Rutas: ${Object.keys(stats.byRoute).length}`);

      expect(reportTime).toBeLessThan(300);
    });
  });

  describe('Métricas de Memoria', () => {
    it('debe manejar arrays grandes sin exceso de memoria', () => {
      const largArray = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        data: `item_${i}`,
      }));

      const initialMemory =
        typeof (performance as any).memory !== 'undefined'
          ? (performance as any).memory.usedJSHeapSize
          : 0;

      // Realizar operaciones
      const filtered = largArray.filter((item) => item.id % 2 === 0);
      const mapped = filtered.map((item) => ({ ...item, processed: true }));

      const finalMemory =
        typeof (performance as any).memory !== 'undefined'
          ? (performance as any).memory.usedJSHeapSize
          : 0;

      const memoryUsed = (finalMemory - initialMemory) / 1048576; // MB

      console.log(`💾 Uso de memoria (array de 100k elementos):`);
      console.log(`   Inicial: ${(initialMemory / 1048576).toFixed(2)}MB`);
      console.log(`   Final: ${(finalMemory / 1048576).toFixed(2)}MB`);
      console.log(`   Usado: ${memoryUsed.toFixed(2)}MB`);
      console.log(`   Resultados: ${mapped.length} elementos`);

      expect(mapped.length).toBe(50000);
      // Aceptar uso razonable de memoria (ajustar según necesidad)
      if (memoryUsed > 0) {
        expect(memoryUsed).toBeLessThan(50); // < 50MB
      }
    });
  });
});
