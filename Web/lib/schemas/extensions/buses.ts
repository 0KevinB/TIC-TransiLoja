/**
 * Buses Schema (Extensión propia - NO GTFS)
 *
 * Este schema define los buses físicos de la flota.
 * NO es parte del estándar GTFS, es una extensión del proyecto TransiLoja.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Estado del bus
 */
export const BusStatusEnum = z.enum([
  "active", // En servicio
  "maintenance", // En mantenimiento
  "inactive", // Fuera de servicio
  "retired", // Dado de baja
])

/**
 * Tipo de combustible
 */
export const FuelTypeEnum = z.enum([
  "diesel",
  "gasoline",
  "electric",
  "hybrid",
  "cng", // Compressed Natural Gas
])

/**
 * Schema para Bus físico
 */
export const BusSchema = z.object({
  // Identificación
  id: z.string(),
  plateNumber: z
    .string()
    .min(1, "La placa es obligatoria")
    .regex(/^[A-Z]{3}-\d{3,4}$/, "Formato de placa inválido (ej: ABC-1234)"),

  // Características del vehículo
  model: z.string().min(1, "El modelo es obligatorio"),
  brand: z.string().min(1, "La marca es obligatoria"),
  year: z
    .number()
    .int()
    .min(1900, "Año inválido")
    .max(new Date().getFullYear() + 1, "El año no puede ser futuro"),
  capacity: z.number().int().min(1, "La capacidad debe ser al menos 1"),

  // Información técnica
  fuelType: FuelTypeEnum.optional().default("diesel"),
  engineNumber: z.string().optional(),
  chassisNumber: z.string().optional(),

  // Estado y operación
  status: BusStatusEnum.default("active"),
  lastMaintenanceDate: z.custom<Timestamp>().optional(),
  nextMaintenanceDate: z.custom<Timestamp>().optional(),
  mileage: z.number().nonnegative().optional(), // Kilometraje

  // Asignación (opcional)
  assignedRouteId: z.string().optional(), // Ruta asignada habitualmente
  currentTripId: z.string().optional(), // Viaje actual (si está en servicio)

  // Características adicionales
  hasAirConditioning: z.boolean().optional().default(false),
  hasWifi: z.boolean().optional().default(false),
  hasGPS: z.boolean().optional().default(false),
  wheelchairAccessible: z.boolean().optional().default(false),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type Bus = z.infer<typeof BusSchema>

/**
 * Schema para crear un bus (sin ID ni timestamps)
 */
export const BusCreateSchema = BusSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type BusCreate = z.infer<typeof BusCreateSchema>

/**
 * Schema para actualizar un bus
 */
export const BusUpdateSchema = BusCreateSchema.partial()

export type BusUpdate = z.infer<typeof BusUpdateSchema>

/**
 * Helper para validar número de placa
 */
export const validatePlateNumber = (plate: string): boolean => {
  return /^[A-Z]{3}-\d{3,4}$/.test(plate)
}

/**
 * Helper para calcular edad del bus
 */
export const getBusAge = (bus: Bus): number => {
  return new Date().getFullYear() - bus.year
}

/**
 * Helper para determinar si el bus necesita mantenimiento
 */
export const needsMaintenance = (bus: Bus): boolean => {
  if (!bus.nextMaintenanceDate) return false
  const now = new Date()
  const nextMaintenance = bus.nextMaintenanceDate.toDate()
  return nextMaintenance <= now
}
