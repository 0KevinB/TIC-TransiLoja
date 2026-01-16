/**
 * GTFS Calendar Schema
 * Especificación: https://gtfs.org/schedule/reference/#calendartxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Day availability (0 = not available, 1 = available)
 */
const DayAvailabilityEnum = z.enum(["0", "1"])

/**
 * Schema GTFS estándar para Calendar
 */
export const GTFSCalendarSchema = z.object({
  // GTFS Required fields
  service_id: z.string(),
  monday: DayAvailabilityEnum,
  tuesday: DayAvailabilityEnum,
  wednesday: DayAvailabilityEnum,
  thursday: DayAvailabilityEnum,
  friday: DayAvailabilityEnum,
  saturday: DayAvailabilityEnum,
  sunday: DayAvailabilityEnum,
  start_date: z.string().regex(/^\d{8}$/, "Formato debe ser YYYYMMDD"), // e.g., "20250101"
  end_date: z.string().regex(/^\d{8}$/, "Formato debe ser YYYYMMDD"), // e.g., "20251231"

  // Extensiones propias (metadata)
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
}).refine(
  (data) => {
    // Validar que start_date sea antes de end_date
    return data.start_date <= data.end_date
  },
  {
    message: "start_date debe ser anterior o igual a end_date",
  }
)

export type GTFSCalendar = z.infer<typeof GTFSCalendarSchema>

/**
 * Schema para crear un calendario (sin timestamps)
 */
export const GTFSCalendarCreateSchema = GTFSCalendarSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSCalendarCreate = z.infer<typeof GTFSCalendarCreateSchema>

/**
 * Helper para convertir Date a formato GTFS YYYYMMDD
 */
export const dateToGTFSDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}${month}${day}`
}

/**
 * Helper para convertir formato GTFS YYYYMMDD a Date
 */
export const gtfsDateToDate = (gtfsDate: string): Date => {
  const year = parseInt(gtfsDate.substring(0, 4))
  const month = parseInt(gtfsDate.substring(4, 6)) - 1 // Month is 0-indexed
  const day = parseInt(gtfsDate.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * Helper para crear calendario de tipo "weekday" (lunes a viernes)
 */
export const createWeekdayCalendar = (
  serviceId: string,
  startDate: string,
  endDate: string
): GTFSCalendarCreate => ({
  service_id: serviceId,
  monday: "1",
  tuesday: "1",
  wednesday: "1",
  thursday: "1",
  friday: "1",
  saturday: "0",
  sunday: "0",
  start_date: startDate,
  end_date: endDate,
})

/**
 * Helper para crear calendario de tipo "weekend" (sábado y domingo)
 */
export const createWeekendCalendar = (
  serviceId: string,
  startDate: string,
  endDate: string
): GTFSCalendarCreate => ({
  service_id: serviceId,
  monday: "0",
  tuesday: "0",
  wednesday: "0",
  thursday: "0",
  friday: "0",
  saturday: "1",
  sunday: "1",
  start_date: startDate,
  end_date: endDate,
})

/**
 * Helper para crear calendario de tipo "daily" (todos los días)
 */
export const createDailyCalendar = (
  serviceId: string,
  startDate: string,
  endDate: string
): GTFSCalendarCreate => ({
  service_id: serviceId,
  monday: "1",
  tuesday: "1",
  wednesday: "1",
  thursday: "1",
  friday: "1",
  saturday: "1",
  sunday: "1",
  start_date: startDate,
  end_date: endDate,
})
