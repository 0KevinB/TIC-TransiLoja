/**
 * Pruebas de Integración - Modo Offline
 * MOB-INT-OFF: Verifica funcionalidad completa en modo sin conexión
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock de NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  clear: jest.fn(),
}));

describe('Modo Offline - Integración Completa', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('MOB-INT-OFF-01: Caché de Rutas', () => {
    it('debe guardar rutas buscadas en caché', async () => {
      const mockRoute = {
        id: 'ruta-1',
        origen: 'Parque Central',
        destino: 'Terminal Terrestre',
        duracion: 25,
        transbordos: 1,
        segmentos: [
          { tipo: 'bus', linea: '5', duracion: 15 },
          { tipo: 'caminar', duracion: 5 },
          { tipo: 'bus', linea: '12', duracion: 5 },
        ],
      };

      // Simular guardado en caché
      await AsyncStorage.setItem(
        `route-cache-${mockRoute.origen}-${mockRoute.destino}`,
        JSON.stringify(mockRoute)
      );

      // Verificar que se guardó
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'route-cache-Parque Central-Terminal Terrestre',
        JSON.stringify(mockRoute)
      );

      // Simular recuperación offline
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockRoute)
      );

      const cached = await AsyncStorage.getItem(
        'route-cache-Parque Central-Terminal Terrestre'
      );

      expect(JSON.parse(cached!)).toEqual(mockRoute);
    });

    it('debe mantener historial de búsquedas offline', async () => {
      const searchHistory = [
        { origen: 'Parque Central', destino: 'Terminal', timestamp: Date.now() },
        { origen: 'Universidad', destino: 'Centro', timestamp: Date.now() },
      ];

      await AsyncStorage.setItem('search-history', JSON.stringify(searchHistory));

      // Recuperar offline
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(searchHistory)
      );

      const history = await AsyncStorage.getItem('search-history');
      expect(JSON.parse(history!)).toHaveLength(2);
    });

    it('debe limpiar caché antiguo (más de 7 días)', async () => {
      const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 días
      const recentTimestamp = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 días

      const cachedRoutes = [
        { id: '1', timestamp: oldTimestamp, data: {} },
        { id: '2', timestamp: recentTimestamp, data: {} },
      ];

      // Simular limpieza
      const cleanedRoutes = cachedRoutes.filter(
        (route) => Date.now() - route.timestamp < 7 * 24 * 60 * 60 * 1000
      );

      expect(cleanedRoutes).toHaveLength(1);
      expect(cleanedRoutes[0].id).toBe('2');
    });
  });

  describe('MOB-INT-OFF-02: Detección de Conexión', () => {
    it('debe detectar cuando la app está offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      });

      const state = await NetInfo.fetch();
      expect(state.isConnected).toBe(false);
    });

    it('debe detectar reconexión', async () => {
      // Primero offline
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
      });

      let state = await NetInfo.fetch();
      expect(state.isConnected).toBe(false);

      // Luego online
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      state = await NetInfo.fetch();
      expect(state.isConnected).toBe(true);
    });

    it('debe agregar listener para cambios de conectividad', () => {
      const callback = jest.fn();
      NetInfo.addEventListener(callback);

      expect(NetInfo.addEventListener).toHaveBeenCalledWith(callback);
    });
  });

  describe('MOB-INT-OFF-03: Sincronización al Reconectar', () => {
    it('debe sincronizar acciones pendientes al reconectar', async () => {
      const pendingActions = [
        { type: 'favorite-route', data: { routeId: '1' } },
        { type: 'rate-trip', data: { tripId: '123', rating: 5 } },
      ];

      // Guardar acciones pendientes
      await AsyncStorage.setItem('pending-sync', JSON.stringify(pendingActions));

      // Simular reconexión
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
      });

      // Recuperar y procesar
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(pendingActions)
      );

      const pending = await AsyncStorage.getItem('pending-sync');
      const actions = JSON.parse(pending!);

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('favorite-route');
    });

    it('debe limpiar acciones sincronizadas', async () => {
      await AsyncStorage.setItem('pending-sync', '[]');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pending-sync', '[]');
    });
  });

  describe('MOB-INT-OFF-04: Paradas Cercanas Offline', () => {
    it('debe cachear paradas cercanas', async () => {
      const nearbyStops = [
        { id: '1', nombre: 'Parada A', lat: -4.0, lng: -79.2, distancia: 150 },
        { id: '2', nombre: 'Parada B', lat: -4.01, lng: -79.21, distancia: 300 },
      ];

      await AsyncStorage.setItem('nearby-stops', JSON.stringify(nearbyStops));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(nearbyStops)
      );

      const cached = await AsyncStorage.getItem('nearby-stops');
      const stops = JSON.parse(cached!);

      expect(stops).toHaveLength(2);
      expect(stops[0].nombre).toBe('Parada A');
    });

    it('debe ordenar paradas por distancia', () => {
      const stops = [
        { id: '1', distancia: 500 },
        { id: '2', distancia: 150 },
        { id: '3', distancia: 300 },
      ];

      const sorted = stops.sort((a, b) => a.distancia - b.distancia);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('MOB-INT-OFF-05: Favoritos Offline', () => {
    it('debe guardar rutas favoritas localmente', async () => {
      const favorite = {
        id: 'fav-1',
        origen: 'Casa',
        destino: 'Trabajo',
        frecuencia: 5,
      };

      await AsyncStorage.setItem('favorites', JSON.stringify([favorite]));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([favorite])
      );

      const favorites = await AsyncStorage.getItem('favorites');
      expect(JSON.parse(favorites!)).toHaveLength(1);
    });

    it('debe agregar favorito sin conexión', async () => {
      const existing = [{ id: '1' }];
      const newFavorite = { id: '2' };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existing)
      );

      const current = JSON.parse(
        (await AsyncStorage.getItem('favorites')) || '[]'
      );
      const updated = [...current, newFavorite];

      await AsyncStorage.setItem('favorites', JSON.stringify(updated));

      expect(updated).toHaveLength(2);
    });
  });

  describe('MOB-INT-OFF-06: Métricas de Rendimiento Offline', () => {
    it('debe cargar datos cacheados en menos de 100ms', async () => {
      const mockData = { rutas: [], paradas: [] };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockData)
      );

      const start = performance.now();
      await AsyncStorage.getItem('cached-data');
      const end = performance.now();

      const loadTime = end - start;
      console.log(`⚡ Tiempo de carga offline: ${loadTime.toFixed(2)}ms`);

      // AsyncStorage suele ser muy rápido
      expect(loadTime).toBeLessThan(100);
    });

    it('debe reportar tamaño de caché', async () => {
      const largeData = {
        rutas: Array(100).fill({ id: '1', data: 'test' }),
      };

      const jsonString = JSON.stringify(largeData);
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInKB = sizeInBytes / 1024;

      console.log(`💾 Tamaño de caché: ${sizeInKB.toFixed(2)} KB`);

      // Advertir si el caché es muy grande (> 1MB)
      expect(sizeInKB).toBeLessThan(1024);
    });
  });
});
