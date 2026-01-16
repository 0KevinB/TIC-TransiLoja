"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Bus, Route, Conductor } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { Radio, MapPin, Clock, Gauge, User, Navigation } from "lucide-react"

// Lazy load map component for better performance
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then(mod => ({ default: mod.InteractiveMap })),
  {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-md">Cargando mapa...</div>
  }
)

interface RealTimeBus extends Bus {
  conductorNombre?: string
  routeName?: string
  routeNumber?: string
  routeColor?: string
  lastUpdate?: Date
}

export default function RealTimeBusesPage() {
  const [realTimeBuses, setRealTimeBuses] = useState<RealTimeBus[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBus, setSelectedBus] = useState<string | null>(null)

  useEffect(() => {
    fetchStaticData()
    subscribeToRealTimeBuses()
  }, [])

  const fetchStaticData = async () => {
    try {
      const [routesSnapshot, conductoresSnapshot, stopsSnapshot] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(query(collection(db, "conductores"), where("estado", "==", "activo"))),
        getDocs(collection(db, "stops")),
      ])

      // Fetch routes with GTFS support
      const routesData: Route[] = []
      routesSnapshot.forEach((doc) => {
        const data = doc.data()
        routesData.push({
          id: doc.id,
          name: data.route_long_name || data.name || "",
          shortName: data.route_short_name || data.shortName || "",
          description: data.route_desc || data.description || "",
          color: (data.route_color || data.color || "3B82F6").replace('#', ''),
          textColor: (data.route_text_color || data.textColor || "FFFFFF").replace('#', ''),
          operatingStartTime: data.operatingStartTime || "06:00",
          operatingEndTime: data.operatingEndTime || "22:00",
          stopIds: data.custom_stop_ids || data.stopIds || [],
          type: data.type || "bus",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })
      setRoutes(routesData)

      // Fetch conductores
      const conductoresData: Conductor[] = []
      conductoresSnapshot.forEach((doc) => {
        const data = doc.data()
        conductoresData.push({
          id_conductor: doc.id,
          cedula: data.cedula || "",
          nombre: data.nombre || "",
          apellidos: data.apellidos || "",
          fecha_nacimiento: data.fecha_nacimiento?.toDate() || new Date(),
          telefono: data.telefono || "",
          email: data.email,
          direccion: data.direccion,
          fecha_licencia: data.fecha_licencia?.toDate() || new Date(),
          fecha_vencimiento_licencia: data.fecha_vencimiento_licencia?.toDate() || new Date(),
          tipo_licencia: data.tipo_licencia || "B",
          estado: data.estado || "activo",
          foto_url: data.foto_url,
          experiencia_anos: data.experiencia_anos || 0,
          calificacion: data.calificacion,
          observaciones: data.observaciones,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })
      setConductores(conductoresData)

      // Fetch stops
      const stopsData: any[] = []
      stopsSnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.stop_name || data.name || "",
          lat: data.stop_lat || data.lat || 0,
          lng: data.stop_lon || data.lng || 0,
          code: data.stop_code || data.code || "",
        })
      })
      setStops(stopsData)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching static data:", error)
      setLoading(false)
    }
  }

  const subscribeToRealTimeBuses = () => {
    // Suscribirse a buses activos en tiempo real
    const busesQuery = query(
      collection(db, "buses"),
      where("status", "==", "active")
    )

    const unsubscribe = onSnapshot(busesQuery, (snapshot) => {
      const buses: RealTimeBus[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()

        // Solo incluir buses que tengan ubicación actual (conductores activos)
        if (data.currentLocation?.lat && data.currentLocation?.lng) {
          buses.push({
            id: doc.id,
            plateNumber: data.plateNumber || data.licensePlate || "Sin placa",
            model: data.model || "",
            year: data.year || new Date().getFullYear(),
            capacity: data.capacity || 40,
            status: data.status || "active",
            features: data.features || {},
            currentLocation: data.currentLocation,
            speed: data.speed || 0,
            heading: data.heading || 0,
            accuracy: data.accuracy || 0,
            conductorId: data.conductorId,
            routeId: data.assignedRoute || data.routeId,
            lastUpdate: data.lastUpdated?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        }
      })

      // Enriquecer con información de conductor y ruta
      const enrichedBuses = buses.map((bus) => {
        const conductor = conductores.find((c) => c.id_conductor === bus.conductorId)
        const route = routes.find((r) => r.id === bus.routeId)

        return {
          ...bus,
          conductorNombre: conductor ? `${conductor.nombre} ${conductor.apellidos}` : undefined,
          routeName: route?.name,
          routeNumber: route?.shortName,
          routeColor: route?.color,
        }
      })

      setRealTimeBuses(enrichedBuses)
      console.log(`📡 ${enrichedBuses.length} buses en tiempo real actualizados`)
    })

    return unsubscribe
  }

  const formatTimeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return "Ahora"
    if (seconds < 60) return `Hace ${seconds}s`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes}m`

    const hours = Math.floor(minutes / 60)
    return `Hace ${hours}h`
  }

  const getStatusBadge = (lastUpdate?: Date) => {
    if (!lastUpdate) return { variant: "secondary" as const, text: "Sin datos" }

    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)

    if (seconds < 30) return { variant: "default" as const, text: "En línea" }
    if (seconds < 60) return { variant: "outline" as const, text: "Actualizando" }
    return { variant: "destructive" as const, text: "Desconectado" }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Buses en Tiempo Real</h2>
          <p className="text-muted-foreground">
            Seguimiento GPS de conductores activos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-500 animate-pulse" />
            {realTimeBuses.length} buses activos
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Mapa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mapa en Vivo</CardTitle>
            <CardDescription>
              Ubicación en tiempo real de los buses con conductores activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <InteractiveMap
                stops={stops}
                routes={routes}
                liveBuses={realTimeBuses}
                onBusSelect={(busId) => setSelectedBus(busId)}
                selectedBusId={selectedBus}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de buses */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conductores Activos</CardTitle>
            <CardDescription>
              {realTimeBuses.length} {realTimeBuses.length === 1 ? "conductor" : "conductores"} compartiendo ubicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[540px] overflow-y-auto">
              {realTimeBuses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay conductores activos en este momento</p>
                  <p className="text-sm mt-2">Los conductores deben iniciar el seguimiento GPS desde la app móvil</p>
                </div>
              ) : (
                realTimeBuses.map((bus) => {
                  const status = getStatusBadge(bus.lastUpdate)
                  const isSelected = selectedBus === bus.id

                  return (
                    <div
                      key={bus.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedBus(bus.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{bus.plateNumber}</span>
                        </div>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </div>

                      {bus.routeName && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            style={{
                              backgroundColor: bus.routeColor ? `#${bus.routeColor}` : '#3B82F6',
                              color: '#FFFFFF'
                            }}
                          >
                            {bus.routeNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">{bus.routeName}</span>
                        </div>
                      )}

                      {bus.conductorNombre && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span>{bus.conductorNombre}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          <span>{bus.speed} km/h</span>
                        </div>
                        {bus.heading !== undefined && (
                          <div className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" style={{ transform: `rotate(${bus.heading}deg)` }} />
                            <span>{Math.round(bus.heading)}°</span>
                          </div>
                        )}
                        {bus.lastUpdate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeSince(bus.lastUpdate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Buses Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Velocidad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realTimeBuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay buses activos en este momento
                  </TableCell>
                </TableRow>
              ) : (
                realTimeBuses.map((bus) => {
                  const status = getStatusBadge(bus.lastUpdate)

                  return (
                    <TableRow key={bus.id} className="cursor-pointer" onClick={() => setSelectedBus(bus.id)}>
                      <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                      <TableCell>{bus.conductorNombre || "Sin asignar"}</TableCell>
                      <TableCell>
                        {bus.routeName ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              style={{
                                backgroundColor: bus.routeColor ? `#${bus.routeColor}` : '#3B82F6',
                                color: '#FFFFFF'
                              }}
                            >
                              {bus.routeNumber}
                            </Badge>
                            <span className="text-sm">{bus.routeName}</span>
                          </div>
                        ) : (
                          "Sin asignar"
                        )}
                      </TableCell>
                      <TableCell>{bus.speed} km/h</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {bus.currentLocation?.lat.toFixed(6)}, {bus.currentLocation?.lng.toFixed(6)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bus.lastUpdate ? formatTimeSince(bus.lastUpdate) : "Sin datos"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
