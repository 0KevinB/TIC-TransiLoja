/**
 * GTFS Fare Rules Schema
 * Especificación: https://gtfs.org/schedule/reference/#fare_rulestxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Schema GTFS estándar para Fare Rules
 */
export const GTFSFareRuleSchema = z.object({
  // GTFS Required fields
  fare_id: z.string(),

  // GTFS Optional fields (al menos uno debe estar presente)
  route_id: z.string().optional(),
  origin_id: z.string().optional(),
  destination_id: z.string().optional(),
  contains_id: z.string().optional(),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
}).refine(
  (data) => {
    // Al menos uno de los campos opcionales debe estar presente
    return data.route_id || data.origin_id || data.destination_id || data.contains_id
  },
  {
    message:
      "Al menos uno de route_id, origin_id, destination_id o contains_id debe estar presente",
  }
)

export type GTFSFareRule = z.infer<typeof GTFSFareRuleSchema>

/**
 * Schema para crear un fare rule (sin timestamps)
 */
export const GTFSFareRuleCreateSchema = GTFSFareRuleSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSFareRuleCreate = z.infer<typeof GTFSFareRuleCreateSchema>

/**
 * Helper para crear regla de tarifa por ruta
 */
export const createRouteBasedFareRule = (
  fareId: string,
  routeId: string
): GTFSFareRuleCreate => ({
  fare_id: fareId,
  route_id: routeId,
})

/**
 * Helper para crear regla de tarifa por origen-destino
 */
export const createOriginDestinationFareRule = (
  fareId: string,
  originId: string,
  destinationId: string
): GTFSFareRuleCreate => ({
  fare_id: fareId,
  origin_id: originId,
  destination_id: destinationId,
})
