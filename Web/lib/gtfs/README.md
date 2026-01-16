# Módulo de Importación GTFS

Este módulo permite importar datos de transporte público desde múltiples formatos:
- **GTFS** (General Transit Feed Specification) - Archivos TXT/CSV
- **GeoJSON** - Para paradas de bus (formato OpenStreetMap)
- **Firebase Export** - Exportaciones JSON de Firebase

**✨ 100% Compatible con el estándar GTFS**: Todos los campos del estándar GTFS se mapean correctamente a la estructura de Firebase. Ver [GTFS-FIREBASE-MAPPING.md](./GTFS-FIREBASE-MAPPING.md) para el mapeo completo.

## Estructura del Módulo

```
lib/gtfs/
├── index.ts           # Exporta todas las funciones
├── parsers.ts         # Funciones de parseo
├── validators.ts      # Funciones de validación
├── transformers.ts    # Funciones de transformación
└── importer.ts        # Funciones de importación a Firestore

lib/types/
└── gtfs.ts           # Tipos TypeScript para GTFS
```

## Uso Básico

### 1. Importar Archivos GTFS

```typescript
import {
  readGTFSFiles,
  parseGTFS,
  validateGTFS,
  transformGTFSToFirebase,
  importToFirestore,
} from '@/lib/gtfs';

// Leer archivos
const fileContents = await readGTFSFiles(fileList);

// Parsear
const gtfsData = parseGTFS(fileContents);

// Validar
const validation = validateGTFS(gtfsData);

if (validation.valid) {
  // Transformar a formato Firebase
  const firebaseData = transformGTFSToFirebase(gtfsData);

  // Importar a Firestore
  const result = await importToFirestore(firebaseData, {
    format: 'gtfs',
    overwrite: false,
    dryRun: false,
  });

  console.log(result.message);
}
```

### 2. Importar Paradas desde GeoJSON

```typescript
import {
  readSingleFile,
  parseGeoJSON,
  validateGeoJSON,
  transformGeoJSONToFirebase,
  importStops,
} from '@/lib/gtfs';

// Leer archivo
const content = await readSingleFile(file);

// Parsear
const geoJsonData = parseGeoJSON(content);

// Validar
const validation = validateGeoJSON(geoJsonData);

if (validation.valid) {
  // Transformar
  const firebaseData = transformGeoJSONToFirebase(geoJsonData);

  // Importar solo paradas
  const result = await importStops(firebaseData.stops!, false);

  console.log(result.message);
}
```

### 3. Importar desde Firebase Export

```typescript
import {
  readSingleFile,
  parseFirebaseExport,
  validateFirebaseExport,
  normalizeFirebaseExport,
  importToFirestore,
} from '@/lib/gtfs';

// Leer archivo
const content = await readSingleFile(file);

// Parsear
const firebaseData = parseFirebaseExport(content);

// Validar
const validation = validateFirebaseExport(firebaseData);

if (validation.valid) {
  // Normalizar (convertir timestamps)
  const normalizedData = normalizeFirebaseExport(firebaseData);

  // Importar
  const result = await importToFirestore(normalizedData, {
    format: 'firebase',
    overwrite: false,
    dryRun: false,
  });

  console.log(result.message);
}
```

## Formatos Soportados

### GTFS (General Transit Feed Specification)

Archivos soportados:
- ✅ `agency.txt` - Información de la agencia (opcional)
- ✅ `stops.txt` - Paradas (obligatorio)
- ✅ `routes.txt` - Rutas (obligatorio)
- ✅ `trips.txt` - Viajes (obligatorio)
- ✅ `stop_times.txt` - Horarios de paradas (obligatorio)
- ✅ `calendar.txt` - Calendarios de servicio (recomendado)
- ✅ `calendar_dates.txt` - Excepciones de calendario (opcional)
- ✅ `fare_attributes.txt` - Atributos de tarifas (opcional)
- ✅ `fare_rules.txt` - Reglas de tarifas (opcional)
- ✅ `shapes.txt` - Formas de rutas (opcional)
- ✅ `frequencies.txt` - Frecuencias (opcional)
- ✅ `transfers.txt` - Transferencias (opcional)
- ✅ `feed_info.txt` - Información del feed (opcional)

### GeoJSON (OpenStreetMap)

Formato esperado:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [lng, lat]
      },
      "properties": {
        "name": "Nombre de la parada",
        "operator": "SITU",
        "network": "Red de transporte",
        "bench": "yes",
        "shelter": "yes",
        "lit": "yes"
      }
    }
  ]
}
```

### Firebase Export

Formato esperado:
```json
{
  "stops": { "id": { ... } },
  "routes": { "id": { ... } },
  "trips": { "id": { ... } },
  "calendars": { "id": { ... } },
  "stop_times": { "id": { ... } }
}
```

## Validación

El módulo incluye validación exhaustiva de datos:

### Validación GTFS
- Verifica archivos obligatorios
- Valida coordenadas geográficas
- Verifica relaciones entre entidades (route_id, trip_id, stop_id)
- Valida formatos de tiempo (HH:MM:SS)
- Valida formatos de fecha (YYYYMMDD)
- Valida colores hexadecimales

### Validación GeoJSON
- Verifica que sea un FeatureCollection
- Valida geometrías de tipo Point
- Verifica coordenadas válidas
- Advierte sobre features sin nombre

### Validación Firebase Export
- Verifica que exista al menos una colección
- Valida estructura de stops
- Valida estructura de routes
- Verifica coordenadas en paradas

## Transformación de Datos

El módulo transforma automáticamente los datos al formato de Firebase:

### GTFS → Firebase
- `GTFSStop` → `Parada`
- `GTFSRoute` → `Ruta`
- `GTFSTrip` → `Viaje`
- `GTFSCalendar` → `Calendario`
- `GTFSStopTime` → `stop_times` (subcollection)

### GeoJSON → Firebase
- `GeoJSONFeature` → `Parada`

## Opciones de Importación

```typescript
interface ImportOptions {
  format: 'gtfs' | 'firebase' | 'geojson';
  overwrite?: boolean;    // Sobrescribir datos existentes
  dryRun?: boolean;       // Validar sin importar
  municipioId?: string;   // ID del municipio
}
```

## Funciones Auxiliares

### Estadísticas
```typescript
// Obtener estadísticas de colecciones
const stats = await getCollectionStats();
console.log(stats); // { stops: 100, routes: 10, ... }
```

### Limpieza de Datos
```typescript
// CUIDADO: Elimina TODOS los datos de transporte
await clearAllTransitData();
```

### Actualizar Relaciones
```typescript
// Actualizar routeIds en paradas después de importar rutas
await updateStopRoutes();
```

### Detectar Formato
```typescript
const format = detectFormat(content, filename);
// Retorna: 'gtfs' | 'geojson' | 'firebase' | 'unknown'
```

## Interfaz de Usuario

La página de importación está disponible en:
```
/dashboard/import
```

Características:
- ✅ Pestañas para seleccionar formato
- ✅ Drag & drop de archivos
- ✅ Validación en tiempo real
- ✅ Modo de prueba (dry run)
- ✅ Opción de sobrescribir datos
- ✅ Barra de progreso
- ✅ Reporte de errores y advertencias
- ✅ Estadísticas de importación
- ✅ Visualización de datos actuales

## Consideraciones

### Límites de Firestore
- Batch writes limitados a 500 operaciones
- El módulo maneja automáticamente la paginación

### Timestamps
- Los timestamps de GTFS (YYYYMMDD) se convierten a Firestore Timestamp
- Los timestamps de Firebase Export se normalizan automáticamente

### IDs
- Los IDs de GTFS se preservan cuando es posible
- Para GeoJSON, se genera un ID basado en el ID de OSM
- Se pueden generar IDs aleatorios si no existen

### Validación vs. Importación
- Siempre valida antes de importar
- Usa `dryRun: true` para probar sin importar
- Los errores de validación impiden la importación

## Ejemplos de Uso

### Ejemplo 1: Importar GTFS completo
```typescript
// En un componente React
const handleImportGTFS = async (files: FileList) => {
  try {
    // 1. Leer archivos
    const fileContents = await readGTFSFiles(files);

    // 2. Parsear
    const gtfsData = parseGTFS(fileContents);

    // 3. Validar
    const validation = validateGTFS(gtfsData);

    if (!validation.valid) {
      console.error('Errores de validación:', validation.errors);
      return;
    }

    // 4. Transformar
    const firebaseData = transformGTFSToFirebase(gtfsData);

    // 5. Importar (modo prueba primero)
    const dryRunResult = await importToFirestore(firebaseData, {
      format: 'gtfs',
      overwrite: false,
      dryRun: true,
    });

    console.log('Modo prueba:', dryRunResult);

    // 6. Importar realmente
    const result = await importToFirestore(firebaseData, {
      format: 'gtfs',
      overwrite: false,
      dryRun: false,
    });

    console.log('Importación completada:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 2: Importar solo paradas desde GeoJSON
```typescript
const handleImportStops = async (file: File) => {
  try {
    const content = await readSingleFile(file);
    const geoJsonData = parseGeoJSON(content);
    const validation = validateGeoJSON(geoJsonData);

    if (validation.valid) {
      const firebaseData = transformGeoJSONToFirebase(geoJsonData);
      const result = await importStops(firebaseData.stops!, false);
      console.log(`${result.stats?.stops} paradas importadas`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Testing

Para probar el módulo sin afectar datos reales:

1. Usa `dryRun: true` en las opciones de importación
2. Revisa los stats reportados
3. Si todo está correcto, ejecuta con `dryRun: false`

## Soporte

Para reportar problemas o sugerencias:
- GitHub Issues: [TransiLoja](https://github.com/tuusuario/TransiLoja)
- Email: soporte@transi.com

## Licencia

MIT
