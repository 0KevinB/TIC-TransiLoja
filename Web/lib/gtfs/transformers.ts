/**
 * Funciones de transformación de datos a formato Firebase
 */

import {
  GTFSData,
  GTFSStop,
  GTFSRoute,
  GTFSTrip,
  GTFSStopTime,
  GTFSCalendar,
  GeoJSONFeatureCollection,
  FirebaseExport,
} from '@/lib/types/gtfs';
import { Timestamp } from 'firebase/firestore';

/**
 * Genera un ID único
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Convierte un color GTFS a formato hexadecimal
 */
function normalizeColor(color?: string): string {
  if (!color) return '#3B82F6'; // Color por defecto
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Convierte formato de fecha YYYYMMDD a timestamp
 */
function dateStringToTimestamp(dateString: string): Timestamp {
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Meses en JS son 0-indexed
  const day = parseInt(dateString.substring(6, 8));
  const date = new Date(year, month, day);
  return Timestamp.fromDate(date);
}

/**
 * Transforma paradas GTFS a formato Firebase
 */
export function transformGTFSStops(stops: GTFSStop[]): Record<string, any> {
  const result: Record<string, any> = {};

  stops.forEach((stop) => {
    const id = stop.stop_id || generateId();

    result[id] = {
      // Campos básicos
      name: stop.stop_name,
      lat: stop.stop_lat,
      lng: stop.stop_lon,
      routeIds: [], // Se poblará al procesar rutas

      // Campos GTFS estándar
      code: stop.stop_code || null,
      desc: stop.stop_desc || null,
      zoneId: stop.zone_id || null,
      url: stop.stop_url || null,
      locationType: stop.location_type || null,
      parentStation: stop.parent_station || null,
      timezone: stop.stop_timezone || null,
      wheelchairBoarding: stop.wheelchair_boarding || null,
      levelId: stop.level_id || null,
      platformCode: stop.platform_code || null,

      // Amenidades (por defecto)
      amenities: {
        shelter: false, // GTFS no tiene campo específico para shelter
        bench: false,
        lighting: false,
        bin: false,
        wifi: false,
        realTimeDisplay: false,
      },
      operator: null,
      network: null,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  });

  return result;
}

/**
 * Mapea route_type de GTFS a tipo de transporte
 */
function mapRouteType(routeType: string): string {
  const typeMap: Record<string, string> = {
    '0': 'tram',
    '1': 'metro',
    '2': 'rail',
    '3': 'bus',
    '4': 'ferry',
    '5': 'cable_tram',
    '6': 'aerial_lift',
    '7': 'funicular',
    '11': 'trolleybus',
    '12': 'monorail',
  };
  return typeMap[routeType] || 'bus';
}

/**
 * Transforma rutas GTFS a formato Firebase
 */
export function transformGTFSRoutes(routes: GTFSRoute[], stopsByRoute: Map<string, string[]>): Record<string, any> {
  const result: Record<string, any> = {};

  routes.forEach((route) => {
    const id = route.route_id || generateId();

    result[id] = {
      // Campos básicos
      name: route.route_long_name || route.route_short_name,
      shortName: route.route_short_name,
      description: route.route_desc || '',
      color: normalizeColor(route.route_color),
      textColor: normalizeColor(route.route_text_color || 'FFFFFF'),
      type: mapRouteType(route.route_type),
      agencyId: route.agency_id || 'SITU',
      stopIds: stopsByRoute.get(id) || [],

      // Campos GTFS estándar
      url: route.route_url || null,
      sortOrder: route.route_sort_order || null,
      continuousPickup: route.continuous_pickup || null,
      continuousDropOff: route.continuous_drop_off || null,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  });

  return result;
}

/**
 * Transforma calendarios GTFS a formato Firebase
 */
export function transformGTFSCalendars(calendars: GTFSCalendar[]): Record<string, any> {
  const result: Record<string, any> = {};

  calendars.forEach((calendar) => {
    const id = calendar.service_id || generateId();

    result[id] = {
      name: `Calendario ${calendar.service_id}`,
      routeId: 'general', // GTFS no especifica ruta, usar valor general
      operatingStartTime: '06:00', // Valor por defecto
      operatingEndTime: '22:00', // Valor por defecto
      monday: calendar.monday === '1',
      tuesday: calendar.tuesday === '1',
      wednesday: calendar.wednesday === '1',
      thursday: calendar.thursday === '1',
      friday: calendar.friday === '1',
      saturday: calendar.saturday === '1',
      sunday: calendar.sunday === '1',
      startDate: dateStringToTimestamp(calendar.start_date),
      endDate: dateStringToTimestamp(calendar.end_date),
      holidays: [],
    };
  });

  return result;
}

/**
 * Transforma viajes GTFS a formato Firebase
 */
export function transformGTFSTrips(
  trips: GTFSTrip[],
  stopTimes: GTFSStopTime[],
  routeIdMap: Map<string, string>,
  calendarIdMap: Map<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};

  // Agrupar stop_times por trip_id
  const stopTimesByTrip = new Map<string, GTFSStopTime[]>();
  stopTimes.forEach((st) => {
    if (!stopTimesByTrip.has(st.trip_id)) {
      stopTimesByTrip.set(st.trip_id, []);
    }
    stopTimesByTrip.get(st.trip_id)!.push(st);
  });

  trips.forEach((trip) => {
    const id = trip.trip_id || generateId();
    const routeId = routeIdMap.get(trip.route_id) || trip.route_id;
    const calendarId = calendarIdMap.get(trip.service_id) || trip.service_id;

    const tripStopTimes = stopTimesByTrip.get(trip.trip_id) || [];
    tripStopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);

    result[id] = {
      // Campos básicos
      routeId,
      calendarId,
      headsign: trip.trip_headsign || 'Terminal',
      direction: trip.direction_id === '1' ? 1 : 0,

      // Asignaciones de recursos (no disponibles en GTFS estándar)
      busId: null, // Se debe asignar manualmente después de importar
      conductorId: null, // Se debe asignar manualmente después de importar

      // Campos GTFS estándar
      shortName: trip.trip_short_name || null,
      blockId: trip.block_id || null,
      shapeId: trip.shape_id || null,
      wheelchairAccessible: trip.wheelchair_accessible || null,
      bikesAllowed: trip.bikes_allowed || null,

      frequency: {
        startTime: tripStopTimes[0]?.departure_time || '06:00:00',
        endTime: tripStopTimes[tripStopTimes.length - 1]?.arrival_time || '22:00:00',
        headwaySecs: 900, // 15 minutos por defecto
        exactTimes: false,
      },
      stopTimesRef: `stopTimes/trip_${id}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  });

  return result;
}

/**
 * Transforma stop_times GTFS a formato Firebase
 */
export function transformGTFSStopTimes(
  stopTimes: GTFSStopTime[],
  tripIdMap: Map<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};

  // Agrupar por trip_id
  const stopTimesByTrip = new Map<string, GTFSStopTime[]>();
  stopTimes.forEach((st) => {
    if (!stopTimesByTrip.has(st.trip_id)) {
      stopTimesByTrip.set(st.trip_id, []);
    }
    stopTimesByTrip.get(st.trip_id)!.push(st);
  });

  stopTimesByTrip.forEach((times, tripId) => {
    const mappedTripId = tripIdMap.get(tripId) || tripId;
    times.sort((a, b) => a.stop_sequence - b.stop_sequence);

    result[`trip_${mappedTripId}`] = {
      tripId: mappedTripId,
      times: times.map((st) => ({
        // Campos básicos
        stopId: st.stop_id,
        stopSequence: st.stop_sequence,
        arrivalTime: st.arrival_time,
        departureTime: st.departure_time,

        // Campos GTFS estándar
        stopHeadsign: st.stop_headsign || null,
        pickupType: st.pickup_type || null,
        dropOffType: st.drop_off_type || null,
        continuousPickup: st.continuous_pickup || null,
        continuousDropOff: st.continuous_drop_off || null,
        shapeDistTraveled: st.shape_dist_traveled || null,
        timepoint: st.timepoint || null,

        // Campos personalizados
        dwellTime: 30, // Tiempo de espera por defecto
        distanceTraveled: st.shape_dist_traveled || 0,
      })),
      totalDuration: calculateTripDuration(times[0].departure_time, times[times.length - 1].arrival_time),
      createdAt: Timestamp.now(),
    };
  });

  return result;
}

/**
 * Calcula la duración de un viaje en segundos
 */
function calculateTripDuration(startTime: string, endTime: string): number {
  const start = timeStringToSeconds(startTime);
  const end = timeStringToSeconds(endTime);
  return end - start;
}

/**
 * Convierte un string de tiempo HH:MM:SS a segundos
 */
function timeStringToSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Transforma datos completos GTFS a formato Firebase
 */
export function transformGTFSToFirebase(gtfsData: GTFSData): FirebaseExport {
  const firebaseExport: FirebaseExport = {};

  // 1. Transformar paradas
  if (gtfsData.stops) {
    firebaseExport.stops = transformGTFSStops(gtfsData.stops);
  }

  // 2. Construir mapa de paradas por ruta
  const stopsByRoute = new Map<string, string[]>();
  if (gtfsData.trips && gtfsData.stop_times) {
    const stopsByTrip = new Map<string, string[]>();

    gtfsData.stop_times
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .forEach((st) => {
        if (!stopsByTrip.has(st.trip_id)) {
          stopsByTrip.set(st.trip_id, []);
        }
        stopsByTrip.get(st.trip_id)!.push(st.stop_id);
      });

    gtfsData.trips.forEach((trip) => {
      if (!stopsByRoute.has(trip.route_id)) {
        stopsByRoute.set(trip.route_id, []);
      }
      const tripStops = stopsByTrip.get(trip.trip_id) || [];
      const existingStops = stopsByRoute.get(trip.route_id)!;
      tripStops.forEach((stopId) => {
        if (!existingStops.includes(stopId)) {
          existingStops.push(stopId);
        }
      });
    });
  }

  // 3. Transformar rutas
  if (gtfsData.routes) {
    firebaseExport.routes = transformGTFSRoutes(gtfsData.routes, stopsByRoute);
  }

  // 4. Transformar calendarios
  if (gtfsData.calendar) {
    firebaseExport.calendars = transformGTFSCalendars(gtfsData.calendar);
  }

  // 5. Transformar viajes
  if (gtfsData.trips && gtfsData.stop_times) {
    const routeIdMap = new Map<string, string>();
    if (gtfsData.routes) {
      gtfsData.routes.forEach((r) => routeIdMap.set(r.route_id, r.route_id));
    }

    const calendarIdMap = new Map<string, string>();
    if (gtfsData.calendar) {
      gtfsData.calendar.forEach((c) => calendarIdMap.set(c.service_id, c.service_id));
    }

    firebaseExport.trips = transformGTFSTrips(gtfsData.trips, gtfsData.stop_times, routeIdMap, calendarIdMap);
  }

  // 6. Transformar stop_times
  if (gtfsData.stop_times) {
    const tripIdMap = new Map<string, string>();
    if (gtfsData.trips) {
      gtfsData.trips.forEach((t) => tripIdMap.set(t.trip_id, t.trip_id));
    }

    firebaseExport.stop_times = transformGTFSStopTimes(gtfsData.stop_times, tripIdMap);
  }

  // 7. Actualizar routeIds en stops
  if (firebaseExport.stops && stopsByRoute.size > 0) {
    stopsByRoute.forEach((stopIds, routeId) => {
      stopIds.forEach((stopId) => {
        if (firebaseExport.stops![stopId]) {
          if (!firebaseExport.stops![stopId].routeIds.includes(routeId)) {
            firebaseExport.stops![stopId].routeIds.push(routeId);
          }
        }
      });
    });
  }

  return firebaseExport;
}

/**
 * Transforma GeoJSON a formato Firebase (solo paradas)
 */
export function transformGeoJSONToFirebase(geoJson: GeoJSONFeatureCollection): FirebaseExport {
  const stops: Record<string, any> = {};

  geoJson.features.forEach((feature) => {
    if (feature.geometry.type !== 'Point') return;

    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.id.toString().replace(/[^a-zA-Z0-9]/g, '_') || generateId();

    const name =
      feature.properties.name ||
      feature.properties['name:es'] ||
      feature.properties['name:en'] ||
      'Parada sin nombre';

    // Determinar wheelchair_boarding basado en las amenidades
    let wheelchairBoarding: '0' | '1' | '2' | null = null;
    if (feature.properties.wheelchair_boarding) {
      wheelchairBoarding = feature.properties.wheelchair_boarding === 'yes' ? '1' : '2';
    }

    stops[id] = {
      // Campos básicos
      name,
      lat,
      lng,
      routeIds: [],

      // Campos GTFS estándar (extraídos de OSM)
      code: feature.properties.ref || null,
      desc: null,
      zoneId: null,
      url: null,
      locationType: feature.properties.public_transport === 'platform' ? '0' : null,
      parentStation: null,
      timezone: null,
      wheelchairBoarding,
      levelId: null,
      platformCode: feature.properties.platform_code || null,

      // Amenidades (desde OSM)
      amenities: {
        shelter: feature.properties.shelter === 'yes',
        bench: feature.properties.bench === 'yes',
        lighting: feature.properties.lit === 'yes',
        bin: feature.properties.bin === 'yes',
        wifi: false,
        realTimeDisplay: feature.properties.passenger_information_display === 'yes',
      },
      operator: feature.properties.operator || null,
      network: feature.properties.network || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  });

  return { stops };
}

/**
 * Transforma Firebase Export a formato Firebase (normalización)
 */
export function normalizeFirebaseExport(data: FirebaseExport): FirebaseExport {
  // Ya está en formato Firebase, solo verificar timestamps
  const result: FirebaseExport = { ...data };

  // Asegurar que los timestamps sean objetos Timestamp
  const ensureTimestamp = (obj: any) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key]._seconds !== undefined) {
            obj[key] = new Timestamp(obj[key]._seconds, obj[key]._nanoseconds || 0);
          } else {
            ensureTimestamp(obj[key]);
          }
        }
      });
    }
  };

  ensureTimestamp(result);

  return result;
}
