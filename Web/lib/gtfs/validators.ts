/**
 * Funciones de validación para datos GTFS y otros formatos
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
  ValidationError,
  ValidationResult,
} from '@/lib/types/gtfs';

/**
 * Valida coordenadas geográficas
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Valida un color hexadecimal
 */
function isValidHexColor(color: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Valida formato de tiempo HH:MM:SS
 */
function isValidTimeFormat(time: string): boolean {
  return /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/.test(time);
}

/**
 * Valida formato de fecha YYYYMMDD
 */
function isValidDateFormat(date: string): boolean {
  return /^[0-9]{8}$/.test(date);
}

/**
 * Valida datos GTFS
 */
export function validateGTFS(data: GTFSData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validar stops (obligatorio)
  if (!data.stops || data.stops.length === 0) {
    errors.push({
      field: 'stops',
      message: 'El archivo stops.txt es obligatorio y debe contener al menos una parada',
    });
  } else {
    data.stops.forEach((stop, index) => {
      if (!stop.stop_id) {
        errors.push({
          field: `stops[${index}].stop_id`,
          message: 'El campo stop_id es obligatorio',
          value: stop,
        });
      }

      if (!stop.stop_name) {
        errors.push({
          field: `stops[${index}].stop_name`,
          message: 'El campo stop_name es obligatorio',
          value: stop.stop_id,
        });
      }

      if (!isValidCoordinate(stop.stop_lat, stop.stop_lon)) {
        errors.push({
          field: `stops[${index}].coordinates`,
          message: 'Las coordenadas de la parada no son válidas',
          value: `${stop.stop_lat}, ${stop.stop_lon}`,
        });
      }
    });
  }

  // Validar routes (obligatorio)
  if (!data.routes || data.routes.length === 0) {
    errors.push({
      field: 'routes',
      message: 'El archivo routes.txt es obligatorio y debe contener al menos una ruta',
    });
  } else {
    data.routes.forEach((route, index) => {
      if (!route.route_id) {
        errors.push({
          field: `routes[${index}].route_id`,
          message: 'El campo route_id es obligatorio',
          value: route,
        });
      }

      if (!route.route_short_name && !route.route_long_name) {
        errors.push({
          field: `routes[${index}].name`,
          message: 'Se requiere al menos route_short_name o route_long_name',
          value: route.route_id,
        });
      }

      if (route.route_color && !isValidHexColor(route.route_color)) {
        warnings.push({
          field: `routes[${index}].route_color`,
          message: 'El color de la ruta no es un valor hexadecimal válido',
          value: route.route_color,
        });
      }

      if (route.route_text_color && !isValidHexColor(route.route_text_color)) {
        warnings.push({
          field: `routes[${index}].route_text_color`,
          message: 'El color del texto no es un valor hexadecimal válido',
          value: route.route_text_color,
        });
      }
    });
  }

  // Validar trips (obligatorio)
  if (!data.trips || data.trips.length === 0) {
    errors.push({
      field: 'trips',
      message: 'El archivo trips.txt es obligatorio y debe contener al menos un viaje',
    });
  } else {
    const routeIds = new Set(data.routes?.map((r) => r.route_id) || []);
    const serviceIds = new Set(data.calendar?.map((c) => c.service_id) || []);

    data.trips.forEach((trip, index) => {
      if (!trip.trip_id) {
        errors.push({
          field: `trips[${index}].trip_id`,
          message: 'El campo trip_id es obligatorio',
          value: trip,
        });
      }

      if (!trip.route_id) {
        errors.push({
          field: `trips[${index}].route_id`,
          message: 'El campo route_id es obligatorio',
          value: trip.trip_id,
        });
      } else if (!routeIds.has(trip.route_id)) {
        errors.push({
          field: `trips[${index}].route_id`,
          message: 'El route_id no existe en routes.txt',
          value: trip.route_id,
        });
      }

      if (!trip.service_id) {
        errors.push({
          field: `trips[${index}].service_id`,
          message: 'El campo service_id es obligatorio',
          value: trip.trip_id,
        });
      } else if (serviceIds.size > 0 && !serviceIds.has(trip.service_id)) {
        warnings.push({
          field: `trips[${index}].service_id`,
          message: 'El service_id no existe en calendar.txt',
          value: trip.service_id,
        });
      }
    });
  }

  // Validar stop_times (obligatorio)
  if (!data.stop_times || data.stop_times.length === 0) {
    errors.push({
      field: 'stop_times',
      message: 'El archivo stop_times.txt es obligatorio y debe contener al menos un horario',
    });
  } else {
    const tripIds = new Set(data.trips?.map((t) => t.trip_id) || []);
    const stopIds = new Set(data.stops?.map((s) => s.stop_id) || []);

    data.stop_times.forEach((stopTime, index) => {
      if (!stopTime.trip_id) {
        errors.push({
          field: `stop_times[${index}].trip_id`,
          message: 'El campo trip_id es obligatorio',
          value: stopTime,
        });
      } else if (!tripIds.has(stopTime.trip_id)) {
        errors.push({
          field: `stop_times[${index}].trip_id`,
          message: 'El trip_id no existe en trips.txt',
          value: stopTime.trip_id,
        });
      }

      if (!stopTime.stop_id) {
        errors.push({
          field: `stop_times[${index}].stop_id`,
          message: 'El campo stop_id es obligatorio',
          value: stopTime.trip_id,
        });
      } else if (!stopIds.has(stopTime.stop_id)) {
        errors.push({
          field: `stop_times[${index}].stop_id`,
          message: 'El stop_id no existe en stops.txt',
          value: stopTime.stop_id,
        });
      }

      if (!stopTime.arrival_time) {
        errors.push({
          field: `stop_times[${index}].arrival_time`,
          message: 'El campo arrival_time es obligatorio',
          value: stopTime.trip_id,
        });
      } else if (!isValidTimeFormat(stopTime.arrival_time)) {
        errors.push({
          field: `stop_times[${index}].arrival_time`,
          message: 'El formato de arrival_time debe ser HH:MM:SS',
          value: stopTime.arrival_time,
        });
      }

      if (!stopTime.departure_time) {
        errors.push({
          field: `stop_times[${index}].departure_time`,
          message: 'El campo departure_time es obligatorio',
          value: stopTime.trip_id,
        });
      } else if (!isValidTimeFormat(stopTime.departure_time)) {
        errors.push({
          field: `stop_times[${index}].departure_time`,
          message: 'El formato de departure_time debe ser HH:MM:SS',
          value: stopTime.departure_time,
        });
      }

      if (stopTime.stop_sequence === undefined || stopTime.stop_sequence === null) {
        errors.push({
          field: `stop_times[${index}].stop_sequence`,
          message: 'El campo stop_sequence es obligatorio',
          value: stopTime.trip_id,
        });
      }
    });
  }

  // Validar calendar (opcional pero recomendado)
  if (data.calendar) {
    data.calendar.forEach((calendar, index) => {
      if (!calendar.service_id) {
        errors.push({
          field: `calendar[${index}].service_id`,
          message: 'El campo service_id es obligatorio',
          value: calendar,
        });
      }

      if (!isValidDateFormat(calendar.start_date)) {
        errors.push({
          field: `calendar[${index}].start_date`,
          message: 'El formato de start_date debe ser YYYYMMDD',
          value: calendar.start_date,
        });
      }

      if (!isValidDateFormat(calendar.end_date)) {
        errors.push({
          field: `calendar[${index}].end_date`,
          message: 'El formato de end_date debe ser YYYYMMDD',
          value: calendar.end_date,
        });
      }
    });
  } else {
    warnings.push({
      field: 'calendar',
      message: 'No se encontró el archivo calendar.txt. Se recomienda incluirlo para especificar los días de servicio',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida datos GeoJSON
 */
export function validateGeoJSON(data: GeoJSONFeatureCollection): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (data.type !== 'FeatureCollection') {
    errors.push({
      field: 'type',
      message: 'El tipo debe ser FeatureCollection',
      value: data.type,
    });
  }

  if (!data.features || data.features.length === 0) {
    errors.push({
      field: 'features',
      message: 'El archivo debe contener al menos una feature',
    });
  } else {
    data.features.forEach((feature, index) => {
      if (feature.type !== 'Feature') {
        errors.push({
          field: `features[${index}].type`,
          message: 'El tipo de feature debe ser Feature',
          value: feature.type,
        });
      }

      if (feature.geometry.type !== 'Point') {
        warnings.push({
          field: `features[${index}].geometry.type`,
          message: 'Solo se procesarán geometrías de tipo Point',
          value: feature.geometry.type,
        });
      }

      const [lng, lat] = feature.geometry.coordinates;
      if (!isValidCoordinate(lat, lng)) {
        errors.push({
          field: `features[${index}].geometry.coordinates`,
          message: 'Las coordenadas no son válidas',
          value: feature.geometry.coordinates,
        });
      }

      if (!feature.properties.name && !feature.properties['name:es'] && !feature.properties['name:en']) {
        warnings.push({
          field: `features[${index}].properties.name`,
          message: 'La feature no tiene nombre',
          value: feature.id,
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida datos de Firebase Export
 */
export function validateFirebaseExport(data: FirebaseExport): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validar que tenga al menos una colección
  const collections = ['stops', 'routes', 'trips', 'calendars'];
  const hasAnyCollection = collections.some((col) => data[col as keyof FirebaseExport]);

  if (!hasAnyCollection) {
    errors.push({
      field: 'collections',
      message: 'El archivo debe contener al menos una colección (stops, routes, trips, calendars)',
    });
  }

  // Validar stops
  if (data.stops) {
    const stopIds = Object.keys(data.stops);
    if (stopIds.length === 0) {
      warnings.push({
        field: 'stops',
        message: 'La colección stops está vacía',
      });
    } else {
      stopIds.forEach((stopId) => {
        const stop = data.stops![stopId];
        if (!stop.lat || !stop.lng) {
          errors.push({
            field: `stops.${stopId}`,
            message: 'La parada debe tener coordenadas (lat, lng)',
            value: stopId,
          });
        } else if (!isValidCoordinate(stop.lat, stop.lng)) {
          errors.push({
            field: `stops.${stopId}.coordinates`,
            message: 'Las coordenadas no son válidas',
            value: `${stop.lat}, ${stop.lng}`,
          });
        }

        if (!stop.name) {
          errors.push({
            field: `stops.${stopId}.name`,
            message: 'La parada debe tener un nombre',
            value: stopId,
          });
        }
      });
    }
  }

  // Validar routes
  if (data.routes) {
    const routeIds = Object.keys(data.routes);
    if (routeIds.length === 0) {
      warnings.push({
        field: 'routes',
        message: 'La colección routes está vacía',
      });
    } else {
      routeIds.forEach((routeId) => {
        const route = data.routes![routeId];
        if (!route.name && !route.shortName) {
          errors.push({
            field: `routes.${routeId}.name`,
            message: 'La ruta debe tener un nombre o shortName',
            value: routeId,
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
