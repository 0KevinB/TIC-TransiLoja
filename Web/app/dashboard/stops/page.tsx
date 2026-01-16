"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
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
import dynamic from "next/dynamic"
// Importaciones optimizadas de iconos (tree-shakeable)
import MapPin from "lucide-react/dist/esm/icons/map-pin"
import Plus from "lucide-react/dist/esm/icons/plus"
import Edit from "lucide-react/dist/esm/icons/edit"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import Search from "lucide-react/dist/esm/icons/search"
import Map from "lucide-react/dist/esm/icons/map"
import Home from "lucide-react/dist/esm/icons/home"
import Lightbulb from "lucide-react/dist/esm/icons/lightbulb"
import Trash from "lucide-react/dist/esm/icons/trash"
import Wifi from "lucide-react/dist/esm/icons/wifi"
import Monitor from "lucide-react/dist/esm/icons/monitor"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Clock from "lucide-react/dist/esm/icons/clock"
import { useToast } from "@/hooks/use-toast"
import { StopSchedules } from "@/components/stops/StopSchedules"

// Lazy load map component for better performance
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((mod) => ({
    default: mod.InteractiveMap
  })),
  {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center bg-gray-100 rounded-md">Cargando mapa...</div>
  }
)

export default function StopsPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7
  const [selectedStopForSchedules, setSelectedStopForSchedules] = useState<Stop | null>(null)
  const [isSchedulesDialogOpen, setIsSchedulesDialogOpen] = useState(false)

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
          routeIds: data.routeIds || data.lines || [],
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
      const stopData: any = {
        name: formData.name,
        lat,
        lng,
        routeIds: formData.routeIds,
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

  const handleEdit = (stop: Stop) => {
    setEditingStop(stop)
    setFormData({
      name: stop.name ?? "",
      lat: stop.lat?.toString() ?? "",
      lng: stop.lng?.toString() ?? "",
      operator: stop.operator ?? "",
      network: stop.network ?? "",
      code: stop.code ?? "",
      routeIds: stop.routeIds ?? [],
      amenities: stop.amenities ?? {
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

  // Filtrar paradas por búsqueda (busca en todas las paradas, no solo en la página actual)
  const filteredStops = stops.filter((stop) => stop.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Calcular paginación
  const totalPages = Math.ceil(filteredStops.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStops = filteredStops.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Search Skeleton */}
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />

        {/* Table Skeleton */}
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Paradas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Gestiona las paradas del sistema de transporte TransiLoja
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openDialog}
              className="bg-sky-600 hover:bg-sky-700"
              aria-label="Crear nueva parada"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
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
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Parque Central"
                      className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      required
                    />
                  </div>

                  {/* ✅ NUEVO: Información Operativa */}
                  <div className="space-y-4 pt-4 border-t border-sky-100">
                    <h3 className="font-semibold text-sky-700">Información Operativa</h3>

                    <div className="space-y-2">
                      <Label htmlFor="code">Código de Parada</Label>
                      <Input
                        id="code"
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ej: L5-01"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="operator">Operador</Label>
                      <Input
                        id="operator"
                        value={formData.operator || ""}
                        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                        placeholder="Ej: SITU"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network">Red de Transporte</Label>
                      <Input
                        id="network"
                        value={formData.network || ""}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        placeholder="Ej: Red Municipal"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      />
                    </div>
                  </div>

                  {/* ✅ NUEVO: Rutas que pasan por esta parada */}
                  <div className="space-y-2 pt-4 border-t border-sky-100">
                    <Label className="text-sky-700">Rutas que pasan por aquí</Label>
                    <div className="border border-sky-200 rounded-md p-3 max-h-40 overflow-y-auto bg-sky-50/30">
                      {routes.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay rutas disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {routes.map((route) => (
                            <div key={route.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`route-${route.id}`}
                                checked={formData.routeIds.includes(route.id)}
                                className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
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
                                <Badge style={{ backgroundColor: route.color, color: route.textColor }}>
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

                {/* Columna Derecha: Amenities */}
                <div className="space-y-4">
                  {/* ✅ NUEVO: Amenities */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sky-700">Servicios y Comodidades</h3>

                    <div className="space-y-3 p-4 bg-sky-50/30 border border-sky-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shelter"
                          checked={formData.amenities.shelter}
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
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
                          <Home className="mr-2 h-4 w-4 text-blue-600" />
                          Refugio / Techo
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bench"
                          checked={formData.amenities.bench}
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
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
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, lighting: !!checked },
                            })
                          }
                        />
                        <label htmlFor="lighting" className="text-sm font-medium cursor-pointer flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4 text-yellow-600" />
                          Iluminación
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bin"
                          checked={formData.amenities.bin}
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, bin: !!checked },
                            })
                          }
                        />
                        <label htmlFor="bin" className="text-sm font-medium cursor-pointer flex items-center">
                          <Trash className="mr-2 h-4 w-4 text-gray-600" />
                          Basurero
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wifi"
                          checked={formData.amenities.wifi}
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, wifi: !!checked },
                            })
                          }
                        />
                        <label htmlFor="wifi" className="text-sm font-medium cursor-pointer flex items-center">
                          <Wifi className="mr-2 h-4 w-4 text-green-600" />
                          WiFi
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="realTimeDisplay"
                          checked={formData.amenities.realTimeDisplay}
                          className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              amenities: { ...formData.amenities, realTimeDisplay: !!checked },
                            })
                          }
                        />
                        <label htmlFor="realTimeDisplay" className="text-sm font-medium cursor-pointer flex items-center">
                          <Monitor className="mr-2 h-4 w-4 text-purple-600" />
                          Pantalla de Información
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordenadas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sky-200">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitud *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.lat || ""}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="-4.0184"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitud *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.lng || ""}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="-79.2112"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                    required
                  />
                </div>
              </div>

              {/* Botón y Mapa - Al final del todo */}
              <div className="space-y-4 pt-4 border-t border-sky-200">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-sky-300 hover:bg-sky-50 hover:border-sky-500"
                  onClick={() => setShowMap(!showMap)}
                  aria-label={showMap ? "Ocultar mapa de selecci\u00f3n" : "Mostrar mapa para seleccionar ubicaci\u00f3n"}
                  aria-expanded={showMap}
                >
                  <Map className="mr-2 h-4 w-4" aria-hidden="true" />
                  {showMap ? "Ocultar Mapa" : "Seleccionar en Mapa"}
                </Button>

                {showMap && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-sky-600" />
                      <h3 className="font-semibold text-sky-700">Seleccionar Ubicación en el Mapa</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Haz clic en el mapa para seleccionar la ubicación de la parada.
                    </p>
                    <div className="h-[500px] border-2 border-sky-300 rounded-lg overflow-hidden shadow-lg">
                      <InteractiveMap
                        mode={{ type: "add-stop" }}
                        stops={[]}
                        routes={[]}
                        initialCenter={
                          tempCoords || {
                            lat: Number.parseFloat(formData.lat) || -4.0,
                            lng: Number.parseFloat(formData.lng) || -79.2,
                          }
                        }
                        onStopAdd={handleMapStopAdd}
                        className="h-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  aria-label="Cancelar y cerrar formulario"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700"
                  aria-label={editingStop ? "Actualizar parada" : "Crear nueva parada"}
                >
                  {editingStop ? "Actualizar" : "Crear"} Parada
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
                <MapPin className="h-8 w-8 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paradas</p>
                <p className="text-2xl font-bold text-gray-900">{stops.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                <Home className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Refugio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stops.filter(s => s.amenities?.shelter).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                <Lightbulb className="h-8 w-8 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Iluminación</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stops.filter(s => s.amenities?.lighting).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Search className="h-5 w-5 text-sky-600" />
            </div>
            Buscar Paradas
          </CardTitle>
          <CardDescription>Encuentra paradas por nombre en todo el sistema</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md border-sky-200 focus:border-sky-500 focus:ring-sky-500"
            />
            {searchTerm && (
              <Badge variant="secondary" className="ml-2">
                {filteredStops.length} resultados
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                Lista de Paradas
              </CardTitle>
              <CardDescription className="mt-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredStops.length)} de {filteredStops.length} paradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-sky-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50/50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Coordenadas</TableHead>
                  <TableHead className="font-semibold">Servicios</TableHead>
                  <TableHead className="font-semibold">Operador</TableHead>
                  <TableHead className="font-semibold">Horarios</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          {searchTerm ? "No se encontraron paradas con ese criterio" : "No hay paradas registradas"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStops.map((stop) => (
                    <TableRow key={stop.id} className="hover:bg-sky-50/30 transition-colors">
                      <TableCell className="font-medium">{stop.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStopForSchedules(stop)
                            setIsSchedulesDialogOpen(true)
                          }}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(stop)}
                            className="hover:bg-sky-50 hover:border-sky-300"
                            aria-label={`Editar parada ${stop.name}`}
                            title={`Editar ${stop.name}`}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar {stop.name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(stop.id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                            aria-label={`Eliminar parada ${stop.name}`}
                            title={`Eliminar ${stop.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Eliminar {stop.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="hover:bg-sky-50"
                  aria-label="P\u00e1gina anterior"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Anterior
                </Button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1

                      return (
                        <div key={page} className="flex gap-1">
                          {showEllipsis && (
                            <span className="px-3 py-1 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-sky-600 hover:bg-sky-700" : "hover:bg-sky-50"}
                            aria-label={`Ir a p\u00e1gina ${page}`}
                            aria-current={currentPage === page ? "page" : undefined}
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="hover:bg-sky-50"
                  aria-label="P\u00e1gina siguiente"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Horarios */}
      <Dialog open={isSchedulesDialogOpen} onOpenChange={setIsSchedulesDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestión de Horarios</DialogTitle>
            <DialogDescription>
              Administra los horarios de llegada y salida de buses en esta parada
            </DialogDescription>
          </DialogHeader>
          {selectedStopForSchedules && (
            <StopSchedules
              stopId={selectedStopForSchedules.id}
              stopName={selectedStopForSchedules.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
