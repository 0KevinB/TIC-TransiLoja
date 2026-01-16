"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trip, Route, Stop, StopTimesCollection, StopTime } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StopTimesPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [stopTimesCollections, setStopTimesCollections] = useState<StopTimesCollection[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [stopTimes, setStopTimes] = useState<StopTime[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedTripId) {
      loadStopTimesForTrip(selectedTripId)
    }
  }, [selectedTripId])

  const fetchData = async () => {
    try {
      const [tripsSnapshot, routesSnapshot, stopsSnapshot, stopTimesSnapshot] = await Promise.all([
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "stops")),
        getDocs(collection(db, "stop_times")),
      ])

      // Fetch trips
      const tripsData: Trip[] = []
      tripsSnapshot.forEach((doc) => {
        const data = doc.data()

        // Handle old and new frequency format
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
          frequency,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

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

      // Fetch stops
      const stopsData: Stop[] = []
      stopsSnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          routeIds: data.routeIds || data.lines || [],
          amenities: data.amenities || {
            shelter: false,
            bench: false,
            lighting: false,
            bin: false,
            wifi: false,
            realTimeDisplay: false,
          },
          operator: data.operator,
          network: data.network,
          code: data.code,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // Fetch stop times
      const stopTimesData: StopTimesCollection[] = []
      stopTimesSnapshot.forEach((doc) => {
        const data = doc.data()
        stopTimesData.push({
          id: doc.id,
          tripId: data.tripId,
          times: data.times || [],
          totalDuration: data.totalDuration || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        })
      })

      setTrips(tripsData)
      setRoutes(routesData)
      setStops(stopsData)
      setStopTimesCollections(stopTimesData)
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

  const loadStopTimesForTrip = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return

    const route = routes.find((r) => r.id === trip.routeId)
    if (!route) return

    // Check if stop times already exist for this trip
    const existing = stopTimesCollections.find((st) => st.tripId === tripId)

    if (existing) {
      setStopTimes(existing.times)
    } else {
      // Generate default stop times based on route stops
      const defaultTimes: StopTime[] = route.stopIds.map((stopId, index) => ({
        stopId,
        stopSequence: index + 1,
        arrivalTime: calculateDefaultTime(trip.frequency.startTime, index * 3),
        departureTime: calculateDefaultTime(trip.frequency.startTime, index * 3 + 1),
        dwellTime: 60, // 1 minute default
      }))
      setStopTimes(defaultTimes)
    }
  }

  const calculateDefaultTime = (startTime: string, minutesToAdd: number): string => {
    const [hours, minutes, seconds] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + minutesToAdd
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMinutes = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${seconds ? String(seconds).padStart(2, '0') : '00'}`
  }

  const handleTimeChange = (index: number, field: 'arrivalTime' | 'departureTime', value: string) => {
    const updated = [...stopTimes]
    updated[index] = { ...updated[index], [field]: value + ':00' }
    setStopTimes(updated)
  }

  const handleDwellTimeChange = (index: number, value: number) => {
    const updated = [...stopTimes]
    updated[index] = { ...updated[index], dwellTime: value }
    setStopTimes(updated)
  }

  const calculateTotalDuration = (): number => {
    if (stopTimes.length === 0) return 0

    const firstArrival = stopTimes[0].arrivalTime
    const lastDeparture = stopTimes[stopTimes.length - 1].departureTime

    const [h1, m1, s1] = firstArrival.split(':').map(Number)
    const [h2, m2, s2] = lastDeparture.split(':').map(Number)

    const totalSeconds1 = h1 * 3600 + m1 * 60 + s1
    const totalSeconds2 = h2 * 3600 + m2 * 60 + s2

    return totalSeconds2 - totalSeconds1
  }

  const handleSave = async () => {
    if (!selectedTripId) {
      toast({
        title: "Error",
        description: "Selecciona un viaje primero",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const totalDuration = calculateTotalDuration()
      const docId = `trip_${selectedTripId}`

      const stopTimesData: Omit<StopTimesCollection, 'id'> = {
        tripId: selectedTripId,
        times: stopTimes,
        totalDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, "stop_times", docId), stopTimesData)

      toast({
        title: "Éxito",
        description: "Tiempos de parada guardados correctamente",
      })

      fetchData()
    } catch (error) {
      console.error("Error saving stop times:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los tiempos de parada",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTripId) return

    if (!confirm("¿Estás seguro de que quieres eliminar los tiempos de parada de este viaje?")) {
      return
    }

    try {
      const docId = `trip_${selectedTripId}`
      await deleteDoc(doc(db, "stop_times", docId))

      setStopTimes([])
      toast({
        title: "Éxito",
        description: "Tiempos de parada eliminados correctamente",
      })

      fetchData()
    } catch (error) {
      console.error("Error deleting stop times:", error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los tiempos de parada",
        variant: "destructive",
      })
    }
  }

  const getStopName = (stopId: string) => {
    const stop = stops.find((s) => s.id === stopId)
    return stop ? stop.name : "Parada desconocida"
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId)
  const selectedRoute = selectedTrip ? getRouteInfo(selectedTrip.routeId) : null
  const hasStopTimes = stopTimesCollections.some((st) => st.tripId === selectedTripId)

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tiempos de Parada</h1>
        <p className="text-gray-600">Configura los tiempos de llegada y salida para cada parada de un viaje</p>
      </div>

      {/* Trip Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Seleccionar Viaje
          </CardTitle>
          <CardDescription>
            Elige un viaje para configurar los tiempos de parada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Viaje</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar viaje" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => {
                    const route = getRouteInfo(trip.routeId)
                    return (
                      <SelectItem key={trip.id} value={trip.id}>
                        <div className="flex items-center gap-2">
                          {route && (
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: route.color }}
                            />
                          )}
                          {route?.shortName || "?"} - {trip.headsign} ({trip.direction === 0 ? "Ida" : "Vuelta"})
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedTrip && selectedRoute && (
              <div className="space-y-2">
                <Label>Información del Viaje</Label>
                <div className="p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge style={{ backgroundColor: selectedRoute.color, color: selectedRoute.textColor }}>
                      {selectedRoute.shortName}
                    </Badge>
                    <span className="text-sm font-medium">{selectedRoute.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Destino: {selectedTrip.headsign}</div>
                    <div>Horario: {selectedTrip.frequency.startTime.slice(0, 5)} - {selectedTrip.frequency.endTime.slice(0, 5)}</div>
                    <div>Frecuencia: Cada {selectedTrip.frequency.headwaySecs / 60} minutos</div>
                    <div>Paradas en ruta: {selectedRoute.stopIds.length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stop Times Configuration */}
      {selectedTripId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuración de Tiempos
                {hasStopTimes && (
                  <Badge variant="default" className="bg-green-600">
                    Guardado
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {hasStopTimes && (
                  <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="bg-sky-500 hover:bg-sky-600">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Define la hora de llegada y salida para cada parada. El tiempo de permanencia se calcula automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stopTimes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay paradas configuradas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  La ruta seleccionada no tiene paradas configuradas
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Orden</TableHead>
                        <TableHead>Parada</TableHead>
                        <TableHead>Hora de Llegada</TableHead>
                        <TableHead>Hora de Salida</TableHead>
                        <TableHead className="w-32">Permanencia (seg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stopTimes.map((stopTime, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{stopTime.stopSequence}</Badge>
                          </TableCell>
                          <TableCell>{getStopName(stopTime.stopId)}</TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={stopTime.arrivalTime.slice(0, 5)}
                              onChange={(e) => handleTimeChange(index, 'arrivalTime', e.target.value)}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={stopTime.departureTime.slice(0, 5)}
                              onChange={(e) => handleTimeChange(index, 'departureTime', e.target.value)}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="600"
                              value={stopTime.dwellTime}
                              onChange={(e) => handleDwellTimeChange(index, Number.parseInt(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Duración Total del Viaje</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.floor(calculateTotalDuration() / 60)} minutos {calculateTotalDuration() % 60} segundos
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
