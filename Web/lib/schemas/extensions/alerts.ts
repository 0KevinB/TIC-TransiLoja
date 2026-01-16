/**
 * Alerts Schema (Extensión propia - NO GTFS)
 *
 * Este schema define las alertas del sistema.
 * Nota: GTFS tiene service_alerts en GTFS-realtime, pero esto es una implementación simplificada.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Tipo de alerta
 */
export const AlertTypeEnum = z.enum([
  "info", // Informativa
  "warning", // Advertencia
  "error", // Error
  "success", // Éxito
  "maintenance", // Mantenimiento programado
  "delay", // Retraso
  "cancellation", // Cancelación
  "detour", // Desvío
])

/**
 * Prioridad de la alerta
 */
export const AlertPriorityEnum = z.enum([
  "low", // Baja
  "medium", // Media
  "high", // Alta
  "critical", // Crítica
])

/**
 * Schema para Alert
 */
export const AlertSchema = z.object({
  // Identificación
  id: z.string(),

  // Información de la alerta
  titulo: z.string().min(1, "El título es obligatorio"),
  mensaje: z.string().min(1, "El mensaje es obligatorio"),
  tipo: AlertTypeEnum,
  prioridad: AlertPriorityEnum.default("medium"),

  // Alcance de la alerta
  affectedRoutes: z.array(z.string()).optional().default([]),
  affectedStops: z.array(z.string()).optional().default([]),
  affectedTrips: z.array(z.string()).optional().default([]),

  // Vigencia
  isActive: z.boolean().default(true),
  fecha_inicio: z.custom<Timestamp>(),
  fecha_fin: z.custom<Timestamp>().optional(),

  // Información adicional
  url: z.string().url().optional(), // Link con más información
  showInApp: z.boolean().default(true), // Mostrar en app móvil
  showInDashboard: z.boolean().default(true), // Mostrar en dashboard

  // Metadata
  createdBy: z.string().optional(), // ID del usuario que la creó
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type Alert = z.infer<typeof AlertSchema>

/**
 * Schema para crear una alerta (sin ID ni timestamps)
 */
export const AlertCreateSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type AlertCreate = z.infer<typeof AlertCreateSchema>

/**
 * Schema para actualizar una alerta
 */
export const AlertUpdateSchema = AlertCreateSchema.partial()

export type AlertUpdate = z.infer<typeof AlertUpdateSchema>

/**
 * Helper para determinar si una alerta está activa
 */
export const isAlertActive = (alert: Alert): boolean => {
  if (!alert.isActive) return false

  const now = new Date()
  const startDate = alert.fecha_inicio.toDate()

  if (startDate > now) return false

  if (alert.fecha_fin) {
    const endDate = alert.fecha_fin.toDate()
    if (endDate < now) return false
  }

  return true
}

/**
 * Helper para determinar si una alerta afecta a una ruta específica
 */
export const alertAffectsRoute = (alert: Alert, routeId: string): boolean => {
  return alert.affectedRoutes.includes(routeId)
}

/**
 * Helper para determinar si una alerta afecta a una parada específica
 */
export const alertAffectsStop = (alert: Alert, stopId: string): boolean => {
  return alert.affectedStops.includes(stopId)
}

/**
 * Helper para crear alerta de mantenimiento
 */
export const createMaintenanceAlert = (
  titulo: string,
  mensaje: string,
  affectedRoutes: string[],
  fechaInicio: Timestamp,
  fechaFin?: Timestamp
): AlertCreate => ({
  titulo,
  mensaje,
  tipo: "maintenance",
  prioridad: "medium",
  affectedRoutes,
  isActive: true,
  fecha_inicio: fechaInicio,
  fecha_fin: fechaFin,
  showInApp: true,
  showInDashboard: true,
})

/**
 * Helper para crear alerta de desvío
 */
export const createDetourAlert = (
  titulo: string,
  mensaje: string,
  affectedRoutes: string[],
  affectedStops: string[],
  fechaInicio: Timestamp,
  fechaFin?: Timestamp
): AlertCreate => ({
  titulo,
  mensaje,
  tipo: "detour",
  prioridad: "high",
  affectedRoutes,
  affectedStops,
  isActive: true,
  fecha_inicio: fechaInicio,
  fecha_fin: fechaFin,
  showInApp: true,
  showInDashboard: true,
})
