/**
 * @fileoverview Tipos consolidados para TransiLoja
 *
 * Este archivo re-exporta los tipos validados de Zod y proporciona
 * aliases para compatibilidad hacia atrás.
 *
 * IMPORTANTE:
 * - Los tipos GTFS provienen de lib/schemas/gtfs (validados con Zod)
 * - Las extensiones provienen de lib/schemas/extensions (validadas con Zod)
 * - Los tipos legacy se mantienen como aliases para compatibilidad
 *
 * Basado en: https://gtfs.org/schedule/reference/
 */

// =================================================================================
// === GTFS Schedule Types (Re-exportados de Schemas)
// =================================================================================

export type {
  GTFSAgency,
  GTFSAgencyCreate,
} from "./schemas/gtfs/agency"

export type {
  GTFSStop,
  GTFSStopCreate,
  LocationTypeEnum,
  WheelchairBoardingEnum,
} from "./schemas/gtfs/stops"

export type {
  GTFSRoute,
  GTFSRouteCreate,
  RouteTypeEnum,
  ContinuousPickupDropOffEnum,
} from "./schemas/gtfs/routes"

export type {
  GTFSTrip,
  GTFSTripCreate,
  DirectionIdEnum,
  WheelchairAccessibleEnum,
  BikesAllowedEnum,
} from "./schemas/gtfs/trips"

export type {
  GTFSStopTime,
  GTFSStopTimeCreate,
  PickupDropOffTypeEnum,
  TimepointEnum,
} from "./schemas/gtfs/stop_times"

export type {
  GTFSCalendar,
  GTFSCalendarCreate,
} from "./schemas/gtfs/calendar"

export type {
  GTFSCalendarDate,
  GTFSCalendarDateCreate,
  ExceptionTypeEnum,
} from "./schemas/gtfs/calendar_dates"

export type {
  GTFSShape,
  GTFSShapeCreate,
} from "./schemas/gtfs/shapes"

export type {
  GTFSFareAttribute,
  GTFSFareAttributeCreate,
  PaymentMethodEnum,
  TransfersEnum,
} from "./schemas/gtfs/fare_attributes"

export type {
  GTFSFareRule,
  GTFSFareRuleCreate,
} from "./schemas/gtfs/fare_rules"

// =================================================================================
// === Extension Types (Re-exportados de Schemas)
// =================================================================================

export type {
  Bus,
  BusCreate,
  BusUpdate,
  BusStatusEnum,
  FuelTypeEnum,
} from "./schemas/extensions/buses"

export type {
  Driver,
  DriverCreate,
  DriverUpdate,
  DriverStatusEnum,
  LicenseTypeEnum,
} from "./schemas/extensions/drivers"

export type {
  Alert,
  AlertCreate,
  AlertUpdate,
  AlertTypeEnum,
  AlertPriorityEnum,
} from "./schemas/extensions/alerts"

export type {
  User,
  UserCreate,
  UserUpdate,
  UserPreferences,
  UserRoleEnum,
} from "./schemas/extensions/users"

// =================================================================================
// === Compatibility Aliases (Legacy Types - Deprecated)
// =================================================================================

/**
 * @deprecated Use GTFSAgency instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Agency = GTFSAgency

/**
 * @deprecated Use GTFSStop instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Stop = GTFSStop

/**
 * @deprecated Use GTFSRoute instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Route = GTFSRoute

/**
 * @deprecated Use GTFSTrip instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Trip = GTFSTrip

/**
 * @deprecated Use GTFSStopTime instead
 * Mantenido para compatibilidad hacia atrás
 */
export type StopTime = GTFSStopTime

/**
 * @deprecated Use GTFSCalendar instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Calendar = GTFSCalendar

/**
 * @deprecated Use GTFSCalendarDate instead
 * Mantenido para compatibilidad hacia atrás
 */
export type CalendarDate = GTFSCalendarDate

/**
 * @deprecated Use GTFSShape instead
 * Mantenido para compatibilidad hacia atrás
 */
export type Shape = GTFSShape

/**
 * @deprecated Use GTFSFareAttribute instead
 * Mantenido para compatibilidad hacia atrás
 */
export type FareAttribute = GTFSFareAttribute

/**
 * @deprecated Use GTFSFareRule instead
 * Mantenido para compatibilidad hacia atrás
 */
export type FareRule = GTFSFareRule

// =================================================================================
// === Helper Types
// =================================================================================

/**
 * Tipo genérico para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Tipo para coordenadas geográficas
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Tipo para respuestas de API
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// =================================================================================
// === GTFS-Realtime Types (Experimental)
// =================================================================================

/**
 * Representa la posición en vivo de un vehículo
 * Basado en GTFS-RT VehiclePosition entity
 */
export interface VehiclePosition {
  trip: {
    trip_id: string
    route_id: string
    start_time: string // HH:MM:SS
  }
  vehicle: {
    id: string // Corresponde a Bus.id
  }
  position: {
    latitude: number
    longitude: number
    bearing?: number
    speed?: number
  }
  timestamp: number // Unix timestamp
  stop_id?: string
  current_status: "IN_TRANSIT_TO" | "STOPPED_AT" | "INCOMING_AT"
}

/**
 * Representa una actualización de viaje
 * Basado en GTFS-RT TripUpdate entity
 */
export interface TripUpdate {
  trip: {
    trip_id: string
    route_id: string
    start_time: string
    start_date: string // YYYYMMDD
  }
  vehicle?: {
    id: string
  }
  stop_time_update: Array<{
    stop_sequence: number
    stop_id: string
    arrival?: {
      delay?: number // segundos
      time?: number // Unix timestamp
    }
    departure?: {
      delay?: number
      time?: number
    }
    schedule_relationship?: "SCHEDULED" | "SKIPPED" | "NO_DATA"
  }>
  timestamp: number
}

// =================================================================================
// === Re-exports de helpers
// =================================================================================

export {
  // Stops helpers
  coordenadasToGTFS,
  gtfsToCoordenas,
} from "./schemas/gtfs/stops"

export {
  // Routes helpers
  legacyRouteTypeToGTFS,
  gtfsToLegacyRouteType,
} from "./schemas/gtfs/routes"

export {
  // Calendar helpers
  dateToGTFSDate,
  gtfsDateToDate,
  createWeekdayCalendar,
  createWeekendCalendar,
  createDailyCalendar,
} from "./schemas/gtfs/calendar"

export {
  // Calendar dates helpers
  createServiceAddition,
  createServiceRemoval,
  feriadosEcuador2025,
} from "./schemas/gtfs/calendar_dates"

export {
  // Stop times helpers
  secondsToGTFSTime,
  gtfsTimeToSeconds,
  addMinutesToGTFSTime,
  getDurationMinutes,
  generateUniformStopTimes,
  sortStopTimesBySequence,
} from "./schemas/gtfs/stop_times"

export {
  // Trips helpers
  generateTripId,
  isOutbound,
  isInbound,
} from "./schemas/gtfs/trips"

export {
  // Shapes helpers
  createShapeFromPolyline,
  shapeToPolyline,
  calculateShapeDistance,
} from "./schemas/gtfs/shapes"

export {
  // Fare helpers
  createBasicFare,
  createTransferFare,
} from "./schemas/gtfs/fare_attributes"

export {
  // Fare rules helpers
  createRouteBasedFareRule,
  createOriginDestinationFareRule,
} from "./schemas/gtfs/fare_rules"

export {
  // Buses helpers
  validatePlateNumber,
  getBusAge,
  needsMaintenance,
} from "./schemas/extensions/buses"

export {
  // Drivers helpers
  validateCedula,
  isLicenseExpired,
  isLicenseExpiringSoon,
  getFullName,
} from "./schemas/extensions/drivers"

export {
  // Alerts helpers
  isAlertActive,
  alertAffectsRoute,
  alertAffectsStop,
  createMaintenanceAlert,
  createDetourAlert,
} from "./schemas/extensions/alerts"

export {
  // Users helpers
  isAdmin,
  canEdit,
  isViewerOnly,
  addFavoriteRoute,
  removeFavoriteRoute,
  addFavoriteStop,
  removeFavoriteStop,
} from "./schemas/extensions/users"
