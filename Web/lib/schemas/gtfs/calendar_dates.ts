/**
 * GTFS Calendar Dates Schema
 * Especificación: https://gtfs.org/schedule/reference/#calendar_datestxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Exception types según GTFS
 */
export const ExceptionTypeEnum = z.enum([
  "1", // Service added for this date
  "2", // Service removed for this date
])

/**
 * Schema GTFS estándar para Calendar Dates
 */
export const GTFSCalendarDateSchema = z.object({
  // GTFS Required fields
  service_id: z.string(),
  date: z.string().regex(/^\d{8}$/, "Formato debe ser YYYYMMDD"), // e.g., "20250101"
  exception_type: ExceptionTypeEnum,

  // Extensiones propias (metadata)
  description: z.string().optional(), // Descripción del feriado/excepción
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSCalendarDate = z.infer<typeof GTFSCalendarDateSchema>

/**
 * Schema para crear una excepción de calendario (sin timestamps)
 */
export const GTFSCalendarDateCreateSchema = GTFSCalendarDateSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSCalendarDateCreate = z.infer<typeof GTFSCalendarDateCreateSchema>

/**
 * Helper para agregar servicio en una fecha específica
 */
export const createServiceAddition = (
  serviceId: string,
  date: string,
  description?: string
): GTFSCalendarDateCreate => ({
  service_id: serviceId,
  date,
  exception_type: "1",
  description,
})

/**
 * Helper para remover servicio en una fecha específica (feriado)
 */
export const createServiceRemoval = (
  serviceId: string,
  date: string,
  description?: string
): GTFSCalendarDateCreate => ({
  service_id: serviceId,
  date,
  exception_type: "2",
  description,
})

/**
 * Feriados de Ecuador comunes (para 2025)
 */
export const feriadosEcuador2025 = [
  { date: "20250101", description: "Año Nuevo" },
  { date: "20250224", description: "Carnaval" },
  { date: "20250225", description: "Carnaval" },
  { date: "20250418", description: "Viernes Santo" },
  { date: "20250501", description: "Día del Trabajo" },
  { date: "20250524", description: "Batalla de Pichincha" },
  { date: "20250810", description: "Primer Grito de Independencia" },
  { date: "20251009", description: "Independencia de Guayaquil" },
  { date: "20251102", description: "Día de los Difuntos" },
  { date: "20251103", description: "Independencia de Cuenca" },
  { date: "20251225", description: "Navidad" },
]
