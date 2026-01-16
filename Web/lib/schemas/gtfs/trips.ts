/**
 * GTFS Trips Schema
 * Especificación: https://gtfs.org/schedule/reference/#tripstxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Direction ID según GTFS
 */
export const DirectionIdEnum = z.enum([
  "0", // Travel in one direction (e.g., outbound)
  "1", // Travel in opposite direction (e.g., inbound)
])

/**
 * Wheelchair accessible según GTFS
 */
export const WheelchairAccessibleEnum = z.enum([
  "0", // No information
  "1", // Accessible
  "2", // Not accessible
])

/**
 * Bikes allowed según GTFS
 */
export const BikesAllowedEnum = z.enum([
  "0", // No information
  "1", // Bikes allowed
  "2", // Bikes not allowed
])

/**
 * Schema GTFS estándar para Trips
 */
export const GTFSTripSchema = z.object({
  // GTFS Required fields
  route_id: z.string(),
  service_id: z.string(),
  trip_id: z.string(),

  // GTFS Optional fields
  trip_headsign: z.string().optional(),
  trip_short_name: z.string().optional(),
  direction_id: DirectionIdEnum.optional(),
  block_id: z.string().optional(),
  shape_id: z.string().optional(),
  wheelchair_accessible: WheelchairAccessibleEnum.optional().default("0"),
  bikes_allowed: BikesAllowedEnum.optional().default("0"),

  // Extensiones propias (asignaciones de recursos)
  // NOTA: Estos campos NO son GTFS estándar, son extensiones del proyecto
  assigned_bus_id: z.string().optional(), // ID del bus físico asignado
  assigned_driver_id: z.string().optional(), // ID del conductor asignado

  // Estado del viaje (extensión propia)
  status: z.enum(["scheduled", "active", "completed", "cancelled"]).optional().default("scheduled"),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSTrip = z.infer<typeof GTFSTripSchema>

/**
 * Schema para crear un viaje (sin timestamps)
 */
export const GTFSTripCreateSchema = GTFSTripSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSTripCreate = z.infer<typeof GTFSTripCreateSchema>

/**
 * Helper para crear trip_id único
 */
export const generateTripId = (routeId: string, serviceId: string, sequence: number): string => {
  return `${routeId}_${serviceId}_${sequence.toString().padStart(3, "0")}`
}

/**
 * Helper para determinar si un trip está en dirección "outbound" (ida)
 */
export const isOutbound = (trip: GTFSTrip): boolean => {
  return trip.direction_id === "0" || trip.direction_id === undefined
}

/**
 * Helper para determinar si un trip está en dirección "inbound" (vuelta)
 */
export const isInbound = (trip: GTFSTrip): boolean => {
  return trip.direction_id === "1"
}
