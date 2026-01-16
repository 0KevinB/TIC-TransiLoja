import AsyncStorage from '@react-native-async-storage/async-storage';
import { Parada, Ruta, Alerta } from './types';

const STORAGE_KEYS = {
  PARADAS: '@transit_offline_paradas',
  RUTAS: '@transit_offline_rutas',
  ALERTAS: '@transit_offline_alertas',
  LAST_UPDATE: '@transit_offline_last_update',
  DOWNLOAD_SIZE: '@transit_offline_size',
};

export interface OfflineData {
  paradas: Parada[];
  rutas: Ruta[];
  alertas: Alerta[];
  lastUpdate: Date;
  downloadSize: number;
}

export const OfflineStorageService = {
  /**
   * Guardar datos de paradas offline
   */
  async saveParadas(paradas: Parada[]): Promise<void> {
    try {
      const data = JSON.stringify(paradas);
      await AsyncStorage.setItem(STORAGE_KEYS.PARADAS, data);
      console.log(`✅ Guardadas ${paradas.length} paradas offline`);
    } catch (error) {
      console.error('❌ Error saving paradas offline:', error);
      throw error;
    }
  },

  /**
   * Guardar datos de rutas offline
   */
  async saveRutas(rutas: Ruta[]): Promise<void> {
    try {
      const data = JSON.stringify(rutas);
      await AsyncStorage.setItem(STORAGE_KEYS.RUTAS, data);
      console.log(`✅ Guardadas ${rutas.length} rutas offline`);
    } catch (error) {
      console.error('❌ Error saving rutas offline:', error);
      throw error;
    }
  },

  /**
   * Guardar datos de alertas offline
   */
  async saveAlertas(alertas: Alerta[]): Promise<void> {
    try {
      const data = JSON.stringify(alertas);
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTAS, data);
      console.log(`✅ Guardadas ${alertas.length} alertas offline`);
    } catch (error) {
      console.error('❌ Error saving alertas offline:', error);
      throw error;
    }
  },

  /**
   * Guardar todos los datos offline
   */
  async saveAllData(paradas: Parada[], rutas: Ruta[], alertas: Alerta[]): Promise<void> {
    try {
      // Calcular tamaño aproximado
      const totalSize =
        JSON.stringify(paradas).length +
        JSON.stringify(rutas).length +
        JSON.stringify(alertas).length;

      // Guardar en paralelo
      await Promise.all([
        this.saveParadas(paradas),
        this.saveRutas(rutas),
        this.saveAlertas(alertas),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString()),
        AsyncStorage.setItem(STORAGE_KEYS.DOWNLOAD_SIZE, totalSize.toString()),
      ]);

      console.log(`✅ Datos offline guardados correctamente (${(totalSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error('❌ Error saving all data offline:', error);
      throw error;
    }
  },

  /**
   * Obtener paradas offline
   */
  async getParadas(): Promise<Parada[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PARADAS);
      if (!data) return [];

      const paradas = JSON.parse(data);

      // Convertir fechas de string a Date
      const paradasWithDates = paradas.map((parada: any) => ({
        ...parada,
        created_at: parada.created_at ? new Date(parada.created_at) : new Date(),
        updated_at: parada.updated_at ? new Date(parada.updated_at) : new Date(),
      }));

      console.log(`📥 Cargadas ${paradasWithDates.length} paradas offline`);
      return paradasWithDates;
    } catch (error) {
      console.error('❌ Error loading paradas offline:', error);
      return [];
    }
  },

  /**
   * Obtener rutas offline
   */
  async getRutas(): Promise<Ruta[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RUTAS);
      if (!data) return [];

      const rutas = JSON.parse(data);

      // Convertir fechas de string a Date
      const rutasWithDates = rutas.map((ruta: any) => ({
        ...ruta,
        created_at: ruta.created_at ? new Date(ruta.created_at) : new Date(),
        updated_at: ruta.updated_at ? new Date(ruta.updated_at) : new Date(),
      }));

      console.log(`📥 Cargadas ${rutasWithDates.length} rutas offline`);
      return rutasWithDates;
    } catch (error) {
      console.error('❌ Error loading rutas offline:', error);
      return [];
    }
  },

  /**
   * Obtener alertas offline
   */
  async getAlertas(): Promise<Alerta[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTAS);
      if (!data) return [];

      const alertas = JSON.parse(data);

      // Convertir fechas de string a Date
      const alertasWithDates = alertas.map((alerta: any) => ({
        ...alerta,
        fecha_inicio: alerta.fecha_inicio ? new Date(alerta.fecha_inicio) : new Date(),
        fecha_fin: alerta.fecha_fin ? new Date(alerta.fecha_fin) : undefined,
        created_at: alerta.created_at ? new Date(alerta.created_at) : new Date(),
        updated_at: alerta.updated_at ? new Date(alerta.updated_at) : new Date(),
      }));

      console.log(`📥 Cargadas ${alertasWithDates.length} alertas offline`);
      return alertasWithDates;
    } catch (error) {
      console.error('❌ Error loading alertas offline:', error);
      return [];
    }
  },

  /**
   * Obtener todos los datos offline
   */
  async getAllData(): Promise<OfflineData | null> {
    try {
      const [paradas, rutas, alertas, lastUpdateStr, sizeStr] = await Promise.all([
        this.getParadas(),
        this.getRutas(),
        this.getAlertas(),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SIZE),
      ]);

      if (!lastUpdateStr || paradas.length === 0) {
        return null;
      }

      return {
        paradas,
        rutas,
        alertas,
        lastUpdate: new Date(lastUpdateStr),
        downloadSize: parseInt(sizeStr || '0', 10),
      };
    } catch (error) {
      console.error('❌ Error loading all data offline:', error);
      return null;
    }
  },

  /**
   * Verificar si hay datos offline disponibles
   */
  async hasOfflineData(): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      return lastUpdate !== null;
    } catch (error) {
      console.error('❌ Error checking offline data:', error);
      return false;
    }
  },

  /**
   * Obtener información de los datos offline
   */
  async getOfflineInfo(): Promise<{ lastUpdate: Date | null; size: number }> {
    try {
      const [lastUpdateStr, sizeStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SIZE),
      ]);

      return {
        lastUpdate: lastUpdateStr ? new Date(lastUpdateStr) : null,
        size: parseInt(sizeStr || '0', 10),
      };
    } catch (error) {
      console.error('❌ Error getting offline info:', error);
      return { lastUpdate: null, size: 0 };
    }
  },

  /**
   * Limpiar todos los datos offline
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.PARADAS),
        AsyncStorage.removeItem(STORAGE_KEYS.RUTAS),
        AsyncStorage.removeItem(STORAGE_KEYS.ALERTAS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOAD_SIZE),
      ]);

      console.log('🗑️ Datos offline eliminados correctamente');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
      throw error;
    }
  },

  /**
   * Obtener tamaño total de datos offline en MB
   */
  async getStorageSizeMB(): Promise<number> {
    try {
      const sizeStr = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SIZE);
      const bytes = parseInt(sizeStr || '0', 10);
      return bytes / (1024 * 1024);
    } catch (error) {
      console.error('❌ Error getting storage size:', error);
      return 0;
    }
  },
};
