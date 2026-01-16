/**
 * GTFS Agency Schema
 * Especificación: https://gtfs.org/schedule/reference/#agencytxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Schema GTFS estándar para Agency
 */
export const GTFSAgencySchema = z.object({
  // GTFS Required fields
  agency_id: z.string(),
  agency_name: z.string().min(1, "El nombre de la agencia es obligatorio"),
  agency_url: z.string().url("URL inválida"),
  agency_timezone: z.string(), // e.g., "America/Guayaquil"

  // GTFS Optional fields
  agency_lang: z.string().optional(), // ISO 639-1 code
  agency_phone: z.string().optional(),
  agency_fare_url: z.string().url().optional(),
  agency_email: z.string().email().optional(),

  // Extensiones propias (metadata)
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSAgency = z.infer<typeof GTFSAgencySchema>

/**
 * Schema para crear una agencia (sin timestamps)
 */
export const GTFSAgencyCreateSchema = GTFSAgencySchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSAgencyCreate = z.infer<typeof GTFSAgencyCreateSchema>
