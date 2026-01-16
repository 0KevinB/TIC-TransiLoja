/**
 * GTFS Stops Schema
 * Especificación: https://gtfs.org/schedule/reference/#stopstxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Location types según GTFS
 */
export const LocationTypeEnum = z.enum([
  "0", // Stop/Platform
  "1", // Station
  "2", // Entrance/Exit
  "3", // Generic Node
  "4", // Boarding Area
])

/**
 * Wheelchair boarding según GTFS
 */
export const WheelchairBoardingEnum = z.enum([
  "0", // No information
  "1", // Accessible
  "2", // Not accessible
])

/**
 * Schema GTFS estándar para Stops
 */
export const GTFSStopSchema = z.object({
  // GTFS Required fields
  stop_id: z.string(),
  stop_name: z.string().min(1, "El nombre de la parada es obligatorio"),

  // GTFS Conditionally required (required for location_type 0,1,2)
  stop_lat: z.number().min(-90).max(90).optional(),
  stop_lon: z.number().min(-180).max(180).optional(),

  // GTFS Optional fields
  stop_code: z.string().optional(),
  stop_desc: z.string().optional(),
  zone_id: z.string().optional(),
  stop_url: z.string().url().optional(),
  location_type: LocationTypeEnum.optional().default("0"),
  parent_station: z.string().optional(), // stop_id de la estación padre
  stop_timezone: z.string().optional(),
  wheelchair_boarding: WheelchairBoardingEnum.optional().default("0"),
  level_id: z.string().optional(),
  platform_code: z.string().optional(),

  // Extensiones propias (metadata y features)
  es_punto_conexion: z.boolean().optional().default(false), // Transfer point

  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSStop = z.infer<typeof GTFSStopSchema>

/**
 * Schema para crear una parada (sin timestamps)
 */
export const GTFSStopCreateSchema = GTFSStopSchema.omit({
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    // Si es una parada física (location_type 0, 1 o 2), lat/lon son obligatorios
    if (["0", "1", "2"].includes(data.location_type || "0")) {
      return data.stop_lat !== undefined && data.stop_lon !== undefined
    }
    return true
  },
  {
    message: "Las paradas físicas requieren coordenadas (stop_lat y stop_lon)",
  }
)

export type GTFSStopCreate = z.infer<typeof GTFSStopCreateSchema>

/**
 * Helper para convertir coordenadas legacy a GTFS
 */
export const coordenadasToGTFS = (coordenadas: { lat: number; lng: number }) => ({
  stop_lat: coordenadas.lat,
  stop_lon: coordenadas.lng,
})

/**
 * Helper para convertir GTFS a coordenadas legacy
 */
export const gtfsToCoordenas = (stop: { stop_lat?: number; stop_lon?: number }) => ({
  lat: stop.stop_lat || 0,
  lng: stop.stop_lon || 0,
})
