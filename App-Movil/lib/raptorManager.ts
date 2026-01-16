import { RAPTORAlgorithm } from './raptor';
import type { RutaOptima, Parada, Ruta, Bus } from './types';

/**
 * Manager para gestionar el algoritmo RAPTOR
 */
export class RaptorManager {
  private raptor: RAPTORAlgorithm | null = null;

  constructor(private paradas: Parada[], private rutas: Ruta[], private buses: Bus[]) {
    this.initializeAlgorithm();
  }

  private initializeAlgorithm() {
    // Inicializar el algoritmo RAPTOR
    this.raptor = new RAPTORAlgorithm(this.paradas, this.rutas, this.buses);
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  async precargarDistancias(): Promise<void> {
    // No hace nada - mantenido por compatibilidad con código existente
    return Promise.resolve();
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  setUseEnhanced(useEnhanced: boolean) {
    // No hace nada - solo hay una versión
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  isUsingEnhanced(): boolean {
    return false;
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  isPreloadingDistances(): boolean {
    return false;
  }

  /**
   * Encontrar ruta óptima usando el algoritmo RAPTOR
   */
  async encontrarRutaOptima(
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    horaInicio: Date = new Date()
  ): Promise<RutaOptima[]> {
    if (!this.raptor) {
      throw new Error('Algoritmo RAPTOR no inicializado');
    }

    return this.raptor.encontrarRutaOptima(
      origenLat,
      origenLng,
      destinoLat,
      destinoLng,
      horaInicio
    );
  }

  /**
   * Actualizar datos del sistema de transporte
   */
  actualizarDatos(paradas: Parada[], rutas: Ruta[], buses: Bus[]) {
    this.paradas = paradas;
    this.rutas = rutas;
    this.buses = buses;
    this.initializeAlgorithm();
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  getCacheStats() {
    return null;
  }

  /**
   * Método legacy - mantenido por compatibilidad
   */
  async clearCache() {
    return Promise.resolve();
  }
}

// Instancia singleton para uso global
let globalRaptorManager: RaptorManager | null = null;

export function initializeRaptorManager(paradas: Parada[], rutas: Ruta[], buses: Bus[]): RaptorManager {
  globalRaptorManager = new RaptorManager(paradas, rutas, buses);
  return globalRaptorManager;
}

export function getRaptorManager(): RaptorManager | null {
  return globalRaptorManager;
}