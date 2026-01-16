"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trip, Route, Calendar, Bus, Conductor, AsignacionHistorial } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, BusIcon, User, Calendar as CalendarIcon, History, Check, X } from "lucide-react"
import { toast } from "sonner"

export default function AssignmentsPage() {
  // Estados
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [historial, setHistorial] = useState<AsignacionHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Selecciones
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set())
  const [bulkBusId, setBulkBusId] = useState<string>("__none__")
  const [bulkConductorId, setBulkConductorId] = useState<string>("__none__")

  // Filtros
  const [filterRoute, setFilterRoute] = useState<string>("all")
  const [filterCalendar, setFilterCalendar] = useState<string>("all")
  const [filterAssignment, setFilterAssignment] = useState<"all" | "assigned" | "unassigned">("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [tripsSnap, routesSnap, calendarsSnap, busesSnap, conductoresSnap, historialSnap] = await Promise.all([
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "calendars")),
        getDocs(query(collection(db, "buses"), where("status", "==", "active"))),
        getDocs(query(collection(db, "conductores"), where("estado", "==", "activo"))),
        getDocs(query(collection(db, "asignaciones_historial"), orderBy("fecha_asignacion", "desc"))),
      ])

      // Procesar trips
      const tripsData: Trip[] = tripsSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          routeId: data.routeId,
          calendarId: data.calendarId,
          headsign: data.headsign,
          direction: data.direction || 0,
          busId: data.busId,
          conductorId: data.conductorId,
          frequency: data.frequency || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Trip
      })

      // Procesar routes - soporta tanto el formato antiguo como el nuevo formato GTFS
      const routesData: Route[] = routesSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.route_long_name || data.name,
          shortName: data.route_short_name || data.shortName,
          description: data.route_desc || data.description,
          color: (data.route_color || data.color || 'FF0000').replace('#', ''),
          textColor: (data.route_text_color || data.textColor || 'FFFFFF').replace('#', ''),
          operatingStartTime: data.operatingStartTime,
          operatingEndTime: data.operatingEndTime,
          stopIds: data.custom_stop_ids || data.stopIds || [],
          type: data.type || "bus",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Route
      })

      // Procesar calendars
      const calendarsData: Calendar[] = calendarsSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          monday: data.monday,
          tuesday: data.tuesday,
          wednesday: data.wednesday,
          thursday: data.thursday,
          friday: data.friday,
          saturday: data.saturday,
          sunday: data.sunday,
          operatingStartTime: data.operatingStartTime || "06:00",
          operatingEndTime: data.operatingEndTime || "22:00",
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          holidays: data.holidays || [],
        } as Calendar
      })

      // Procesar buses
      const busesData: Bus[] = busesSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          plateNumber: data.plateNumber,
          model: data.model,
          year: data.year,
          capacity: data.capacity,
          status: data.status,
          features: data.features || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Bus
      })

      // Procesar conductores
      const conductoresData: Conductor[] = conductoresSnap.docs.map(doc => {
        const data = doc.data()
        return {
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
        } as Conductor
      })

      // Procesar historial
      const historialData: AsignacionHistorial[] = historialSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id_asignacion: doc.id,
          id_viaje: data.id_viaje,
          id_bus: data.id_bus,
          id_conductor: data.id_conductor,
          fecha_asignacion: data.fecha_asignacion?.toDate() || new Date(),
          fecha_inicio_efectiva: data.fecha_inicio_efectiva?.toDate() || new Date(),
          fecha_fin_efectiva: data.fecha_fin_efectiva?.toDate(),
          estado: data.estado || "programada",
          kilometraje_inicio: data.kilometraje_inicio,
          kilometraje_fin: data.kilometraje_fin,
          combustible_consumido: data.combustible_consumido,
          observaciones: data.observaciones,
          asignado_por: data.asignado_por,
          motivo_cambio: data.motivo_cambio,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AsignacionHistorial
      })

      setTrips(tripsData)
      setRoutes(routesData)
      setCalendars(calendarsData)
      setBuses(busesData)
      setConductores(conductoresData)
      setHistorial(historialData)

    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Aplicar asignación masiva
  const handleBulkAssign = async () => {
    if (selectedTrips.size === 0) {
      toast.error("Selecciona al menos un viaje")
      return
    }

    const hasValidBus = bulkBusId && bulkBusId !== "__none__"
    const hasValidConductor = bulkConductorId && bulkConductorId !== "__none__"

    if (!hasValidBus && !hasValidConductor) {
      toast.error("Selecciona al menos un bus o conductor para asignar")
      return
    }

    try {
      setSaving(true)

      const updates = Array.from(selectedTrips).map(async (tripId) => {
        const updateData: any = {
          updatedAt: new Date()
        }

        if (hasValidBus) updateData.busId = bulkBusId
        if (hasValidConductor) updateData.conductorId = bulkConductorId

        // Actualizar viaje
        await updateDoc(doc(db, "trips", tripId), updateData)

        // Crear registro en historial
        await addDoc(collection(db, "asignaciones_historial"), {
          id_viaje: tripId,
          id_bus: hasValidBus ? bulkBusId : null,
          id_conductor: hasValidConductor ? bulkConductorId : null,
          fecha_asignacion: new Date(),
          fecha_inicio_efectiva: new Date(),
          estado: "programada",
          asignado_por: "admin", // TODO: Obtener del contexto de auth
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })

      await Promise.all(updates)

      toast.success(`${selectedTrips.size} viajes asignados correctamente`)
      setSelectedTrips(new Set())
      setBulkBusId("")
      setBulkConductorId("")
      await loadData()

    } catch (error) {
      console.error("Error bulk assigning:", error)
      toast.error("Error al asignar viajes")
    } finally {
      setSaving(false)
    }
  }

  // Limpiar asignación masiva
  const handleBulkClear = async () => {
    if (selectedTrips.size === 0) {
      toast.error("Selecciona al menos un viaje")
      return
    }

    try {
      setSaving(true)

      const updates = Array.from(selectedTrips).map(async (tripId) => {
        await updateDoc(doc(db, "trips", tripId), {
          busId: null,
          conductorId: null,
          updatedAt: new Date()
        })
      })

      await Promise.all(updates)

      toast.success(`${selectedTrips.size} viajes limpiados correctamente`)
      setSelectedTrips(new Set())
      await loadData()

    } catch (error) {
      console.error("Error clearing assignments:", error)
      toast.error("Error al limpiar asignaciones")
    } finally {
      setSaving(false)
    }
  }

  // Toggle selección de viaje
  const toggleTripSelection = (tripId: string) => {
    const newSelection = new Set(selectedTrips)
    if (newSelection.has(tripId)) {
      newSelection.delete(tripId)
    } else {
      newSelection.add(tripId)
    }
    setSelectedTrips(newSelection)
  }

  // Seleccionar todos los viajes filtrados
  const selectAllFiltered = () => {
    const newSelection = new Set(filteredTrips.map(t => t.id))
    setSelectedTrips(newSelection)
  }

  // Limpiar selección
  const clearSelection = () => {
    setSelectedTrips(new Set())
  }

  // Helper functions
  const getRouteInfo = (routeId: string) => {
    const route = routes.find(r => r.id === routeId)
    return route || null
  }

  const getCalendarInfo = (calendarId: string) => {
    const calendar = calendars.find(c => c.id === calendarId)
    return calendar?.name || "Desconocido"
  }

  const getBusInfo = (busId?: string) => {
    if (!busId) return "Sin asignar"
    const bus = buses.find(b => b.id === busId)
    return bus ? bus.plateNumber : "Bus no encontrado"
  }

  const getConductorInfo = (conductorId?: string) => {
    if (!conductorId) return "Sin asignar"
    const conductor = conductores.find(c => c.id_conductor === conductorId)
    return conductor ? `${conductor.nombre} ${conductor.apellidos}` : "Conductor no encontrado"
  }

  // Filtros
  const filteredTrips = trips.filter(trip => {
    if (filterRoute !== "all" && trip.routeId !== filterRoute) return false
    if (filterCalendar !== "all" && trip.calendarId !== filterCalendar) return false
    if (filterAssignment === "assigned" && !trip.busId && !trip.conductorId) return false
    if (filterAssignment === "unassigned" && (trip.busId || trip.conductorId)) return false
    return true
  })

  // Estadísticas
  const stats = {
    total: trips.length,
    assigned: trips.filter(t => t.busId || t.conductorId).length,
    unassigned: trips.filter(t => !t.busId && !t.conductorId).length,
    selected: selectedTrips.size,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asignación de Viajes</h1>
          <p className="text-gray-600">Gestiona la asignación de buses y conductores a viajes</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Viajes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Asignados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sin Asignar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Seleccionados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.selected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bulk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bulk">Asignación Masiva</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Tab: Asignación Masiva */}
        <TabsContent value="bulk" className="space-y-4">
          {/* Controles de asignación masiva */}
          <Card>
            <CardHeader>
              <CardTitle>Asignación Masiva</CardTitle>
              <CardDescription>
                Selecciona viajes y asigna buses y conductores en lote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bus</label>
                  <Select value={bulkBusId} onValueChange={setBulkBusId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {buses.map(bus => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plateNumber} - {bus.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conductor</label>
                  <Select value={bulkConductorId} onValueChange={setBulkConductorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {conductores.map(conductor => (
                        <SelectItem key={conductor.id_conductor} value={conductor.id_conductor}>
                          {conductor.nombre} {conductor.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleBulkAssign}
                    disabled={saving || selectedTrips.size === 0}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Asignar ({selectedTrips.size})
                  </Button>
                  <Button
                    onClick={handleBulkClear}
                    disabled={saving || selectedTrips.size === 0}
                    variant="outline"
                  >
                    Limpiar
                  </Button>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={selectAllFiltered}
                    variant="outline"
                    size="sm"
                  >
                    Seleccionar Todos
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                  >
                    Limpiar Selección
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ruta</label>
                  <Select value={filterRoute} onValueChange={setFilterRoute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las rutas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las rutas</SelectItem>
                      {routes.map(route => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.shortName} - {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Calendario</label>
                  <Select value={filterCalendar} onValueChange={setFilterCalendar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los calendarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los calendarios</SelectItem>
                      {calendars.map(calendar => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado de Asignación</label>
                  <Select value={filterAssignment} onValueChange={(value: any) => setFilterAssignment(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="assigned">Asignados</SelectItem>
                      <SelectItem value="unassigned">Sin Asignar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de viajes */}
          <Card>
            <CardHeader>
              <CardTitle>Viajes ({filteredTrips.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTrips.size === filteredTrips.length && filteredTrips.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllFiltered()
                            } else {
                              clearSelection()
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Calendario</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Bus Actual</TableHead>
                      <TableHead>Conductor Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map(trip => {
                      const route = getRouteInfo(trip.routeId)
                      return (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTrips.has(trip.id)}
                              onCheckedChange={() => toggleTripSelection(trip.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: route?.color || "#3B82F6",
                                color: route?.textColor || "#FFFFFF"
                              }}
                            >
                              {route?.shortName || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{trip.headsign}</span>
                              <Badge variant="outline" className="text-xs">
                                {trip.direction === 0 ? "Ida" : "Vuelta"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getCalendarInfo(trip.calendarId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {trip.frequency?.startTime?.slice(0, 5)} - {trip.frequency?.endTime?.slice(0, 5)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trip.busId ? "default" : "outline"}>
                              {getBusInfo(trip.busId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={trip.conductorId ? "default" : "outline"}>
                              {getConductorInfo(trip.conductorId)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredTrips.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No se encontraron viajes con los filtros aplicados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Asignaciones
              </CardTitle>
              <CardDescription>
                Registro completo de todas las asignaciones realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Viaje</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Asignado Por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.slice(0, 50).map(registro => {
                      const trip = trips.find(t => t.id === registro.id_viaje)
                      const route = trip ? getRouteInfo(trip.routeId) : null

                      return (
                        <TableRow key={registro.id_asignacion}>
                          <TableCell className="text-sm">
                            {registro.fecha_asignacion.toLocaleDateString()} {registro.fecha_asignacion.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {route && (
                              <Badge
                                style={{
                                  backgroundColor: route.color || "#3B82F6",
                                  color: route.textColor || "#FFFFFF"
                                }}
                              >
                                {route.shortName} - {trip?.headsign}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getBusInfo(registro.id_bus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getConductorInfo(registro.id_conductor)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                registro.estado === "completada" ? "default" :
                                registro.estado === "en_curso" ? "secondary" :
                                registro.estado === "cancelada" ? "destructive" :
                                "outline"
                              }
                            >
                              {registro.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {registro.asignado_por || "Sistema"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {historial.length === 0 && (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin historial</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aún no se han realizado asignaciones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
