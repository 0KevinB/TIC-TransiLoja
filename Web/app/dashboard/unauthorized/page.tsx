"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, LogOut, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { translateRole } from "@/lib/utils/role-translations"

export default function UnauthorizedPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            No tienes permisos para acceder al panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Usuario actual:</strong> {user?.name || user?.email}
            </p>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Rol:</strong> {user?.role ? translateRole(user.role) : "Desconocido"}
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Solo los usuarios con rol de <strong>Administrador</strong> pueden acceder al panel de administración.
            Si crees que esto es un error, contacta con el administrador del sistema.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-sky-500 hover:bg-sky-600"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
