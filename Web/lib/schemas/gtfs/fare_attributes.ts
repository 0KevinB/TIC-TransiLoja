/**
 * GTFS Fare Attributes Schema
 * Especificación: https://gtfs.org/schedule/reference/#fare_attributestxt
 */

import { z } from "zod"
import { Timestamp } from "firebase/firestore"

/**
 * Payment method según GTFS
 */
export const PaymentMethodEnum = z.enum([
  "0", // Paid on board
  "1", // Paid before boarding
])

/**
 * Transfers según GTFS
 */
export const TransfersEnum = z.enum([
  "0", // No transfers permitted
  "1", // Passengers may transfer once
  "2", // Passengers may transfer twice
  "", // Unlimited transfers
])

/**
 * Schema GTFS estándar para Fare Attributes
 */
export const GTFSFareAttributeSchema = z.object({
  // GTFS Required fields
  fare_id: z.string(),
  price: z.number().nonnegative(),
  currency_type: z.string().length(3), // ISO 4217 currency code (e.g., "USD")
  payment_method: PaymentMethodEnum,
  transfers: TransfersEnum,

  // GTFS Optional fields
  agency_id: z.string().optional(),
  transfer_duration: z.number().int().nonnegative().optional(), // In seconds

  // Extensiones propias
  description: z.string().optional(), // Descripción de la tarifa (e.g., "Estudiante")
  active: z.boolean().optional().default(true),

  // Metadata
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
})

export type GTFSFareAttribute = z.infer<typeof GTFSFareAttributeSchema>

/**
 * Schema para crear un fare attribute (sin timestamps)
 */
export const GTFSFareAttributeCreateSchema = GTFSFareAttributeSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type GTFSFareAttributeCreate = z.infer<typeof GTFSFareAttributeCreateSchema>

/**
 * Helper para crear tarifa básica
 */
export const createBasicFare = (
  fareId: string,
  price: number,
  description?: string
): GTFSFareAttributeCreate => ({
  fare_id: fareId,
  price,
  currency_type: "USD",
  payment_method: "0", // Pago a bordo
  transfers: "0", // Sin transferencias
  description,
  active: true,
})

/**
 * Helper para crear tarifa con transferencias
 */
export const createTransferFare = (
  fareId: string,
  price: number,
  maxTransfers: "1" | "2" | "",
  transferDuration?: number,
  description?: string
): GTFSFareAttributeCreate => ({
  fare_id: fareId,
  price,
  currency_type: "USD",
  payment_method: "0",
  transfers: maxTransfers,
  transfer_duration: transferDuration,
  description,
  active: true,
})
