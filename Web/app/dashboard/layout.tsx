"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { LoginForm } from "@/components/auth/login-form"
import { Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Solo verificar el rol después de cargar y si el usuario está autenticado
    if (!loading && user && user.role !== "admin") {
      // Si no está en la página de unauthorized, redirigir
      if (pathname !== "/dashboard/unauthorized") {
        router.push("/dashboard/unauthorized")
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Permitir acceso a la página de unauthorized sin sidebar
  if (pathname === "/dashboard/unauthorized") {
    return <>{children}</>
  }

  // Si no es admin, no mostrar nada (el useEffect redirigirá)
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-6 lg:p-8 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  )
}
