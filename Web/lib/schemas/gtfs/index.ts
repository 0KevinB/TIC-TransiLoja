/**
 * GTFS Schemas - Índice central
 *
 * Este archivo exporta todos los schemas y tipos GTFS estándar.
 * Basado en la especificación oficial: https://gtfs.org/schedule/reference/
 */

// Agency
export * from "./agency"

// Stops
export * from "./stops"

// Routes
export * from "./routes"

// Trips
export * from "./trips"

// Stop Times
export * from "./stop_times"

// Calendar
export * from "./calendar"
export * from "./calendar_dates"

// Shapes
export * from "./shapes"

// Fare
export * from "./fare_attributes"
export * from "./fare_rules"
