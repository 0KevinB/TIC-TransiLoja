import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Parada, Ruta, Bus, Alerta, Municipio, Conductor, AsignacionServicio, Calendario } from './types';
import { ConfiguracionVisual } from '../hooks/useAppConfiguration';

export interface OfflineData {
  paradas: Parada[];
  rutas: Ruta[];
  buses: Bus[];
  alertas: Alerta[];
  municipios: Municipio[];
  conductores: Conductor[];
  calendarios: Calendario[];
  asignaciones: AsignacionServicio[];
  configuracion: ConfiguracionVisual | null;
  downloadedAt: Date;
  version: string;
}

export interface DownloadProgress {
  collection: string;
  current: number;
  total: number;
  progress: number;
}

class OfflineDataService {
  private readonly STORAGE_KEY = '@TransiLoja:offline_data';
  private readonly VERSION_KEY = '@TransiLoja:offline_version';
  private readonly CURRENT_VERSION = '1.0.0';

  async downloadData(
    onProgress?: (progress: DownloadProgress) => void,
    municipioId?: string
  ): Promise<void> {
    try {
      const collections = ['configuracion', 'municipios', 'paradas', 'rutas', 'buses', 'conductores', 'calendarios', 'asignaciones', 'alertas'];
      const data: Partial<OfflineData> = {};
      let totalCollections = collections.length;
      let currentCollection = 0;

      // Descargar configuración de la app primero
      onProgress?.({
        collection: 'configuracion',
        current: 0,
        total: totalCollections,
        progress: 0
      });

      try {
        const configRef = collection(db(), 'configuracion_app');
        const configQuery = query(configRef, where('activa', '==', true));
        const configSnap = await getDocs(configQuery);

        if (!configSnap.empty) {
          const configData = configSnap.docs[0].data();
          data.configuracion = {
            nombre_app: configData.nombre_app || 'TransiLoja',
            logo_url: configData.logo_url || '',
            color_primario: configData.color_primario || '#0ea5e9',
            color_secundario: configData.color_secundario || '#64748b'
          };
        } else {
          data.configuracion = null;
        }
      } catch (error) {
        console.error('Error descargando configuración:', error);
        data.configuracion = null;
      }

      currentCollection++;
      onProgress?.({
        collection: 'configuracion',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar municipios
      onProgress?.({
        collection: 'municipios',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      const municipiosSnapshot = await getDocs(collection(db(), 'municipios'));
      data.municipios = municipiosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Municipio[];

      currentCollection++;
      onProgress?.({
        collection: 'municipios',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Si no se especifica municipio, usar el primero disponible o todos
      const targetMunicipioId = municipioId || data.municipios?.[0]?.id;

      // Descargar paradas
      onProgress?.({
        collection: 'paradas',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      let paradasQuery = collection(db(), 'paradas');
      if (targetMunicipioId) {
        paradasQuery = query(paradasQuery, where('municipio_id', '==', targetMunicipioId));
      }

      const paradasSnapshot = await getDocs(paradasQuery);
      data.paradas = paradasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Parada[];

      currentCollection++;
      onProgress?.({
        collection: 'paradas',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar rutas
      onProgress?.({
        collection: 'rutas',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      let rutasQuery = collection(db(), 'rutas');
      if (targetMunicipioId) {
        rutasQuery = query(rutasQuery, where('municipio_id', '==', targetMunicipioId));
      }

      const rutasSnapshot = await getDocs(rutasQuery);
      data.rutas = rutasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Ruta[];

      currentCollection++;
      onProgress?.({
        collection: 'rutas',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar buses
      onProgress?.({
        collection: 'buses',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      let busesQuery = collection(db(), 'buses');
      if (targetMunicipioId) {
        busesQuery = query(busesQuery, where('municipio_id', '==', targetMunicipioId));
      }

      const busesSnapshot = await getDocs(busesQuery);
      data.buses = busesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Bus[];

      currentCollection++;
      onProgress?.({
        collection: 'buses',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar conductores
      onProgress?.({
        collection: 'conductores',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      let conductoresQuery = collection(db(), 'conductores');
      if (targetMunicipioId) {
        conductoresQuery = query(conductoresQuery, where('municipio_id', '==', targetMunicipioId));
      }

      const conductoresSnapshot = await getDocs(conductoresQuery);
      data.conductores = conductoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
        fecha_nacimiento: doc.data().fecha_nacimiento?.toDate(),
        licencia_vencimiento: doc.data().licencia_vencimiento?.toDate() || doc.data().fecha_vencimiento_licencia?.toDate(),
      })) as Conductor[];

      currentCollection++;
      onProgress?.({
        collection: 'conductores',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar calendarios (horarios)
      onProgress?.({
        collection: 'calendarios',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      const calendariosSnapshot = await getDocs(collection(db(), 'calendars'));
      data.calendarios = calendariosSnapshot.docs.map(doc => {
        const calData = doc.data();
        return {
          id: doc.id,
          name: calData.name || '',
          routeId: calData.routeId || null,
          operatingStartTime: calData.operatingStartTime || null,
          operatingEndTime: calData.operatingEndTime || null,
          monday: calData.monday || false,
          tuesday: calData.tuesday || false,
          wednesday: calData.wednesday || false,
          thursday: calData.thursday || false,
          friday: calData.friday || false,
          saturday: calData.saturday || false,
          sunday: calData.sunday || false,
          startDate: calData.startDate?.toDate() || new Date(),
          endDate: calData.endDate?.toDate() || new Date(),
          holidays: calData.holidays || [],
          createdAt: calData.createdAt,
          updatedAt: calData.updatedAt,
        };
      }) as Calendario[];

      currentCollection++;
      onProgress?.({
        collection: 'calendarios',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar asignaciones (trips)
      onProgress?.({
        collection: 'asignaciones',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      const tripsSnapshot = await getDocs(collection(db(), 'trips'));
      data.asignaciones = tripsSnapshot.docs.map(doc => {
        const tripData = doc.data();
        return {
          id: doc.id,
          routeId: tripData.routeId,
          busId: tripData.busId,
          conductorId: tripData.conductorId,
          calendarId: tripData.calendarId,
          headsign: tripData.headsign,
          direction: tripData.direction,
          startTime: tripData.startTime || '00:00',
          endTime: tripData.endTime || '23:59',
          frequency: tripData.frequency,
          createdAt: tripData.createdAt,
          updatedAt: tripData.updatedAt,
        };
      }) as AsignacionServicio[];

      currentCollection++;
      onProgress?.({
        collection: 'asignaciones',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      // Descargar alertas activas
      onProgress?.({
        collection: 'alertas',
        current: currentCollection,
        total: totalCollections,
        progress: (currentCollection / totalCollections) * 100
      });

      let alertasQuery = query(collection(db(), 'alertas'), where('activa', '==', true));
      if (targetMunicipioId) {
        alertasQuery = query(alertasQuery,
          where('municipio_id', '==', targetMunicipioId),
          where('activa', '==', true)
        );
      }

      const alertasSnapshot = await getDocs(alertasQuery);
      data.alertas = alertasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
        fecha_fin: doc.data().fecha_fin?.toDate() || null,
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Alerta[];

      currentCollection++;
      onProgress?.({
        collection: 'alertas',
        current: currentCollection,
        total: totalCollections,
        progress: 100
      });

      // Preparar datos finales
      const offlineData: OfflineData = {
        paradas: data.paradas || [],
        rutas: data.rutas || [],
        buses: data.buses || [],
        alertas: data.alertas || [],
        municipios: data.municipios || [],
        conductores: data.conductores || [],
        calendarios: data.calendarios || [],
        asignaciones: data.asignaciones || [],
        configuracion: data.configuracion || null,
        downloadedAt: new Date(),
        version: this.CURRENT_VERSION
      };

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
      await AsyncStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);

      console.log('✅ Datos offline descargados exitosamente:', {
        configuracion: offlineData.configuracion ? 'Sí' : 'No',
        paradas: offlineData.paradas.length,
        rutas: offlineData.rutas.length,
        buses: offlineData.buses.length,
        conductores: offlineData.conductores.length,
        calendarios: offlineData.calendarios.length,
        asignaciones: offlineData.asignaciones.length,
        alertas: offlineData.alertas.length,
        municipios: offlineData.municipios.length
      });

    } catch (error) {
      console.error('❌ Error descargando datos offline:', error);
      throw new Error('No se pudieron descargar los datos offline. Verifica tu conexión a internet.');
    }
  }

  async getOfflineData(): Promise<OfflineData | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsedData = JSON.parse(data) as OfflineData;

      // Convertir fechas de strings a Date objects
      parsedData.downloadedAt = new Date(parsedData.downloadedAt);
      parsedData.paradas = parsedData.paradas.map(p => ({
        ...p,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at)
      }));
      parsedData.rutas = parsedData.rutas.map(r => ({
        ...r,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      }));
      parsedData.buses = parsedData.buses.map(b => ({
        ...b,
        created_at: new Date(b.created_at),
        updated_at: new Date(b.updated_at)
      }));
      parsedData.alertas = parsedData.alertas.map(a => ({
        ...a,
        fecha_inicio: new Date(a.fecha_inicio),
        fecha_fin: a.fecha_fin ? new Date(a.fecha_fin) : undefined,
        created_at: new Date(a.created_at),
        updated_at: new Date(a.updated_at)
      }));
      parsedData.municipios = parsedData.municipios.map(m => ({
        ...m,
        created_at: new Date(m.created_at),
        updated_at: new Date(m.updated_at)
      }));

      // Convertir fechas de conductores
      parsedData.conductores = (parsedData.conductores || []).map(c => ({
        ...c,
        created_at: c.created_at ? new Date(c.created_at) : new Date(),
        updated_at: c.updated_at ? new Date(c.updated_at) : new Date(),
        fecha_nacimiento: c.fecha_nacimiento ? new Date(c.fecha_nacimiento) : undefined,
        licencia_vencimiento: c.licencia_vencimiento ? new Date(c.licencia_vencimiento) : undefined,
      }));

      // Convertir fechas de calendarios
      parsedData.calendarios = (parsedData.calendarios || []).map(cal => ({
        ...cal,
        startDate: new Date(cal.startDate),
        endDate: new Date(cal.endDate),
      }));

      // Asignaciones no tienen fechas que convertir además de las timestamps
      parsedData.asignaciones = parsedData.asignaciones || [];

      return parsedData;
    } catch (error) {
      console.error('Error obteniendo datos offline:', error);
      return null;
    }
  }

  async hasOfflineData(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data !== null;
    } catch {
      return false;
    }
  }

  async getDataSize(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return '0 KB';

      const sizeInBytes = new Blob([data]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB >= 1) {
        return `${sizeInMB.toFixed(1)} MB`;
      }

      const sizeInKB = sizeInBytes / 1024;
      return `${sizeInKB.toFixed(0)} KB`;
    } catch {
      return '0 KB';
    }
  }

  async getDownloadInfo(): Promise<{
    hasData: boolean;
    downloadedAt?: Date;
    version?: string;
    size: string;
    itemCounts?: {
      paradas: number;
      rutas: number;
      buses: number;
      conductores: number;
      calendarios: number;
      asignaciones: number;
      alertas: number;
      municipios: number;
      configuracion: boolean;
    };
  }> {
    const hasData = await this.hasOfflineData();
    const size = await this.getDataSize();

    if (!hasData) {
      return { hasData: false, size };
    }

    const data = await this.getOfflineData();
    if (!data) {
      return { hasData: false, size };
    }

    return {
      hasData: true,
      downloadedAt: data.downloadedAt,
      version: data.version,
      size,
      itemCounts: {
        paradas: data.paradas.length,
        rutas: data.rutas.length,
        buses: data.buses.length,
        conductores: data.conductores?.length || 0,
        calendarios: data.calendarios?.length || 0,
        asignaciones: data.asignaciones?.length || 0,
        alertas: data.alertas.length,
        municipios: data.municipios.length,
        configuracion: data.configuracion !== null
      }
    };
  }

  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.VERSION_KEY);
      console.log('🗑️ Datos offline eliminados');
    } catch (error) {
      console.error('Error eliminando datos offline:', error);
      throw error;
    }
  }

  async isDataStale(maxAgeHours: number = 24): Promise<boolean> {
    const data = await this.getOfflineData();
    if (!data) return true;

    const ageInHours = (Date.now() - data.downloadedAt.getTime()) / (1000 * 60 * 60);
    return ageInHours > maxAgeHours;
  }
}

export const offlineDataService = new OfflineDataService();
export default offlineDataService;