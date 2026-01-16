import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { offlineDataService, OfflineData } from './offlineDataService';
import networkService from './networkService';
import { Parada, Ruta, Bus, Alerta, Municipio } from './types';

export class HybridDataService {
  private static instance: HybridDataService;

  public static getInstance(): HybridDataService {
    if (!HybridDataService.instance) {
      HybridDataService.instance = new HybridDataService();
    }
    return HybridDataService.instance;
  }

  async getParadas(municipioId?: string): Promise<Parada[]> {
    try {
      // Intentar obtener datos online si hay conexión
      if (networkService.isOnline()) {
        console.log('🌐 Obteniendo paradas online...');
        let paradasQuery = collection(db(), 'paradas');

        if (municipioId) {
          paradasQuery = query(paradasQuery, where('municipio_id', '==', municipioId));
        }

        const snapshot = await getDocs(paradasQuery);
        const paradas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Parada[];

        console.log(`✅ Obtenidas ${paradas.length} paradas online`);
        return paradas;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo paradas online, usando datos offline:', error);
    }

    // Fallback a datos offline
    console.log('📱 Usando datos offline para paradas...');
    const offlineData = await offlineDataService.getOfflineData();
    if (offlineData?.paradas) {
      let paradas = offlineData.paradas;

      if (municipioId) {
        paradas = paradas.filter(p => p.municipio_id === municipioId);
      }

      console.log(`✅ Obtenidas ${paradas.length} paradas offline`);
      return paradas;
    }

    console.log('❌ No hay datos offline disponibles para paradas');
    return [];
  }

  async getRutas(municipioId?: string): Promise<Ruta[]> {
    try {
      // Intentar obtener datos online si hay conexión
      if (networkService.isOnline()) {
        console.log('🌐 Obteniendo rutas online...');
        let rutasQuery = collection(db(), 'rutas');

        if (municipioId) {
          rutasQuery = query(rutasQuery, where('municipio_id', '==', municipioId));
        }

        const snapshot = await getDocs(rutasQuery);
        const rutas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Ruta[];

        console.log(`✅ Obtenidas ${rutas.length} rutas online`);
        return rutas;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo rutas online, usando datos offline:', error);
    }

    // Fallback a datos offline
    console.log('📱 Usando datos offline para rutas...');
    const offlineData = await offlineDataService.getOfflineData();
    if (offlineData?.rutas) {
      let rutas = offlineData.rutas;

      if (municipioId) {
        rutas = rutas.filter(r => r.municipio_id === municipioId);
      }

      console.log(`✅ Obtenidas ${rutas.length} rutas offline`);
      return rutas;
    }

    console.log('❌ No hay datos offline disponibles para rutas');
    return [];
  }

  async getBuses(municipioId?: string, rutaId?: string): Promise<Bus[]> {
    try {
      // Para buses, siempre intentar datos online primero ya que cambian frecuentemente
      if (networkService.isOnline()) {
        console.log('🌐 Obteniendo buses online...');
        let busesQuery = collection(db(), 'buses');

        if (municipioId) {
          busesQuery = query(busesQuery, where('municipio_id', '==', municipioId));
        }

        if (rutaId) {
          busesQuery = query(busesQuery, where('ruta_id', '==', rutaId));
        }

        const snapshot = await getDocs(busesQuery);
        const buses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Bus[];

        console.log(`✅ Obtenidos ${buses.length} buses online`);
        return buses;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo buses online, usando datos offline:', error);
    }

    // Fallback a datos offline (datos básicos sin ubicación en tiempo real)
    console.log('📱 Usando datos offline para buses...');
    const offlineData = await offlineDataService.getOfflineData();
    if (offlineData?.buses) {
      let buses = offlineData.buses;

      if (municipioId) {
        buses = buses.filter(b => b.municipio_id === municipioId);
      }

      if (rutaId) {
        buses = buses.filter(b => b.ruta_id === rutaId);
      }

      console.log(`✅ Obtenidos ${buses.length} buses offline (sin ubicación en tiempo real)`);
      return buses;
    }

    console.log('❌ No hay datos offline disponibles para buses');
    return [];
  }

  async getAlertas(municipioId?: string): Promise<Alerta[]> {
    try {
      // Intentar obtener alertas online primero
      if (networkService.isOnline()) {
        console.log('🌐 Obteniendo alertas online...');
        let alertasQuery = query(
          collection(db(), 'alertas'),
          where('activa', '==', true),
          orderBy('created_at', 'desc')
        );

        if (municipioId) {
          alertasQuery = query(
            collection(db(), 'alertas'),
            where('municipio_id', '==', municipioId),
            where('activa', '==', true),
            orderBy('created_at', 'desc')
          );
        }

        const snapshot = await getDocs(alertasQuery);
        const alertas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
          fecha_fin: doc.data().fecha_fin?.toDate() || null,
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Alerta[];

        console.log(`✅ Obtenidas ${alertas.length} alertas online`);
        return alertas;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo alertas online, usando datos offline:', error);
    }

    // Fallback a datos offline
    console.log('📱 Usando datos offline para alertas...');
    const offlineData = await offlineDataService.getOfflineData();
    if (offlineData?.alertas) {
      let alertas = offlineData.alertas;

      if (municipioId) {
        alertas = alertas.filter(a => a.municipio_id === municipioId);
      }

      // Filtrar alertas que aún están activas
      alertas = alertas.filter(a => {
        if (!a.fecha_fin) return true;
        return new Date() <= a.fecha_fin;
      });

      console.log(`✅ Obtenidas ${alertas.length} alertas offline`);
      return alertas;
    }

    console.log('❌ No hay datos offline disponibles para alertas');
    return [];
  }

  async getMunicipios(): Promise<Municipio[]> {
    try {
      // Intentar obtener municipios online
      if (networkService.isOnline()) {
        console.log('🌐 Obteniendo municipios online...');
        const snapshot = await getDocs(collection(db(), 'municipios'));
        const municipios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Municipio[];

        console.log(`✅ Obtenidos ${municipios.length} municipios online`);
        return municipios;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo municipios online, usando datos offline:', error);
    }

    // Fallback a datos offline
    console.log('📱 Usando datos offline para municipios...');
    const offlineData = await offlineDataService.getOfflineData();
    if (offlineData?.municipios) {
      console.log(`✅ Obtenidos ${offlineData.municipios.length} municipios offline`);
      return offlineData.municipios;
    }

    console.log('❌ No hay datos offline disponibles para municipios');
    return [];
  }

  async getDataSource(): Promise<'online' | 'offline' | 'unavailable'> {
    if (networkService.isOnline()) {
      return 'online';
    }

    const hasOfflineData = await offlineDataService.hasOfflineData();
    return hasOfflineData ? 'offline' : 'unavailable';
  }

  async findNearbyStops(
    latitude: number,
    longitude: number,
    radiusKm: number = 1,
    limitResults: number = 10
  ): Promise<Parada[]> {
    console.log(`🔍 Buscando paradas cerca de ${latitude}, ${longitude} (radio: ${radiusKm}km)`);

    const paradas = await this.getParadas();

    // Calcular distancia haversine
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const nearbyStops = paradas
      .map(parada => ({
        ...parada,
        distancia: calculateDistance(
          latitude,
          longitude,
          parada.ubicacion.latitud,
          parada.ubicacion.longitud
        )
      }))
      .filter(parada => parada.distancia <= radiusKm)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, limitResults);

    console.log(`✅ Encontradas ${nearbyStops.length} paradas cercanas`);
    return nearbyStops;
  }
}

// Singleton instance
export const hybridDataService = HybridDataService.getInstance();
export default hybridDataService;