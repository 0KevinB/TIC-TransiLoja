/**
 * Drivers Schema (Extensión propia - NO GTFS)
 *
 * Este schema define los conductores de la flota.
 * NO es parte del estándar GTFS, es una extensión del proyecto TransiLoja.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Estado del conductor
 */
export const DriverStatusEnum = z.enum([
  "active", // Activo
  "on_leave", // De vacaciones/permiso
  "suspended", // Suspendido
  "inactive", // Inactivo
])

/**
 * Tipo de licencia
 */
export const LicenseTypeEnum = z.enum([
  "A", // Motocicletas
  "B", // Vehículos ligeros
  "C", // Vehículos pesados
  "D", // Vehículos de transporte público
  "E", // Tractores y maquinaria agrícola
])

/**
 * Schema para Conductor
 */
export const DriverSchema = z.object({
  // Identificación
  id: z.string(),
  cedula: z
    .string()
    .min(10, "Cédula inválida")
    .max(10, "Cédula inválida")
    .regex(/^\d{10}$/, "La cédula debe tener 10 dígitos"),

  // Información personal
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Email inválido").optional(),
  telefono: z
    .string()
    .regex(/^\d{10}$/, "El teléfono debe tener 10 dígitos")
    .optional(),

  // Información de licencia
  numero_licencia: z.string().min(1, "El número de licencia es obligatorio"),
  tipo_licencia: LicenseTypeEnum,
  fecha_expedicion_licencia: z.custom<Timestamp>().optional(),
  fecha_vencimiento_licencia: z.custom<Timestamp>(),

  // Estado y operación
  status: DriverStatusEnum.default("active"),
  fecha_contratacion: z.custom<Timestamp>().optional(),

  // Asignación actual
  assignedBusId: z.string().optional(), // Bus asignado habitualmente
  currentTripId: z.string().optional(), // Viaje actual (si está en servicio)

  // Información adicional
  direccion: z.string().optional(),
  fecha_nacimiento: z.custom<Timestamp>().optional(),
  contacto_emergencia: z
    .object({
      nombre: z.string(),
      telefono: z.string(),
      parentesco: z.string().optional(),
    })
    .optional(),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type Driver = z.infer<typeof DriverSchema>

/**
 * Schema para crear un conductor (sin ID ni timestamps)
 */
export const DriverCreateSchema = DriverSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type DriverCreate = z.infer<typeof DriverCreateSchema>

/**
 * Schema para actualizar un conductor
 */
export const DriverUpdateSchema = DriverCreateSchema.partial()

export type DriverUpdate = z.infer<typeof DriverUpdateSchema>

/**
 * Helper para validar cédula ecuatoriana
 */
export const validateCedula = (cedula: string): boolean => {
  if (!/^\d{10}$/.test(cedula)) return false

  const province = parseInt(cedula.substring(0, 2))
  if (province < 1 || province > 24) return false

  const digits = cedula.split("").map(Number)
  const verifier = digits[9]

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = digits[i]
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  const calculatedVerifier = sum % 10 === 0 ? 0 : 10 - (sum % 10)
  return calculatedVerifier === verifier
}

/**
 * Helper para determinar si la licencia está vencida
 */
export const isLicenseExpired = (driver: Driver): boolean => {
  const now = new Date()
  const expirationDate = driver.fecha_vencimiento_licencia.toDate()
  return expirationDate <= now
}

/**
 * Helper para determinar si la licencia vence pronto (en los próximos 30 días)
 */
export const isLicenseExpiringSoon = (driver: Driver, daysThreshold: number = 30): boolean => {
  const now = new Date()
  const expirationDate = driver.fecha_vencimiento_licencia.toDate()
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysUntilExpiration > 0 && daysUntilExpiration <= daysThreshold
}

/**
 * Helper para obtener nombre completo
 */
export const getFullName = (driver: Driver): string => {
  return `${driver.nombre} ${driver.apellido}`
}
