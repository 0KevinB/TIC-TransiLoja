/**
 * Trips Service (GTFS)
 *
 * Servicio para gestión de viajes individuales.
 */

import { where, orderBy } from "firebase/firestore"
import { BaseService } from "../base-service"
import { GTFSTrip, GTFSTripSchema, GTFSTripCreate } from "@/lib/schemas/gtfs/trips"

class TripsService extends BaseService<GTFSTrip> {
  constructor() {
    super("gtfs_trips", GTFSTripSchema)
  }

  /**
   * Obtener trips por ruta
   */
  async getByRoute(routeId: string): Promise<GTFSTrip[]> {
    return this.query(where("route_id", "==", routeId), orderBy("trip_headsign", "asc"))
  }

  /**
   * Obtener trips por servicio (calendario)
   */
  async getByService(serviceId: string): Promise<GTFSTrip[]> {
    return this.query(where("service_id", "==", serviceId))
  }

  /**
   * Obtener trips por dirección
   */
  async getByDirection(routeId: string, directionId: "0" | "1"): Promise<GTFSTrip[]> {
    return this.query(
      where("route_id", "==", routeId),
      where("direction_id", "==", directionId)
    )
  }

  /**
   * Obtener trips de ida (outbound)
   */
  async getOutboundTrips(routeId: string): Promise<GTFSTrip[]> {
    return this.getByDirection(routeId, "0")
  }

  /**
   * Obtener trips de vuelta (inbound)
   */
  async getInboundTrips(routeId: string): Promise<GTFSTrip[]> {
    return this.getByDirection(routeId, "1")
  }

  /**
   * Obtener trips por shape
   */
  async getByShape(shapeId: string): Promise<GTFSTrip[]> {
    return this.query(where("shape_id", "==", shapeId))
  }

  /**
   * Obtener trips accesibles para sillas de ruedas
   */
  async getWheelchairAccessibleTrips(routeId?: string): Promise<GTFSTrip[]> {
    const constraints = [where("wheelchair_accessible", "==", "1")]

    if (routeId) {
      constraints.push(where("route_id", "==", routeId))
    }

    return this.query(...constraints)
  }

  /**
   * Obtener trips que permiten bicicletas
   */
  async getBikeFriendlyTrips(routeId?: string): Promise<GTFSTrip[]> {
    const constraints = [where("bikes_allowed", "==", "1")]

    if (routeId) {
      constraints.push(where("route_id", "==", routeId))
    }

    return this.query(...constraints)
  }

  /**
   * EXTENSIONES: Obtener trips por bus asignado
   */
  async getByAssignedBus(busId: string): Promise<GTFSTrip[]> {
    return this.query(where("assigned_bus_id", "==", busId))
  }

  /**
   * EXTENSIONES: Obtener trips por conductor asignado
   */
  async getByAssignedDriver(driverId: string): Promise<GTFSTrip[]> {
    return this.query(where("assigned_driver_id", "==", driverId))
  }

  /**
   * EXTENSIONES: Obtener trips por estado
   */
  async getByStatus(status: "scheduled" | "active" | "completed" | "cancelled"): Promise<GTFSTrip[]> {
    return this.query(where("status", "==", status), orderBy("createdAt", "desc"))
  }

  /**
   * EXTENSIONES: Obtener trips activos
   */
  async getActiveTrips(): Promise<GTFSTrip[]> {
    return this.getByStatus("active")
  }

  /**
   * EXTENSIONES: Asignar bus a un trip
   */
  async assignBus(tripId: string, busId: string): Promise<void> {
    return this.update(tripId, { assigned_bus_id: busId })
  }

  /**
   * EXTENSIONES: Asignar conductor a un trip
   */
  async assignDriver(tripId: string, driverId: string): Promise<void> {
    return this.update(tripId, { assigned_driver_id: driverId })
  }

  /**
   * EXTENSIONES: Desasignar bus de un trip
   */
  async unassignBus(tripId: string): Promise<void> {
    return this.update(tripId, { assigned_bus_id: undefined })
  }

  /**
   * EXTENSIONES: Desasignar conductor de un trip
   */
  async unassignDriver(tripId: string): Promise<void> {
    return this.update(tripId, { assigned_driver_id: undefined })
  }

  /**
   * EXTENSIONES: Cambiar estado de un trip
   */
  async updateStatus(
    tripId: string,
    status: "scheduled" | "active" | "completed" | "cancelled"
  ): Promise<void> {
    return this.update(tripId, { status })
  }

  /**
   * EXTENSIONES: Activar un trip
   */
  async activateTrip(tripId: string): Promise<void> {
    return this.updateStatus(tripId, "active")
  }

  /**
   * EXTENSIONES: Completar un trip
   */
  async completeTrip(tripId: string): Promise<void> {
    return this.updateStatus(tripId, "completed")
  }

  /**
   * EXTENSIONES: Cancelar un trip
   */
  async cancelTrip(tripId: string): Promise<void> {
    return this.updateStatus(tripId, "cancelled")
  }
}

// Exportar instancia singleton
export const tripsService = new TripsService()
