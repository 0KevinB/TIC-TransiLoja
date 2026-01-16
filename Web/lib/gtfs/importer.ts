/**
 * Funciones de importación de datos a Firestore
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  writeBatch,
  getDocs,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { FirebaseExport, ImportOptions, ImportResult } from '@/lib/types/gtfs';

/**
 * Importa paradas preservando amenidades personalizadas
 * Campos que SE PRESERVAN si ya existen: amenities
 */
async function importStopsWithPreservation(
  data: Record<string, any>,
  overwrite: boolean = false
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  const collectionRef = collection(db, 'stops');
  const entries = Object.entries(data);
  const batchSize = 500;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchEntries = entries.slice(i, i + batchSize);

    // Pre-cargar documentos existentes para preservar campos
    const existingDocsPromises = batchEntries.map(async ([id]) => {
      const docRef = doc(collectionRef, id);
      const docSnap = await getDoc(docRef);
      return { id, exists: docSnap.exists(), data: docSnap.data() };
    });

    const existingDocs = await Promise.all(existingDocsPromises);

    batchEntries.forEach(([id, value], index) => {
      const docRef = doc(collectionRef, id);
      const existing = existingDocs[index];

      // Preparar data preservando campos importantes
      let finalData = { ...value };

      if (existing.exists && existing.data) {
        // ✅ PRESERVAR amenities si existen y tienen valores personalizados
        if (existing.data.amenities) {
          const hasCustomAmenities = Object.values(existing.data.amenities).some(v => v === true);
          if (hasCustomAmenities) {
            finalData.amenities = existing.data.amenities;
          }
        }
      }

      batch.set(docRef, finalData, { merge: !overwrite });
    });

    try {
      await batch.commit();
      success += batchEntries.length;
    } catch (error) {
      errors.push(
        `Error al importar lote ${i / batchSize + 1} de stops: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  return { success, errors };
}

/**
 * Importa datos a Firestore en lotes
 */
async function importCollection(
  collectionName: string,
  data: Record<string, any>,
  overwrite: boolean = false
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  const collectionRef = collection(db, collectionName);

  // Si overwrite es true, eliminar datos existentes
  if (overwrite) {
    try {
      const snapshot = await getDocs(collectionRef);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      errors.push(`Error al eliminar datos existentes de ${collectionName}: ${error}`);
    }
  }

  // Importar en lotes de 500 (límite de Firestore)
  const entries = Object.entries(data);
  const batchSize = 500;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchEntries = entries.slice(i, i + batchSize);

    batchEntries.forEach(([id, value]) => {
      const docRef = doc(collectionRef, id);
      batch.set(docRef, value, { merge: !overwrite });
    });

    try {
      await batch.commit();
      success += batchEntries.length;
    } catch (error) {
      errors.push(
        `Error al importar lote ${i / batchSize + 1} de ${collectionName}: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  return { success, errors };
}

/**
 * Importa datos completos de Firebase Export a Firestore
 */
export async function importToFirestore(
  data: FirebaseExport,
  options: ImportOptions
): Promise<ImportResult> {
  const { overwrite = false, dryRun = false } = options;
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: Record<string, number> = {};

  // Identificar qué colecciones se van a importar
  const collectionsToImport = Object.keys(data).filter(
    (key) => data[key] && typeof data[key] === 'object' && Object.keys(data[key]!).length > 0
  );

  if (dryRun) {
    // Modo de prueba: solo validar y contar
    collectionsToImport.forEach((collectionName) => {
      const collectionData = data[collectionName];
      if (collectionData && typeof collectionData === 'object') {
        stats[collectionName] = Object.keys(collectionData).length;
      }
    });

    return {
      success: true,
      message: `Validación completada. Se importarían ${collectionsToImport.length} colecciones: ${collectionsToImport.join(', ')}. No se importaron datos (modo prueba).`,
      stats,
      errors,
      warnings,
      collectionsToImport,
    };
  }

  // IMPORTANTE: Solo importar las colecciones que están en los datos
  // No tocar otras colecciones que no están en el import
  const importOrder = [
    'stops',
    'routes',
    'calendars',
    'trips',
    'stop_times',
    'buses',
    'conductores',
    'alerts',
    'liveBuses',
    'configuracion_app',
    'municipios',
    'users',
  ];

  // Filtrar solo las colecciones que realmente están en los datos
  const orderedCollections = importOrder.filter((col) => collectionsToImport.includes(col));

  for (const collectionName of orderedCollections) {
    const collectionData = data[collectionName as keyof FirebaseExport];

    if (collectionData && typeof collectionData === 'object') {
      console.log(`Importando ${collectionName}...`);

      // ✅ Usar función especializada para stops que preserva amenities
      const result = collectionName === 'stops'
        ? await importStopsWithPreservation(
            collectionData as Record<string, any>,
            overwrite
          )
        : await importCollection(
            collectionName,
            collectionData as Record<string, any>,
            overwrite
          );

      stats[collectionName] = result.success;

      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }

      if (result.success > 0) {
        console.log(`✓ Importados ${result.success} documentos en ${collectionName}`);
        if (collectionName === 'stops') {
          console.log('  ℹ️  Amenities personalizados fueron preservados');
        }
      }
    }
  }

  const totalImported = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return {
    success: errors.length === 0,
    message:
      errors.length === 0
        ? `Importación completada exitosamente. ${totalImported} documentos importados en ${orderedCollections.length} colecciones.`
        : `Importación completada con ${errors.length} errores. ${totalImported} documentos importados.`,
    stats,
    errors,
    warnings,
    collectionsToImport: orderedCollections,
  };
}

/**
 * Importa solo paradas (útil para GeoJSON)
 */
export async function importStops(
  stops: Record<string, any>,
  overwrite: boolean = false
): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const result = await importCollection('stops', stops, overwrite);

  return {
    success: result.errors.length === 0,
    message:
      result.errors.length === 0
        ? `${result.success} paradas importadas exitosamente.`
        : `${result.success} paradas importadas con ${result.errors.length} errores.`,
    stats: { stops: result.success },
    errors: result.errors,
    warnings,
  };
}

/**
 * Actualiza las rutas en las paradas existentes
 * Esto es útil después de importar rutas para vincularlas con paradas
 */
export async function updateStopRoutes(): Promise<void> {
  const routesSnapshot = await getDocs(collection(db, 'routes'));
  const stopsToUpdate = new Map<string, string[]>();

  // Recopilar stopIds por ruta
  routesSnapshot.forEach((routeDoc) => {
    const route = routeDoc.data();
    const stopIds = route.stopIds || [];

    stopIds.forEach((stopId: string) => {
      if (!stopsToUpdate.has(stopId)) {
        stopsToUpdate.set(stopId, []);
      }
      stopsToUpdate.get(stopId)!.push(routeDoc.id);
    });
  });

  // Actualizar cada parada
  const batch = writeBatch(db);
  let count = 0;

  for (const [stopId, routeIds] of stopsToUpdate.entries()) {
    const stopRef = doc(db, 'stops', stopId);
    batch.update(stopRef, { routeIds });
    count++;

    // Firestore limita a 500 operaciones por batch
    if (count >= 500) {
      await batch.commit();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
}

/**
 * Limpia todas las colecciones de transporte
 * ¡CUIDADO! Esta función elimina todos los datos
 */
export async function clearAllTransitData(): Promise<void> {
  const collections = [
    'stops',
    'routes',
    'trips',
    'stop_times',
    'calendars',
    'liveBuses',
    'alerts',
  ];

  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✓ Eliminada colección: ${collectionName}`);
  }
}

/**
 * Obtiene estadísticas de las colecciones actuales
 */
export async function getCollectionStats(): Promise<Record<string, number>> {
  const collections = [
    'stops',
    'routes',
    'trips',
    'stop_times',
    'calendars',
    'buses',
    'conductores',
    'alerts',
    'liveBuses',
    'users',
  ];

  const stats: Record<string, number> = {};

  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      stats[collectionName] = snapshot.size;
    } catch (error) {
      stats[collectionName] = 0;
    }
  }

  return stats;
}

/**
 * Verifica si una colección está vacía
 */
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.empty;
}
