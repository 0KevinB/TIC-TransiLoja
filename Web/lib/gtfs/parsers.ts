/**
 * Funciones de parseo para diferentes formatos de importación
 */

import {
  GTFSData,
  GTFSAgency,
  GTFSStop,
  GTFSRoute,
  GTFSTrip,
  GTFSStopTime,
  GTFSCalendar,
  GTFSCalendarDate,
  GTFSFareAttribute,
  GTFSFareRule,
  GTFSShape,
  GTFSFrequency,
  GTFSTransfer,
  GTFSFeedInfo,
  GeoJSONFeatureCollection,
  FirebaseExport,
} from '@/lib/types/gtfs';

/**
 * Parsea un archivo CSV/TXT a un array de objetos
 */
function parseCSV<T>(content: string): T[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'));
  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parseo básico de CSV (maneja comillas)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: any = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"(.*)"$/, '$1') || '';

      // Convertir a número si es apropiado
      if (value && !isNaN(Number(value)) &&
          (header.includes('lat') || header.includes('lon') ||
           header.includes('sequence') || header.includes('type') ||
           header.includes('secs') || header.includes('time'))) {
        obj[header] = Number(value);
      } else {
        obj[header] = value;
      }
    });

    result.push(obj as T);
  }

  return result;
}

/**
 * Parsea archivos GTFS desde un objeto con contenidos de archivos
 */
export function parseGTFS(files: Record<string, string>): GTFSData {
  const gtfsData: GTFSData = {};

  // Parsear cada archivo GTFS
  if (files['agency.txt']) {
    gtfsData.agency = parseCSV<GTFSAgency>(files['agency.txt']);
  }

  if (files['stops.txt']) {
    gtfsData.stops = parseCSV<GTFSStop>(files['stops.txt']);
  }

  if (files['routes.txt']) {
    gtfsData.routes = parseCSV<GTFSRoute>(files['routes.txt']);
  }

  if (files['trips.txt']) {
    gtfsData.trips = parseCSV<GTFSTrip>(files['trips.txt']);
  }

  if (files['stop_times.txt']) {
    gtfsData.stop_times = parseCSV<GTFSStopTime>(files['stop_times.txt']);
  }

  if (files['calendar.txt']) {
    gtfsData.calendar = parseCSV<GTFSCalendar>(files['calendar.txt']);
  }

  if (files['calendar_dates.txt']) {
    gtfsData.calendar_dates = parseCSV<GTFSCalendarDate>(files['calendar_dates.txt']);
  }

  if (files['fare_attributes.txt']) {
    gtfsData.fare_attributes = parseCSV<GTFSFareAttribute>(files['fare_attributes.txt']);
  }

  if (files['fare_rules.txt']) {
    gtfsData.fare_rules = parseCSV<GTFSFareRule>(files['fare_rules.txt']);
  }

  if (files['shapes.txt']) {
    gtfsData.shapes = parseCSV<GTFSShape>(files['shapes.txt']);
  }

  if (files['frequencies.txt']) {
    gtfsData.frequencies = parseCSV<GTFSFrequency>(files['frequencies.txt']);
  }

  if (files['transfers.txt']) {
    gtfsData.transfers = parseCSV<GTFSTransfer>(files['transfers.txt']);
  }

  if (files['feed_info.txt']) {
    gtfsData.feed_info = parseCSV<GTFSFeedInfo>(files['feed_info.txt']);
  }

  return gtfsData;
}

/**
 * Parsea un archivo GeoJSON de paradas
 */
export function parseGeoJSON(content: string): GeoJSONFeatureCollection {
  try {
    const data = JSON.parse(content);

    if (data.type !== 'FeatureCollection') {
      throw new Error('El archivo no es un FeatureCollection válido');
    }

    return data as GeoJSONFeatureCollection;
  } catch (error) {
    throw new Error(`Error al parsear GeoJSON: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Parsea un archivo de exportación de Firebase
 */
export function parseFirebaseExport(content: string): FirebaseExport {
  try {
    const data = JSON.parse(content);
    return data as FirebaseExport;
  } catch (error) {
    throw new Error(`Error al parsear Firebase Export: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Detecta automáticamente el formato de un archivo
 */
export function detectFormat(content: string, filename: string): 'gtfs' | 'geojson' | 'firebase' | 'unknown' {
  // Detectar por extensión primero
  if (filename.endsWith('.txt')) {
    return 'gtfs';
  }

  if (filename.endsWith('.geojson') || filename.endsWith('.json')) {
    try {
      const data = JSON.parse(content);

      if (data.type === 'FeatureCollection') {
        return 'geojson';
      }

      if (data.routes || data.stops || data.trips) {
        return 'firebase';
      }
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
}

/**
 * Lee múltiples archivos GTFS desde un input de tipo file
 */
export async function readGTFSFiles(files: FileList): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = await file.text();
    result[file.name] = content;
  }

  return result;
}

/**
 * Lee un archivo único
 */
export async function readSingleFile(file: File): Promise<string> {
  return await file.text();
}
