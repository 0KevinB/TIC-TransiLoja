# GTFS Feed - TransiLoja

Este directorio contiene archivos GTFS (General Transit Feed Specification) de ejemplo para el sistema de transporte público de Loja, Ecuador.

## Archivos Incluidos

### Archivos Obligatorios:
✓ agency.txt         - Información de la agencia de transporte (SITU)
✓ stops.txt          - 10 paradas distribuidas por la ciudad
✓ routes.txt         - 4 rutas (L5, L2, L7, L12)
✓ trips.txt          - 6 viajes de ejemplo
✓ stop_times.txt     - Horarios detallados para cada viaje
✓ calendar.txt       - 3 calendarios de servicio (días laborables, fines de semana, todos los días)

### Archivos Opcionales:
✓ fare_attributes.txt  - 3 tipos de tarifas (Regular: $0.35, Estudiante: $0.18, Preferencial: $0.12)
✓ fare_rules.txt       - Reglas de aplicación de tarifas
✓ frequencies.txt      - Frecuencias de servicio (cada 15-30 min según ruta)
✓ calendar_dates.txt   - Excepciones para días festivos 2025
✓ feed_info.txt        - Información general del feed

## Cómo Importar

### Opción 1: Importar desde la Aplicación Web

1. Navega a: http://localhost:3000/dashboard/import
2. Selecciona la pestaña "GTFS"
3. Selecciona TODOS los archivos .txt de esta carpeta (puedes seleccionar múltiples)
4. Click en "Validar Archivos"
5. Si la validación es exitosa, click en "Importar a Firestore"

### Opción 2: Importar Programáticamente

```javascript
import { readGTFSFiles, parseGTFS, validateGTFS, transformGTFSToFirebase, importToFirestore } from '@/lib/gtfs';

// Leer archivos
const fileContents = await readGTFSFiles(fileList);

// Parsear
const gtfsData = parseGTFS(fileContents);

// Validar
const validation = validateGTFS(gtfsData);

if (validation.valid) {
  // Transformar
  const firebaseData = transformGTFSToFirebase(gtfsData);

  // Importar
  const result = await importToFirestore(firebaseData, {
    format: 'gtfs',
    overwrite: false,
    dryRun: false,
  });

  console.log(result.message);
}
```

## Datos Incluidos

### Rutas:
- Línea 5 (L5): Colinas Lojanas - El Paraíso (Color: Turquesa)
- Línea 2 (L2): Centro - Argelia (Color: Naranja)
- Línea 7 (L7): Línea 7 (Color: Verde)
- Línea 12 (L12): Línea 12 (Color: Morado)

### Paradas:
1. Parada 1 - Colinas Lojanas
2. Parada 2 - Intermedia
3. Parada 3 - El Paraíso
4. Terminal La Tebaida - Estación principal
5. Coliseo
6. Benjamín Carrión
7. Miguel Riofrío
8. Puente Bolívar
9. Filipinas
10. Estadio

### Calendarios:
- WEEKDAY: Lunes a Viernes
- WEEKEND: Sábados y Domingos
- ALLDAYS: Todos los días

### Frecuencias:
- L5: Cada 15 minutos (06:00-22:00)
- L2: Cada 20 minutos (06:30-21:30)
- L7: Cada 30 minutos (06:45-20:00)
- L12: Cada 30 minutos (07:30-19:30)

### Tarifas:
- Regular: $0.35 USD
- Estudiante: $0.18 USD
- Preferencial: $0.12 USD

## Notas Importantes

1. Todas las coordenadas están en formato WGS84 (lat, lon)
2. Los horarios están en formato 24 horas (HH:MM:SS)
3. Las fechas están en formato YYYYMMDD
4. Este es un dataset de ejemplo - puedes modificarlo según tus necesidades
5. Los archivos están codificados en UTF-8

## Validación

Todos los archivos han sido creados siguiendo la especificación GTFS oficial:
https://gtfs.org/schedule/reference/

Puedes validar estos archivos usando:
- Google's GTFS Validator: https://gtfs-validator.mobilitydata.org/
- TransiLoja Import Module (incluye validación automática)

## Contacto

Para más información:
- Email: kevin010803abq@gmail.com
- Web: https://loja.gob.ec

## Licencia

Estos datos son de dominio público y pueden ser usados libremente para propósitos de desarrollo y prueba.
