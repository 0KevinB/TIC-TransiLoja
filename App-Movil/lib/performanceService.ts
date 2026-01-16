/**
 * Servicio de Firebase Performance Monitoring
 * Mide métricas de rendimiento de la app en tiempo real
 */

import perf from '@react-native-firebase/perf';

/**
 * Wrapper para traces de Firebase Performance
 */
export class PerformanceService {
  private static instance: PerformanceService;

  private constructor() {}

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Crear un trace de performance
   */
  async startTrace(traceName: string) {
    try {
      const trace = await perf().startTrace(traceName);
      return trace;
    } catch (error) {
      console.warn(`Error iniciando trace ${traceName}:`, error);
      return null;
    }
  }

  /**
   * Medir el tiempo de inicio de la app
   */
  async measureAppStart() {
    const trace = await this.startTrace('app_start');
    if (!trace) return null;

    // El trace se detendrá cuando llames a trace.stop()
    return trace;
  }

  /**
   * Medir navegación entre pantallas
   */
  async measureScreenTransition(fromScreen: string, toScreen: string) {
    const trace = await this.startTrace(`screen_${fromScreen}_to_${toScreen}`);
    if (!trace) return null;

    trace.putAttribute('from_screen', fromScreen);
    trace.putAttribute('to_screen', toScreen);

    return trace;
  }

  /**
   * Medir operaciones de Firestore
   */
  async measureFirestoreOperation(
    operation: 'read' | 'write' | 'query',
    collection: string
  ) {
    const trace = await this.startTrace(`firestore_${operation}_${collection}`);
    if (!trace) return null;

    trace.putAttribute('operation', operation);
    trace.putAttribute('collection', collection);

    return trace;
  }

  /**
   * Medir algoritmo RAPTOR
   */
  async measureRaptorCalculation() {
    const trace = await this.startTrace('raptor_calculate_route');
    if (!trace) return null;

    return trace;
  }

  /**
   * Medir autenticación
   */
  async measureAuth(method: 'email' | 'google' | 'anonymous') {
    const trace = await this.startTrace('auth_sign_in');
    if (!trace) return null;

    trace.putAttribute('auth_method', method);

    return trace;
  }

  /**
   * Medir carga de datos desde caché
   */
  async measureCacheOperation(operation: 'read' | 'write') {
    const trace = await this.startTrace(`cache_${operation}`);
    if (!trace) return null;

    trace.putAttribute('storage', 'async_storage');

    return trace;
  }

  /**
   * Medir actualización GPS
   */
  async measureGPSUpdate() {
    const trace = await this.startTrace('gps_update');
    if (!trace) return null;

    return trace;
  }

  /**
   * HTTP Metrics - Automático para fetch/axios
   */
  async createHttpMetric(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
    try {
      const metric = await perf().newHttpMetric(url, method);
      return metric;
    } catch (error) {
      console.warn(`Error creando HTTP metric para ${url}:`, error);
      return null;
    }
  }

  /**
   * Verificar si Performance está habilitado
   */
  async isPerformanceCollectionEnabled(): Promise<boolean> {
    try {
      return await perf().isPerformanceCollectionEnabled();
    } catch (error) {
      console.warn('Error verificando Performance collection:', error);
      return false;
    }
  }

  /**
   * Habilitar/deshabilitar Performance collection
   */
  async setPerformanceCollectionEnabled(enabled: boolean) {
    try {
      await perf().setPerformanceCollectionEnabled(enabled);
    } catch (error) {
      console.warn('Error configurando Performance collection:', error);
    }
  }
}

export default PerformanceService.getInstance();
