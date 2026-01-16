"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Alert, Route, Stop } from "@/lib/types"
import { sendAlertNotification } from "@/lib/pushNotifications"
import { useAuth } from "@/lib/auth-context"
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
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  RouteIcon,
  MapPin,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const alertTypes = [
  { value: "info", label: "Información", icon: Info, color: "bg-blue-100 text-blue-800" },
  { value: "warning", label: "Advertencia", icon: AlertCircle, color: "bg-yellow-100 text-yellow-800" },
  { value: "error", label: "Error", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "success", label: "Éxito", icon: CheckCircle, color: "bg-green-100 text-green-800" },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "info" as "info" | "warning" | "error" | "success",
    affectedRoutes: [] as string[],
    affectedStops: [] as string[],
    alternativeRoute: "__none__",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [alertsSnapshot, routesSnapshot, stopsSnapshot] = await Promise.all([
        getDocs(collection(db, "alerts")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "stops")),
      ])

      // Fetch alerts
      const alertsData: Alert[] = []
      alertsSnapshot.forEach((doc) => {
        const data = doc.data()

        // Manejar formato antiguo (strings separados por comas) y nuevo (arrays de IDs)
        let affectedRoutes: string[] = []
        let affectedStops: string[] = []

        if (Array.isArray(data.affectedRoutes)) {
          affectedRoutes = data.affectedRoutes
        } else if (typeof data.affectedRoutes === "string") {
          // Formato antiguo: convertir string a array
          affectedRoutes = data.affectedRoutes.split(",").map((s: string) => s.trim()).filter((s: string) => s)
        }

        if (Array.isArray(data.affectedStops)) {
          affectedStops = data.affectedStops
        } else if (typeof data.affectedStops === "string") {
          // Formato antiguo: convertir string a array
          affectedStops = data.affectedStops.split(",").map((s: string) => s.trim()).filter((s: string) => s)
        }

        alertsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          type: data.type,
          affectedRoutes,
          affectedStops,
          alternativeRoute: data.alternativeRoute,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
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

      setAlerts(alertsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
      setRoutes(routesData)
      setStops(stopsData.sort((a, b) => a.name.localeCompare(b.name)))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "El título y descripción son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const alertData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        affectedRoutes: formData.affectedRoutes,
        affectedStops: formData.affectedStops,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: formData.isActive,
        createdAt: editingAlert ? editingAlert.createdAt : new Date(),
      }

      // Only add alternativeRoute if it has a valid value
      if (formData.alternativeRoute && formData.alternativeRoute !== "__none__") {
        alertData.alternativeRoute = formData.alternativeRoute
      }

      let alertId: string

      if (editingAlert) {
        await updateDoc(doc(db, "alerts", editingAlert.id), alertData)
        alertId = editingAlert.id
        toast({
          title: "Éxito",
          description: "Alerta actualizada correctamente",
        })
      } else {
        const docRef = await addDoc(collection(db, "alerts"), alertData)
        alertId = docRef.id
        toast({
          title: "Éxito",
          description: "Alerta creada correctamente",
        })

        // ✅ Enviar notificaciones push solo para alertas nuevas y activas
        if (formData.isActive) {
          toast({
            title: "Enviando notificaciones...",
            description: "Enviando notificaciones push a los usuarios",
          })

          try {
            const notificationResult = await sendAlertNotification(
              {
                id: alertId,
                title: formData.title,
                description: formData.description,
                type: formData.type,
                affectedRoutes: formData.affectedRoutes,
                affectedStops: formData.affectedStops,
              },
              user?.id || "system"
            )

            if (notificationResult.success) {
              toast({
                title: "Notificaciones enviadas",
                description: `Se enviaron ${notificationResult.count} notificaciones correctamente`,
              })
            } else {
              toast({
                title: "Error parcial",
                description: `Se enviaron ${notificationResult.count} notificaciones, pero hubo ${notificationResult.errors.length} errores`,
                variant: "destructive",
              })
            }
          } catch (notificationError) {
            console.error("Error enviando notificaciones:", notificationError)
            toast({
              title: "Error en notificaciones",
              description: "La alerta se creó, pero no se pudieron enviar las notificaciones",
              variant: "destructive",
            })
          }
        }
      }

      setIsDialogOpen(false)
      setEditingAlert(null)
      setFormData({
        title: "",
        description: "",
        type: "info",
        affectedRoutes: [],
        affectedStops: [],
        alternativeRoute: "__none__",
        startDate: "",
        endDate: "",
        isActive: true,
      })
      fetchData()
    } catch (error) {
      console.error("Error saving alert:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la alerta",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      title: alert.title,
      description: alert.description,
      type: alert.type,
      affectedRoutes: alert.affectedRoutes,
      affectedStops: alert.affectedStops,
      alternativeRoute: alert.alternativeRoute || "__none__",
      startDate: alert.startDate.toISOString().slice(0, 16),
      endDate: alert.endDate.toISOString().slice(0, 16),
      isActive: alert.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta alerta?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "alerts", alertId))
      toast({
        title: "Éxito",
        description: "Alerta eliminada correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta",
        variant: "destructive",
      })
    }
  }

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        isActive: !currentStatus,
      })
      toast({
        title: "Éxito",
        description: `Alerta ${!currentStatus ? "activada" : "desactivada"} correctamente`,
      })
      fetchData()
    } catch (error) {
      console.error("Error updating alert status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la alerta",
        variant: "destructive",
      })
    }
  }

  const getAlertTypeInfo = (type: string) => {
    return alertTypes.find((t) => t.value === type) || alertTypes[0]
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route
  }

  const getStopInfo = (stopId: string) => {
    const stop = stops.find((s) => s.id === stopId)
    return stop
  }

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600">Gestiona las alertas del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAlert ? "Editar Alerta" : "Nueva Alerta"}</DialogTitle>
              <DialogDescription>
                {editingAlert ? "Modifica los datos de la alerta" : "Crea una nueva alerta para el sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título de la alerta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de alerta</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la alerta..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Rutas afectadas */}
                <div className="space-y-2">
                  <Label>Rutas afectadas</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {routes.length > 0 ? (
                      routes.map((route) => (
                        <div key={route.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`route-${route.id}`}
                            checked={formData.affectedRoutes.includes(route.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  affectedRoutes: [...formData.affectedRoutes, route.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  affectedRoutes: formData.affectedRoutes.filter((id) => id !== route.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`route-${route.id}`} className="cursor-pointer flex items-center gap-2">
                            <Badge style={{ backgroundColor: route.color, color: route.textColor }}>
                              {route.shortName}
                            </Badge>
                            <span className="text-sm">{route.name}</span>
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay rutas disponibles</p>
                    )}
                  </div>
                  {formData.affectedRoutes.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {formData.affectedRoutes.length} ruta(s) seleccionada(s)
                    </p>
                  )}
                </div>

                {/* Paradas afectadas */}
                <div className="space-y-2">
                  <Label>Paradas afectadas</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {stops.length > 0 ? (
                      stops.map((stop) => (
                        <div key={stop.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`stop-${stop.id}`}
                            checked={formData.affectedStops.includes(stop.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  affectedStops: [...formData.affectedStops, stop.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  affectedStops: formData.affectedStops.filter((id) => id !== stop.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`stop-${stop.id}`} className="cursor-pointer flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">{stop.name}</span>
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay paradas disponibles</p>
                    )}
                  </div>
                  {formData.affectedStops.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {formData.affectedStops.length} parada(s) seleccionada(s)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternativeRoute">Ruta alternativa (opcional)</Label>
                <Select
                  value={formData.alternativeRoute}
                  onValueChange={(value) => setFormData({ ...formData, alternativeRoute: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta alternativa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin ruta alternativa</SelectItem>
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
                {formData.alternativeRoute && (
                  <p className="text-xs text-gray-500">
                    Esta ruta se sugerirá como alternativa a los usuarios afectados
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Alerta activa</Label>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingAlert ? "Actualizar" : "Crear"} Alerta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas del Sistema ({filteredAlerts.length})
          </CardTitle>
          <CardDescription>Administra las alertas y notificaciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Rutas Afectadas</TableHead>
                  <TableHead>Paradas Afectadas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const typeInfo = getAlertTypeInfo(alert.type)
                  const Icon = typeInfo.icon

                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          <Icon className="mr-1 h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{alert.description}</TableCell>
                      <TableCell>
                        {alert.affectedRoutes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedRoutes.slice(0, 3).map((routeId) => {
                              const route = getRouteInfo(routeId)
                              return route ? (
                                <Badge
                                  key={routeId}
                                  style={{ backgroundColor: route.color, color: route.textColor }}
                                >
                                  {route.shortName}
                                </Badge>
                              ) : null
                            })}
                            {alert.affectedRoutes.length > 3 && (
                              <Badge variant="secondary">+{alert.affectedRoutes.length - 3}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Todas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.affectedStops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedStops.slice(0, 2).map((stopId) => {
                              const stop = getStopInfo(stopId)
                              return stop ? (
                                <Badge key={stopId} variant="outline" className="text-xs">
                                  {stop.name}
                                </Badge>
                              ) : null
                            })}
                            {alert.affectedStops.length > 2 && (
                              <Badge variant="secondary">+{alert.affectedStops.length - 2}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Todas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => toggleAlertStatus(alert.id, alert.isActive)}
                          />
                          <span className="text-sm">{alert.isActive ? "Activa" : "Inactiva"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(alert)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="text-red-600 hover:text-red-700"
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

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron alertas con ese término" : "Comienza creando una nueva alerta"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
