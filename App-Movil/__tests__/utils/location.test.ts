/**
 * Tests de Funcionalidad - Utilidades de Localización
 *
 * Tests para funciones relacionadas con geolocalización
 */

describe('Location Utils - Funcionalidad', () => {
  // Fórmula de Haversine para calcular distancia
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

  describe('Cálculo de Distancias', () => {
    it('debe calcular distancia correcta entre dos puntos en Loja', () => {
      // Centro de Loja
      const centro = { lat: -3.99313, lon: -79.20422 };
      // Parque Jipiro
      const jipiro = { lat: -3.98893, lon: -79.20217 };

      const distancia = haversineDistance(centro.lat, centro.lon, jipiro.lat, jipiro.lon);

      // La distancia real es aproximadamente 0.5 km
      expect(distancia).toBeGreaterThan(0.4);
      expect(distancia).toBeLessThan(0.6);
    });

    it('debe retornar 0 para el mismo punto', () => {
      const punto = { lat: -3.99313, lon: -79.20422 };
      const distancia = haversineDistance(punto.lat, punto.lon, punto.lat, punto.lon);

      expect(distancia).toBe(0);
    });

    it('debe calcular distancias mayores correctamente', () => {
      // Loja
      const loja = { lat: -3.99313, lon: -79.20422 };
      // Quito
      const quito = { lat: -0.1807, lon: -78.4678 };

      const distancia = haversineDistance(loja.lat, loja.lon, quito.lat, quito.lon);

      // La distancia Loja-Quito es aproximadamente 420 km
      expect(distancia).toBeGreaterThan(400);
      expect(distancia).toBeLessThan(450);
    });

    it('debe manejar coordenadas negativas correctamente', () => {
      const p1 = { lat: -3.99313, lon: -79.20422 };
      const p2 = { lat: -4.0, lon: -79.2 };

      const distancia = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);

      expect(distancia).toBeGreaterThan(0);
      expect(distancia).toBeLessThan(1); // Menos de 1km
    });
  });

  describe('Validación de Coordenadas', () => {
    const isValidCoordinate = (lat: number, lon: number): boolean => {
      return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    };

    it('debe validar coordenadas correctas', () => {
      expect(isValidCoordinate(-3.99313, -79.20422)).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
    });

    it('debe rechazar coordenadas inválidas', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
    });
  });

  describe('Formato de Coordenadas', () => {
    const formatCoordinate = (value: number, decimals = 5): string => {
      return value.toFixed(decimals);
    };

    it('debe formatear coordenadas con precisión correcta', () => {
      expect(formatCoordinate(-3.99313, 5)).toBe('-3.99313');
      expect(formatCoordinate(-79.20422, 5)).toBe('-79.20422');
      expect(formatCoordinate(-3.993134567, 5)).toBe('-3.99313');
    });

    it('debe redondear correctamente', () => {
      expect(formatCoordinate(-3.999999, 5)).toBe('-4.00000');
      expect(formatCoordinate(-3.111115, 4)).toBe('-3.1111');
    });
  });
});
