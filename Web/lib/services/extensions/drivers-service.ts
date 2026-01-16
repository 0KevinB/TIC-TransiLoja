/**
 * Drivers Service (Extensión)
 *
 * Servicio para gestión de conductores.
 */

import { where, orderBy } from "firebase/firestore"
import { BaseService } from "../base-service"
import {
  Driver,
  DriverSchema,
  DriverCreate,
  validateCedula,
  isLicenseExpired,
  isLicenseExpiringSoon,
  getFullName,
} from "@/lib/schemas/extensions/drivers"

class DriversService extends BaseService<Driver> {
  constructor() {
    super("ext_drivers", DriverSchema)
  }

  /**
   * Obtener conductores por estado
   */
  async getByStatus(
    status: "active" | "on_leave" | "suspended" | "inactive"
  ): Promise<Driver[]> {
    return this.query(where("status", "==", status), orderBy("apellido", "asc"))
  }

  /**
   * Obtener conductores activos
   */
  async getActiveDrivers(): Promise<Driver[]> {
    return this.getByStatus("active")
  }

  /**
   * Obtener conductor por cédula
   */
  async getByCedula(cedula: string): Promise<Driver | null> {
    const drivers = await this.query(where("cedula", "==", cedula))
    return drivers[0] || null
  }

  /**
   * Obtener conductor por número de licencia
   */
  async getByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    const drivers = await this.query(where("numero_licencia", "==", licenseNumber))
    return drivers[0] || null
  }

  /**
   * Obtener conductores por tipo de licencia
   */
  async getByLicenseType(licenseType: "A" | "B" | "C" | "D" | "E"): Promise<Driver[]> {
    return this.query(where("tipo_licencia", "==", licenseType))
  }

  /**
   * Obtener conductores asignados a un bus
   */
  async getByAssignedBus(busId: string): Promise<Driver[]> {
    return this.query(where("assignedBusId", "==", busId))
  }

  /**
   * Obtener conductores sin asignar
   */
  async getUnassignedDrivers(): Promise<Driver[]> {
    const allDrivers = await this.getActiveDrivers()
    return allDrivers.filter((driver) => !driver.currentTripId)
  }

  /**
   * Obtener conductores con licencia vencida
   */
  async getWithExpiredLicense(): Promise<Driver[]> {
    const allDrivers = await this.getAll()
    return allDrivers.filter((driver) => isLicenseExpired(driver))
  }

  /**
   * Obtener conductores con licencia por vencer
   */
  async getWithLicenseExpiringSoon(daysThreshold: number = 30): Promise<Driver[]> {
    const allDrivers = await this.getActiveDrivers()
    return allDrivers.filter((driver) => isLicenseExpiringSoon(driver, daysThreshold))
  }

  /**
   * Crear conductor con validación de cédula
   */
  async createDriver(data: DriverCreate): Promise<Driver> {
    // Validar cédula ecuatoriana
    if (!validateCedula(data.cedula)) {
      throw new Error(`Cédula inválida: ${data.cedula}`)
    }

    // Verificar que la cédula no esté duplicada
    const existingByCedula = await this.getByCedula(data.cedula)
    if (existingByCedula) {
      throw new Error(`Ya existe un conductor con la cédula ${data.cedula}`)
    }

    // Verificar que el número de licencia no esté duplicado
    const existingByLicense = await this.getByLicenseNumber(data.numero_licencia)
    if (existingByLicense) {
      throw new Error(`Ya existe un conductor con el número de licencia ${data.numero_licencia}`)
    }

    // Verificar que la licencia no esté vencida
    const expirationDate = data.fecha_vencimiento_licencia.toDate()
    if (expirationDate <= new Date()) {
      throw new Error("No se puede crear un conductor con licencia vencida")
    }

    return this.create(data)
  }

  /**
   * Asignar conductor a un trip
   */
  async assignToTrip(driverId: string, tripId: string): Promise<void> {
    // Verificar que el conductor no esté asignado a otro trip
    const driver = await this.getById(driverId)
    if (!driver) {
      throw new Error(`Conductor ${driverId} no encontrado`)
    }

    if (driver.currentTripId && driver.currentTripId !== tripId) {
      throw new Error(
        `${getFullName(driver)} ya está asignado al trip ${driver.currentTripId}`
      )
    }

    // Verificar que la licencia no esté vencida
    if (isLicenseExpired(driver)) {
      throw new Error(`${getFullName(driver)} tiene la licencia vencida`)
    }

    return this.update(driverId, { currentTripId: tripId })
  }

  /**
   * Desasignar conductor de un trip
   */
  async unassignFromTrip(driverId: string): Promise<void> {
    return this.update(driverId, { currentTripId: undefined })
  }

  /**
   * Suspender conductor
   */
  async suspend(driverId: string): Promise<void> {
    const driver = await this.getById(driverId)
    if (!driver) {
      throw new Error(`Conductor ${driverId} no encontrado`)
    }

    if (driver.currentTripId) {
      throw new Error(
        `No se puede suspender a ${getFullName(driver)} porque está asignado a un trip`
      )
    }

    return this.update(driverId, { status: "suspended" })
  }

  /**
   * Activar conductor
   */
  async activate(driverId: string): Promise<void> {
    const driver = await this.getById(driverId)
    if (!driver) {
      throw new Error(`Conductor ${driverId} no encontrado`)
    }

    // Verificar que la licencia no esté vencida
    if (isLicenseExpired(driver)) {
      throw new Error(
        `No se puede activar a ${getFullName(driver)} porque tiene la licencia vencida`
      )
    }

    return this.update(driverId, { status: "active" })
  }

  /**
   * Buscar conductores por texto (nombre, apellido, cédula)
   */
  async search(searchTerm: string): Promise<Driver[]> {
    const allDrivers = await this.getAll()
    const lowerSearchTerm = searchTerm.toLowerCase()

    return allDrivers.filter((driver) => {
      const nombre = driver.nombre.toLowerCase()
      const apellido = driver.apellido.toLowerCase()
      const cedula = driver.cedula

      return (
        nombre.includes(lowerSearchTerm) ||
        apellido.includes(lowerSearchTerm) ||
        cedula.includes(searchTerm)
      )
    })
  }
}

// Exportar instancia singleton
export const driversService = new DriversService()
