"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, deleteField, query, limit, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { LiveBus, Route, Bus, Conductor, Trip } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { Radio, Play, Pause, RotateCcw, MapPin, Clock, Gauge, Plus, Edit2, Trash2, Settings, Navigation, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

// Lazy load map component for better performance
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then(mod => ({ default: mod.InteractiveMap })),
  {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-md">Cargando mapa...</div>
  }
)

// Simulación de buses en vivo
const SIMULATION_INTERVAL = 3000 // 3 segundos para mejor visualización
const NORMAL_SPEED = 30 // km/h
const RUSH_HOUR_SPEED = 15 // km/h durante horas pico
const STOP_DURATION = 10000 // 10 segundos en cada parada (reducido para demo)

// Horas pico en Loja (formato 24h)
const RUSH_HOURS = [
  { start: 7, end: 9 }, // Mañana
  { start: 12, end: 14 }, // Almuerzo
  { start: 17, end: 19 }, // Tarde
]

interface SimulatedBus extends LiveBus {
  routeStops: string[]
  currentStopIndex: number
  isAtStop: boolean
  stopArrivalTime?: Date
  direction: 0 | 1 // 0 = ida, 1 = vuelta
  customSpeed?: number // Velocidad personalizada por bus
  isPaused?: boolean // Para pausar buses individuales
}

interface RealTimeBus extends Bus {
  conductorNombre?: string
  routeName?: string
  routeNumber?: string
  routeColor?: string
  lastUpdate?: Date
}

interface AssignedBus extends Bus {
  tripId?: string // ID del viaje (trip) del cual proviene esta asignación
}

export default function LiveBusesPage() {
  const [liveBuses, setLiveBuses] = useState<SimulatedBus[]>([])
  const [realTimeBuses, setRealTimeBuses] = useState<RealTimeBus[]>([])
  const [assignedBuses, setAssignedBuses] = useState<AssignedBus[]>([]) // Todos los buses asignados desde viajes
  const [trips, setTrips] = useState<Trip[]>([]) // Viajes programados
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [selectedBus, setSelectedBus] = useState<string | null>(null)
  const [selectedRouteForSim, setSelectedRouteForSim] = useState<string>("")
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [editingLiveBus, setEditingLiveBus] = useState<SimulatedBus | null>(null)
  const [busConfig, setBusConfig] = useState({
    routeId: "",
    busId: "",
    conductorId: "",
    customSpeed: NORMAL_SPEED,
  })
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isEditAssignDialogOpen, setIsEditAssignDialogOpen] = useState(false)
  const [editingBusAssignment, setEditingBusAssignment] = useState<AssignedBus | null>(null)
  const [selectedBusForAssign, setSelectedBusForAssign] = useState<string>("")
  const [selectedConductor, setSelectedConductor] = useState<string>("")
  const [selectedRoute, setSelectedRoute] = useState<string>("")
  const [selectedCalendar, setSelectedCalendar] = useState<string>("") // Para crear viajes
  const [calendars, setCalendars] = useState<Calendar[]>([]) // Calendarios disponibles
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    const unsubscribeBuses = subscribeToRealTimeBuses()
    const unsubscribeAssigned = subscribeToAssignedBuses()
    return () => {
      if (unsubscribeBuses) unsubscribeBuses()
      if (unsubscribeAssigned) unsubscribeAssigned()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (simulationRunning) {
      interval = setInterval(updateBusPositions, SIMULATION_INTERVAL)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [simulationRunning, liveBuses])

  const fetchData = async () => {
    try {
      // Optimización: Cargar solo los datos necesarios con límites
      const [routesSnapshot, busesSnapshot, stopsSnapshot, conductoresSnapshot, liveBusesSnapshot, tripsSnapshot, calendarsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "routes"), limit(100))), // Máximo 100 rutas
        getDocs(query(collection(db, "buses"), where("status", "in", ["active", "maintenance"]), limit(200))), // Solo buses activos/mantenimiento
        getDocs(query(collection(db, "stops"), limit(500))), // Máximo 500 paradas (las más relevantes)
        getDocs(query(collection(db, "conductores"), where("estado", "==", "activo"), limit(100))), // Solo conductores activos
        getDocs(collection(db, "liveBuses")), // Live buses suelen ser pocos, no necesita límite
        getDocs(query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(100))), // Últimos 100 viajes
        getDocs(query(collection(db, "calendars"), limit(50))), // Calendarios
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

      // Fetch buses
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
          routeId: data.routeId,
          conductorId: data.conductorId,
          features: data.features,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // Fetch conductores
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

      // Fetch stops
      const stopsData: any[] = []
      stopsSnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          lines: data.lines || [],
        })
      })

      // Fetch existing live buses
      const liveBusesData: SimulatedBus[] = []
      liveBusesSnapshot.forEach((doc) => {
        const data = doc.data()
        const route = routesData.find((r) => r.id === data.routeId)
        liveBusesData.push({
          id: doc.id,
          busId: data.busId,
          conductorId: data.conductorId || "",
          routeId: data.routeId,
          tripId: data.tripId || "",
          vehicleTripId: data.vehicleTripId || `vt_${doc.id}`,
          currentStopId: data.currentStopId || data.nextStopId || "",
          scheduleDeviation: data.scheduleDeviation || 0,
          lat: data.lat,
          lng: data.lng,
          bearing: data.bearing || 0,
          speed: data.speed || 0,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status,
          nextStopId: data.nextStopId,
          delay: data.delay || 0,
          routeStops: route?.stopIds || [],
          currentStopIndex: data.currentStopIndex || 0,
          isAtStop: data.isAtStop || false,
          stopArrivalTime: data.stopArrivalTime?.toDate(),
          direction: data.direction || 0,
        })
      })

      // Fetch trips
      const tripsData: Trip[] = []
      tripsSnapshot.forEach((doc) => {
        const data = doc.data()
        // Manejar formato antiguo y nuevo de frequency
        let frequency
        if (typeof data.frequency === "object" && data.frequency !== null) {
          frequency = {
            startTime: data.frequency.startTime || "06:00:00",
            endTime: data.frequency.endTime || "22:00:00",
            headwaySecs: data.frequency.headwaySecs || 900,
          }
        } else {
          const freqMinutes = data.frequency || 15
          frequency = {
            startTime: data.startTime || "06:00:00",
            endTime: data.endTime || "22:00:00",
            headwaySecs: freqMinutes * 60,
          }
        }

        tripsData.push({
          id: doc.id,
          routeId: data.routeId,
          calendarId: data.calendarId,
          headsign: data.headsign,
          direction: data.direction || 0,
          busId: data.busId,
          conductorId: data.conductorId,
          frequency,
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

      setRoutes(routesData)
      setBuses(busesData)
      setConductores(conductoresData.filter(c => c.estado === "activo"))
      setStops(stopsData)
      setLiveBuses(liveBusesData)
      setTrips(tripsData)
      setCalendars(calendarsData)
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

  const subscribeToRealTimeBuses = () => {
    // Suscribirse a la colección liveBuses para obtener datos GPS en tiempo real
    const liveBusesQuery = query(
      collection(db, "liveBuses")
    )

    const unsubscribe = onSnapshot(liveBusesQuery, async (snapshot) => {
      const liveBusesData: RealTimeBus[] = []

      // Cargar información de buses si no está disponible
      let busesData = buses
      if (busesData.length === 0) {
        const busesSnapshot = await getDocs(collection(db, "buses"))
        busesData = []
        busesSnapshot.forEach((doc) => {
          const data = doc.data()
          busesData.push({
            id: doc.id,
            plateNumber: data.plateNumber,
            model: data.model,
            year: data.year,
            capacity: data.capacity,
            status: data.status,
            routeId: data.routeId,
            conductorId: data.conductorId,
            features: data.features,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        })
      }

      // Cargar conductores si no están disponibles
      let conductoresData = conductores
      if (conductoresData.length === 0) {
        const conductoresSnapshot = await getDocs(
          query(collection(db, "conductores"), where("estado", "==", "activo"))
        )
        conductoresData = []
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
      }

      // Cargar rutas si no están disponibles
      let routesData = routes
      if (routesData.length === 0) {
        const routesSnapshot = await getDocs(collection(db, "routes"))
        routesData = []
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
      }

      snapshot.forEach((doc) => {
        const data = doc.data()

        // Los datos vienen de liveBuses con lat/lng directos
        if (data.lat && data.lng && data.busId) {
          // Buscar información del bus
          const busInfo = busesData.find(b => b.id === data.busId)
          const conductor = conductoresData.find((c) => c.id_conductor === data.conductorId)
          const route = routesData.find((r) => r.id === data.routeId)

          liveBusesData.push({
            id: data.busId, // Usar busId como ID principal
            plateNumber: busInfo?.plateNumber || "Sin placa",
            model: busInfo?.model || "",
            year: busInfo?.year || new Date().getFullYear(),
            capacity: busInfo?.capacity || 40,
            status: "active",
            features: busInfo?.features || {},
            currentLocation: {
              lat: data.lat,
              lng: data.lng
            },
            speed: data.speed || 0,
            heading: data.bearing || 0,
            accuracy: data.accuracy || 0,
            conductorId: data.conductorId,
            routeId: data.routeId,
            lastUpdate: data.timestamp?.toDate() || new Date(),
            createdAt: busInfo?.createdAt || new Date(),
            updatedAt: data.timestamp?.toDate() || new Date(),
            conductorNombre: conductor ? `${conductor.nombre} ${conductor.apellidos}` : undefined,
            routeName: route?.name,
            routeNumber: route?.shortName,
            routeColor: route?.color,
          })
        }
      })

      setRealTimeBuses(liveBusesData)
      console.log(`📡 ${liveBusesData.length} buses GPS en tiempo real actualizados desde liveBuses`,
        liveBusesData.map(b => ({
          busId: b.id,
          plate: b.plateNumber,
          lat: b.currentLocation.lat,
          lng: b.currentLocation.lng,
          speed: b.speed,
          lastUpdate: b.lastUpdate
        }))
      )
    })

    return unsubscribe
  }

  const subscribeToAssignedBuses = () => {
    // Suscribirse a todos los viajes (trips) que tienen bus y conductor asignado
    const tripsQuery = query(
      collection(db, "trips"),
      orderBy("createdAt", "desc"),
      limit(100) // Limitar a los últimos 100 viajes
    )

    const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
      const busesFromTrips: AssignedBus[] = []
      const allTrips: any[] = []

      snapshot.forEach((tripDoc) => {
        const tripData = tripDoc.data()

        // Debug: guardar todos los viajes para logging
        allTrips.push({
          tripId: tripDoc.id,
          busId: tripData.busId,
          conductorId: tripData.conductorId,
          routeId: tripData.routeId,
          headsign: tripData.headsign,
        })

        // Incluir solo viajes que tienen bus Y conductor asignado
        if (tripData.busId && tripData.conductorId) {
          // Buscar la información del bus en el estado de buses
          const busInfo = buses.find(b => b.id === tripData.busId)

          busesFromTrips.push({
            id: tripData.busId, // Usar el ID del bus, no del trip
            tripId: tripDoc.id, // Guardar el ID del trip para referencia
            plateNumber: busInfo?.plateNumber || "Sin placa",
            model: busInfo?.model || "",
            year: busInfo?.year || new Date().getFullYear(),
            capacity: busInfo?.capacity || 40,
            status: busInfo?.status || "active",
            features: busInfo?.features || {},
            routeId: tripData.routeId,
            conductorId: tripData.conductorId,
            createdAt: tripData.createdAt?.toDate() || new Date(),
            updatedAt: tripData.updatedAt?.toDate() || new Date(),
          })
        }
      })

      setAssignedBuses(busesFromTrips)
      console.log(`📋 ${busesFromTrips.length} buses asignados desde viajes (de ${allTrips.length} viajes totales)`)
      console.log('Buses asignados desde trips:', busesFromTrips.map(b => ({
        busId: b.id,
        tripId: b.tripId,
        plate: b.plateNumber,
        conductor: b.conductorId,
        route: b.routeId
      })))
      console.log('Todos los viajes (para debug):', allTrips)
    })

    return unsubscribe
  }

  const handleAssignConductor = async () => {
    if (!selectedBusForAssign || !selectedConductor || !selectedRoute) {
      toast({
        title: "Error",
        description: "Debes seleccionar un bus, conductor y ruta",
        variant: "destructive",
      })
      return
    }

    if (!selectedCalendar) {
      toast({
        title: "Error",
        description: "Debes seleccionar un calendario",
        variant: "destructive",
      })
      return
    }

    try {
      // Crear un nuevo viaje (trip) con la asignación
      const route = routes.find(r => r.id === selectedRoute)

      await addDoc(collection(db, "trips"), {
        routeId: selectedRoute,
        calendarId: selectedCalendar,
        headsign: route?.name || "Sin destino",
        direction: 0,
        busId: selectedBusForAssign,
        conductorId: selectedConductor,
        frequency: {
          startTime: "06:00:00",
          endTime: "22:00:00",
          headwaySecs: 900, // 15 minutos
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      toast({
        title: "Viaje creado exitosamente",
        description: "El viaje ha sido creado y aparecerá en la lista de buses asignados.",
      })

      setIsAssignDialogOpen(false)
      setSelectedBusForAssign("")
      setSelectedConductor("")
      setSelectedRoute("")
      setSelectedCalendar("")
    } catch (error) {
      console.error("Error creating trip:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el viaje",
        variant: "destructive",
      })
    }
  }

  const handleEditAssignment = async () => {
    if (!editingBusAssignment || !editingBusAssignment.tripId) {
      toast({
        title: "Error",
        description: "No se encontró el viaje a editar",
        variant: "destructive",
      })
      return
    }

    if (!selectedConductor || !selectedRoute) {
      toast({
        title: "Error",
        description: "Debes seleccionar un conductor y una ruta",
        variant: "destructive",
      })
      return
    }

    try {
      await updateDoc(doc(db, "trips", editingBusAssignment.tripId), {
        conductorId: selectedConductor,
        routeId: selectedRoute,
        updatedAt: new Date(),
      })

      toast({
        title: "Viaje actualizado",
        description: "El viaje ha sido actualizado exitosamente.",
      })

      setIsEditAssignDialogOpen(false)
      setEditingBusAssignment(null)
      setSelectedConductor("")
      setSelectedRoute("")
    } catch (error) {
      console.error("Error updating trip:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje",
        variant: "destructive",
      })
    }
  }

  const handleRemoveAssignment = async (tripId: string) => {
    if (!tripId) {
      toast({
        title: "Error",
        description: "No se encontró el viaje a eliminar",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, "trips", tripId))

      toast({
        title: "Viaje eliminado",
        description: "El viaje ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error removing trip:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      })
    }
  }

  const openEditAssignmentDialog = (bus: AssignedBus) => {
    setEditingBusAssignment(bus)
    setSelectedConductor(bus.conductorId || "")
    setSelectedRoute(bus.routeId || "")
    setIsEditAssignDialogOpen(true)
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

  const getGPSStatusBadge = (lastUpdate?: Date) => {
    if (!lastUpdate) return { variant: "secondary" as const, text: "Sin datos" }

    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)

    if (seconds < 30) return { variant: "default" as const, text: "En línea" }
    if (seconds < 60) return { variant: "outline" as const, text: "Actualizando" }
    return { variant: "destructive" as const, text: "Desconectado" }
  }

  const openConfigDialog = () => {
    setEditingLiveBus(null)
    setBusConfig({
      routeId: selectedRouteForSim,
      busId: "",
      conductorId: "",
      customSpeed: NORMAL_SPEED,
    })
    setIsConfigDialogOpen(true)
  }

  const openEditDialog = (liveBus: SimulatedBus) => {
    setEditingLiveBus(liveBus)
    setBusConfig({
      routeId: liveBus.routeId,
      busId: liveBus.busId,
      conductorId: liveBus.conductorId,
      customSpeed: liveBus.customSpeed || NORMAL_SPEED,
    })
    setIsConfigDialogOpen(true)
  }

  const createOrUpdateLiveBus = async () => {
    const { routeId, busId, conductorId, customSpeed } = busConfig

    if (!routeId || !busId || !conductorId) {
      toast({
        title: "Error",
        description: "Debes seleccionar ruta, bus y conductor",
        variant: "destructive",
      })
      return
    }

    const route = routes.find((r) => r.id === routeId)
    if (!route || route.stopIds.length === 0) {
      toast({
        title: "Error",
        description: "La ruta seleccionada no tiene paradas configuradas",
        variant: "destructive",
      })
      return
    }

    const firstStop = stops.find((s) => s.id === route.stopIds[0])
    if (!firstStop) {
      toast({
        title: "Error",
        description: "No se encontró la primera parada de la ruta",
        variant: "destructive",
      })
      return
    }

    if (editingLiveBus) {
      // Editar bus existente
      try {
        await updateDoc(doc(db, "liveBuses", editingLiveBus.id), {
          busId,
          conductorId,
          routeId,
          customSpeed,
          updatedAt: new Date(),
        })

        setLiveBuses((prev) =>
          prev.map((b) =>
            b.id === editingLiveBus.id
              ? { ...b, busId, conductorId, routeId, customSpeed }
              : b
          )
        )

        toast({
          title: "Bus actualizado",
          description: "La configuración del bus ha sido actualizada",
        })
      } catch (error) {
        console.error("Error updating bus:", error)
        toast({
          title: "Error",
          description: "No se pudo actualizar el bus",
          variant: "destructive",
        })
      }
    } else {
      // Crear nuevo bus
      const vehicleTripId = `vt_${Date.now()}`
      const newBus: Omit<SimulatedBus, "id"> = {
        busId,
        conductorId,
        routeId,
        tripId: `trip_${Date.now()}`,
        vehicleTripId,
        currentStopId: route.stopIds[0],
        scheduleDeviation: 0,
        lat: firstStop.lat,
        lng: firstStop.lng,
        bearing: 0,
        speed: 0,
        timestamp: new Date(),
        status: "stopped",
        nextStopId: route.stopIds[1] || route.stopIds[0],
        delay: 0,
        routeStops: route.stopIds,
        currentStopIndex: 0,
        isAtStop: true,
        stopArrivalTime: new Date(),
        direction: 0,
        customSpeed,
        isPaused: false,
      }

      try {
        const docRef = await addDoc(collection(db, "liveBuses"), newBus)
        setLiveBuses((prev) => [...prev, { ...newBus, id: docRef.id }])

        const bus = buses.find((b) => b.id === busId)
        const conductor = conductores.find((c) => c.id_conductor === conductorId)

        toast({
          title: "Bus agregado",
          description: `Bus ${bus?.plateNumber} con conductor ${conductor?.nombre} ${conductor?.apellidos} agregado a la ruta ${route.shortName}`,
        })
      } catch (error) {
        console.error("Error creating bus:", error)
        toast({
          title: "Error",
          description: "No se pudo crear el bus simulado",
          variant: "destructive",
        })
      }
    }

    setIsConfigDialogOpen(false)
  }

  const toggleBusPause = async (busId: string) => {
    const bus = liveBuses.find((b) => b.id === busId)
    if (!bus) return

    const newPausedState = !bus.isPaused

    try {
      await updateDoc(doc(db, "liveBuses", busId), {
        isPaused: newPausedState,
      })

      setLiveBuses((prev) =>
        prev.map((b) => (b.id === busId ? { ...b, isPaused: newPausedState } : b))
      )

      toast({
        title: newPausedState ? "Bus pausado" : "Bus reanudado",
        description: `El bus ha sido ${newPausedState ? "pausado" : "reanudado"}`,
      })
    } catch (error) {
      console.error("Error toggling bus pause:", error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del bus",
        variant: "destructive",
      })
    }
  }

  const deleteLiveBus = async (busId: string) => {
    try {
      await deleteDoc(doc(db, "liveBuses", busId))
      setLiveBuses((prev) => prev.filter((b) => b.id !== busId))
      toast({
        title: "Bus eliminado",
        description: "El bus ha sido eliminado de la simulación",
      })
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el bus",
        variant: "destructive",
      })
    }
  }

  const isRushHour = () => {
    const now = new Date()
    const hour = now.getHours()
    return RUSH_HOURS.some((rush) => hour >= rush.start && hour < rush.end)
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 1000 // Retorna en metros
  }

  const updateBusPositions = async () => {
    const updatedBuses = [...liveBuses]
    const now = new Date()

    for (let i = 0; i < updatedBuses.length; i++) {
      const bus = updatedBuses[i]

      // Si el bus está pausado, saltarlo
      if (bus.isPaused) continue

      const route = routes.find((r) => r.id === bus.routeId)
      if (!route || bus.routeStops.length === 0) continue

      // Usar velocidad personalizada si existe, sino usar velocidad por defecto
      const currentSpeed = bus.customSpeed || (isRushHour() ? RUSH_HOUR_SPEED : NORMAL_SPEED)
      const speedMps = (currentSpeed * 1000) / 3600 // Convertir km/h a m/s

      // Si está en una parada, verificar si debe salir
      if (bus.isAtStop && bus.stopArrivalTime) {
        const timeAtStop = now.getTime() - bus.stopArrivalTime.getTime()
        if (timeAtStop >= STOP_DURATION) {
          // Salir de la parada
          bus.isAtStop = false
          delete (bus as any).stopArrivalTime // Eliminar el campo en lugar de undefined
          bus.status = "moving"

          // Avanzar al siguiente índice de parada
          if (bus.direction === 0) {
            // Ida
            if (bus.currentStopIndex < bus.routeStops.length - 1) {
              bus.currentStopIndex++
            } else {
              // Cambiar dirección
              bus.direction = 1
              bus.currentStopIndex = bus.routeStops.length - 2
            }
          } else {
            // Vuelta
            if (bus.currentStopIndex > 0) {
              bus.currentStopIndex--
            } else {
              // Cambiar dirección
              bus.direction = 0
              bus.currentStopIndex = 1
            }
          }

          bus.nextStopId = bus.routeStops[bus.currentStopIndex]
        }
        continue
      }

      // Mover hacia la siguiente parada
      const nextStop = stops.find((s) => s.id === bus.nextStopId)
      if (!nextStop) continue

      const distance = calculateDistance(bus.lat, bus.lng, nextStop.lat, nextStop.lng)
      const distanceToMove = speedMps * (SIMULATION_INTERVAL / 1000) // Distancia en metros

      if (distance <= 50) {
        // Llegó a la parada
        bus.lat = nextStop.lat
        bus.lng = nextStop.lng
        bus.isAtStop = true
        bus.stopArrivalTime = now
        bus.status = "stopped"
        bus.speed = 0
        bus.currentStopId = nextStop.id
        // Calcular desviación del horario (simulado)
        bus.scheduleDeviation = bus.delay
      } else {
        // Mover hacia la parada
        const ratio = Math.min(distanceToMove / distance, 1)
        const newLat = bus.lat + (nextStop.lat - bus.lat) * ratio
        const newLng = bus.lng + (nextStop.lng - bus.lng) * ratio

        bus.lat = newLat
        bus.lng = newLng
        bus.speed = currentSpeed
        bus.bearing = Math.atan2(nextStop.lng - bus.lng, nextStop.lat - bus.lat) * (180 / Math.PI)
      }

      bus.timestamp = now

      // Actualizar en Firebase
      try {
        const updateData: any = {
          lat: bus.lat,
          lng: bus.lng,
          bearing: bus.bearing,
          speed: bus.speed,
          timestamp: bus.timestamp,
          status: bus.status,
          nextStopId: bus.nextStopId,
          currentStopId: bus.currentStopId,
          scheduleDeviation: bus.scheduleDeviation,
          currentStopIndex: bus.currentStopIndex,
          isAtStop: bus.isAtStop,
          direction: bus.direction,
        }

        // Manejar stopArrivalTime: agregar si existe, eliminar si no
        if (bus.stopArrivalTime) {
          updateData.stopArrivalTime = bus.stopArrivalTime
        } else if (!bus.isAtStop) {
          // Eliminar el campo si el bus no está en la parada
          updateData.stopArrivalTime = deleteField()
        }

        await updateDoc(doc(db, "liveBuses", bus.id), updateData)
      } catch (error) {
        console.error("Error updating bus position:", error)
      }
    }

    setLiveBuses(updatedBuses)
  }

  const toggleSimulation = () => {
    setSimulationRunning(!simulationRunning)
    toast({
      title: simulationRunning ? "Simulación pausada" : "Simulación iniciada",
      description: simulationRunning ? "Los buses se han detenido" : "Los buses comenzaron a moverse",
    })
  }

  const resetSimulation = async () => {
    try {
      // Eliminar todos los buses en vivo
      const promises = liveBuses.map((bus) => deleteDoc(doc(db, "liveBuses", bus.id)))
      await Promise.all(promises)

      setLiveBuses([])
      setSimulationRunning(false)

      toast({
        title: "Simulación reiniciada",
        description: "Todos los buses han sido eliminados",
      })
    } catch (error) {
      console.error("Error resetting simulation:", error)
      toast({
        title: "Error",
        description: "No se pudo reiniciar la simulación",
        variant: "destructive",
      })
    }
  }

  const getBusInfo = (busId: string) => {
    const bus = buses.find((b) => b.id === busId)
    return bus ? `${bus.plateNumber} (${bus.model})` : "Bus desconocido"
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta desconocida"
  }

  const getConductorInfo = (conductorId: string) => {
    const conductor = conductores.find((c) => c.id_conductor === conductorId)
    return conductor ? `${conductor.nombre} ${conductor.apellidos}` : "Sin conductor"
  }

  const getStatusBadge = (status: string, isAtStop: boolean) => {
    if (isAtStop) {
      return <Badge className="bg-yellow-100 text-yellow-800">En Parada</Badge>
    }

    switch (status) {
      case "moving":
        return <Badge className="bg-green-100 text-green-800">En Tránsito</Badge>
      case "stopped":
        return <Badge className="bg-red-100 text-red-800">Detenido</Badge>
      case "delayed":
        return <Badge className="bg-orange-100 text-orange-800">Demorado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Preparar datos para el mapa - mostrar buses como puntos especiales
  const busesForMap = liveBuses.map((bus) => ({
    id: bus.id,
    name: `🚌 ${getBusInfo(bus.busId)} - ${getRouteInfo(bus.routeId)}`,
    lat: bus.lat,
    lng: bus.lng,
    lines: [getRouteInfo(bus.routeId)],
    isBus: true,
    status: bus.status,
    isAtStop: bus.isAtStop,
    speed: bus.speed,
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
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
            Buses en Vivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Seguimiento GPS y simulación de buses en tiempo real
          </p>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-500 animate-pulse" />
            {realTimeBuses.length} buses GPS activos
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="gps" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="gps">Buses por GPS</TabsTrigger>
          <TabsTrigger value="simulation">Simulación</TabsTrigger>
        </TabsList>

        {/* TAB: Buses por GPS */}
        <TabsContent value="gps" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-sky-600" />
                Crear Viaje
              </CardTitle>
              <CardDescription>
                Crea un nuevo viaje asignando un bus y conductor a una ruta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                onClick={() => setIsAssignDialogOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Viaje
              </Button>
            </CardContent>
          </Card>

          {/* GPS Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Buses Asignados</p>
                    <p className="text-2xl font-bold text-gray-900">{assignedBuses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                    <Radio className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">GPS Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{realTimeBuses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conductores Disponibles</p>
                    <p className="text-2xl font-bold text-gray-900">{conductores.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg">
                    <Gauge className="h-8 w-8 text-sky-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Velocidad Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realTimeBuses.length > 0
                        ? Math.round(realTimeBuses.reduce((sum, bus) => sum + (bus.speed || 0), 0) / realTimeBuses.length)
                        : 0}{" "}
                      km/h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GPS Map */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-600" />
                Mapa GPS en Tiempo Real
                <Badge variant="outline" className="ml-2">
                  {realTimeBuses.length} conductores transmitiendo
                </Badge>
              </CardTitle>
              <CardDescription>
                Ubicación en tiempo real de buses con conductores activos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <InteractiveMap
                mode={{ type: "view-only" }}
                stops={stops}
                routes={routes}
                liveBuses={realTimeBuses}
                onBusSelect={(busId) => setSelectedBus(busId)}
                selectedBusId={selectedBus}
                className="h-96"
              />
            </CardContent>
          </Card>

          {/* Debug Info Card */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-sm text-amber-800">Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-1 text-amber-900">
                  <p>Total buses activos: {buses.filter(b => b.status === 'active').length}</p>
                  <p>Buses asignados detectados: {assignedBuses.length}</p>
                  <p>Conductores disponibles: {conductores.length}</p>
                  <p>Buses con GPS activo: {realTimeBuses.length}</p>
                  <p className="mt-2 font-semibold">Revisa la consola del navegador para más detalles</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GPS Buses Table */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
              <CardTitle>Viajes Activos ({assignedBuses.length})</CardTitle>
              <CardDescription>Todos los viajes con bus y conductor asignados. {realTimeBuses.length} transmitiendo GPS activamente</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
                    <TableHead>Bus</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Estado GPS</TableHead>
                    <TableHead>Velocidad</TableHead>
                    <TableHead>Última Act.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedBuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <Radio className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="font-medium">No se encontraron buses con conductores asignados</p>
                        <p className="text-sm mt-1">
                          Haz clic en "Nueva Asignación" para asignar un conductor a un bus
                        </p>
                        <p className="text-xs mt-2 text-amber-600">
                          Si ya has asignado conductores, revisa la consola del navegador para información de depuración
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignedBuses.map((bus) => {
                      // Buscar si este bus tiene GPS activo
                      const gpsData = realTimeBuses.find((rb) => rb.id === bus.id)
                      const conductor = conductores.find((c) => c.id_conductor === bus.conductorId)
                      const route = routes.find((r) => r.id === bus.routeId)
                      const status = getGPSStatusBadge(gpsData?.lastUpdate)

                      return (
                        <TableRow
                          key={bus.id}
                          className="hover:bg-sky-50/30 cursor-pointer"
                          onClick={() => gpsData && setSelectedBus(bus.id)}
                        >
                          <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                          <TableCell>
                            {conductor ? `${conductor.nombre} ${conductor.apellidos}` : "Sin asignar"}
                          </TableCell>
                          <TableCell>
                            {route ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  style={{
                                    backgroundColor: route.color ? `#${route.color}` : '#3B82F6',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  {route.shortName}
                                </Badge>
                                <span className="text-sm">{route.name}</span>
                              </div>
                            ) : (
                              "Sin asignar"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.text}</Badge>
                          </TableCell>
                          <TableCell>
                            {gpsData ? (
                              <div className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {gpsData.speed || 0} km/h
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin datos</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {gpsData?.lastUpdate ? formatTimeSince(gpsData.lastUpdate) : "Sin datos"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditAssignmentDialog(bus)
                                }}
                                title="Editar asignación"
                                className="hover:bg-sky-100 hover:text-sky-700 hover:border-sky-300"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm("¿Estás seguro de eliminar este viaje? El conductor ya no podrá ver este bus en la app.")) {
                                    handleRemoveAssignment(bus.tripId || "")
                                  }
                                }}
                                title="Eliminar viaje"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 hover:border-red-300"
                                disabled={!bus.tripId}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Simulación */}
        <TabsContent value="simulation" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              onClick={toggleSimulation}
              variant={simulationRunning ? "destructive" : "default"}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {simulationRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {simulationRunning ? "Pausar" : "Iniciar"} Simulación
            </Button>
            <Button onClick={resetSimulation} variant="outline" className="hover:bg-sky-50">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>

      {/* Add Bus Section */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Plus className="h-5 w-5 text-sky-600" />
            </div>
            Agregar Bus a Ruta
          </CardTitle>
          <CardDescription>Selecciona una ruta para simular un bus recorriéndola</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Seleccionar Ruta</label>
              <Select value={selectedRouteForSim} onValueChange={setSelectedRouteForSim}>
                <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue placeholder="Elige una ruta para simular" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: route.color }} />
                        {route.shortName} - {route.name} ({route.stopIds.length} paradas)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={openConfigDialog}
              disabled={!selectedRouteForSim}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar Bus
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <Radio className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buses Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liveBuses.filter((b) => b.status === "moving").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                <MapPin className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Paradas</p>
                <p className="text-2xl font-bold text-gray-900">{liveBuses.filter((b) => b.isAtStop).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg">
                <Gauge className="h-8 w-8 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Velocidad Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liveBuses.length > 0
                    ? Math.round(liveBuses.reduce((sum, bus) => sum + bus.speed, 0) / liveBuses.length)
                    : 0}{" "}
                  km/h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hora Pico</p>
                <p className="text-2xl font-bold text-gray-900">{isRushHour() ? "SÍ" : "NO"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Radio className="h-5 w-5 text-sky-600" />
            </div>
            Mapa en Tiempo Real
            <Badge variant={simulationRunning ? "default" : "secondary"} className="ml-2">
              {simulationRunning ? "Activo" : "Pausado"}
            </Badge>
            {liveBuses.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {liveBuses.length} buses simulados
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Visualización en tiempo real de buses recorriendo sus rutas. Los buses aparecen como 🚌 en el mapa.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <InteractiveMap
            mode={{ type: "view-only" }}
            stops={[...stops, ...busesForMap]}
            routes={routes}
            className="h-96"
          />
        </CardContent>
      </Card>

      {/* Buses Table */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Radio className="h-5 w-5 text-sky-600" />
            </div>
            Estado de Buses ({liveBuses.length})
          </CardTitle>
          <CardDescription>Información detallada de cada bus en tiempo real</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border border-sky-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
                  <TableHead className="font-semibold">Bus</TableHead>
                  <TableHead className="font-semibold">Conductor</TableHead>
                  <TableHead className="font-semibold">Ruta</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Velocidad</TableHead>
                  <TableHead className="font-semibold">Próxima Parada</TableHead>
                  <TableHead className="font-semibold">Dirección</TableHead>
                  <TableHead className="font-semibold">Última Actualización</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveBuses.map((bus) => {
                  const nextStop = stops.find((s) => s.id === bus.nextStopId)
                  return (
                    <TableRow
                      key={bus.id}
                      className={`hover:bg-sky-50/30 transition-colors ${selectedBus === bus.id ? "bg-sky-50" : ""}`}
                    >
                      <TableCell className="font-medium">{getBusInfo(bus.busId)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{getConductorInfo(bus.conductorId)}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: routes.find((r) => r.id === bus.routeId)?.color || "#3B82F6",
                            color: routes.find((r) => r.id === bus.routeId)?.textColor || "#FFFFFF",
                          }}
                        >
                          {getRouteInfo(bus.routeId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(bus.status, bus.isAtStop)}
                          {bus.isPaused && <Badge variant="secondary" className="text-xs">Pausado</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {bus.speed} km/h
                          </div>
                          {bus.customSpeed && (
                            <span className="text-xs text-gray-500">Max: {bus.customSpeed} km/h</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{nextStop?.name || "Desconocida"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bus.direction === 0 ? "Ida" : "Vuelta"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {bus.timestamp.toLocaleTimeString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBusPause(bus.id)}
                            title={bus.isPaused ? "Reanudar" : "Pausar"}
                            className="hover:bg-sky-100 hover:text-sky-700 hover:border-sky-300"
                          >
                            {bus.isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(bus)}
                            title="Editar configuración"
                            className="hover:bg-sky-100 hover:text-sky-700 hover:border-sky-300"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("¿Estás seguro de eliminar este bus de la simulación?")) {
                                deleteLiveBus(bus.id)
                              }
                            }}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700 hover:bg-red-100 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {liveBuses.length === 0 && (
            <div className="text-center py-8">
              <Radio className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay buses en simulación</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona una ruta arriba y haz clic en "Agregar Bus" para comenzar la simulación
              </p>
            </div>
          )}
        </CardContent>
      </Card>

          {/* Simulation Config Dialog */}
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLiveBus ? "Editar Configuración del Bus" : "Configurar Nuevo Bus"}</DialogTitle>
                <DialogDescription>
                  {editingLiveBus
                    ? "Modifica el bus, conductor o velocidad del bus en simulación"
                    : "Selecciona el bus físico, conductor y configura la velocidad"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Ruta */}
                <div className="space-y-2">
                  <Label htmlFor="route">Ruta</Label>
                  <Select
                    value={busConfig.routeId}
                    onValueChange={(value) => setBusConfig({ ...busConfig, routeId: value })}
                    disabled={!!editingLiveBus}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Selecciona una ruta" />
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

                {/* Bus */}
                <div className="space-y-2">
                  <Label htmlFor="bus">Bus Físico</Label>
                  <Select
                    value={busConfig.busId}
                    onValueChange={(value) => setBusConfig({ ...busConfig, busId: value })}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Selecciona un bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses
                        .filter((b) => b.status === "active")
                        .map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.plateNumber} - {bus.model} ({bus.year}) - Cap: {bus.capacity}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {buses.filter((b) => b.status === "active").length === 0 && (
                    <p className="text-sm text-amber-600">⚠️ No hay buses activos disponibles</p>
                  )}
                </div>

                {/* Conductor */}
                <div className="space-y-2">
                  <Label htmlFor="conductor">Conductor</Label>
                  <Select
                    value={busConfig.conductorId}
                    onValueChange={(value) => setBusConfig({ ...busConfig, conductorId: value })}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue placeholder="Selecciona un conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {conductores.map((conductor) => (
                        <SelectItem key={conductor.id_conductor} value={conductor.id_conductor}>
                          {conductor.nombre} {conductor.apellidos} - Lic: {conductor.tipo_licencia} - Exp:{" "}
                          {conductor.experiencia_anos} años
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {conductores.length === 0 && (
                    <p className="text-sm text-amber-600">⚠️ No hay conductores activos disponibles</p>
                  )}
                </div>

                {/* Velocidad personalizada */}
                <div className="space-y-2">
                  <Label htmlFor="speed">
                    Velocidad Máxima: {busConfig.customSpeed} km/h
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[busConfig.customSpeed]}
                      onValueChange={([value]) => setBusConfig({ ...busConfig, customSpeed: value })}
                      min={5}
                      max={60}
                      step={5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={busConfig.customSpeed}
                      onChange={(e) => setBusConfig({ ...busConfig, customSpeed: Number(e.target.value) })}
                      className="w-20 border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      min={5}
                      max={60}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Velocidad recomendada: 15-30 km/h en ciudad. Velocidad actual del sistema: {isRushHour() ? RUSH_HOUR_SPEED : NORMAL_SPEED} km/h
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-sky-50 to-emerald-50 p-4 rounded-lg space-y-2 border border-sky-100">
                  <h4 className="font-semibold text-sm">Vista Previa</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Ruta:</span>{" "}
                      <span className="font-medium">{routes.find((r) => r.id === busConfig.routeId)?.shortName || "No seleccionada"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Bus:</span>{" "}
                      <span className="font-medium">{buses.find((b) => b.id === busConfig.busId)?.plateNumber || "No seleccionado"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Conductor:</span>{" "}
                      <span className="font-medium">
                        {conductores.find((c) => c.id_conductor === busConfig.conductorId)
                          ? `${conductores.find((c) => c.id_conductor === busConfig.conductorId)?.nombre} ${conductores.find((c) => c.id_conductor === busConfig.conductorId)?.apellidos}`
                          : "No seleccionado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Velocidad:</span>{" "}
                      <span className="font-medium">{busConfig.customSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrUpdateLiveBus} className="bg-sky-500 hover:bg-sky-600">
                  {editingLiveBus ? "Actualizar" : "Crear"} Bus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* GPS Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Viaje</DialogTitle>
            <DialogDescription>
              Asigna un bus y conductor a una ruta. El bus aparecerá en la app móvil del conductor para seguimiento GPS
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bus */}
            <div className="space-y-2">
              <Label>Bus</Label>
              <Select value={selectedBusForAssign} onValueChange={setSelectedBusForAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses
                    .filter((b) => b.status === "active")
                    .map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.plateNumber} - {bus.model} ({bus.year})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conductor */}
            <div className="space-y-2">
              <Label>Conductor</Label>
              <Select value={selectedConductor} onValueChange={setSelectedConductor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conductor" />
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

            {/* Ruta (OBLIGATORIO) */}
            <div className="space-y-2">
              <Label>Ruta *</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ruta" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: `#${route.color}` }} />
                        {route.shortName} - {route.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendario (OBLIGATORIO) */}
            <div className="space-y-2">
              <Label>Calendario *</Label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un calendario" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {calendars.length === 0 && (
                <p className="text-xs text-amber-600">⚠️ No hay calendarios disponibles. Crea uno primero.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignConductor} className="bg-emerald-500 hover:bg-emerald-600">
              Crear Viaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditAssignDialogOpen} onOpenChange={setIsEditAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Viaje</DialogTitle>
            <DialogDescription>
              Modifica el conductor o la ruta del viaje
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bus (read-only) */}
            <div className="space-y-2">
              <Label>Bus</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="font-medium">
                  {editingBusAssignment?.plateNumber} - {editingBusAssignment?.model} ({editingBusAssignment?.year})
                </p>
              </div>
            </div>

            {/* Conductor */}
            <div className="space-y-2">
              <Label>Conductor</Label>
              <Select value={selectedConductor} onValueChange={setSelectedConductor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conductor" />
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

            {/* Ruta (OBLIGATORIO) */}
            <div className="space-y-2">
              <Label>Ruta *</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ruta" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: `#${route.color}` }} />
                        {route.shortName} - {route.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAssignment} className="bg-sky-500 hover:bg-sky-600">
              Actualizar Viaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
