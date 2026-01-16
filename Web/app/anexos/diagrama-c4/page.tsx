import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Diagramas C4 - TransiLoja",
  description: "Diagramas de arquitectura C4 del sistema TransiLoja",
}

export default function DiagramaC4Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-violet-500">Diagramas C4</span> - TransiLoja
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Arquitectura del Sistema</p>
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
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Introduction */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              🗺️ Arquitectura del Sistema
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Los diagramas C4 proporcionan una vista completa de la arquitectura del sistema TransiLoja
              en diferentes niveles de abstracción.
            </p>
          </div>

          {/* Diagrama de Sistema (Nivel 1 - Contexto) */}
          <section>
            <Card className="border-2 border-violet-200 dark:border-violet-900">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle>Nivel 1: Diagrama de Contexto del Sistema</CardTitle>
                <CardDescription>
                  Vista general mostrando el sistema TransiLoja y sus interacciones principales
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <img
                    src="/anexos/C4-Diagrama-Sistema.png"
                    alt="Diagrama C4 Nivel 1 - Contexto del Sistema"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Sistema TransiLoja:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Plataforma centralizada de gestión y consulta</li>
                    <li>Integración con Firebase, Google Maps API y Open Street Maps</li>
                    <li>Soporte para datos GTFS (General Transit Feed Specification)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Diagrama de Contexto Original (Nivel 2 - Contenedores) */}
          <section>
            <Card className="border-2 border-violet-200 dark:border-violet-900">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle>Nivel 2: Diagrama de Contenedores</CardTitle>
                <CardDescription>
                  Muestra los contenedores principales (aplicaciones) y sistemas externos
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <img
                    src="/anexos/C4-Diagrama-Contexto.png"
                    alt="Diagrama C4 Nivel 2 - Contenedores"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Actores principales:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Administrador:</strong> Gestiona el sistema (paradas, rutas, viajes, buses)</li>
                    <li><strong>Conductor:</strong> Registra ubicación y gestiona viajes asignados</li>
                    <li><strong>Pasajero:</strong> Consulta rutas, horarios y buses en tiempo real</li>
                  </ul>
                  <p className="mt-4"><strong>Sistemas externos:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Firebase (Auth, Firestore)</li>
                    <li>Google Maps API</li>
                    <li>Open Street Maps (datos cartográficos)</li>
                    <li>Archivos GTFS (datos de transporte)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Diagrama de Contenedores Original (Nivel 3 - Componentes) */}
          <section>
            <Card className="border-2 border-violet-200 dark:border-violet-900">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle>Nivel 3: Diagrama de Componentes</CardTitle>
                <CardDescription>
                  Detalla los componentes internos de cada contenedor y sus interacciones
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <img
                    src="/anexos/C4-Diagrama-Contenedores.png"
                    alt="Diagrama C4 Nivel 3 - Componentes"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Contenedores principales:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>App Web (Next.js 15):</strong> Dashboard administrativo</li>
                    <li><strong>App Móvil (React Native + Expo):</strong> Aplicación para usuarios y tracking</li>
                    <li><strong>Firebase Auth:</strong> Sistema de autenticación</li>
                    <li><strong>Cloud Firestore:</strong> Base de datos NoSQL en tiempo real</li>
                    <li><strong>Google Maps API:</strong> Mapas y geolocalización</li>
                  </ul>
                  <p className="mt-4"><strong>Módulos clave:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>RAPTOR Engine (optimización de rutas)</li>
                    <li>Location Manager (geolocalización)</li>
                    <li>Data Controller (sincronización)</li>
                    <li>Mapa Centralizado (visualización compartida)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Notes */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 rounded-lg p-6 border-2 border-violet-200 dark:border-violet-900">
            <h3 className="text-lg font-bold mb-3 text-violet-900 dark:text-violet-100">📝 Nota sobre los Diagramas</h3>
            <p className="text-sm text-violet-800 dark:text-violet-200">
              Los diagramas C4 (Context, Containers, Components, Code) son una metodología para documentar
              arquitecturas de software. Estos diagramas muestran TransiLoja desde diferentes niveles de
              abstracción, facilitando la comprensión del sistema para diferentes audiencias: stakeholders
              (Contexto), desarrolladores (Contenedores) y arquitectos (Componentes).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            TransiLoja - Sistema de Transporte Público de Loja | Diagramas C4
          </p>
        </div>
      </footer>
    </div>
  )
}
