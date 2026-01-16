"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, updateDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Plus from "lucide-react/dist/esm/icons/plus"
import Clock from "lucide-react/dist/esm/icons/clock"
import Edit from "lucide-react/dist/esm/icons/edit"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import { useToast } from "@/hooks/use-toast"
import { Timestamp } from "firebase/firestore"

interface StopSchedulesProps {
  stopId: string
  stopName: string
}

interface StopTimeEntry {
  stopId: string
  stopSequence: number
  arrivalTime: string
  departureTime: string
  stopHeadsign?: string
  pickupType?: string
  dropOffType?: string
}

interface TripStopTimes {
  tripId: string
  tripDocId: string
  times: StopTimeEntry[]
  routeName?: string
  routeColor?: string
}

interface StopTimeDisplay {
  tripId: string
  tripDocId: string
  arrivalTime: string
  departureTime: string
  stopSequence: number
  routeName?: string
  routeColor?: string
  index: number // índice en el array times
}

interface Trip {
  id: string
  headsign?: string
  routeId?: string
  routeName?: string
}

export function StopSchedules({ stopId, stopName }: StopSchedulesProps) {
  const [stopTimes, setStopTimes] = useState<StopTimeDisplay[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStopTime, setEditingStopTime] = useState<StopTimeDisplay | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    tripId: "",
    newTripHeadsign: "",
    createNewTrip: false,
    arrivalTime: "06:00:00",
    departureTime: "06:00:00",
    stopSequence: 1,
  })

  useEffect(() => {
    fetchStopTimes()
  }, [stopId])

  const fetchStopTimes = async () => {
    try {
      setLoading(true)

      // Obtener todos los documentos de stop_times
      const stopTimesSnapshot = await getDocs(collection(db, "stop_times"))
      const allStopTimes: StopTimeDisplay[] = []

      // Obtener trips para enriquecer con nombre de ruta
      const tripsSnapshot = await getDocs(collection(db, "trips"))
      const tripsMap = new Map()
      const tripsList: Trip[] = []

      tripsSnapshot.forEach((doc) => {
        const data = doc.data()
        tripsMap.set(doc.id, data)
        tripsList.push({
          id: doc.id,
          headsign: data.headsign,
          routeId: data.routeId,
        })
      })
      setTrips(tripsList)

      // Obtener rutas para enriquecer con nombre
      const routesSnapshot = await getDocs(collection(db, "routes"))
      const routesMap = new Map()
      routesSnapshot.forEach((doc) => {
        const data = doc.data()
        routesMap.set(doc.id, {
          name: data.shortName || data.name,
          color: data.color
        })
      })

      // Enriquecer trips con nombre de ruta
      tripsList.forEach(trip => {
        if (trip.routeId) {
          const routeData = routesMap.get(trip.routeId)
          trip.routeName = routeData?.name
        }
      })

      // Filtrar horarios de esta parada
      stopTimesSnapshot.forEach((doc) => {
        const data = doc.data()
        const tripId = data.tripId

        if (data.times && Array.isArray(data.times)) {
          data.times.forEach((time: StopTimeEntry, index: number) => {
            if (time.stopId === stopId) {
              const tripData = tripsMap.get(tripId)
              const routeData = tripData?.routeId ? routesMap.get(tripData.routeId) : null

              allStopTimes.push({
                tripId,
                tripDocId: doc.id,
                arrivalTime: time.arrivalTime,
                departureTime: time.departureTime,
                stopSequence: time.stopSequence,
                routeName: routeData?.name,
                routeColor: routeData?.color,
                index,
              })
            }
          })
        }
      })

      // Ordenar por hora de llegada
      allStopTimes.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))

      setStopTimes(allStopTimes)
    } catch (error) {
      console.error("Error fetching stop times:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newStopTime: StopTimeEntry = {
        stopId,
        stopSequence: formData.stopSequence,
        arrivalTime: formData.arrivalTime,
        departureTime: formData.departureTime,
      }

      let targetTripId = formData.tripId
      let targetDocId = `trip_${formData.tripId}`

      // Si se está creando un nuevo trip
      if (formData.createNewTrip && formData.newTripHeadsign) {
        targetTripId = `trip_${Date.now()}`
        targetDocId = `trip_${targetTripId}`

        // Crear nuevo trip en la colección trips
        await setDoc(doc(db, "trips", targetTripId), {
          headsign: formData.newTripHeadsign,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        // Crear documento en stop_times
        await setDoc(doc(db, "stop_times", targetDocId), {
          tripId: targetTripId,
          times: [newStopTime],
          totalDuration: 0,
          createdAt: Timestamp.now(),
        })
      } else {
        // Actualizar trip existente
        const stopTimeDocRef = doc(db, "stop_times", targetDocId)

        if (editingStopTime) {
          // Editar: primero obtener el documento actual
          const stopTimesSnapshot = await getDocs(collection(db, "stop_times"))
          let currentTimes: StopTimeEntry[] = []
          let docExists = false

          stopTimesSnapshot.forEach((d) => {
            if (d.id === editingStopTime.tripDocId) {
              currentTimes = d.data().times || []
              docExists = true
            }
          })

          // Actualizar el elemento específico
          currentTimes[editingStopTime.index] = newStopTime

          if (docExists) {
            await updateDoc(stopTimeDocRef, {
              times: currentTimes,
              updatedAt: Timestamp.now(),
            })
          } else {
            // Si no existe, crearlo
            await setDoc(stopTimeDocRef, {
              tripId: targetTripId,
              times: currentTimes,
              totalDuration: 0,
              createdAt: Timestamp.now(),
            })
          }
        } else {
          // Agregar nuevo: verificar si el documento existe
          const stopTimesSnapshot = await getDocs(collection(db, "stop_times"))
          let docExists = false
          let existingTimes: StopTimeEntry[] = []

          stopTimesSnapshot.forEach((d) => {
            if (d.id === targetDocId) {
              docExists = true
              existingTimes = d.data().times || []
            }
          })

          if (docExists) {
            // Si existe, agregar al array
            await updateDoc(stopTimeDocRef, {
              times: arrayUnion(newStopTime),
              updatedAt: Timestamp.now(),
            })
          } else {
            // Si no existe, crear el documento
            await setDoc(stopTimeDocRef, {
              tripId: targetTripId,
              times: [newStopTime],
              totalDuration: 0,
              createdAt: Timestamp.now(),
            })
          }
        }
      }

      toast({
        title: "Éxito",
        description: editingStopTime ? "Horario actualizado" : "Horario agregado",
      })

      setIsDialogOpen(false)
      setEditingStopTime(null)
      resetForm()
      fetchStopTimes()
    } catch (error) {
      console.error("Error saving stop time:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el horario",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (stopTime: StopTimeDisplay) => {
    setEditingStopTime(stopTime)
    setFormData({
      tripId: stopTime.tripId,
      newTripHeadsign: "",
      createNewTrip: false,
      arrivalTime: stopTime.arrivalTime,
      departureTime: stopTime.departureTime,
      stopSequence: stopTime.stopSequence,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (stopTime: StopTimeDisplay) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este horario?")) {
      return
    }

    try {
      // Obtener el documento actual
      const stopTimesSnapshot = await getDocs(collection(db, "stop_times"))
      let currentTimes: StopTimeEntry[] = []

      stopTimesSnapshot.forEach((d) => {
        if (d.id === stopTime.tripDocId) {
          currentTimes = d.data().times || []
        }
      })

      // Eliminar el elemento del array
      currentTimes.splice(stopTime.index, 1)

      // Actualizar el documento
      const stopTimeDocRef = doc(db, "stop_times", stopTime.tripDocId)
      await updateDoc(stopTimeDocRef, {
        times: currentTimes,
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Éxito",
        description: "Horario eliminado",
      })

      fetchStopTimes()
    } catch (error) {
      console.error("Error deleting stop time:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      tripId: "",
      newTripHeadsign: "",
      createNewTrip: false,
      arrivalTime: "06:00:00",
      departureTime: "06:00:00",
      stopSequence: 1,
    })
  }

  const openDialog = () => {
    setEditingStopTime(null)
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Horarios de {stopName}
            </CardTitle>
            <CardDescription className="mt-1">
              Horarios de llegada y salida de buses en esta parada
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Horario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingStopTime ? "Editar Horario" : "Nuevo Horario"}</DialogTitle>
                <DialogDescription>
                  Agrega un horario de llegada y salida para esta parada
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de trip o crear nuevo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.createNewTrip}
                        onChange={() => setFormData({ ...formData, createNewTrip: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Usar viaje existente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.createNewTrip}
                        onChange={() => setFormData({ ...formData, createNewTrip: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Crear nuevo viaje</span>
                    </label>
                  </div>

                  {!formData.createNewTrip ? (
                    <div className="space-y-2">
                      <Label htmlFor="tripId">Viaje *</Label>
                      <Select
                        value={formData.tripId}
                        onValueChange={(value) => setFormData({ ...formData, tripId: value })}
                        required={!formData.createNewTrip}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un viaje" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.map((trip) => (
                            <SelectItem key={trip.id} value={trip.id}>
                              {trip.headsign || trip.id}
                              {trip.routeName && ` (${trip.routeName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="newTripHeadsign">Nombre del nuevo viaje *</Label>
                      <Input
                        id="newTripHeadsign"
                        value={formData.newTripHeadsign}
                        onChange={(e) => setFormData({ ...formData, newTripHeadsign: e.target.value })}
                        placeholder="Ej: Terminal - Centro"
                        required={formData.createNewTrip}
                      />
                    </div>
                  )}
                </div>

                {/* Horarios */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Hora de Llegada *</Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      step="1"
                      value={formData.arrivalTime.slice(0, 5)}
                      onChange={(e) =>
                        setFormData({ ...formData, arrivalTime: `${e.target.value}:00` })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departureTime">Hora de Salida *</Label>
                    <Input
                      id="departureTime"
                      type="time"
                      step="1"
                      value={formData.departureTime.slice(0, 5)}
                      onChange={(e) =>
                        setFormData({ ...formData, departureTime: `${e.target.value}:00` })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Secuencia */}
                <div className="space-y-2">
                  <Label htmlFor="stopSequence">Secuencia en el Viaje *</Label>
                  <Input
                    id="stopSequence"
                    type="number"
                    min="1"
                    value={formData.stopSequence}
                    onChange={(e) =>
                      setFormData({ ...formData, stopSequence: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Posición de esta parada en la secuencia del viaje (1 = primera parada)
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingStopTime ? "Actualizar" : "Crear"} Horario
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : stopTimes.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay horarios definidos para esta parada</p>
            <p className="text-xs text-gray-400 mt-1">
              Agrega horarios para indicar cuándo llegan los buses
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Ruta</TableHead>
                  <TableHead>Viaje</TableHead>
                  <TableHead>Llegada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Secuencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stopTimes.map((stopTime, index) => (
                  <TableRow key={`${stopTime.tripDocId}-${index}`}>
                    <TableCell>
                      {stopTime.routeName ? (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: stopTime.routeColor ? `${stopTime.routeColor}20` : undefined,
                            borderColor: stopTime.routeColor || undefined
                          }}
                        >
                          {stopTime.routeName}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin ruta</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {stopTime.tripId}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {stopTime.arrivalTime.slice(0, 5)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {stopTime.departureTime.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stopTime.stopSequence}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(stopTime)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(stopTime)}
                          className="hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
