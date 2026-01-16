/**
 * Users Schema (Extensión propia - NO GTFS)
 *
 * Este schema define los usuarios del sistema.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Rol del usuario
 */
export const UserRoleEnum = z.enum([
  "admin", // Administrador del sistema
  "conductor", // Conductor de bus con seguimiento GPS
  "operator", // Operador (gestión de rutas y buses)
  "dispatcher", // Despachador
  "viewer", // Solo visualización
  "user", // Usuario regular de la app móvil
])

/**
 * Preferencias de usuario
 */
export const UserPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["es", "en"]).default("es"),
  notifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(false),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

/**
 * Schema para Usuario
 */
export const UserSchema = z.object({
  // Identificación (Firebase Auth)
  id: z.string(), // UID de Firebase Auth
  email: z.string().email("Email inválido"),

  // Información personal
  name: z.string().min(1, "El nombre es obligatorio"),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().optional(),

  // Rol y permisos
  role: UserRoleEnum.default("user"),
  permissions: z.array(z.string()).optional().default([]),

  // Para conductores: ID del perfil de conductor
  conductorId: z.string().optional(),

  // Preferencias
  preferences: UserPreferencesSchema.optional(),

  // Para usuarios de la app móvil
  favoriteRoutes: z.array(z.string()).optional().default([]),
  favoriteStops: z.array(z.string()).optional().default([]),
  recentSearches: z
    .array(
      z.object({
        origin: z.string(),
        destination: z.string(),
        timestamp: z.custom<Timestamp>(),
      })
    )
    .optional()
    .default([]),

  // Estado
  isActive: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
  lastLoginAt: z.custom<Timestamp>().optional(),
})

export type User = z.infer<typeof UserSchema>

/**
 * Schema para crear un usuario (sin ID ni timestamps)
 */
export const UserCreateSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
})

export type UserCreate = z.infer<typeof UserCreateSchema>

/**
 * Schema para actualizar un usuario
 */
export const UserUpdateSchema = UserCreateSchema.partial()

export type UserUpdate = z.infer<typeof UserUpdateSchema>

/**
 * Helper para determinar si un usuario es admin
 */
export const isAdmin = (user: User): boolean => {
  return user.role === "admin"
}

/**
 * Helper para determinar si un usuario puede editar
 */
export const canEdit = (user: User): boolean => {
  return ["admin", "operator", "dispatcher"].includes(user.role)
}

/**
 * Helper para determinar si un usuario es conductor
 */
export const isConductor = (user: User): boolean => {
  return user.role === "conductor"
}

/**
 * Helper para determinar si un usuario solo puede ver
 */
export const isViewerOnly = (user: User): boolean => {
  return user.role === "viewer"
}

/**
 * Helper para agregar ruta favorita
 */
export const addFavoriteRoute = (user: User, routeId: string): string[] => {
  if (user.favoriteRoutes.includes(routeId)) {
    return user.favoriteRoutes
  }
  return [...user.favoriteRoutes, routeId]
}

/**
 * Helper para remover ruta favorita
 */
export const removeFavoriteRoute = (user: User, routeId: string): string[] => {
  return user.favoriteRoutes.filter((id) => id !== routeId)
}

/**
 * Helper para agregar parada favorita
 */
export const addFavoriteStop = (user: User, stopId: string): string[] => {
  if (user.favoriteStops.includes(stopId)) {
    return user.favoriteStops
  }
  return [...user.favoriteStops, stopId]
}

/**
 * Helper para remover parada favorita
 */
export const removeFavoriteStop = (user: User, stopId: string): string[] => {
  return user.favoriteStops.filter((id) => id !== stopId)
}
