'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  parseGTFS,
  parseGeoJSON,
  parseFirebaseExport,
  validateGTFS,
  validateGeoJSON,
  validateFirebaseExport,
  transformGTFSToFirebase,
  transformGeoJSONToFirebase,
  normalizeFirebaseExport,
  importToFirestore,
  importStops,
  getCollectionStats,
  clearAllTransitData,
  readGTFSFiles,
  readSingleFile,
  detectFormat,
} from '@/lib/gtfs';
import { ImportResult, ValidationResult } from '@/lib/types/gtfs';

export default function ImportPage() {
  const [selectedFormat, setSelectedFormat] = useState<'gtfs' | 'firebase' | 'geojson'>('gtfs');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentStats, setCurrentStats] = useState<Record<string, number> | null>(null);

  // Opciones
  const [overwrite, setOverwrite] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  // Cargar estadísticas actuales
  const loadStats = useCallback(async () => {
    try {
      const stats = await getCollectionStats();
      setCurrentStats(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  // Cargar estadísticas al montar
  useState(() => {
    loadStats();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setValidationResult(null);
    setImportResult(null);
  };

  const handleValidate = async () => {
    if (!files || files.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      if (selectedFormat === 'gtfs') {
        // Validar GTFS
        const fileContents = await readGTFSFiles(files);
        setProgress(30);

        const gtfsData = parseGTFS(fileContents);
        setProgress(50);

        const validation = validateGTFS(gtfsData);
        setProgress(100);

        setValidationResult(validation);
      } else if (selectedFormat === 'geojson') {
        // Validar GeoJSON
        const content = await readSingleFile(files[0]);
        setProgress(30);

        const geoJsonData = parseGeoJSON(content);
        setProgress(50);

        const validation = validateGeoJSON(geoJsonData);
        setProgress(100);

        setValidationResult(validation);
      } else if (selectedFormat === 'firebase') {
        // Validar Firebase Export
        const content = await readSingleFile(files[0]);
        setProgress(30);

        const firebaseData = parseFirebaseExport(content);
        setProgress(50);

        const validation = validateFirebaseExport(firebaseData);
        setProgress(100);

        setValidationResult(validation);
      }
    } catch (error) {
      console.error('Error al validar:', error);
      setValidationResult({
        valid: false,
        errors: [
          {
            field: 'general',
            message: error instanceof Error ? error.message : 'Error desconocido al validar',
          },
        ],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!files || files.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return;
    }

    if (!validationResult || !validationResult.valid) {
      alert('Por favor valida los archivos antes de importar');
      return;
    }

    // Si no es dry run, primero hacer una verificación para obtener las colecciones afectadas
    let collectionsAffected: string[] = [];

    if (!dryRun) {
      // Hacer un dry run rápido para obtener qué colecciones se van a afectar
      try {
        setLoading(true);
        let previewResult: ImportResult;

        if (selectedFormat === 'gtfs') {
          const fileContents = await readGTFSFiles(files);
          const gtfsData = parseGTFS(fileContents);
          const firebaseData = transformGTFSToFirebase(gtfsData);

          previewResult = await importToFirestore(firebaseData, {
            format: 'gtfs',
            overwrite,
            dryRun: true, // Siempre hacer dry run para preview
          });
        } else if (selectedFormat === 'geojson') {
          const content = await readSingleFile(files[0]);
          const geoJsonData = parseGeoJSON(content);
          const firebaseData = transformGeoJSONToFirebase(geoJsonData);

          previewResult = {
            success: true,
            message: 'Preview',
            collectionsToImport: ['stops'],
            stats: { stops: Object.keys(firebaseData.stops || {}).length },
          };
        } else {
          const content = await readSingleFile(files[0]);
          const firebaseData = parseFirebaseExport(content);
          const normalizedData = normalizeFirebaseExport(firebaseData);

          previewResult = await importToFirestore(normalizedData, {
            format: 'firebase',
            overwrite,
            dryRun: true, // Siempre hacer dry run para preview
          });
        }

        collectionsAffected = previewResult.collectionsToImport || [];
      } catch (error) {
        console.error('Error al obtener preview:', error);
      } finally {
        setLoading(false);
      }

      // Mostrar advertencia específica si overwrite está activado
      if (overwrite && collectionsAffected.length > 0) {
        const collectionsList = collectionsAffected.join(', ');
        const confirmMessage = `⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n` +
          `Estás a punto de BORRAR y REEMPLAZAR los datos existentes en las siguientes colecciones:\n\n` +
          `${collectionsList}\n\n` +
          `Esta acción NO SE PUEDE DESHACER.\n\n` +
          `Las demás colecciones NO serán afectadas.\n\n` +
          `¿Estás completamente seguro de continuar?`;

        if (!confirm(confirmMessage)) {
          return;
        }

        // Segunda confirmación para sobrescritura
        if (!confirm('Por favor confirma nuevamente que deseas BORRAR y REEMPLAZAR estos datos.')) {
          return;
        }
      } else if (!overwrite) {
        // Confirmación normal si no hay overwrite
        const collectionsList = collectionsAffected.join(', ');
        if (!confirm(`¿Estás seguro de que deseas importar estos datos?\n\nColecciones a importar: ${collectionsList}`)) {
          return;
        }
      }
    }

    setLoading(true);
    setProgress(10);

    try {
      let result: ImportResult;

      if (selectedFormat === 'gtfs') {
        const fileContents = await readGTFSFiles(files);
        setProgress(20);

        const gtfsData = parseGTFS(fileContents);
        setProgress(40);

        const firebaseData = transformGTFSToFirebase(gtfsData);
        setProgress(60);

        result = await importToFirestore(firebaseData, {
          format: 'gtfs',
          overwrite,
          dryRun,
        });
        setProgress(100);
      } else if (selectedFormat === 'geojson') {
        const content = await readSingleFile(files[0]);
        setProgress(20);

        const geoJsonData = parseGeoJSON(content);
        setProgress(40);

        const firebaseData = transformGeoJSONToFirebase(geoJsonData);
        setProgress(60);

        result = await importStops(firebaseData.stops!, overwrite);
        setProgress(100);
      } else {
        const content = await readSingleFile(files[0]);
        setProgress(20);

        const firebaseData = parseFirebaseExport(content);
        setProgress(40);

        const normalizedData = normalizeFirebaseExport(firebaseData);
        setProgress(60);

        result = await importToFirestore(normalizedData, {
          format: 'firebase',
          overwrite,
          dryRun,
        });
        setProgress(100);
      }

      setImportResult(result);

      // Recargar estadísticas
      await loadStats();
    } catch (error) {
      console.error('Error al importar:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al importar',
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar TODOS los datos de transporte? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    if (!confirm('Por favor confirma nuevamente. Se eliminarán TODOS los datos.')) {
      return;
    }

    setLoading(true);
    try {
      await clearAllTransitData();
      alert('Datos eliminados exitosamente');
      await loadStats();
    } catch (error) {
      console.error('Error al eliminar datos:', error);
      alert('Error al eliminar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Datos</h1>
        <p className="text-muted-foreground">
          Importa datos desde archivos GTFS, GeoJSON o exportaciones de Firebase
        </p>
      </div>

      {/* Estadísticas actuales */}
      {currentStats && (
        <Card>
          <CardHeader>
            <CardTitle>Datos Actuales</CardTitle>
            <CardDescription>Cantidad de documentos en cada colección</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentStats).map(([collection, count]) => (
                <div key={collection} className="flex flex-col">
                  <span className="text-sm text-muted-foreground capitalize">{collection}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Todos los Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gtfs">GTFS</TabsTrigger>
          <TabsTrigger value="geojson">GeoJSON</TabsTrigger>
          <TabsTrigger value="firebase">Firebase Export</TabsTrigger>
        </TabsList>

        <TabsContent value="gtfs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Archivos GTFS</CardTitle>
              <CardDescription>
                Selecciona archivos TXT de GTFS. Los archivos obligatorios son: stops.txt, routes.txt, trips.txt y
                stop_times.txt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para seleccionar</span> o arrastra archivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Archivos .txt (stops.txt, routes.txt, trips.txt, etc.)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".txt"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {files && files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Archivos seleccionados:</p>
                  <ul className="text-sm space-y-1">
                    {Array.from(files).map((file, index) => (
                      <li key={index} className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geojson" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Paradas desde GeoJSON</CardTitle>
              <CardDescription>
                Selecciona un archivo GeoJSON con features de tipo Point para importar paradas de autobús
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para seleccionar</span> o arrastra archivo
                    </p>
                    <p className="text-xs text-muted-foreground">Archivo .geojson o .json</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".geojson,.json"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {files && files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Archivo seleccionado:</p>
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {files[0].name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firebase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar desde Exportación de Firebase</CardTitle>
              <CardDescription>
                Selecciona un archivo JSON exportado desde Firebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para seleccionar</span> o arrastra archivo
                    </p>
                    <p className="text-xs text-muted-foreground">Archivo .json</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {files && files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Archivo seleccionado:</p>
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {files[0].name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Opciones */}
      <Card>
        <CardHeader>
          <CardTitle>Opciones de Importación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="dryRun" checked={dryRun} onCheckedChange={(checked) => setDryRun(checked as boolean)} className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="dryRun" className="font-medium">
                Modo de prueba (recomendado)
              </Label>
              <p className="text-xs text-muted-foreground">
                Valida los archivos sin importar realmente los datos. Úsalo primero para verificar que todo esté correcto.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked as boolean)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="overwrite" className="font-medium text-red-600">
                ⚠️ Sobrescribir datos existentes
              </Label>
              <p className="text-xs text-muted-foreground">
                Si está activado, se BORRARÁN PERMANENTEMENTE los datos existentes en las colecciones que se van a importar antes de agregar los nuevos.
                Si está desactivado, los nuevos datos se mezclarán con los existentes (merge).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button onClick={handleValidate} disabled={!files || loading}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Validar Archivos
        </Button>

        <Button
          onClick={handleImport}
          disabled={!files || loading || !validationResult?.valid}
          variant={dryRun ? 'secondary' : 'default'}
        >
          <Download className="w-4 h-4 mr-2" />
          {dryRun ? 'Simular Importación' : 'Importar a Firestore'}
        </Button>
      </div>

      {/* Barra de progreso */}
      {loading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">Procesando... {progress}%</p>
        </div>
      )}

      {/* Advertencia de sobrescritura */}
      {validationResult && validationResult.valid && overwrite && importResult?.collectionsToImport && (
        <Alert variant="destructive" className="border-2 border-red-500">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-bold text-lg">⚠️ ADVERTENCIA: Modo Sobrescritura Activado</p>
              <p>
                Si procedes con la importación, se BORRARÁN y REEMPLAZARÁN los datos existentes en las siguientes colecciones:
              </p>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                <ul className="list-disc list-inside space-y-1">
                  {importResult.collectionsToImport.map((collection) => (
                    <li key={collection} className="font-medium">
                      {collection} ({importResult.stats?.[collection] || 0} documentos)
                    </li>
                  ))}
                </ul>
              </div>
              <p className="font-semibold text-sm">
                Las demás colecciones NO serán afectadas. Esta acción NO se puede deshacer.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Resultado de validación */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              {validationResult.valid ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Validación Exitosa
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Errores de Validación
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">Errores:</h3>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{error.field}:</span> {error.message}
                      {error.value && <span className="text-muted-foreground"> ({JSON.stringify(error.value)})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600">Advertencias:</h3>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{warning.field}:</span> {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <Alert variant={importResult.success ? 'default' : 'destructive'}>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{importResult.message}</p>

              {importResult.stats && Object.keys(importResult.stats).length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Estadísticas:</p>
                  <ul className="text-sm space-y-1">
                    {Object.entries(importResult.stats).map(([key, value]) => (
                      <li key={key}>
                        {key}: <span className="font-medium">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600">Errores:</p>
                  <ul className="text-sm space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
