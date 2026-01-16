/**
 * Hook para gestión de Stops (Paradas)
 *
 * Proporciona funcionalidad completa de CRUD para paradas con validación automática.
 */

import { useState, useEffect, useCallback } from "react"
import { stopsService } from "@/lib/services"
import { GTFSStop, GTFSStopCreate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface UseStopsOptions {
  autoFetch?: boolean
  limit?: number
}

interface UseStopsReturn {
  stops: GTFSStop[]
  loading: boolean
  error: Error | null
  creating: boolean
  updating: boolean
  deleting: boolean

  // CRUD operations
  fetchStops: () => Promise<void>
  createStop: (data: GTFSStopCreate) => Promise<GTFSStop | null>
  updateStop: (id: string, data: Partial<GTFSStopCreate>) => Promise<void>
  deleteStop: (id: string) => Promise<void>

  // Búsquedas específicas
  searchByName: (term: string) => Promise<GTFSStop[]>
  getNearby: (lat: number, lng: number, radiusKm?: number) => Promise<Array<GTFSStop & { distance: number }>>
  getTransferPoints: () => Promise<GTFSStop[]>
}

export function useStops(options: UseStopsOptions = {}): UseStopsReturn {
  const { autoFetch = true, limit } = options
  const { toast } = useToast()

  const [stops, setStops] = useState<GTFSStop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /**
   * Obtener todas las paradas
   */
  const fetchStops = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await stopsService.getAll(limit)
      setStops(data)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al cargar paradas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [limit, toast])

  /**
   * Crear nueva parada
   */
  const createStop = useCallback(async (data: GTFSStopCreate): Promise<GTFSStop | null> => {
    setCreating(true)
    setError(null)

    try {
      const newStop = await stopsService.createStop(data)

      // Actualizar lista local
      setStops((prev) => [newStop, ...prev])

      toast({
        title: "Parada creada",
        description: `${newStop.stop_name} se ha creado exitosamente`,
      })

      return newStop
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al crear parada",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setCreating(false)
    }
  }, [toast])

  /**
   * Actualizar parada existente
   */
  const updateStop = useCallback(async (id: string, data: Partial<GTFSStopCreate>) => {
    setUpdating(true)
    setError(null)

    try {
      await stopsService.update(id, data)

      // Actualizar lista local
      setStops((prev) =>
        prev.map((stop) => (stop.stop_id === id ? { ...stop, ...data } : stop))
      )

      toast({
        title: "Parada actualizada",
        description: "Los cambios se han guardado exitosamente",
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al actualizar parada",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }, [toast])

  /**
   * Eliminar parada
   */
  const deleteStop = useCallback(async (id: string) => {
    setDeleting(true)
    setError(null)

    try {
      await stopsService.delete(id)

      // Actualizar lista local
      setStops((prev) => prev.filter((stop) => stop.stop_id !== id))

      toast({
        title: "Parada eliminada",
        description: "La parada se ha eliminado exitosamente",
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: "Error al eliminar parada",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }, [toast])

  /**
   * Buscar paradas por nombre
   */
  const searchByName = useCallback(async (term: string): Promise<GTFSStop[]> => {
    try {
      return await stopsService.searchByName(term)
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
   * Obtener paradas cercanas
   */
  const getNearby = useCallback(
    async (lat: number, lng: number, radiusKm: number = 1) => {
      try {
        return await stopsService.getNearbyStops(lat, lng, radiusKm)
      } catch (err) {
        const error = err as Error
        toast({
          title: "Error al buscar paradas cercanas",
          description: error.message,
          variant: "destructive",
        })
        return []
      }
    },
    [toast]
  )

  /**
   * Obtener puntos de transferencia
   */
  const getTransferPoints = useCallback(async () => {
    try {
      return await stopsService.getTransferPoints()
    } catch (err) {
      const error = err as Error
      toast({
        title: "Error al obtener puntos de transferencia",
        description: error.message,
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchStops()
    }
  }, [autoFetch, fetchStops])

  return {
    stops,
    loading,
    error,
    creating,
    updating,
    deleting,
    fetchStops,
    createStop,
    updateStop,
    deleteStop,
    searchByName,
    getNearby,
    getTransferPoints,
  }
}
