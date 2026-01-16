"use client"

/**
 * Página de Gestión de Paradas - VERSIÓN GTFS
 *
 * CAMBIOS PRINCIPALES:
 * ✅ Usa useStops hook (con validación automática)
 * ✅ Tipos GTFS estándar (GTFSStop)
 * ✅ Límites automáticos en queries
 * ✅ Validación con Zod
 * ✅ Código reducido de 693 → ~400 líneas
 */

import { useState } from "react"
import { useStops } from "@/hooks/useStops"
import { useRoutes } from "@/hooks/useRoutes"
import { GTFSStop, GTFSStopCreate } from "@/lib/types"
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
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Plus, Edit, Trash2, Search, Navigation } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function StopsPage() {
  // ✅ NUEVO: Hooks personalizados (reemplaza 150+ líneas de código)
  const {
    stops,
    loading,
    creating,
    updating,
    deleting,
    createStop,
    updateStop,
    deleteStop,
  } = useStops({ limit: 100 }) // Límite de 100 paradas

  const { routes } = useRoutes({ limit: 50 })

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<GTFSStop | null>(null)

  // ✅ NUEVO: FormData con tipos GTFS
  const [formData, setFormData] = useState<Partial<GTFSStopCreate>>({
    stop_name: "",
    stop_lat: undefined,
    stop_lon: undefined,
    stop_code: "",
    location_type: "0",
    wheelchair_boarding: "0",
    es_punto_conexion: false,
  })

  /**
   * Filtrar paradas por búsqueda
   */
  const filteredStops = stops.filter((stop) =>
    stop.stop_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * Abrir diálogo para crear
   */
  const handleCreate = () => {
    setEditingStop(null)
    setFormData({
      stop_name: "",
      stop_lat: undefined,
      stop_lon: undefined,
      stop_code: "",
      location_type: "0",
      wheelchair_boarding: "0",
      es_punto_conexion: false,
    })
    setIsDialogOpen(true)
  }

  /**
   * Abrir diálogo para editar
   */
  const handleEdit = (stop: GTFSStop) => {
    setEditingStop(stop)
    setFormData({
      stop_name: stop.stop_name,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      stop_code: stop.stop_code,
      stop_desc: stop.stop_desc,
      location_type: stop.location_type,
      wheelchair_boarding: stop.wheelchair_boarding,
      es_punto_conexion: stop.es_punto_conexion,
    })
    setIsDialogOpen(true)
  }

  /**
   * Guardar parada (crear o actualizar)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    if (!formData.stop_name || formData.stop_lat === undefined || formData.stop_lon === undefined) {
      return
    }

    // Generar stop_id si es creación
    const stopData: GTFSStopCreate = {
      stop_id: editingStop?.stop_id || `stop_${Date.now()}`,
      stop_name: formData.stop_name,
      stop_lat: formData.stop_lat,
      stop_lon: formData.stop_lon,
      stop_code: formData.stop_code,
      stop_desc: formData.stop_desc,
      location_type: formData.location_type || "0",
      wheelchair_boarding: formData.wheelchair_boarding || "0",
      es_punto_conexion: formData.es_punto_conexion || false,
    }

    if (editingStop) {
      // Actualizar
      await updateStop(editingStop.stop_id, stopData)
    } else {
      // Crear
      await createStop(stopData)
    }

    // Cerrar diálogo
    setIsDialogOpen(false)
    setEditingStop(null)
  }

  /**
   * Eliminar parada
   */
  const handleDelete = async (stop: GTFSStop) => {
    if (confirm(`¿Estás seguro de eliminar la parada "${stop.stop_name}"?`)) {
      await deleteStop(stop.stop_id)
    }
  }

  /**
   * Obtener badge de tipo de ubicación
   */
  const getLocationTypeBadge = (locationType?: string) => {
    const types: Record<string, string> = {
      "0": "Parada",
      "1": "Estación",
      "2": "Entrada",
      "3": "Nodo",
      "4": "Área de Abordaje",
    }
    return types[locationType || "0"] || "Parada"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paradas</h1>
          <p className="text-muted-foreground">
            Gestión de paradas del sistema de transporte ({filteredStops.length} de {stops.length})
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Parada
            </>
          )}
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Paradas</CardTitle>
          <CardDescription>Filtra paradas por nombre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Paradas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Paradas</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${filteredStops.length} paradas encontradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Accesibilidad</TableHead>
                  <TableHead>Transferencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No se encontraron paradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStops.map((stop) => (
                    <TableRow key={stop.stop_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {stop.stop_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {stop.stop_code ? (
                          <Badge variant="secondary">{stop.stop_code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stop.stop_lat?.toFixed(6)}, {stop.stop_lon?.toFixed(6)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getLocationTypeBadge(stop.location_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        {stop.wheelchair_boarding === "1" ? (
                          <Badge className="bg-green-500">Accesible</Badge>
                        ) : stop.wheelchair_boarding === "2" ? (
                          <Badge variant="destructive">No accesible</Badge>
                        ) : (
                          <Badge variant="secondary">Sin info</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {stop.es_punto_conexion ? (
                          <Badge className="bg-blue-500">Sí</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stop)}
                            disabled={updating}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stop)}
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo Crear/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStop ? "Editar Parada" : "Nueva Parada"}
            </DialogTitle>
            <DialogDescription>
              {editingStop
                ? "Modifica los datos de la parada"
                : "Crea una nueva parada en el sistema GTFS"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="col-span-2">
                <Label htmlFor="stop_name">
                  Nombre de la Parada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stop_name"
                  value={formData.stop_name}
                  onChange={(e) =>
                    setFormData({ ...formData, stop_name: e.target.value })
                  }
                  required
                  placeholder="Ej: Terminal Terrestre"
                />
              </div>

              {/* Código */}
              <div>
                <Label htmlFor="stop_code">Código (opcional)</Label>
                <Input
                  id="stop_code"
                  value={formData.stop_code}
                  onChange={(e) =>
                    setFormData({ ...formData, stop_code: e.target.value })
                  }
                  placeholder="Ej: T001"
                />
              </div>

              {/* Tipo de Ubicación */}
              <div>
                <Label htmlFor="location_type">Tipo de Ubicación</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Parada</SelectItem>
                    <SelectItem value="1">Estación</SelectItem>
                    <SelectItem value="2">Entrada/Salida</SelectItem>
                    <SelectItem value="3">Nodo Genérico</SelectItem>
                    <SelectItem value="4">Área de Abordaje</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Latitud */}
              <div>
                <Label htmlFor="stop_lat">
                  Latitud <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stop_lat"
                  type="number"
                  step="any"
                  value={formData.stop_lat || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, stop_lat: parseFloat(e.target.value) })
                  }
                  required
                  placeholder="-3.9928"
                />
              </div>

              {/* Longitud */}
              <div>
                <Label htmlFor="stop_lon">
                  Longitud <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stop_lon"
                  type="number"
                  step="any"
                  value={formData.stop_lon || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, stop_lon: parseFloat(e.target.value) })
                  }
                  required
                  placeholder="-79.2044"
                />
              </div>

              {/* Accesibilidad */}
              <div>
                <Label htmlFor="wheelchair_boarding">Accesibilidad</Label>
                <Select
                  value={formData.wheelchair_boarding}
                  onValueChange={(value) =>
                    setFormData({ ...formData, wheelchair_boarding: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin información</SelectItem>
                    <SelectItem value="1">Accesible</SelectItem>
                    <SelectItem value="2">No accesible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Punto de Transferencia */}
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="es_punto_conexion"
                  checked={formData.es_punto_conexion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, es_punto_conexion: checked as boolean })
                  }
                />
                <Label htmlFor="es_punto_conexion" className="cursor-pointer">
                  Es un punto de transferencia entre rutas
                </Label>
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <Label htmlFor="stop_desc">Descripción (opcional)</Label>
                <Input
                  id="stop_desc"
                  value={formData.stop_desc}
                  onChange={(e) =>
                    setFormData({ ...formData, stop_desc: e.target.value })
                  }
                  placeholder="Información adicional sobre la parada"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {creating || updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {editingStop ? "Actualizar" : "Crear"} Parada
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
