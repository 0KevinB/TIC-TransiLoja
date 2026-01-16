"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Route, Stop } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import dynamic from "next/dynamic"
import { RouteIcon, Plus, Edit, Trash2, Search, Map, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RouteSchema } from "@/lib/schemas"

// Lazy load map component for better performance
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then(mod => ({ default: mod.InteractiveMap })),
  {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center bg-gray-100 rounded-md">Cargando mapa...</div>
  }
)

const routeColors = [
  "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "FFA500", "800080", "008000", "000080", "800000", "808000",
]

// Helper to convert GTFS route_type number to a readable string
const getRouteTypeString = (type: number): string => {
  const routeTypes: { [key: number]: string } = {
    0: "Tram", 1: "Subway", 2: "Rail", 3: "Bus", 4: "Ferry",
    5: "Cable Car", 6: "Gondola", 7: "Funicular", 11: "Trolleybus", 12: "Monorail"
  };
  return routeTypes[type] || "Unknown";
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [selectedStops, setSelectedStops] = useState<string[]>([])
  const [showMap, setShowMap] = useState(false)

  const initialFormData = {
    route_short_name: "",
    route_long_name: "",
    route_desc: "",
    route_color: "FF0000",
    route_text_color: "FFFFFF",
    route_type: 3 as Route["route_type"],
    agency_id: "",
    // Non-standard fields, should be prefixed
    custom_stop_ids: [] as string[],
  }

  const [formData, setFormData] = useState(initialFormData)
  const { toast } = useToast()
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  useEffect(() => {
    fetchData()
  }, [])

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const fetchData = async () => {
    try {
      const [routesSnapshot, stopsSnapshot] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "stops")),
      ])

      const routesData: Route[] = [];
      routesSnapshot.docs.forEach(doc => {
        try {
          const route = RouteSchema.parse({ ...doc.data(), route_id: doc.id });
          routesData.push(route as Route);
        } catch (error) {
          console.error(`Failed to parse route ${doc.id}:`, error);
        }
      });

      const stopsData: Stop[] = stopsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          stop_id: doc.id,
          stop_name: data.stop_name || data.name,
          stop_lat: data.stop_lat || data.lat,
          stop_lon: data.stop_lon || data.lng,
        } as Stop
      })

      setRoutes(routesData.sort((a, b) => a.route_short_name.localeCompare(b.route_short_name)))
      setStops(stopsData)
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

  const handleStopSelect = (stopId: string) => {
    setSelectedStops((prev) => {
      if (prev.includes(stopId)) {
        return prev.filter((id) => id !== stopId)
      } else {
        return [...prev, stopId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.route_short_name || !formData.route_long_name) {
      toast({ title: "Error", description: "El nombre corto y largo son obligatorios", variant: "destructive" })
      return
    }
    if (selectedStops.length < 2) {
      toast({ title: "Error", description: "Selecciona al menos 2 paradas para la ruta", variant: "destructive" })
      return
    }

    try {
      const routeData = {
        route_short_name: formData.route_short_name,
        route_long_name: formData.route_long_name,
        route_desc: formData.route_desc,
        route_color: formData.route_color,
        route_text_color: formData.route_text_color,
        route_type: formData.route_type,
        agency_id: formData.agency_id || null,
        custom_stop_ids: selectedStops,
        updatedAt: new Date(),
      }

      if (editingRoute) {
        await updateDoc(doc(db, "routes", editingRoute.route_id), routeData)
        toast({ title: "Éxito", description: "Ruta actualizada correctamente" })
      } else {
        await addDoc(collection(db, "routes"), { ...routeData, createdAt: new Date() })
        toast({ title: "Éxito", description: "Ruta creada correctamente" })
      }

      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error saving route:", error)
      toast({ title: "Error", description: "No se pudo guardar la ruta", variant: "destructive" })
    }
  }

  const handleEdit = (route: Route) => {
    setEditingRoute(route)
    setFormData({
      route_short_name: route.route_short_name || "",
      route_long_name: route.route_long_name || "",
      route_desc: route.route_desc || "",
      route_color: route.route_color?.replace("#", "") || "FF0000",
      route_text_color: route.route_text_color?.replace("#", "") || "FFFFFF",
      route_type: route.route_type ?? 3,
      agency_id: route.agency_id || "",
      custom_stop_ids: (route as any).custom_stop_ids || [],
    })
    setSelectedStops((route as any).custom_stop_ids || [])
    setIsDialogOpen(true)
  }

  const handleDelete = async (routeId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta ruta?")) return

    try {
      await deleteDoc(doc(db, "routes", routeId))
      toast({ title: "Éxito", description: "Ruta eliminada correctamente" })
      fetchData()
    } catch (error) {
      console.error("Error deleting route:", error)
      toast({ title: "Error", description: "No se pudo eliminar la ruta", variant: "destructive" })
    }
  }

  const openDialog = () => {
    setEditingRoute(null)
    setFormData(initialFormData)
    setSelectedStops([])
    setShowMap(false)
    setIsDialogOpen(true)
  }

  const filteredRoutes = routes.filter(
    (route) =>
      route.route_long_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.route_short_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calcular paginación
  const totalPages = Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRoutes = filteredRoutes.slice(startIndex, endIndex)

  // Filtrar rutas para el mapa
  const routesForMap = selectedRouteFilter
    ? routes.filter((route) => route.route_id === selectedRouteFilter)
    : routes

  // Filtrar paradas para el mapa (solo mostrar paradas de la ruta seleccionada)
  const stopsForMap = selectedRouteFilter
    ? stops.filter((stop) => {
        const selectedRoute = routes.find((r) => r.route_id === selectedRouteFilter)
        return selectedRoute && (selectedRoute as any).custom_stop_ids?.includes(stop.stop_id)
      })
    : stops

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Rutas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Gestiona las rutas del sistema de transporte TransiLoja
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="mr-2 h-4 w-4" /> Nueva Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="grid max-w-6xl grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingRoute ? "Editar Ruta" : "Nueva Ruta"}</DialogTitle>
              <DialogDescription>
                {editingRoute ? "Modifica los datos de la ruta" : "Añade una nueva ruta al sistema"}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto p-6">
              <form id="route-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sky-700">Información Básica</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="route_short_name">Nombre corto *</Label>
                      <Input
                        id="route_short_name"
                        value={formData.route_short_name}
                        onChange={(e) => setFormData({ ...formData, route_short_name: e.target.value })}
                        placeholder="L1, 101"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="route_long_name">Nombre completo *</Label>
                      <Input
                        id="route_long_name"
                        value={formData.route_long_name}
                        onChange={(e) => setFormData({ ...formData, route_long_name: e.target.value })}
                        placeholder="Línea 1 - Centro - Terminal"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="route_desc">Descripción</Label>
                    <Textarea
                      id="route_desc"
                      value={formData.route_desc}
                      onChange={(e) => setFormData({ ...formData, route_desc: e.target.value })}
                      placeholder="Descripción de la ruta..."
                      rows={3}
                      className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="route_type">Tipo de transporte</Label>
                      <Select
                        value={String(formData.route_type)}
                        onValueChange={(value) => setFormData({ ...formData, route_type: Number(value) as Route["route_type"] })}
                      >
                        <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Bus</SelectItem>
                          <SelectItem value="0">Tram</SelectItem>
                          <SelectItem value="1">Subway</SelectItem>
                          <SelectItem value="2">Rail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agency_id">ID de Operador (opcional)</Label>
                      <Input
                        id="agency_id"
                        value={formData.agency_id}
                        onChange={(e) => setFormData({ ...formData, agency_id: e.target.value })}
                        placeholder="Ej: TRAN001"
                        className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Colores */}
                <div className="space-y-4 pt-4 border-t border-sky-200">
                  <h3 className="font-semibold text-sky-700">Colores de la Ruta</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="route_color">Color de la ruta</Label>
                      <div className="flex gap-2">
                        <Input
                          id="route_color"
                          type="color"
                          value={`#${formData.route_color}`}
                          onChange={(e) => setFormData({ ...formData, route_color: e.target.value.replace("#", "") })}
                          className="w-16 h-10 p-1 border-sky-200 hover:border-sky-400"
                        />
                        <div className="flex flex-wrap gap-1">
                          {routeColors.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded border-2 border-sky-300 hover:border-sky-500 transition-colors"
                              style={{ backgroundColor: `#${color}` }}
                              onClick={() => setFormData({ ...formData, route_color: color })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="route_text_color">Color del texto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="route_text_color"
                          type="color"
                          value={`#${formData.route_text_color}`}
                          onChange={(e) => setFormData({ ...formData, route_text_color: e.target.value.replace("#", "") })}
                          className="w-16 h-10 p-1 border-sky-200 hover:border-sky-400"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="w-6 h-6 rounded border-2 border-sky-300 bg-white hover:border-sky-500 transition-colors"
                            onClick={() => setFormData({ ...formData, route_text_color: "FFFFFF" })}
                          />
                          <button
                            type="button"
                            className="w-6 h-6 rounded border-2 border-sky-300 bg-black hover:border-sky-500 transition-colors"
                            onClick={() => setFormData({ ...formData, route_text_color: "000000" })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="p-3 border border-sky-200 rounded-md bg-sky-50/30">
                      <Badge style={{ backgroundColor: `#${formData.route_color}`, color: `#${formData.route_text_color}`, border: "none" }}>
                        {formData.route_short_name || "L1"}
                      </Badge>
                      <span className="ml-2 text-sm">{formData.route_long_name || "Nombre de la ruta"}</span>
                    </div>
                  </div>
                </div>

                {/* Paradas Seleccionadas */}
                <div className="space-y-4 pt-4 border-t border-sky-200">
                  <h3 className="font-semibold text-sky-700">Paradas de la Ruta</h3>

                  <div className="space-y-2">
                    <Label>Paradas seleccionadas ({selectedStops.length})</Label>
                    <div className="max-h-32 overflow-y-auto border border-sky-200 rounded-md p-3 bg-sky-50/30">
                      {selectedStops.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay paradas seleccionadas. Usa el mapa abajo para seleccionar.</p>
                      ) : (
                        <div className="space-y-1">
                          {selectedStops.map((stopId, index) => (
                            <div key={stopId} className="text-sm flex items-center gap-2">
                              <span className="font-semibold text-sky-600">{index + 1}.</span>
                              <span>{stops.find((s) => s.stop_id === stopId)?.stop_name || "Parada no encontrada"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón y Mapa - Al final */}
                <div className="space-y-4 pt-4 border-t border-sky-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full border-sky-300 hover:bg-sky-50 hover:border-sky-500"
                  >
                    <Map className="mr-2 h-4 w-4" />
                    {showMap ? "Ocultar Mapa" : "Seleccionar Paradas en Mapa"}
                  </Button>

                  {showMap && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-sky-600" />
                        <h3 className="font-semibold text-sky-700">Seleccionar Paradas para la Ruta</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Haz clic en las paradas del mapa para añadirlas a la ruta.
                        <span className="block mt-1 text-sky-600 font-medium">
                          ⚠️ El orden de selección importa - define la secuencia de la ruta
                        </span>
                      </p>
                      <div className="h-[500px] border-2 border-sky-300 rounded-lg overflow-hidden shadow-lg">
                        <InteractiveMap
                          mode={{ type: "create-route" }}
                          stops={stops}
                          routes={[]}
                          onRouteStopSelect={handleStopSelect}
                          selectedStops={selectedStops}
                          className="h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            <DialogFooter className="border-t p-6">
              <Button type="submit" form="route-form" className="bg-sky-500 hover:bg-sky-600">
                {editingRoute ? "Actualizar" : "Crear"} Ruta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              <CardTitle>Vista del Mapa</CardTitle>
            </div>
            <Select onValueChange={(value) => setSelectedRouteFilter(value === "all" ? null : value)} value={selectedRouteFilter || "all"}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Filtrar por ruta..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las rutas</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.route_id} value={route.route_id}>{route.route_long_name} ({route.route_short_name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription className="pt-2">
            {selectedRouteFilter ? `Mostrando la ruta seleccionada y sus paradas.` : "Visualización geográfica de todas las rutas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap mode={{ type: "view-only" }} stops={stopsForMap} routes={routesForMap} className="h-96" />
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <RouteIcon className="h-5 w-5 text-sky-600" />
                </div>
                Rutas Registradas
              </CardTitle>
              <CardDescription className="mt-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredRoutes.length)} de {filteredRoutes.length} rutas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar rutas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
            />
            {searchTerm && (
              <Badge variant="secondary" className="ml-2">
                {filteredRoutes.length} resultados
              </Badge>
            )}
          </div>
          <div className="rounded-md border border-sky-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50/50">
                  <TableHead className="font-semibold">Ruta</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Paradas</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <RouteIcon className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          {searchTerm ? "No se encontraron rutas con ese criterio" : "No hay rutas registradas"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRoutes.map((route) => (
                    <TableRow key={route.route_id} className="hover:bg-sky-50/30 transition-colors">
                      <TableCell>
                        <Badge style={{ backgroundColor: `#${route.route_color}`, color: `#${route.route_text_color}`, border: "none" }}>
                          {route.route_short_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{route.route_long_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{((route as any).custom_stop_ids || []).length} paradas</Badge>
                      </TableCell>
                      <TableCell>{getRouteTypeString(route.route_type)}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{route.route_desc || "Sin descripción"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(route)} className="hover:bg-sky-50 hover:border-sky-300">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(route.route_id)} className="hover:bg-red-50 hover:border-red-300">
                            <Trash2 className="h-4 w-4 text-red-600" />
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
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                            className={currentPage === page ? "bg-sky-500 hover:bg-sky-600" : "hover:bg-sky-50"}
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
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
