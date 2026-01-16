/**
 * Hook para gestión de Routes (Rutas)
 *
 * Proporciona funcionalidad completa de CRUD para rutas con validación automática.
 */

import { useState, useEffect, useCallback } from "react"
import { routesService } from "@/lib/services"
import { GTFSRoute, GTFSRouteCreate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface UseRoutesOptions {
  autoFetch?: boolean
  limit?: number
}

interface UseRoutesReturn {
  routes: GTFSRoute[]
  loading: boolean
  error: Error | null
  creating: boolean
  updating: boolean
  deleting: boolean

  // CRUD operations
  fetchRoutes: () => Promise<void>
  createRoute: (data: GTFSRouteCreate) => Promise<GTFSRoute | null>
  updateRoute: (id: string, data: Partial<GTFSRouteCreate>) => Promise<void>
  deleteRoute: (id: string) => Promise<void>

  // Búsquedas específicas
  searchByName: (term: string) => Promise<GTFSRoute[]>
  getByType: (type: string) => Promise<GTFSRoute[]>
  getBusRoutes: () => Promise<GTFSRoute[]>
}

export function useRoutes(options: UseRoutesOptions = {}): UseRoutesReturn {
  const { autoFetch = true, limit } = options
  const { toast } = useToast()

  const [routes, setRoutes] = useState<GTFSRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /**
   * Obtener todas las rutas
   */
  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await routesService.getAll(limit)
      setRoutes(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al cargar rutas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [limit, toast])

  /**
   * Crear nueva ruta
   */
  const createRoute = useCallback(async (data: GTFSRouteCreate): Promise<GTFSRoute | null> => {
    setCreating(true)
    setError(null)

    try {
      const newRoute = await routesService.createRoute(data)

      // Actualizar lista local
      setRoutes((prev) => [newRoute, ...prev])

      const displayName = routesService.getDisplayName(newRoute)
      toast({
        title: "Ruta creada",
        description: `${displayName} se ha creado exitosamente`,
      })

      return newRoute
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al crear ruta",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setCreating(false)
    }
  }, [toast])

  /**
   * Actualizar ruta existente
   */
  const updateRoute = useCallback(async (id: string, data: Partial<GTFSRouteCreate>) => {
    setUpdating(true)
    setError(null)

    try {
      await routesService.update(id, data)

      // Actualizar lista local
      setRoutes((prev) =>
        prev.map((route) => (route.route_id === id ? { ...route, ...data } : route))
      )

      toast({
        title: "Ruta actualizada",
        description: "Los cambios se han guardado exitosamente",
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al actualizar ruta",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }, [toast])

  /**
   * Eliminar ruta
   */
  const deleteRoute = useCallback(async (id: string) => {
    setDeleting(true)
    setError(null)

    try {
      await routesService.delete(id)

      // Actualizar lista local
      setRoutes((prev) => prev.filter((route) => route.route_id !== id))

      toast({
        title: "Ruta eliminada",
        description: "La ruta se ha eliminado exitosamente",
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al eliminar ruta",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }, [toast])

  /**
   * Buscar rutas por nombre
   */
  const searchByName = useCallback(async (term: string): Promise<GTFSRoute[]> => {
    try {
      return await routesService.searchByName(term)
    } catch (err) {
      const error = err as Error
      toast({
        title: "Error en la búsqueda",
        description: error.message,
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  /**
   * Obtener rutas por tipo
   */
  const getByType = useCallback(async (type: string): Promise<GTFSRoute[]> => {
    try {
      return await routesService.getByType(type)
    } catch (err) {
      const error = err as Error
      toast({
        title: "Error al filtrar por tipo",
        description: error.message,
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  /**
   * Obtener solo rutas de bus
   */
  const getBusRoutes = useCallback(async (): Promise<GTFSRoute[]> => {
    try {
      return await routesService.getBusRoutes()
    } catch (err) {
      const error = err as Error
      toast({
        title: "Error al obtener rutas de bus",
        description: error.message,
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchRoutes()
    }
  }, [autoFetch, fetchRoutes])

  return {
    routes,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    searchByName,
    getByType,
    getBusRoutes,
  }
}
