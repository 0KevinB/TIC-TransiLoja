/**
 * Routes Service (GTFS)
 *
 * Servicio para gestión de rutas de transporte.
 */

import { where, orderBy } from "firebase/firestore"
import { BaseService } from "../base-service"
import { GTFSRoute, GTFSRouteSchema, GTFSRouteCreate } from "@/lib/schemas/gtfs/routes"

class RoutesService extends BaseService<GTFSRoute> {
  constructor() {
    super("gtfs_routes", GTFSRouteSchema)
  }

  /**
   * Obtener rutas por tipo (bus, metro, etc.)
   */
  async getByType(routeType: string): Promise<GTFSRoute[]> {
    return this.query(where("route_type", "==", routeType))
  }

  /**
   * Obtener solo rutas de bus
   */
  async getBusRoutes(): Promise<GTFSRoute[]> {
    return this.getByType("3")
  }

  /**
   * Obtener rutas por agencia
   */
  async getByAgency(agencyId: string): Promise<GTFSRoute[]> {
    return this.query(where("agency_id", "==", agencyId))
  }

  /**
   * Buscar rutas por nombre corto o largo
   */
  async searchByName(searchTerm: string): Promise<GTFSRoute[]> {
    const allRoutes = await this.getAll()
    const lowerSearchTerm = searchTerm.toLowerCase()

    return allRoutes.filter((route) => {
      const shortName = route.route_short_name?.toLowerCase() || ""
      const longName = route.route_long_name?.toLowerCase() || ""
      return shortName.includes(lowerSearchTerm) || longName.includes(lowerSearchTerm)
    })
  }

  /**
   * Obtener rutas ordenadas por route_sort_order
   */
  async getAllSorted(): Promise<GTFSRoute[]> {
    return this.query(orderBy("route_sort_order", "asc"))
  }

  /**
   * Validar que al menos uno de route_short_name o route_long_name esté presente
   */
  async createRoute(data: GTFSRouteCreate): Promise<GTFSRoute> {
    if (!data.route_short_name && !data.route_long_name) {
      throw new Error("Debe proporcionar route_short_name o route_long_name (o ambos)")
    }

    return this.create(data)
  }

  /**
   * Obtener nombre completo de la ruta (short + long)
   */
  getDisplayName(route: GTFSRoute): string {
    if (route.route_short_name && route.route_long_name) {
      return `${route.route_short_name} - ${route.route_long_name}`
    }
    return route.route_short_name || route.route_long_name || route.route_id
  }

  /**
   * Obtener color de la ruta con #
   */
  getRouteColorHex(route: GTFSRoute): string {
    return `#${route.route_color || "FFFFFF"}`
  }

  /**
   * Obtener color de texto de la ruta con #
   */
  getRouteTextColorHex(route: GTFSRoute): string {
    return `#${route.route_text_color || "000000"}`
  }
}

// Exportar instancia singleton
export const routesService = new RoutesService()
