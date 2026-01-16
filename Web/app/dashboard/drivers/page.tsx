"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  Download,
  Star,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { Conductor } from "@/lib/types"
import { DataImport } from "@/components/dashboard/data-import"

const ITEMS_PER_PAGE = 7

export default function DriversPage() {
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [conductorEditando, setConductorEditando] = useState<Conductor | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroLicencia, setFiltroLicencia] = useState<string>("todos")

  // Formulario
  const [formData, setFormData] = useState<Partial<Conductor>>({
    cedula: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    direccion: "",
    tipo_licencia: "B",
    estado: "activo",
    experiencia_anos: 0,
    observaciones: ""
  })

  useEffect(() => {
    cargarConductores()
  }, [])

  // Resetear a página 1 cuando cambian los filtros o búsqueda
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado, filtroLicencia, busqueda])

  const cargarConductores = async () => {
    try {
      setCargando(true)

      const q = query(
        collection(db, "conductores"),
        orderBy("createdAt", "desc")
      )

      const conductoresSnap = await getDocs(q)

      const conductoresData = conductoresSnap.docs.map(doc => ({
        id_conductor: doc.id,
        ...doc.data(),
        fecha_nacimiento: doc.data().fecha_nacimiento?.toDate() || new Date(),
        fecha_licencia: doc.data().fecha_licencia?.toDate() || new Date(),
        fecha_vencimiento_licencia: doc.data().fecha_vencimiento_licencia?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Conductor[]

      setConductores(conductoresData)

    } catch (error) {
      console.error("Error cargando conductores:", error)
      toast.error("Error al cargar los conductores")
    } finally {
      setCargando(false)
    }
  }

  const abrirModal = (conductor?: Conductor) => {
    if (conductor) {
      setConductorEditando(conductor)
      setFormData({
        cedula: conductor.cedula,
        nombre: conductor.nombre,
        apellidos: conductor.apellidos,
        telefono: conductor.telefono,
        email: conductor.email,
        direccion: conductor.direccion,
        tipo_licencia: conductor.tipo_licencia,
        estado: conductor.estado,
        experiencia_anos: conductor.experiencia_anos,
        observaciones: conductor.observaciones
      })
    } else {
      setConductorEditando(null)
      setFormData({
        cedula: "",
        nombre: "",
        apellidos: "",
        telefono: "",
        email: "",
        direccion: "",
        tipo_licencia: "B",
        estado: "activo",
        experiencia_anos: 0,
        observaciones: ""
      })
    }
    setModalAbierto(true)
  }

  const guardarConductor = async () => {
    try {
      setGuardando(true)

      // Validaciones básicas
      if (!formData.cedula || !formData.nombre || !formData.apellidos || !formData.telefono) {
        toast.error("Complete los campos obligatorios")
        return
      }

      const ahora = new Date()
      const conductorData: Partial<Conductor> = {
        ...formData,
        fecha_nacimiento: new Date(formData.fecha_nacimiento || ahora),
        fecha_licencia: new Date(formData.fecha_licencia || ahora),
        fecha_vencimiento_licencia: new Date(formData.fecha_vencimiento_licencia || ahora),
        updatedAt: ahora
      }

      if (conductorEditando) {
        // Actualizar conductor existente
        await updateDoc(doc(db, "conductores", conductorEditando.id_conductor), conductorData)
        toast.success("Conductor actualizado exitosamente")
      } else {
        // Crear nuevo conductor
        const nuevoId = `COND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        conductorData.id_conductor = nuevoId
        conductorData.createdAt = ahora
        
        await setDoc(doc(db, "conductores", nuevoId), conductorData)
        toast.success("Conductor creado exitosamente")
      }

      setModalAbierto(false)
      cargarConductores()
    } catch (error) {
      console.error("Error guardando conductor:", error)
      toast.error("Error al guardar el conductor")
    } finally {
      setGuardando(false)
    }
  }

  const eliminarConductor = async (conductor: Conductor) => {
    if (!confirm(`¿Está seguro de eliminar al conductor ${conductor.nombre} ${conductor.apellidos}?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "conductores", conductor.id_conductor))
      toast.success("Conductor eliminado exitosamente")
      cargarConductores()
    } catch (error) {
      console.error("Error eliminando conductor:", error)
      toast.error("Error al eliminar el conductor")
    }
  }

  const calcularEdad = (fechaNacimiento: Date): number => {
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = fechaNacimiento.getMonth()
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    
    return edad
  }

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-green-100 text-green-800"
      case "inactivo": return "bg-gray-100 text-gray-800"
      case "suspendido": return "bg-red-100 text-red-800"
      case "vacaciones": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Filtrar conductores en memoria
  const conductoresFiltrados = useMemo(() => {
    let result = [...conductores]

    // Filtro de búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase()
      result = result.filter(conductor =>
        conductor.nombre.toLowerCase().includes(busquedaLower) ||
        conductor.apellidos.toLowerCase().includes(busquedaLower) ||
        conductor.cedula.includes(busqueda) ||
        conductor.telefono.includes(busqueda)
      )
    }

    // Filtro de estado
    if (filtroEstado !== "todos") {
      result = result.filter(conductor => conductor.estado === filtroEstado)
    }

    // Filtro de licencia
    if (filtroLicencia !== "todos") {
      result = result.filter(conductor => conductor.tipo_licencia === filtroLicencia)
    }

    return result
  }, [conductores, busqueda, filtroEstado, filtroLicencia])

  // Calcular paginación en memoria
  const totalPages = Math.ceil(conductoresFiltrados.length / ITEMS_PER_PAGE)
  const startIndex = (paginaActual - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const conductoresPaginados = conductoresFiltrados.slice(startIndex, endIndex)

  const exportarCSV = () => {
    const headers = "Cédula,Nombre,Apellidos,Teléfono,Email,Tipo Licencia,Estado,Experiencia,Edad\n"
    const csvContent = conductores.map(conductor => 
      `${conductor.cedula},"${conductor.nombre}","${conductor.apellidos}",${conductor.telefono},"${conductor.email || ''}",${conductor.tipo_licencia},${conductor.estado},${conductor.experiencia_anos},${calcularEdad(conductor.fecha_nacimiento)}`
    ).join("\n")
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conductores_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Gestión de Conductores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Administra la información de los conductores del sistema de transporte TransiLoja
          </p>
        </div>
        <div className="flex gap-2">
          <DataImport tipoEntidad="conductores" onImportComplete={() => cargarConductores()} />
          <Button variant="outline" onClick={exportarCSV} className="hover:bg-sky-50">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => abrirModal()} className="bg-sky-500 hover:bg-sky-600">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Conductor
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg">
                <Users className="h-8 w-8 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Conductores</p>
                <p className="text-2xl font-bold text-gray-900">{conductores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conductores.filter(c => c.estado === "activo").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conductores.filter(c => c.estado === "inactivo").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-5 h-5 bg-red-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspendidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conductores.filter(c => c.estado === "suspendido").length}
                </p>
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
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Búsqueda</Label>
              <Input
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo Licencia</Label>
              <Select value={filtroLicencia} onValueChange={setFiltroLicencia}>
                <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="A">Tipo A</SelectItem>
                  <SelectItem value="B">Tipo B</SelectItem>
                  <SelectItem value="C">Tipo C</SelectItem>
                  <SelectItem value="D">Tipo D</SelectItem>
                  <SelectItem value="E">Tipo E</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {conductoresFiltrados.length > 0 && (busqueda || filtroEstado !== "todos" || filtroLicencia !== "todos") && (
            <Badge variant="secondary" className="mt-4">
              {conductoresFiltrados.length} resultados encontrados
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Conductores */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
                Lista de Conductores
              </CardTitle>
              <CardDescription className="mt-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, conductoresFiltrados.length)} de {conductoresFiltrados.length} conductores
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarConductores}
              disabled={cargando}
              className="hover:bg-sky-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {cargando && conductores.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : conductoresPaginados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No se encontraron conductores</p>
              <p className="text-gray-400 text-sm mt-2">
                {busqueda || filtroEstado !== "todos" || filtroLicencia !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando un nuevo conductor"}
              </p>
            </div>
          ) : (
            <div className="border border-sky-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
                    <TableHead className="font-semibold">Información Personal</TableHead>
                    <TableHead className="font-semibold">Contacto</TableHead>
                    <TableHead className="font-semibold">Licencia</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Experiencia</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conductoresPaginados.map((conductor) => (
                    <TableRow key={conductor.id_conductor} className="hover:bg-sky-50/30 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {conductor.nombre} {conductor.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            CI: {conductor.cedula}
                          </div>
                          <div className="text-sm text-gray-500">
                            Edad: {calcularEdad(conductor.fecha_nacimiento)} años
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {conductor.telefono}
                          </div>
                          {conductor.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              {conductor.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">Tipo {conductor.tipo_licencia}</Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            Vence: {conductor.fecha_vencimiento_licencia.toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={obtenerColorEstado(conductor.estado)}>
                          {conductor.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{conductor.experiencia_anos} años</div>
                          {conductor.calificacion && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {conductor.calificacion.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirModal(conductor)}
                            className="hover:bg-sky-100 hover:text-sky-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarConductor(conductor)}
                            className="hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Página {paginaActual} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="hover:bg-sky-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                {/* Números de página */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar primera página, última página, página actual y páginas adyacentes
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      (page >= paginaActual - 1 && page <= paginaActual + 1)

                    // Mostrar puntos suspensivos
                    const showEllipsisBefore = page === paginaActual - 1 && paginaActual > 3
                    const showEllipsisAfter = page === paginaActual + 1 && paginaActual < totalPages - 2

                    if (!shouldShow && !showEllipsisBefore && !showEllipsisAfter) return null

                    if (showEllipsisBefore && page !== 2) {
                      return <span key={`ellipsis-before-${page}`} className="px-2 py-1">...</span>
                    }

                    if (showEllipsisAfter && page !== totalPages - 1) {
                      return <span key={`ellipsis-after-${page}`} className="px-2 py-1">...</span>
                    }

                    return (
                      <Button
                        key={page}
                        variant={paginaActual === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaActual(page)}
                        className={paginaActual === page ? "bg-sky-500 hover:bg-sky-600" : "hover:bg-sky-50"}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.min(totalPages, prev + 1))}
                  disabled={paginaActual === totalPages}
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

      {/* Modal de Edición */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {conductorEditando ? "Editar Conductor" : "Nuevo Conductor"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del conductor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Personal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    placeholder="1234567890"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="0987654321"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Juan"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    placeholder="Pérez García"
                    className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="conductor@email.com"
                  className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Dirección completa"
                  rows={2}
                  className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                />
              </div>
            </div>

            {/* Información Profesional */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Profesional</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_licencia">Tipo de Licencia</Label>
                  <Select
                    value={formData.tipo_licencia}
                    onValueChange={(value) => setFormData({...formData, tipo_licencia: value as any})}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
                      <SelectItem value="B">Tipo B - Automóviles</SelectItem>
                      <SelectItem value="C">Tipo C - Camiones</SelectItem>
                      <SelectItem value="D">Tipo D - Buses</SelectItem>
                      <SelectItem value="E">Tipo E - Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({...formData, estado: value as any})}
                  >
                    <SelectTrigger className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                      <SelectItem value="vacaciones">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia">Años de Experiencia</Label>
                <Input
                  id="experiencia"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experiencia_anos}
                  onChange={(e) => setFormData({...formData, experiencia_anos: parseInt(e.target.value) || 0})}
                  className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales"
                  rows={3}
                  className="border-sky-200 focus:border-sky-500 focus:ring-sky-500 hover:border-sky-400"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)} className="hover:bg-sky-50">
              Cancelar
            </Button>
            <Button onClick={guardarConductor} disabled={guardando} className="bg-sky-500 hover:bg-sky-600">
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}