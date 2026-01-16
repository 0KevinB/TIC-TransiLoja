"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  limit, 
  startAfter, 
  orderBy, 
  where, 
  DocumentSnapshot,
  QueryConstraint
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Bus } from "@/lib/types"
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
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BusIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Wifi, 
  Accessibility, 
  Snowflake, 
  Navigation,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { DataImport } from "@/components/dashboard/data-import"

// Constantes para paginación
const ITEMS_PER_PAGE = 7
const MAX_ITEMS_PER_PAGE = 50

// Modelos de buses reales disponibles en Ecuador
const BUS_MODELS = [
  "Mercedes-Benz Citaro",
  "Mercedes-Benz Sprinter",
  "Volvo 7900 Electric",
  "Volvo B290R",
  "Scania Citywide LE",
  "Scania K320IB",
  "MAN Lion's City",
  "MAN 18.280 HOCL",
  "Iveco Urbanway",
  "Iveco Daily Minibus",
  "BYD K9 Electric",
  "BYD K7M",
  "Yutong E12",
  "Yutong ZK6107HA",
  "King Long XMQ6127",
  "Hino AK Series",
  "Chevrolet NPR",
  "Isuzu NPR",
] as const

interface BusFormData {
  plateNumber: string
  model: string
  year: number
  capacity: number
  status: "active" | "maintenance" | "retired"
  // ✅ GTFS: routeId y conductorId se asignan en Trip, no en Bus
  features: {
    airConditioning: boolean
    wheelchair: boolean
    wifi: boolean
    gps: boolean
  }
}

interface FilterState {
  search: string
  status: string
  model: string
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
  lastDoc: DocumentSnapshot | null
  firstDoc: DocumentSnapshot | null
}

export default function BusesPage() {
  // Estados principales
  const [buses, setBuses] = useState<Bus[]>([])

  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Estados de formulario y modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const initialFormData: BusFormData = {
    plateNumber: "",
    model: "",
    year: new Date().getFullYear(),
    capacity: 40,
    status: "active",
    features: {
      airConditioning: false,
      wheelchair: false,
      wifi: false,
      gps: true,
    },
  }
  
  const [formData, setFormData] = useState<BusFormData>(initialFormData)
  
  // Estados de filtros y paginación
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    model: "all"
  })
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
    lastDoc: null,
    firstDoc: null
  })

  // Validaciones del formulario
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BusFormData, string>>>({})

  // Efecto inicial
  useEffect(() => {
    loadInitialData()
  }, [])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }, [filters])

  // Función para cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true)

      // ✅ GTFS: Solo cargamos buses, la asignación se hace en viajes
      await loadBuses()

    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.error("Error al cargar los datos iniciales")
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar buses con paginación cursor-based de Firestore
  const loadBuses = async (direction: 'initial' | 'next' | 'prev' = 'initial') => {
    try {
      setLoading(true)

      const constraints: QueryConstraint[] = [
        orderBy("plateNumber", "asc"),
        limit(MAX_ITEMS_PER_PAGE) // Cargar máximo 50 buses por página
      ]

      // Cursor-based pagination
      if (direction === 'next' && pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc))
      }
      // Note: For 'prev' we would need to reverse order and use endBefore
      // For simplicity, we'll implement "Load More" instead of previous page

      const busesQuery = query(collection(db, "buses"), ...constraints)
      const busesSnapshot = await getDocs(busesQuery)

      if (busesSnapshot.empty) {
        toast.info("No hay más buses para cargar")
        setLoading(false)
        return
      }

      // Procesar buses
      const busesData: Bus[] = busesSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          plateNumber: data.plateNumber || "",
          model: data.model || "",
          year: data.year || new Date().getFullYear(),
          capacity: data.capacity || 40,
          status: data.status || "active",
          features: {
            airConditioning: data.features?.airConditioning || false,
            wheelchair: data.features?.wheelchair || false,
            wifi: data.features?.wifi || false,
            gps: data.features?.gps || true,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      })

      // Update buses based on direction
      if (direction === 'initial') {
        setBuses(busesData)
      } else if (direction === 'next') {
        setBuses(prev => [...prev, ...busesData])
      }

      // Update pagination cursors
      setPagination(prev => ({
        ...prev,
        lastDoc: busesSnapshot.docs[busesSnapshot.docs.length - 1],
        firstDoc: busesSnapshot.docs[0],
        totalItems: prev.totalItems + busesData.length
      }))

    } catch (error) {
      console.error("Error loading buses:", error)
      toast.error("Error al cargar los buses")
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar más buses
  const loadMoreBuses = () => {
    loadBuses('next')
  }

  // Validar formulario
  const validateForm = async (): Promise<boolean> => {
    const errors: Partial<Record<keyof BusFormData, string>> = {}

    if (!formData.plateNumber.trim()) {
      errors.plateNumber = "La placa es obligatoria"
    } else if (!/^[A-Z]{3}-\d{3,4}$/.test(formData.plateNumber.toUpperCase())) {
      errors.plateNumber = "Formato de placa inválido (ej: ABC-123)"
    }

    if (!formData.model.trim()) {
      errors.model = "El modelo es obligatorio"
    }

    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      errors.year = `El año debe estar entre 1990 y ${new Date().getFullYear() + 1}`
    }

    if (formData.capacity < 10 || formData.capacity > 100) {
      errors.capacity = "La capacidad debe estar entre 10 y 100 pasajeros"
    }

    // ✅ GTFS: Sin validaciones de conductor o ruta (se hacen en Trip)

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(await validateForm())) {
      toast.error("Por favor corrige los errores en el formulario")
      return
    }

    const isEditing = !!editingBus
    const loadingState = isEditing ? setUpdating : setCreating
    
    try {
      loadingState(true)

      // Verificar placa duplicada
      if (!isEditing || formData.plateNumber !== editingBus.plateNumber) {
        const duplicateQuery = query(
          collection(db, "buses"), 
          where("plateNumber", "==", formData.plateNumber.toUpperCase())
        )
        const duplicateSnapshot = await getDocs(duplicateQuery)
        
        if (!duplicateSnapshot.empty) {
          toast.error("Ya existe un bus con esta placa")
          return
        }
      }

      const busData = {
        plateNumber: formData.plateNumber.toUpperCase(),
        model: formData.model,
        year: formData.year,
        capacity: formData.capacity,
        status: formData.status,
        // ✅ GTFS: Sin asignación fija de ruta o conductor
        features: formData.features,
        updatedAt: new Date(),
      }

      if (isEditing) {
        await updateDoc(doc(db, "buses", editingBus.id), busData)
        toast.success("Bus actualizado correctamente")
      } else {
        const newBusId = `BUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await setDoc(doc(db, "buses", newBusId), {
          ...busData,
          createdAt: new Date(),
        })
        toast.success("Bus creado correctamente")
      }

      closeDialog()
      await loadBuses()
      
    } catch (error) {
      console.error("Error saving bus:", error)
      toast.error(isEditing ? "Error al actualizar el bus" : "Error al crear el bus")
    } finally {
      loadingState(false)
    }
  }

  // Manejar edición
  const handleEdit = (bus: Bus) => {
    setEditingBus(bus)
    setFormData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      year: bus.year,
      capacity: bus.capacity,
      status: bus.status,
      features: bus.features,
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Manejar eliminación
  const handleDelete = async (bus: Bus) => {
    if (!confirm(`¿Estás seguro de eliminar el bus ${bus.plateNumber}?`)) {
      return
    }

    try {
      setDeleting(bus.id)
      await deleteDoc(doc(db, "buses", bus.id))
      toast.success("Bus eliminado correctamente")
      await loadBuses()
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast.error("Error al eliminar el bus")
    } finally {
      setDeleting(null)
    }
  }

  // Cerrar modal y limpiar formulario
  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingBus(null)
    setFormData(initialFormData)
    setFormErrors({})
  }

  // Manejar cambios en filtros
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1, lastDoc: null }))
  }, [])

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  // Funciones helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mantenimiento</Badge>
      case "retired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Retirado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Filtrar buses en memoria
  const filteredBuses = useMemo(() => {
    let result = [...buses]

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(bus =>
        bus.plateNumber.toLowerCase().includes(searchLower) ||
        bus.model.toLowerCase().includes(searchLower)
      )
    }

    // Filtro de estado
    if (filters.status && filters.status !== "all") {
      result = result.filter(bus => bus.status === filters.status)
    }

    // Filtro de modelo
    if (filters.model && filters.model !== "all") {
      result = result.filter(bus => bus.model === filters.model)
    }

    return result
  }, [buses, filters])

  // Calcular paginación en memoria
  const totalPages = Math.ceil(filteredBuses.length / ITEMS_PER_PAGE)
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedBuses = filteredBuses.slice(startIndex, endIndex)

  // Estadísticas basadas en buses filtrados
  const stats = useMemo(() => {
    return {
      active: buses.filter(b => b.status === "active").length,
      maintenance: buses.filter(b => b.status === "maintenance").length,
      retired: buses.filter(b => b.status === "retired").length,
      totalCapacity: buses.reduce((total, bus) => total + bus.capacity, 0),
    }
  }, [buses])

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Flota de Buses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Gestiona los vehículos del sistema de transporte TransiLoja
          </p>
        </div>

        <div className="flex gap-2">
          <DataImport tipoEntidad="buses" onImportComplete={loadBuses} />
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Bus
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <BusIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                <BusIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                <BusIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retirados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.retired}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg">
                <BusIcon className="h-8 w-8 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Search className="h-5 w-5 text-sky-600" />
            </div>
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Placa o modelo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="retired">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-filter">Modelo</Label>
              <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)}>
                <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue placeholder="Todos los modelos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los modelos</SelectItem>
                  {BUS_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredBuses.length > 0 && filters.search && (
            <Badge variant="secondary" className="mt-4">
              {filteredBuses.length} resultados encontrados
            </Badge>
          )}

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ search: "", status: "all", model: "all" })
                setPagination(prev => ({ ...prev, currentPage: 1 }))
              }}
              className="hover:bg-sky-50"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Buses */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <BusIcon className="h-5 w-5 text-sky-600" />
                </div>
                Lista de Buses
              </CardTitle>
              <CardDescription className="mt-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBuses.length)} de {filteredBuses.length} buses
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBuses}
              disabled={loading}
              className="hover:bg-sky-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {paginatedBuses.length === 0 ? (
            <div className="text-center py-12">
              <BusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay buses</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f) 
                  ? "No se encontraron buses con los filtros aplicados" 
                  : "Comienza añadiendo un nuevo bus a la flota"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-sky-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-sky-50/50">
                      <TableHead className="font-semibold">Placa</TableHead>
                      <TableHead className="font-semibold">Modelo</TableHead>
                      <TableHead className="font-semibold">Año</TableHead>
                      <TableHead className="font-semibold">Capacidad</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Características</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBuses.map((bus) => (
                      <TableRow key={bus.id} className="hover:bg-sky-50/30 transition-colors">
                        <TableCell className="font-medium font-mono">
                          {bus.plateNumber}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={bus.model}>
                          {bus.model}
                        </TableCell>
                        <TableCell>{bus.year}</TableCell>
                        <TableCell>{bus.capacity} pax</TableCell>
                        <TableCell>{getStatusBadge(bus.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {bus.features.airConditioning && (
                              <Snowflake className="h-4 w-4 text-blue-500" title="Aire acondicionado" />
                            )}
                            {bus.features.wheelchair && (
                              <Accessibility className="h-4 w-4 text-green-500" title="Accesible" />
                            )}
                            {bus.features.wifi && (
                              <Wifi className="h-4 w-4 text-purple-500" title="WiFi" />
                            )}
                            {bus.features.gps && (
                              <Navigation className="h-4 w-4 text-orange-500" title="GPS" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(bus)}
                              disabled={updating}
                              className="hover:bg-sky-50 hover:border-sky-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(bus)}
                              disabled={deleting === bus.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                            >
                              {deleting === bus.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación en memoria (para buses ya cargados) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Página {pagination.currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                      disabled={pagination.currentPage === 1}
                      className="hover:bg-sky-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || page === totalPages || Math.abs(page - pagination.currentPage) <= 1
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          const showEllipsis = prevPage && page - prevPage > 1

                          return (
                            <div key={page} className="flex gap-1">
                              {showEllipsis && (
                                <span className="px-3 py-1 text-gray-400">...</span>
                              )}
                              <Button
                                variant={pagination.currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                                className={pagination.currentPage === page ? "bg-sky-500 hover:bg-sky-600" : "hover:bg-sky-50"}
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
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                      disabled={pagination.currentPage === totalPages}
                      className="hover:bg-sky-50"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Botón para cargar más buses desde Firestore */}
              {buses.length >= MAX_ITEMS_PER_PAGE && buses.length % MAX_ITEMS_PER_PAGE === 0 && (
                <div className="flex justify-center mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={loadMoreBuses}
                    disabled={loading}
                    className="hover:bg-sky-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Cargar más buses
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición/Creación */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBus ? "Editar Bus" : "Nuevo Bus"}</DialogTitle>
            <DialogDescription>
              {editingBus ? "Modifica los datos del bus" : "Añade un nuevo bus a la flota"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">
                  Placa *
                  {formErrors.plateNumber && (
                    <span className="text-red-500 text-xs ml-2">{formErrors.plateNumber}</span>
                  )}
                </Label>
                <Input
                  id="plateNumber"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                  placeholder="ABC-123"
                  className={formErrors.plateNumber ? "border-red-500" : "border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"}
                  maxLength={7}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">
                  Modelo *
                  {formErrors.model && (
                    <span className="text-red-500 text-xs ml-2">{formErrors.model}</span>
                  )}
                </Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger className={formErrors.model ? "border-red-500" : "border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"}>
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUS_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Especificaciones */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">
                  Año *
                  {formErrors.year && (
                    <span className="text-red-500 text-xs ml-2">{formErrors.year}</span>
                  )}
                </Label>
                <Input
                  id="year"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className={formErrors.year ? "border-red-500" : "border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacidad *
                  {formErrors.capacity && (
                    <span className="text-red-500 text-xs ml-2">{formErrors.capacity}</span>
                  )}
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="10"
                  max="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 40 })}
                  className={formErrors.capacity ? "border-red-500" : "border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="retired">Retirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Características */}
            <div className="space-y-3">
              <Label>Características del Vehículo</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Aire acondicionado</span>
                  </div>
                  <Switch
                    checked={formData.features.airConditioning}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        features: { ...formData.features, airConditioning: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Accessibility className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Acceso para sillas de ruedas</span>
                  </div>
                  <Switch
                    checked={formData.features.wheelchair}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        features: { ...formData.features, wheelchair: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">WiFi</span>
                  </div>
                  <Switch
                    checked={formData.features.wifi}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        features: { ...formData.features, wifi: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">GPS</span>
                  </div>
                  <Switch
                    checked={formData.features.gps}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        features: { ...formData.features, gps: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-sky-500 hover:bg-sky-600"
                disabled={creating || updating}
              >
                {(creating || updating) && (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingBus ? "Actualizar" : "Crear"} Bus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}