/**
 * GTFS Routes Schema
 * Especificación: https://gtfs.org/schedule/reference/#routestxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Route types según GTFS
 */
export const RouteTypeEnum = z.enum([
  "0", // Tram, Streetcar, Light rail
  "1", // Subway, Metro
  "2", // Rail
  "3", // Bus
  "4", // Ferry
  "5", // Cable tram
  "6", // Aerial lift
  "7", // Funicular
  "11", // Trolleybus
  "12", // Monorail
])

/**
 * Continuous pickup/drop-off según GTFS
 */
export const ContinuousPickupDropOffEnum = z.enum([
  "0", // Continuous stopping
  "1", // No continuous stopping
  "2", // Must phone agency
  "3", // Must coordinate with driver
])

/**
 * Schema GTFS estándar para Routes
 */
export const GTFSRouteSchema = z.object({
  // GTFS Required fields
  route_id: z.string(),
  route_type: RouteTypeEnum,

  // GTFS Conditionally required (al menos uno debe estar presente)
  route_short_name: z.string().optional(),
  route_long_name: z.string().optional(),

  // GTFS Optional fields
  agency_id: z.string().optional(),
  route_desc: z.string().optional(),
  route_url: z.string().url().optional(),
  route_color: z
    .string()
    .regex(/^[0-9A-Fa-f]{6}$/, "Color debe ser formato hex de 6 dígitos (sin #)")
    .optional()
    .default("FFFFFF"),
  route_text_color: z
    .string()
    .regex(/^[0-9A-Fa-f]{6}$/, "Color debe ser formato hex de 6 dígitos (sin #)")
    .optional()
    .default("000000"),
  route_sort_order: z.number().int().nonnegative().optional(),
  continuous_pickup: ContinuousPickupDropOffEnum.optional().default("1"),
  continuous_drop_off: ContinuousPickupDropOffEnum.optional().default("1"),

  // Extensiones propias (metadata)
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
}).refine(
  (data) => {
    // Al menos uno de route_short_name o route_long_name debe estar presente
    return data.route_short_name || data.route_long_name
  },
  {
    message: "Debe proporcionar route_short_name o route_long_name (o ambos)",
  }
)

export type GTFSRoute = z.infer<typeof GTFSRouteSchema>

/**
 * Schema para crear una ruta (sin timestamps)
 */
export const GTFSRouteCreateSchema = GTFSRouteSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSRouteCreate = z.infer<typeof GTFSRouteCreateSchema>

/**
 * Helper para mapear tipos legacy a GTFS
 */
export const legacyRouteTypeToGTFS = (type: string): string => {
  const mapping: Record<string, string> = {
    bus: "3",
    metro: "1",
    tram: "0",
    rail: "2",
    ferry: "4",
  }
  return mapping[type] || "3" // Default to bus
}

/**
 * Helper para mapear GTFS a tipos legacy
 */
export const gtfsToLegacyRouteType = (
  routeType: string
): "bus" | "metro" | "tram" | "rail" | "ferry" => {
  const mapping: Record<string, "bus" | "metro" | "tram" | "rail" | "ferry"> = {
    "0": "tram",
    "1": "metro",
    "2": "rail",
    "3": "bus",
    "4": "ferry",
    "5": "tram",
    "6": "tram",
    "7": "rail",
    "11": "bus",
    "12": "metro",
  }
  return mapping[routeType] || "bus"
}
