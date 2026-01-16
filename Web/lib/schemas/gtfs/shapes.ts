/**
 * GTFS Shapes Schema
 * Especificación: https://gtfs.org/schedule/reference/#shapestxt
 *
 * Shapes define el trazado geográfico que sigue un vehículo en una ruta.
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Schema GTFS estándar para Shapes
 */
export const GTFSShapeSchema = z.object({
  // GTFS Required fields
  shape_id: z.string(),
  shape_pt_lat: z.number().min(-90).max(90),
  shape_pt_lon: z.number().min(-180).max(180),
  shape_pt_sequence: z.number().int().nonnegative(),

  // GTFS Optional fields
  shape_dist_traveled: z.number().nonnegative().optional(),

  // Metadata (para Firestore)
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSShape = z.infer<typeof GTFSShapeSchema>

/**
 * Schema para crear un shape point (sin timestamps)
 */
export const GTFSShapeCreateSchema = GTFSShapeSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSShapeCreate = z.infer<typeof GTFSShapeCreateSchema>

/**
 * Helper para crear shape desde polyline (array de coordenadas)
 */
export const createShapeFromPolyline = (
  shapeId: string,
  coordinates: Array<{ lat: number; lng: number }>
): GTFSShapeCreate[] => {
  return coordinates.map((coord, index) => ({
    shape_id: shapeId,
    shape_pt_lat: coord.lat,
    shape_pt_lon: coord.lng,
    shape_pt_sequence: index + 1,
  }))
}

/**
 * Helper para convertir shape points a polyline
 */
export const shapeToPolyline = (
  shapes: GTFSShape[]
): Array<{ lat: number; lng: number }> => {
  return shapes
    .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
    .map((shape) => ({
      lat: shape.shape_pt_lat,
      lng: shape.shape_pt_lon,
    }))
}

/**
 * Helper para calcular distancia total del shape
 */
export const calculateShapeDistance = (shapes: GTFSShape[]): number => {
  const sorted = shapes.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
  const lastPoint = sorted[sorted.length - 1]
  return lastPoint?.shape_dist_traveled || 0
}
