import Link from "next/link"
import { FileText, Database, Map, Smartphone, Monitor, ExternalLink, TestTube, Layers, Video, MessageSquare, Globe, Rocket, GitBranch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Anexos - TransiLoja",
  description: "Documentación técnica, diagramas y esquemas de datos del proyecto TransiLoja",
}

export default function AnexosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 opacity-75 blur-sm"></div>
                <div className="relative bg-white rounded-full p-2 shadow-lg">
                  <FileText className="h-6 w-6 text-sky-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-sky-500">Transi</span>Loja
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anexos Técnicos</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Introduction */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              📚 Anexos Técnicos
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Documentación técnica, diagramas de arquitectura, esquemas de datos, resultados
              de pruebas y aplicaciones publicadas del Sistema de Transporte Público de Loja.
            </p>
          </div>

          {/* Published Applications Section */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-rose-500" />
              Aplicaciones Publicadas
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow border-2 border-rose-200 dark:border-rose-900">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-rose-500" />
                    App Móvil (Android)
                  </CardTitle>
                  <CardDescription>
                    Aplicación móvil publicada en Expo - Build APK disponible
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Framework:</strong> Expo SDK 52 | React Native<br/>
                    <strong>Plataforma:</strong> Android (APK)<br/>
                    <strong>Tamaño:</strong> ~45 MB
                  </p>
                  <a
                    href="https://expo.dev/accounts/0kevinb/projects/transiloja/builds/5d0650b6-4dc2-48d4-a71d-b7148032d632"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                      Descargar APK
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-2 border-sky-200 dark:border-sky-900">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-sky-500" />
                    Dashboard Web (Vercel)
                  </CardTitle>
                  <CardDescription>
                    Aplicación web administrativa publicada en producción
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Framework:</strong> Next.js 15.2.4<br/>
                    <strong>Hosting:</strong> Vercel (CDN Global)<br/>
                    <strong>Performance:</strong> Score 88.7/100
                  </p>
                  <a
                    href="https://transi-loja.vercel.app/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600">
                      Abrir Dashboard
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* C4 Architecture Diagrams */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Layers className="h-6 w-6 text-violet-500" />
              Diagramas de Arquitectura C4
            </h3>
            <Card className="hover:shadow-lg transition-shadow border-2 border-violet-200 dark:border-violet-900">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-500" />
                  Arquitectura del Sistema TransiLoja
                </CardTitle>
                <CardDescription>
                  Diagramas C4 completos mostrando Contexto, Contenedores y Componentes del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Link href="/anexos/diagrama-c4">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                    Ver Diagramas C4
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Videos and Demos */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Video className="h-6 w-6 text-amber-500" />
              Videos Demostrativos
            </h3>
            <Card className="hover:shadow-lg transition-shadow border-2 border-amber-200 dark:border-amber-900">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-amber-500" />
                  Funcionalidades Móviles
                </CardTitle>
                <CardDescription>
                  Videos demostrativos de las funcionalidades principales de la aplicación móvil
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Videos incluidos:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Registro y autenticación de usuarios</li>
                    <li>Planificación de viajes con algoritmo RAPTOR</li>
                    <li>Búsqueda de rutas (texto y mapa)</li>
                    <li>Visualización de buses en tiempo real</li>
                    <li>Gestión de rutas favoritas</li>
                    <li>Modo offline y sincronización</li>
                  </ul>
                </div>
                <a
                  href="https://drive.google.com/drive/folders/1XhFnXw3Mw_iZ5IpuQKy3SiDWnN7tSPqD"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600">
                    Ver Videos en Google Drive
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </section>

          {/* User Survey */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-teal-500" />
              Encuesta de Satisfacción
            </h3>
            <Card className="hover:shadow-lg transition-shadow border-2 border-teal-200 dark:border-teal-900">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-teal-500" />
                  Feedback de Usuarios
                </CardTitle>
                <CardDescription>
                  Comparte tu experiencia y ayúdanos a mejorar TransiLoja
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tu opinión es importante. Completa nuestra encuesta para evaluar:
                  facilidad de uso, precisión de información, tiempos de respuesta y funcionalidades.
                </p>
                <a
                  href="https://forms.gle/iZYcUhDXayhr8B5x7"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                    Completar Encuesta
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </section>

          {/* Test Results Section */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TestTube className="h-6 w-6 text-indigo-500" />
              Resultados de Pruebas
            </h3>

            {/* Test Schema */}
            <Card className="mb-6 hover:shadow-lg transition-shadow border-2 border-indigo-200 dark:border-indigo-900">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Esquema de Pruebas
                </CardTitle>
                <CardDescription>
                  Matriz completa de 96 casos de prueba (Web y Mobile) - E2E, Unitarias, Performance, Accesibilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Link href="/anexos/esquema-pruebas">
                  <Button className="w-full sm:w-auto" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Esquema de Pruebas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Test Reports */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                    App Móvil
                  </CardTitle>
                  <CardDescription>
                    213 tests - Jest, Maestro E2E, Coverage (89.2% éxito)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/App-Movil-Resultados/index.html" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full sm:w-auto" variant="outline">
                      Ver Resultados
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-green-500" />
                    Portal Web
                  </CardTitle>
                  <CardDescription>
                    106 tests - Jest, Cypress E2E, Lighthouse (100% éxito)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/Web-Resultados/index.html" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full sm:w-auto" variant="outline">
                      Ver Resultados
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Schemas Section */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-500" />
              Esquemas de Datos
            </h3>

            {/* Interactive Viewer */}
            <Card className="mb-6 border-2 border-emerald-200 dark:border-emerald-900 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950 dark:to-sky-950">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-emerald-500" />
                  Visualizador Interactivo de Esquemas
                </CardTitle>
                <CardDescription>
                  Explora los tres esquemas de datos principales: GTFS, Firebase y OSM
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Link href="/Esquemas-Datos.html" target="_blank">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600">
                    Abrir Visualizador
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Raw Data Files */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    Esquema Firebase
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Estructura completa de Firestore (230 KB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/anexos/Esquema-Firebase.json" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" variant="outline" size="sm">
                      Ver JSON
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Map className="h-4 w-4 text-blue-500" />
                    Datos OSM
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Datos geográficos de OpenStreetMap (104 KB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/anexos/Datos-OSM.geojson" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" variant="outline" size="sm">
                      Ver GeoJSON
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Esquema GTFS
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Archivos GTFS (General Transit Feed Spec)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/anexos/gtfs">
                    <Button className="w-full" variant="outline" size="sm">
                      Ver Archivos
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* External Platforms */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Globe className="h-6 w-6 text-cyan-500" />
              Plataformas Externas Utilizadas
            </h3>
            <Card className="hover:shadow-lg transition-shadow border-2 border-cyan-200 dark:border-cyan-900">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-cyan-500" />
                  Overpass Turbo (OpenStreetMap)
                </CardTitle>
                <CardDescription>
                  Plataforma utilizada para extraer datos cartográficos de paradas de buses en Loja, Ecuador
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Datos extraídos:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Paradas de buses existentes en Loja</li>
                    <li>Red vial completa de la ciudad</li>
                    <li>Puntos de interés y referencias geográficas</li>
                    <li>Geometrías en formato GeoJSON (104 KB)</li>
                  </ul>
                </div>
                <a
                  href="https://overpass-turbo.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    Abrir Overpass Turbo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </section>

          {/* Notes Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-900">
            <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              📝 Información Adicional
            </h3>
            <ul className="space-y-3 text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  <strong>Aplicaciones en producción:</strong> La app móvil APK está disponible en Expo y el dashboard web está desplegado en Vercel con CDN global
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  <strong>Tests completos:</strong> 281 tests totales (Web: 100% éxito, Móvil: 89.2% éxito) incluyendo unitarias, integración, E2E y accesibilidad
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  <strong>Datos abiertos:</strong> Todos los esquemas de datos (Firebase, OSM, GTFS) están disponibles en formatos estándar (JSON, GeoJSON)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  <strong>Código abierto:</strong> El proyecto completo está disponible en GitHub con documentación completa
                </span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            TransiLoja - Sistema de Transporte Público de Loja | Última actualización: Diciembre
            2025
          </p>
        </div>
      </footer>
    </div>
  )
}
