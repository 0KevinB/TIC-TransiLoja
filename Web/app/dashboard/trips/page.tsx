"use client"

import type React from "react"

import { useEffect, useState, useMemo, useCallback } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trip, Route, Calendar, Bus, Conductor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Edit, Trash2, Search, RouteIcon, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ITEMS_PER_PAGE = 20

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [ultimoDoc, setUltimoDoc] = useState<DocumentSnapshot | null>(null)
  const [hayMasPaginas, setHayMasPaginas] = useState(true)
  const [filtroRuta, setFiltroRuta] = useState<string>("todas")
  const [filtroCalendario, setFiltroCalendario] = useState<string>("todos")
  const [formData, setFormData] = useState({
    routeId: "",
    calendarId: "",
    headsign: "",
    direction: 0 as 0 | 1,
    busId: "",  // ✅ GTFS: Asignación de bus (OBLIGATORIO)
    conductorId: "",  // ✅ GTFS: Asignación de conductor (OBLIGATORIO)
    frequency: {
      startTime: "06:00:00",
      endTime: "22:00:00",
      headwaySecs: 900, // 15 minutos = 900 segundos
    },
  })
  const { toast } = useToast()

  const cargarViajes = useCallback(async (pagina: number = 1, resetear: boolean = false) => {
    try {
      setLoadingTrips(true)

      let q = query(
        collection(db, "trips"),
        orderBy("createdAt", "desc")
      )

      // Aplicar filtros
      if (filtroRuta !== "todas") {
        q = query(q, where("routeId", "==", filtroRuta))
      }

      if (filtroCalendario !== "todos") {
        q = query(q, where("calendarId", "==", filtroCalendario))
      }

      // Paginación
      q = query(q, limit(ITEMS_PER_PAGE + 1))

      if (pagina > 1 && ultimoDoc && !resetear) {
        q = query(q, startAfter(ultimoDoc))
      }

      const tripsSnapshot = await getDocs(q)
      const docs = tripsSnapshot.docs

      const hayMas = docs.length > ITEMS_PER_PAGE
      const tripsData = docs.slice(0, ITEMS_PER_PAGE).map(doc => {
        const data = doc.data()

        // Manejar formato antiguo y nuevo de frequency
        let frequency
        if (typeof data.frequency === "object" && data.frequency !== null) {
          // Nuevo formato
          frequency = {
            startTime: data.frequency.startTime || "06:00:00",
            endTime: data.frequency.endTime || "22:00:00",
            headwaySecs: data.frequency.headwaySecs || 900,
          }
        } else {
          // Formato antiguo (número de minutos)
          const freqMinutes = data.frequency || 15
          frequency = {
            startTime: data.startTime || "06:00:00",
            endTime: data.endTime || "22:00:00",
            headwaySecs: freqMinutes * 60,
          }
        }

        return {
          id: doc.id,
          routeId: data.routeId,
          calendarId: data.calendarId,
          headsign: data.headsign,
          direction: data.direction || 0,
          busId: data.busId,  // ✅ GTFS: Bus asignado
          conductorId: data.conductorId,  // ✅ GTFS: Conductor asignado
          frequency,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Trip
      })

      if (resetear || pagina === 1) {
        setTrips(tripsData)
      } else {
        setTrips(prev => [...prev, ...tripsData])
      }

      setUltimoDoc(docs[Math.min(docs.length - 1, ITEMS_PER_PAGE - 1)])
      setHayMasPaginas(hayMas)
      setPaginaActual(pagina)

    } catch (error) {
      console.error("Error cargando viajes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes",
        variant: "destructive",
      })
    } finally {
      setLoadingTrips(false)
    }
  }, [filtroRuta, filtroCalendario, ultimoDoc, toast])

  const fetchData = async () => {
    try {
      const [routesSnapshot, calendarsSnapshot, busesSnapshot, conductoresSnapshot] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "calendars")),
        getDocs(query(collection(db, "buses"), where("status", "==", "active"))),  // ✅ Solo buses activos
        getDocs(query(collection(db, "conductores"), where("estado", "==", "activo"))),  // ✅ Solo conductores activos
      ])

      // Fetch routes
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
          operatingStartTime: data.operatingStartTime,
          operatingEndTime: data.operatingEndTime,
          stopIds: data.custom_stop_ids || data.stopIds || [],
          type: data.type || "bus",
          agencyId: data.agencyId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // Fetch calendars
      const calendarsData: Calendar[] = []
      calendarsSnapshot.forEach((doc) => {
        const data = doc.data()
        calendarsData.push({
          id: doc.id,
          name: data.name,
          monday: data.monday,
          tuesday: data.tuesday,
          wednesday: data.wednesday,
          thursday: data.thursday,
          friday: data.friday,
          saturday: data.saturday,
          sunday: data.sunday,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          holidays: data.holidays || [],
        })
      })

      // ✅ GTFS: Fetch buses
      const busesData: Bus[] = []
      busesSnapshot.forEach((doc) => {
        const data = doc.data()
        busesData.push({
          id: doc.id,
          plateNumber: data.plateNumber,
          model: data.model,
          year: data.year,
          capacity: data.capacity,
          status: data.status,
          features: data.features || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // ✅ GTFS: Fetch conductores
      const conductoresData: Conductor[] = []
      conductoresSnapshot.forEach((doc) => {
        const data = doc.data()
        conductoresData.push({
          id_conductor: doc.id,
          cedula: data.cedula,
          nombre: data.nombre,
          apellidos: data.apellidos,
          fecha_nacimiento: data.fecha_nacimiento?.toDate() || new Date(),
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          fecha_licencia: data.fecha_licencia?.toDate() || new Date(),
          fecha_vencimiento_licencia: data.fecha_vencimiento_licencia?.toDate() || new Date(),
          tipo_licencia: data.tipo_licencia,
          estado: data.estado,
          foto_url: data.foto_url,
          experiencia_anos: data.experiencia_anos,
          calificacion: data.calificacion,
          observaciones: data.observaciones,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      setRoutes(routesData)
      setCalendars(calendarsData)
      setBuses(busesData)
      setConductores(conductoresData)

      // Cargar viajes con paginación después
      await cargarViajes(1, true)

      // Crear calendarios por defecto si no existen
      if (calendarsData.length === 0) {
        await createDefaultCalendars()
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createDefaultCalendars = async () => {
    const defaultCalendars = [
      {
        name: "Días Laborables",
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        holidays: ["2024-01-01", "2024-12-25"], // Año Nuevo y Navidad
      },
      {
        name: "Fines de Semana",
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        holidays: [],
      },
      {
        name: "Todos los Días",
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        holidays: [],
      },
    ]

    try {
      const promises = defaultCalendars.map((calendar) => addDoc(collection(db, "calendars"), calendar))
      await Promise.all(promises)
      toast({
        title: "Calendarios creados",
        description: "Se crearon los calendarios por defecto",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating calendars:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (routes.length > 0) {
      cargarViajes(1, true)
    }
  }, [filtroRuta, filtroCalendario, cargarViajes, routes.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.routeId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una ruta",
        variant: "destructive",
      })
      return
    }

    if (!formData.calendarId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un calendario",
        variant: "destructive",
      })
      return
    }

    if (!formData.busId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un bus",
        variant: "destructive",
      })
      return
    }

    if (!formData.conductorId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un conductor",
        variant: "destructive",
      })
      return
    }

    try {
      const tripData = {
        routeId: formData.routeId,
        calendarId: formData.calendarId,
        headsign: formData.direction === 0 ? "Ida" : "Vuelta", // Generar automáticamente basado en dirección
        direction: formData.direction,
        busId: formData.busId,  // ✅ GTFS: Bus asignado (OBLIGATORIO)
        conductorId: formData.conductorId,  // ✅ GTFS: Conductor asignado (OBLIGATORIO)
        frequency: formData.frequency,
        createdAt: editingTrip ? editingTrip.createdAt : new Date(),
        updatedAt: new Date(),
      }

      if (editingTrip) {
        await updateDoc(doc(db, "trips", editingTrip.id), {
          ...tripData,
        })
        toast({
          title: "Éxito",
          description: "Viaje actualizado correctamente",
        })
      } else {
        await addDoc(collection(db, "trips"), tripData)
        toast({
          title: "Éxito",
          description: "Viaje creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingTrip(null)
      setFormData({
        routeId: "",
        calendarId: "",
        headsign: "",
        direction: 0,
        busId: "",
        conductorId: "",
        frequency: {
          startTime: "06:00:00",
          endTime: "22:00:00",
          headwaySecs: 900,
        },
      })
      cargarViajes(1, true)
    } catch (error) {
      console.error("Error saving trip:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el viaje",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      routeId: trip.routeId,
      calendarId: trip.calendarId,
      headsign: trip.headsign,
      direction: trip.direction,
      busId: trip.busId || "",  // ✅ GTFS: Valor obligatorio
      conductorId: trip.conductorId || "",  // ✅ GTFS: Valor obligatorio
      frequency: trip.frequency,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (tripId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este viaje?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "trips", tripId))
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente",
      })
      cargarViajes(1, true)
    } catch (error) {
      console.error("Error deleting trip:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      })
    }
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta desconocida"
  }

  const getCalendarInfo = (calendarId: string) => {
    const calendar = calendars.find((c) => c.id === calendarId)
    return calendar ? calendar.name : "Calendario desconocido"
  }

  // ✅ GTFS: Helper functions para bus y conductor
  const getBusInfo = (busId?: string) => {
    if (!busId) return "No asignado"
    const bus = buses.find((b) => b.id === busId)
    return bus ? bus.plateNumber : "Bus no encontrado"
  }

  const getConductorInfo = (conductorId?: string) => {
    if (!conductorId) return "No asignado"
    const conductor = conductores.find((c) => c.id_conductor === conductorId)
    return conductor ? `${conductor.nombre} ${conductor.apellidos}` : "Conductor no encontrado"
  }

  const filteredTrips = useMemo(() => {
    if (!searchTerm.trim()) return trips

    const searchLower = searchTerm.toLowerCase()
    return trips.filter((trip) => {
      const route = routes.find((r) => r.id === trip.routeId)

      return (
        route?.shortName.toLowerCase().includes(searchLower) ||
        route?.name.toLowerCase().includes(searchLower) ||
        trip.headsign.toLowerCase().includes(searchLower)
      )
    })
  }, [trips, searchTerm, routes])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Viajes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Planificación de viajes y horarios de rutas
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrip ? "Editar Viaje" : "Nuevo Viaje"}</DialogTitle>
              <DialogDescription>
                {editingTrip ? "Modifica los datos del viaje" : "Programa un nuevo viaje"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routeId">Ruta</Label>
                  <Select
                    value={formData.routeId}
                    onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Seleccionar ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: route.color }} />
                            {route.shortName} - {route.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendarId">Calendario</Label>
                  <Select
                    value={formData.calendarId}
                    onValueChange={(value) => setFormData({ ...formData, calendarId: value })}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Seleccionar calendario" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Dirección</Label>
                <Select
                  value={formData.direction.toString()}
                  onValueChange={(value) => setFormData({ ...formData, direction: Number.parseInt(value) as 0 | 1 })}
                >
                  <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ida</SelectItem>
                    <SelectItem value="1">Vuelta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ GTFS: Asignación de Bus y Conductor */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="busId">Bus Asignado *</Label>
                  <Select
                    value={formData.busId}
                    onValueChange={(value) => setFormData({ ...formData, busId: value })}
                    required
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plateNumber} - {bus.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conductorId">Conductor Asignado *</Label>
                  <Select
                    value={formData.conductorId}
                    onValueChange={(value) => setFormData({ ...formData, conductorId: value })}
                    required
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {conductores.map((conductor) => (
                        <SelectItem key={conductor.id_conductor} value={conductor.id_conductor}>
                          {conductor.nombre} {conductor.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-sm">Configuración de Frecuencia</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.frequency.startTime.slice(0, 5)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frequency: { ...formData.frequency, startTime: e.target.value + ":00" },
                        })
                      }
                      className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.frequency.endTime.slice(0, 5)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frequency: { ...formData.frequency, endTime: e.target.value + ":00" },
                        })
                      }
                      className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headway">Frecuencia (min)</Label>
                    <Input
                      id="headway"
                      type="number"
                      min="5"
                      max="120"
                      value={formData.frequency.headwaySecs / 60}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frequency: {
                            ...formData.frequency,
                            headwaySecs: Number.parseInt(e.target.value) * 60,
                          },
                        })
                      }
                      className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tiempo entre salidas de buses consecutivos en la misma ruta
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingTrip ? "Actualizar" : "Crear"} Viaje
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg">
                <Clock className="h-8 w-8 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Viajes</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                <RouteIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rutas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(trips.map((t) => t.routeId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Frecuencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.length > 0
                    ? Math.round(
                        trips.reduce((sum, trip) => sum + (trip.frequency.headwaySecs / 60), 0) / trips.length
                      )
                    : 0}{" "}
                  min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Clock className="h-5 w-5 text-sky-600" />
            </div>
            Viajes Programados ({filteredTrips.length})
          </CardTitle>
          <CardDescription>Gestiona los viajes planificados del sistema</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar viajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filtroRuta} onValueChange={setFiltroRuta}>
                <SelectTrigger className="w-48 border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue placeholder="Filtrar por ruta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las rutas</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.shortName} - {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroCalendario} onValueChange={setFiltroCalendario}>
                <SelectTrigger className="w-48 border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue placeholder="Filtrar por calendario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los calendarios</SelectItem>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingTrips && trips.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                  <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-sky-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
                    <TableHead className="font-semibold">Ruta</TableHead>
                    <TableHead className="font-semibold">Dirección</TableHead>
                    <TableHead className="font-semibold">Bus</TableHead>
                    <TableHead className="font-semibold">Conductor</TableHead>
                    <TableHead className="font-semibold">Horario</TableHead>
                    <TableHead className="font-semibold">Frecuencia</TableHead>
                    <TableHead className="font-semibold">Calendario</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => {
                    const route = routes.find((r) => r.id === trip.routeId)
                    return (
                      <TableRow key={trip.id} className="hover:bg-sky-50/30 transition-colors">
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: route?.color || "#3B82F6",
                              color: route?.textColor || "#FFFFFF",
                            }}
                          >
                            {getRouteInfo(trip.routeId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {trip.direction === 0 ? "Ida" : "Vuelta"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getBusInfo(trip.busId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getConductorInfo(trip.conductorId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {trip.frequency.startTime.slice(0, 5)} - {trip.frequency.endTime.slice(0, 5)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            Cada {trip.frequency.headwaySecs / 60} min
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getCalendarInfo(trip.calendarId)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(trip)}
                              className="hover:bg-sky-100 hover:text-sky-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(trip.id)}
                              className="text-red-600 hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {filteredTrips.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {filteredTrips.length} viajes
              </div>
              <div className="flex gap-2">
                {hayMasPaginas && (
                  <Button
                    variant="outline"
                    onClick={() => cargarViajes(paginaActual + 1)}
                    disabled={loadingTrips}
                    className="hover:bg-sky-50"
                  >
                    {loadingTrips ? "Cargando..." : "Cargar más"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {filteredTrips.length === 0 && !loadingTrips && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron viajes con ese criterio" : "Comienza programando un nuevo viaje"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
