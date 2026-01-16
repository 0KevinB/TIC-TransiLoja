/**
 * GTFS Stop Times Schema
 * Especificación: https://gtfs.org/schedule/reference/#stop_timestxt
 *
 * IMPORTANTE: En GTFS, stop_times es una tabla PLANA donde cada registro
 * representa una parada específica en un viaje específico.
 * NO debe ser una estructura anidada.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Pickup/Drop-off types según GTFS
 */
export const PickupDropOffTypeEnum = z.enum([
  "0", // Regularly scheduled
  "1", // No pickup/drop-off available
  "2", // Must phone agency
  "3", // Must coordinate with driver
])

/**
 * Timepoint según GTFS
 */
export const TimepointEnum = z.enum([
  "0", // Times are approximate
  "1", // Times are exact
])

/**
 * Regex para validar formato de tiempo GTFS: HH:MM:SS
 * Nota: Las horas pueden ser >= 24 para viajes que pasan de medianoche
 */
const GTFS_TIME_REGEX = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/

/**
 * Schema base para Stop Times (sin validaciones de refine)
 */
const GTFSStopTimeBaseSchema = z.object({
  // GTFS Required fields
  trip_id: z.string(),
  arrival_time: z.string().regex(GTFS_TIME_REGEX, "Formato debe ser HH:MM:SS"),
  departure_time: z.string().regex(GTFS_TIME_REGEX, "Formato debe ser HH:MM:SS"),
  stop_id: z.string(),
  stop_sequence: z.number().int().nonnegative(),

  // GTFS Optional fields
  stop_headsign: z.string().optional(),
  pickup_type: PickupDropOffTypeEnum.optional().default("0"),
  drop_off_type: PickupDropOffTypeEnum.optional().default("0"),
  continuous_pickup: PickupDropOffTypeEnum.optional(),
  continuous_drop_off: PickupDropOffTypeEnum.optional(),
  shape_dist_traveled: z.number().nonnegative().optional(),
  timepoint: TimepointEnum.optional().default("1"),

  // Metadata (para Firestore)
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

/**
 * Schema GTFS estándar para Stop Times (con validación)
 */
export const GTFSStopTimeSchema = GTFSStopTimeBaseSchema.refine(
  (data) => {
    // Validar que arrival_time <= departure_time
    return data.arrival_time <= data.departure_time
  },
  {
    message: "arrival_time debe ser anterior o igual a departure_time",
  }
)

export type GTFSStopTime = z.infer<typeof GTFSStopTimeSchema>

/**
 * Schema para crear un stop time (sin timestamps, con validación)
 */
export const GTFSStopTimeCreateSchema = GTFSStopTimeBaseSchema.omit({
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    // Validar que arrival_time <= departure_time
    return data.arrival_time <= data.departure_time
  },
  {
    message: "arrival_time debe ser anterior o igual a departure_time",
  }
)

export type GTFSStopTimeCreate = z.infer<typeof GTFSStopTimeCreateSchema>

/**
 * Helper para convertir segundos desde medianoche a formato GTFS HH:MM:SS
 */
export const secondsToGTFSTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Helper para convertir formato GTFS HH:MM:SS a segundos desde medianoche
 */
export const gtfsTimeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(":").map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Helper para agregar minutos a un tiempo GTFS
 */
export const addMinutesToGTFSTime = (time: string, minutes: number): string => {
  const seconds = gtfsTimeToSeconds(time)
  const newSeconds = seconds + minutes * 60
  return secondsToGTFSTime(newSeconds)
}

/**
 * Helper para calcular duración entre dos tiempos GTFS (en minutos)
 */
export const getDurationMinutes = (startTime: string, endTime: string): number => {
  const startSeconds = gtfsTimeToSeconds(startTime)
  const endSeconds = gtfsTimeToSeconds(endTime)
  return Math.round((endSeconds - startSeconds) / 60)
}

/**
 * Helper para generar stop_times para un trip con intervalos uniformes
 */
export const generateUniformStopTimes = (
  tripId: string,
  stopIds: string[],
  startTime: string,
  intervalMinutes: number
): GTFSStopTimeCreate[] => {
  return stopIds.map((stopId, index) => {
    const time = addMinutesToGTFSTime(startTime, index * intervalMinutes)
    return {
      trip_id: tripId,
      stop_id: stopId,
      stop_sequence: index + 1,
      arrival_time: time,
      departure_time: time, // Asumimos que no hay tiempo de espera en paradas
      pickup_type: "0",
      drop_off_type: "0",
      timepoint: "1",
    }
  })
}

/**
 * Helper para ordenar stop_times por secuencia
 */
export const sortStopTimesBySequence = (stopTimes: GTFSStopTime[]): GTFSStopTime[] => {
  return [...stopTimes].sort((a, b) => a.stop_sequence - b.stop_sequence)
}
