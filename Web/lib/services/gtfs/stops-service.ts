/**
 * Stops Service (GTFS)
 *
 * Servicio para gestión de paradas/estaciones de transporte.
 */

import { where, orderBy } from "firebase/firestore"
import { BaseService } from "../base-service"
import { GTFSStop, GTFSStopSchema, GTFSStopCreate } from "@/lib/schemas/gtfs/stops"

class StopsService extends BaseService<GTFSStop> {
  constructor() {
    super("gtfs_stops", GTFSStopSchema)
  }

  /**
   * Obtener paradas por tipo de ubicación
   */
  async getByLocationType(locationType: "0" | "1" | "2" | "3" | "4"): Promise<GTFSStop[]> {
    return this.query(where("location_type", "==", locationType))
  }

  /**
   * Obtener solo paradas físicas (no estaciones ni nodos)
   */
  async getPhysicalStops(): Promise<GTFSStop[]> {
    return this.getByLocationType("0")
  }

  /**
   * Obtener solo estaciones
   */
  async getStations(): Promise<GTFSStop[]> {
    return this.getByLocationType("1")
  }

  /**
   * Obtener paradas accesibles para sillas de ruedas
   */
  async getWheelchairAccessibleStops(): Promise<GTFSStop[]> {
    return this.query(where("wheelchair_boarding", "==", "1"))
  }

  /**
   * Obtener puntos de conexión/transferencia
   */
  async getTransferPoints(): Promise<GTFSStop[]> {
    return this.query(where("es_punto_conexion", "==", true))
  }

  /**
   * Obtener paradas por estación padre
   */
  async getStopsByParentStation(parentStationId: string): Promise<GTFSStop[]> {
    return this.query(where("parent_station", "==", parentStationId))
  }

  /**
   * Buscar paradas por nombre (búsqueda aproximada)
   * Nota: Firestore no soporta búsqueda full-text, este es un approach básico
   */
  async searchByName(searchTerm: string): Promise<GTFSStop[]> {
    const allStops = await this.getAll()
    const lowerSearchTerm = searchTerm.toLowerCase()

    return allStops.filter((stop) =>
      stop.stop_name.toLowerCase().includes(lowerSearchTerm)
    )
  }

  /**
   * Obtener paradas cercanas a una coordenada
   * Nota: Esto requiere cálculo en cliente, en producción considerar usar Geohashing o GeoFirestore
   */
  async getNearbyStops(
    lat: number,
    lon: number,
    radiusKm: number = 1
  ): Promise<Array<GTFSStop & { distance: number }>> {
    const allStops = await this.getPhysicalStops()

    const stopsWithDistance = allStops
      .map((stop) => {
        if (!stop.stop_lat || !stop.stop_lon) return null

        const distance = this.calculateDistance(
          lat,
          lon,
          stop.stop_lat,
          stop.stop_lon
        )

        return { ...stop, distance }
      })
      .filter((stop): stop is GTFSStop & { distance: number } => stop !== null)
      .filter((stop) => stop.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)

    return stopsWithDistance
  }

  /**
   * Calcular distancia entre dos coordenadas usando Haversine
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convertir grados a radianes
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Validar que las coordenadas sean válidas antes de crear
   */
  async createStop(data: GTFSStopCreate): Promise<GTFSStop> {
    // Validar que si es parada física tiene coordenadas
    if (
      ["0", "1", "2"].includes(data.location_type || "0") &&
      (!data.stop_lat || !data.stop_lon)
    ) {
      throw new Error("Las paradas físicas requieren coordenadas (stop_lat y stop_lon)")
    }

    return this.create(data)
  }
}

// Exportar instancia singleton
export const stopsService = new StopsService()
