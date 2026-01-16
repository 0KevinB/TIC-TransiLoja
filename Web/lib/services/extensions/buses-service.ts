/**
 * Buses Service (Extensión)
 *
 * Servicio para gestión de buses físicos de la flota.
 */

import { where, orderBy, Timestamp } from "firebase/firestore"
import { BaseService } from "../base-service"
import { Bus, BusSchema, BusCreate, validatePlateNumber } from "@/lib/schemas/extensions/buses"

class BusesService extends BaseService<Bus> {
  constructor() {
    super("ext_buses", BusSchema)
  }

  /**
   * Obtener buses por estado
   */
  async getByStatus(status: "active" | "maintenance" | "inactive" | "retired"): Promise<Bus[]> {
    return this.query(where("status", "==", status), orderBy("plateNumber", "asc"))
  }

  /**
   * Obtener buses activos
   */
  async getActiveBuses(): Promise<Bus[]> {
    return this.getByStatus("active")
  }

  /**
   * Obtener buses en mantenimiento
   */
  async getBusesInMaintenance(): Promise<Bus[]> {
    return this.getByStatus("maintenance")
  }

  /**
   * Obtener bus por placa
   */
  async getByPlateNumber(plateNumber: string): Promise<Bus | null> {
    const buses = await this.query(where("plateNumber", "==", plateNumber.toUpperCase()))
    return buses[0] || null
  }

  /**
   * Obtener buses por marca
   */
  async getByBrand(brand: string): Promise<Bus[]> {
    return this.query(where("brand", "==", brand), orderBy("year", "desc"))
  }

  /**
   * Obtener buses por modelo
   */
  async getByModel(model: string): Promise<Bus[]> {
    return this.query(where("model", "==", model))
  }

  /**
   * Obtener buses por tipo de combustible
   */
  async getByFuelType(
    fuelType: "diesel" | "gasoline" | "electric" | "hybrid" | "cng"
  ): Promise<Bus[]> {
    return this.query(where("fuelType", "==", fuelType))
  }

  /**
   * Obtener buses asignados a una ruta
   */
  async getByAssignedRoute(routeId: string): Promise<Bus[]> {
    return this.query(where("assignedRouteId", "==", routeId))
  }

  /**
   * Obtener buses sin asignar
   */
  async getUnassignedBuses(): Promise<Bus[]> {
    const allBuses = await this.getActiveBuses()
    return allBuses.filter((bus) => !bus.currentTripId)
  }

  /**
   * Obtener buses que necesitan mantenimiento pronto
   */
  async getBusesNeedingMaintenance(): Promise<Bus[]> {
    const allBuses = await this.getAll()
    const now = new Date()

    return allBuses.filter((bus) => {
      if (!bus.nextMaintenanceDate) return false
      const nextMaintenance = bus.nextMaintenanceDate.toDate()
      return nextMaintenance <= now
    })
  }

  /**
   * Crear bus con validación de placa
   */
  async createBus(data: BusCreate): Promise<Bus> {
    // Validar formato de placa
    if (!validatePlateNumber(data.plateNumber)) {
      throw new Error(`Formato de placa inválido: ${data.plateNumber}. Debe ser ABC-1234`)
    }

    // Verificar que la placa no esté duplicada
    const existing = await this.getByPlateNumber(data.plateNumber)
    if (existing) {
      throw new Error(`Ya existe un bus con la placa ${data.plateNumber}`)
    }

    // Normalizar placa a mayúsculas
    const normalizedData = {
      ...data,
      plateNumber: data.plateNumber.toUpperCase(),
    }

    return this.create(normalizedData)
  }

  /**
   * Asignar bus a un trip
   */
  async assignToTrip(busId: string, tripId: string): Promise<void> {
    // Verificar que el bus no esté asignado a otro trip
    const bus = await this.getById(busId)
    if (!bus) {
      throw new Error(`Bus ${busId} no encontrado`)
    }

    if (bus.currentTripId && bus.currentTripId !== tripId) {
      throw new Error(`Bus ${bus.plateNumber} ya está asignado al trip ${bus.currentTripId}`)
    }

    return this.update(busId, { currentTripId: tripId, status: "active" })
  }

  /**
   * Desasignar bus de un trip
   */
  async unassignFromTrip(busId: string): Promise<void> {
    return this.update(busId, { currentTripId: undefined })
  }

  /**
   * Poner bus en mantenimiento
   */
  async putInMaintenance(busId: string): Promise<void> {
    const bus = await this.getById(busId)
    if (!bus) {
      throw new Error(`Bus ${busId} no encontrado`)
    }

    if (bus.currentTripId) {
      throw new Error(
        `No se puede poner en mantenimiento el bus ${bus.plateNumber} porque está asignado a un trip`
      )
    }

    return this.update(busId, { status: "maintenance" })
  }

  /**
   * Activar bus después de mantenimiento
   */
  async activateAfterMaintenance(busId: string): Promise<void> {
    const now = new Date()

    return this.update(busId, {
      status: "active",
      lastMaintenanceDate: Timestamp.fromDate(now),
    })
  }

  /**
   * Buscar buses por texto (placa, marca, modelo)
   */
  async search(searchTerm: string): Promise<Bus[]> {
    const allBuses = await this.getAll()
    const lowerSearchTerm = searchTerm.toLowerCase()

    return allBuses.filter((bus) => {
      const plateNumber = bus.plateNumber.toLowerCase()
      const brand = bus.brand.toLowerCase()
      const model = bus.model.toLowerCase()

      return (
        plateNumber.includes(lowerSearchTerm) ||
        brand.includes(lowerSearchTerm) ||
        model.includes(lowerSearchTerm)
      )
    })
  }
}

// Exportar instancia singleton
export const busesService = new BusesService()
