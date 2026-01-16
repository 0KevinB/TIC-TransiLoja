"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/lib/types"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Search, UserIcon, Crown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "admin" | "user" | "conductor",
    preferences: {
      language: "es" as "es" | "en",
      notifications: true,
      theme: "system" as "light" | "dark" | "system",
    },
  })
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"))
      const usersData: User[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Helper function to convert Firestore timestamp to Date
        const toDate = (timestamp: any): Date => {
          if (!timestamp) return new Date()
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate()
          }
          if (timestamp instanceof Date) {
            return timestamp
          }
          // Handle Firestore timestamp format from JSON {_seconds, _nanoseconds}
          if (timestamp._seconds) {
            return new Date(timestamp._seconds * 1000)
          }
          return new Date()
        }

        usersData.push({
          id: doc.id,
          email: data.email || "",
          name: data.name || "Sin nombre",
          role: data.role || "user",
          conductorId: data.conductorId,
          favoriteStops: data.favoriteStops || [],
          favoriteRoutes: data.favoriteRoutes || [],
          preferences: data.preferences || {
            language: "es",
            notifications: true,
            theme: "system",
          },
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        })
      })
      setUsers(usersData.sort((a, b) => (a.name || "").localeCompare(b.name || "")))
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "El nombre y email son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        favoriteStops: [],
        favoriteRoutes: [],
        preferences: formData.preferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Si el rol es conductor, crear/actualizar perfil de conductor
      if (formData.role === "conductor") {
        let conductorId = editingUser?.conductorId

        // Si no existe conductorId, crear nuevo conductor
        if (!conductorId) {
          const [firstName, ...lastNameParts] = formData.name.split(" ")
          const lastName = lastNameParts.join(" ") || firstName

          const conductorData = {
            nombre: firstName,
            apellidos: lastName,
            email: formData.email,
            cedula: "", // El administrador deberá completar esto después
            telefono: "",
            direccion: "",
            fecha_nacimiento: new Date(),
            fecha_licencia: new Date(),
            fecha_vencimiento_licencia: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde hoy
            tipo_licencia: "C", // Licencia tipo C por defecto para buses
            estado: "activo",
            experiencia_anos: 0,
            observaciones: "Conductor creado automáticamente desde panel de usuarios",
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const conductorRef = await addDoc(collection(db, "conductores"), conductorData)
          conductorId = conductorRef.id

          toast({
            title: "Perfil de conductor creado",
            description: "Se ha creado automáticamente un perfil de conductor. Completa los datos en la sección de Conductores.",
          })
        }

        userData.conductorId = conductorId
      } else {
        // Si cambió de conductor a otro rol, eliminar conductorId
        userData.conductorId = null
      }

      if (editingUser) {
        // Si está cambiando de rol no-conductor a conductor o viceversa
        const wasDriver = editingUser.role === "conductor"
        const isNowDriver = formData.role === "conductor"

        if (wasDriver && !isNowDriver && editingUser.conductorId) {
          // Cambió de conductor a otro rol: desactivar conductor en lugar de eliminar
          await updateDoc(doc(db, "conductores", editingUser.conductorId), {
            estado: "inactivo",
            observaciones: "Usuario cambió de rol",
            updatedAt: new Date(),
          })
        }

        await updateDoc(doc(db, "users", editingUser.id), {
          ...userData,
          createdAt: editingUser.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente",
        })
      } else {
        await addDoc(collection(db, "users"), userData)
        toast({
          title: "Éxito",
          description: "Usuario creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        role: "user",
        preferences: {
          language: "es",
          notifications: true,
          theme: "system",
        },
      })
      fetchUsers()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el usuario",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "users", userId))
      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      })
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Crown className="mr-1 h-3 w-3" />
            Administrador
          </Badge>
        )
      case "conductor":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Users className="mr-1 h-3 w-3" />
            Conductor
          </Badge>
        )
      case "operator":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <UserIcon className="mr-1 h-3 w-3" />
            Operador
          </Badge>
        )
      case "dispatcher":
        return (
          <Badge className="bg-green-100 text-green-800">
            <UserIcon className="mr-1 h-3 w-3" />
            Despachador
          </Badge>
        )
      case "viewer":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <UserIcon className="mr-1 h-3 w-3" />
            Visualizador
          </Badge>
        )
      case "user":
        return (
          <Badge variant="secondary">
            <UserIcon className="mr-1 h-3 w-3" />
            Usuario
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
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
          <h1 className="text-2xl font-bold">
            Bienvenido{mounted && currentUser?.name ? `, ${currentUser.name}` : ""}
          </h1>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Añade un nuevo usuario al sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Usuario
                      </div>
                    </SelectItem>
                    <SelectItem value="conductor">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Conductor
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="operator">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Operador
                      </div>
                    </SelectItem>
                    <SelectItem value="dispatcher">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Despachador
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Visualizador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Preferencias</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={formData.preferences.language}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, language: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={formData.preferences.theme}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, theme: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Notificaciones</Label>
                    <Switch
                      id="notifications"
                      checked={formData.preferences.notifications}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, notifications: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingUser ? "Actualizar" : "Crear"} Usuario
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "admin").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Regulares</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "user").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Registrados ({filteredUsers.length})
          </CardTitle>
          <CardDescription>Administra los usuarios del sistema TransiLoja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Preferencias</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-sky-100 text-sky-700">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.favoriteStops.length} paradas favoritas</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {user.preferences.language === "es" ? "Español" : "English"}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {user.preferences.notifications ? "Notificaciones ON" : "Notificaciones OFF"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.createdAt.toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron usuarios con ese criterio" : "Comienza añadiendo un nuevo usuario"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
