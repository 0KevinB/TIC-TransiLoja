import { FileText, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Esquema GTFS - TransiLoja",
  description: "Archivos del esquema GTFS (General Transit Feed Specification)",
}

const gtfsFiles = [
  {
    name: "agency.txt",
    description: "Información sobre las agencias de transporte",
    path: "/anexos/GTFS/agency.txt",
  },
  {
    name: "stops.txt",
    description: "Listado de paradas del sistema de transporte",
    path: "/anexos/GTFS/stops.txt",
  },
  {
    name: "routes.txt",
    description: "Rutas disponibles en el sistema",
    path: "/anexos/GTFS/routes.txt",
  },
  {
    name: "trips.txt",
    description: "Viajes programados para cada ruta",
    path: "/anexos/GTFS/trips.txt",
  },
  {
    name: "stop_times.txt",
    description: "Horarios de llegada y salida en cada parada",
    path: "/anexos/GTFS/stop_times.txt",
  },
  {
    name: "calendar.txt",
    description: "Fechas de servicio para programación regular",
    path: "/anexos/GTFS/calendar.txt",
  },
  {
    name: "calendar_dates.txt",
    description: "Excepciones para las fechas de servicio",
    path: "/anexos/GTFS/calendar_dates.txt",
  },
  {
    name: "fare_attributes.txt",
    description: "Información sobre tarifas",
    path: "/anexos/GTFS/fare_attributes.txt",
  },
  {
    name: "fare_rules.txt",
    description: "Reglas de aplicación de tarifas",
    path: "/anexos/GTFS/fare_rules.txt",
  },
  {
    name: "shapes.txt",
    description: "Trazado geográfico de las rutas",
    path: "/anexos/GTFS/shapes.txt",
  },
  {
    name: "frequencies.txt",
    description: "Frecuencias de servicio basadas en intervalos",
    path: "/anexos/GTFS/frequencies.txt",
  },
  {
    name: "feed_info.txt",
    description: "Metadatos del feed GTFS",
    path: "/anexos/GTFS/feed_info.txt",
  },
]

export default function GTFSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-75 blur-sm"></div>
                <div className="relative bg-white rounded-full p-2 shadow-lg">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Esquema GTFS</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  General Transit Feed Specification
                </p>
              </div>
            </div>
            <Link href="/anexos">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Anexos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Introduction */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle>Acerca de GTFS</CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-300">
                El GTFS (General Transit Feed Specification) es un formato estándar para datos de
                transporte público que permite a las aplicaciones consumir información de horarios,
                rutas y paradas de manera uniforme.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Files Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gtfsFiles.map((file) => (
              <Card key={file.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    {file.name}
                  </CardTitle>
                  <CardDescription className="text-sm">{file.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Ver Archivo
                    </Button>
                  </a>
                  <a href={file.path} download>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Information */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                📝 Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-blue-800 dark:text-blue-200">
              <p>
                <strong>Formato:</strong> CSV (Comma-Separated Values) con codificación UTF-8
              </p>
              <p>
                <strong>Especificación:</strong> Sigue el estándar GTFS oficial definido por Google
                Transit
              </p>
              <p>
                <strong>Uso:</strong> Estos archivos pueden ser procesados por aplicaciones de
                planificación de rutas y mapas de transporte público
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
