/**
 * GTFS Types and Data Import Types
 * Defines types for GTFS data structures, GeoJSON, and Firebase exports
 */

import { Timestamp } from 'firebase/firestore';

// ===================================================================================
// GTFS Standard Types (matching CSV structure)
// ===================================================================================

export interface GTFSAgency {
  agency_id?: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
  agency_fare_url?: string;
  agency_email?: string;
}

export interface GTFSStop {
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type?: string;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: string;
  level_id?: string;
  platform_code?: string;
}

export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: string;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
  route_sort_order?: string;
  continuous_pickup?: string;
  continuous_drop_off?: string;
}

export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: string;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: string;
  bikes_allowed?: string;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: string;
  drop_off_type?: string;
  continuous_pickup?: string;
  continuous_drop_off?: string;
  shape_dist_traveled?: number;
  timepoint?: string;
}

export interface GTFSCalendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
}

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: string;
}

export interface GTFSFareAttribute {
  fare_id: string;
  price: string;
  currency_type: string;
  payment_method: string;
  transfers: string;
  agency_id?: string;
  transfer_duration?: string;
}

export interface GTFSFareRule {
  fare_id: string;
  route_id?: string;
  origin_id?: string;
  destination_id?: string;
  contains_id?: string;
}

export interface GTFSShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

export interface GTFSFrequency {
  trip_id: string;
  start_time: string;
  end_time: string;
  headway_secs: number;
  exact_times?: string;
}

export interface GTFSTransfer {
  from_stop_id: string;
  to_stop_id: string;
  transfer_type: string;
  min_transfer_time?: number;
}

export interface GTFSFeedInfo {
  feed_publisher_name: string;
  feed_publisher_url: string;
  feed_lang: string;
  default_lang?: string;
  feed_start_date?: string;
  feed_end_date?: string;
  feed_version?: string;
  feed_contact_email?: string;
  feed_contact_url?: string;
}

// ===================================================================================
// GTFS Data Container
// ===================================================================================

export interface GTFSData {
  agency?: GTFSAgency[];
  stops?: GTFSStop[];
  routes?: GTFSRoute[];
  trips?: GTFSTrip[];
  stop_times?: GTFSStopTime[];
  calendar?: GTFSCalendar[];
  calendar_dates?: GTFSCalendarDate[];
  fare_attributes?: GTFSFareAttribute[];
  fare_rules?: GTFSFareRule[];
  shapes?: GTFSShape[];
  frequencies?: GTFSFrequency[];
  transfers?: GTFSTransfer[];
  feed_info?: GTFSFeedInfo[];
}

// ===================================================================================
// GeoJSON Types
// ===================================================================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoJSONFeature {
  type: 'Feature';
  id: string | number;
  geometry: GeoJSONPoint;
  properties: {
    name?: string;
    'name:es'?: string;
    'name:en'?: string;
    operator?: string;
    network?: string;
    ref?: string;
    shelter?: string;
    bench?: string;
    lit?: string;
    bin?: string;
    wheelchair_boarding?: string;
    passenger_information_display?: string;
    public_transport?: string;
    platform_code?: string;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ===================================================================================
// Firebase Export Types
// ===================================================================================

export interface FirebaseExport {
  stops?: Record<string, any>;
  routes?: Record<string, any>;
  trips?: Record<string, any>;
  stop_times?: Record<string, any>;
  calendars?: Record<string, any>;
  buses?: Record<string, any>;
  conductores?: Record<string, any>;
  alerts?: Record<string, any>;
  liveBuses?: Record<string, any>;
  configuracion_app?: Record<string, any>;
  municipios?: Record<string, any>;
  users?: Record<string, any>;
  [key: string]: Record<string, any> | undefined;
}

// ===================================================================================
// Import/Export Types
// ===================================================================================

export interface ImportOptions {
  format: 'gtfs' | 'geojson' | 'firebase';
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: Record<string, number>;
  errors?: string[];
  warnings?: string[];
  collectionsToImport?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ===================================================================================
// Legacy Types (Deprecated)
// ===================================================================================

/**
 * @deprecated Use types from lib/types.ts instead
 */
export interface Parada {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  routeIds: string[];
  amenities?: {
    shelter: boolean;
    bench: boolean;
    lighting: boolean;
    bin: boolean;
    wifi: boolean;
    realTimeDisplay: boolean;
  };
  operator?: string | null;
  network?: string | null;
  code?: string | null;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * @deprecated Use types from lib/types.ts instead
 */
export interface Ruta {
  id?: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  textColor: string;
  type: string;
  agencyId: string;
  stopIds: string[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * @deprecated Use types from lib/types.ts instead
 */
export interface Viaje {
  id?: string;
  routeId: string;
  calendarId: string;
  headsign: string;
  direction: 0 | 1;
  busId?: string | null;
  conductorId?: string | null;
  frequency: {
    startTime: string;
    endTime: string;
    headwaySecs: number;
    exactTimes?: boolean;
  };
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * @deprecated Use types from lib/types.ts instead
 */
export interface Calendario {
  id?: string;
  name: string;
  routeId?: string;
  operatingStartTime?: string;
  operatingEndTime?: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  holidays: string[];
}
