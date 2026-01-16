"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Stop, Route } from "@/lib/types"
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
import { Checkbox } from "@/components/ui/checkbox"
import { InteractiveMap } from "@/components/map/interactive-map"
import { MapPin, Plus, Edit, Trash2, Search, Map, Home, Lightbulb, Trash, Wifi, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StopsPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null)

  // ✅ ACTUALIZADO: Nuevo formData con todos los campos
  const [formData, setFormData] = useState({
    name: "",
    lat: "",
    lng: "",
    operator: "",
    network: "",
    code: "",
    routeIds: [] as string[],
    amenities: {
      shelter: false,
      bench: false,
      lighting: false,
      bin: false,
      wifi: false,
      realTimeDisplay: false,
    },
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchStops()
    fetchRoutes()
  }, [])

  // ✅ NUEVO: Cargar rutas para el selector
  const fetchRoutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "routes"))
      const routesData: Route[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        routesData.push({
          id: doc.id,
          name: data.route_long_name || data.name || "",
          shortName: data.route_short_name || data.shortName || "",
          description: data.route_desc || data.description || "",
          color: (data.route_color || data.color || "3B82F6").replace('#', ''),
          textColor: (data.route_text_color || data.textColor || "FFFFFF").replace('#', ''),
          type: data.type || "bus",
          agencyId: data.agencyId,
          stopIds: data.custom_stop_ids || data.stopIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })
      setRoutes(routesData)
    } catch (error) {
      console.error("Error fetching routes:", error)
    }
  }

  // ✅ ACTUALIZADO: fetchStops con nuevos campos
  const fetchStops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "stops"))
      const stopsData: Stop[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          routeIds: data.routeIds || [], // ✅ CORREGIDO: IDs en lugar de lines
          amenities: data.amenities || {
            shelter: false,
            bench: false,
            lighting: false,
            bin: false,
            wifi: false,
            realTimeDisplay: false,
          },
          operator: data.operator || null,
          network: data.network || null,
          code: data.code || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Stop)
      })
      setStops(stopsData.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error("Error fetching stops:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las paradas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMapStopAdd = (lat: number, lng: number) => {
    setTempCoords({ lat, lng })
    setFormData({
      ...formData,
      lat: lat.toString(),
      lng: lng.toString(),
    })
  }

  // ✅ ACTUALIZADO: handleSubmit con nuevos campos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.lat || !formData.lng) {
      toast({
        title: "Error",
        description: "Nombre y coordenadas son obligatorios",
        variant: "destructive",
      })
      return
    }

    const lat = Number.parseFloat(formData.lat)
    const lng = Number.parseFloat(formData.lng)

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Error",
        description: "Las coordenadas deben ser números válidos",
        variant: "destructive",
      })
      return
    }

    try {
      const stopData = {
        name: formData.name,
        lat,
        lng,
        routeIds: formData.routeIds, // ✅ CORREGIDO
        amenities: formData.amenities,
        operator: formData.operator || null,
        network: formData.network || null,
        code: formData.code || null,
        createdAt: editingStop ? editingStop.createdAt : new Date(),
        updatedAt: new Date(),
      }

      if (editingStop) {
        await updateDoc(doc(db, "stops", editingStop.id), stopData)
        toast({
          title: "Éxito",
          description: "Parada actualizada correctamente",
        })
      } else {
        await addDoc(collection(db, "stops"), stopData)
        toast({
          title: "Éxito",
          description: "Parada creada correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingStop(null)
      setShowMap(false)
      setTempCoords(null)
      resetForm()
      fetchStops()
    } catch (error) {
      console.error("Error saving stop:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la parada",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      lat: "",
      lng: "",
      operator: "",
      network: "",
      code: "",
      routeIds: [],
      amenities: {
        shelter: false,
        bench: false,
        lighting: false,
        bin: false,
        wifi: false,
        realTimeDisplay: false,
      },
    })
  }

  // ✅ ACTUALIZADO: handleEdit con nuevos campos
  const handleEdit = (stop: Stop) => {
    setEditingStop(stop)
    setFormData({
      name: stop.name,
      lat: stop.lat.toString(),
      lng: stop.lng.toString(),
      operator: stop.operator || "",
      network: stop.network || "",
      code: stop.code || "",
      routeIds: stop.routeIds || [],
      amenities: stop.amenities || {
        shelter: false,
        bench: false,
        lighting: false,
        bin: false,
        wifi: false,
        realTimeDisplay: false,
      },
    })
    setTempCoords({ lat: stop.lat, lng: stop.lng })
    setIsDialogOpen(true)
  }

  const handleDelete = async (stopId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta parada?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "stops", stopId))
      toast({
        title: "Éxito",
        description: "Parada eliminada correctamente",
      })
      fetchStops()
    } catch (error) {
      console.error("Error deleting stop:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la parada",
        variant: "destructive",
      })
    }
  }

  const openDialog = () => {
    setEditingStop(null)
    resetForm()
    setTempCoords(null)
    setShowMap(false)
    setIsDialogOpen(true)
  }

  const filteredStops = stops.filter((stop) => stop.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Helper para obtener nombres de rutas
  const getRouteNames = (routeIds: string[]) => {
    return routeIds
      .map((id) => routes.find((r) => r.id === id)?.shortName)
      .filter(Boolean)
      .join(", ")
  }

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paradas</h1>
          <p className="text-gray-600">Gestiona las paradas del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Parada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStop ? "Editar Parada" : "Nueva Parada"}</DialogTitle>
              <DialogDescription>
                {editingStop ? "Modifica los datos de la parada" : "Añade una nueva parada al sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda: Información Básica */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la parada *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Parque Central"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitud *</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        placeholder="-4.0184"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitud *</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        placeholder="-79.2112"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    {showMap ? "Ocultar Mapa" : "Seleccionar en Mapa"}
                  </Button>

                  {/* ✅ NUEVO: Información Operativa */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Información Operativa</h3>

                    <div className="space-y-2">
                      <Label htmlFor="code">Código de Parada</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ej: L5-01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="operator">Operador</Label>
                      <Input
                        id="operator"
                        value={formData.operator}
                        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                        placeholder="Ej: SITU"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network">Red de Transporte</Label>
                      <Input
                        id="network"
                        value={formData.network}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        placeholder="Ej: Red Municipal"
                      />
                    </div>
                  </div>

                  {/* ✅ NUEVO: Rutas que pasan por esta parada */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Rutas que pasan por aquí</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      {routes.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay rutas disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {routes.map((route) => (
                            <div key={route.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`route-${route.id}`}
                                checked={formData.routeIds.includes(route.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      routeIds: [...formData.routeIds, route.id],
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      routeIds: formData.routeIds.filter((id) => id !== route.id),
                                    })
                                  }
                                }}
                              />
                              <label
                                htmlFor={`route-${route.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                <Badge style={{ backgroundColor: route.color }}>
                                  {route.shortName}
                                </Badge>
                                <span className="ml-2">{route.name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Amenities + Mapa */}
                <div className="space-y-4">
                  {/* ✅ NUEVO: Amenities */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Servicios y Comodidades</h3>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shelter"
                          checked={formData.amenities.shelter}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, shelter: !!checked },
                            })
                          }
                        />
                        <label
                          htmlFor="shelter"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                        >
                          <Home className="mr-2 h-4 w-4" />
                          Refugio / Techo
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bench"
                          checked={formData.amenities.bench}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, bench: !!checked },
                            })
                          }
                        />
                        <label htmlFor="bench" className="text-sm font-medium cursor-pointer">
                          Banca / Asiento
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="lighting"
                          checked={formData.amenities.lighting}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, lighting: !!checked },
                            })
                          }
                        />
                        <label htmlFor="lighting" className="text-sm font-medium cursor-pointer flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Iluminación
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bin"
                          checked={formData.amenities.bin}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, bin: !!checked },
                            })
                          }
                        />
                        <label htmlFor="bin" className="text-sm font-medium cursor-pointer flex items-center">
                          <Trash className="mr-2 h-4 w-4" />
                          Basurero
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wifi"
                          checked={formData.amenities.wifi}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, wifi: !!checked },
                            })
                          }
                        />
                        <label htmlFor="wifi" className="text-sm font-medium cursor-pointer flex items-center">
                          <Wifi className="mr-2 h-4 w-4" />
                          WiFi
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="realTimeDisplay"
                          checked={formData.amenities.realTimeDisplay}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, realTimeDisplay: !!checked },
                            })
                          }
                        />
                        <label htmlFor="realTimeDisplay" className="text-sm font-medium cursor-pointer flex items-center">
                          <Monitor className="mr-2 h-4 w-4" />
                          Pantalla de Información
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Mapa */}
                  {showMap && (
                    <div className="border rounded-lg overflow-hidden" style={{ height: "400px" }}>
                      <InteractiveMap
                        initialCenter={
                          tempCoords || {
                            lat: Number.parseFloat(formData.lat) || -4.0,
                            lng: Number.parseFloat(formData.lng) || -79.2,
                          }
                        }
                        onStopAdd={handleMapStopAdd}
                        existingStops={stops}
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingStop ? "Actualizar" : "Crear"} Parada
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Paradas ({filteredStops.length})</CardTitle>
          <CardDescription>
            Gestiona todas las paradas del sistema de transporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Coordenadas</TableHead>
                <TableHead>Rutas</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStops.map((stop) => (
                <TableRow key={stop.id}>
                  <TableCell className="font-medium">{stop.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    {stop.routeIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {stop.routeIds.slice(0, 3).map((routeId) => {
                          const route = routes.find((r) => r.id === routeId)
                          return route ? (
                            <Badge key={routeId} style={{ backgroundColor: route.color }}>
                              {route.shortName}
                            </Badge>
                          ) : null
                        })}
                        {stop.routeIds.length > 3 && (
                          <Badge variant="outline">+{stop.routeIds.length - 3}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin rutas</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {stop.amenities.shelter && <Home className="h-4 w-4 text-blue-600" title="Refugio" />}
                      {stop.amenities.bench && <span className="text-xs">💺</span>}
                      {stop.amenities.lighting && <Lightbulb className="h-4 w-4 text-yellow-600" title="Iluminación" />}
                      {stop.amenities.wifi && <Wifi className="h-4 w-4 text-green-600" title="WiFi" />}
                      {!Object.values(stop.amenities).some(v => v) && (
                        <span className="text-xs text-gray-400">Sin servicios</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {stop.operator || <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(stop)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(stop.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
