/**
 * Stop Times Service (GTFS)
 *
 * Servicio para gestión de horarios de paradas.
 * IMPORTANTE: stop_times es una tabla PLANA, no anidada.
 */

import { where, orderBy, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BaseService } from "../base-service"
import {
  GTFSStopTime,
  GTFSStopTimeSchema,
  GTFSStopTimeCreate,
  sortStopTimesBySequence,
} from "@/lib/schemas/gtfs/stop_times"

class StopTimesService extends BaseService<GTFSStopTime> {
  constructor() {
    super("stop_times", GTFSStopTimeSchema)
  }

  /**
   * Obtener todos los stop_times de un trip, ordenados por secuencia
   */
  async getByTrip(tripId: string): Promise<GTFSStopTime[]> {
    const stopTimes = await this.query(
      where("trip_id", "==", tripId),
      orderBy("stop_sequence", "asc")
    )

    return sortStopTimesBySequence(stopTimes)
  }

  /**
   * Obtener todos los stop_times de una parada específica
   */
  async getByStop(stopId: string): Promise<GTFSStopTime[]> {
    return this.query(where("stop_id", "==", stopId), orderBy("arrival_time", "asc"))
  }

  /**
   * Obtener el primer stop_time de un trip (origen)
   */
  async getFirstStopTime(tripId: string): Promise<GTFSStopTime | null> {
    const stopTimes = await this.query(
      where("trip_id", "==", tripId),
      orderBy("stop_sequence", "asc")
    )

    return stopTimes[0] || null
  }

  /**
   * Obtener el último stop_time de un trip (destino)
   */
  async getLastStopTime(tripId: string): Promise<GTFSStopTime | null> {
    const stopTimes = await this.query(
      where("trip_id", "==", tripId),
      orderBy("stop_sequence", "desc")
    )

    return stopTimes[0] || null
  }

  /**
   * Crear múltiples stop_times para un trip (operación batch)
   */
  async createBatch(stopTimes: GTFSStopTimeCreate[]): Promise<void> {
    // Validar que todos pertenecen al mismo trip
    const tripIds = [...new Set(stopTimes.map((st) => st.trip_id))]
    if (tripIds.length > 1) {
      throw new Error(
        "createBatch solo debe usarse para stop_times del mismo trip. " +
          `Se detectaron ${tripIds.length} trips diferentes.`
      )
    }

    // Validar secuencias únicas
    const sequences = stopTimes.map((st) => st.stop_sequence)
    const uniqueSequences = new Set(sequences)
    if (sequences.length !== uniqueSequences.size) {
      throw new Error("Las secuencias (stop_sequence) deben ser únicas")
    }

    // Ordenar por secuencia
    const sortedStopTimes = [...stopTimes].sort((a, b) => a.stop_sequence - b.stop_sequence)

    // Crear documentos en batch
    const batch = writeBatch(db)

    sortedStopTimes.forEach((stopTime) => {
      const docRef = this.getCollectionRef().doc() // Generar ID automático
      batch.set(docRef, {
        ...stopTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
  }

  /**
   * Reemplazar todos los stop_times de un trip
   */
  async replaceForTrip(tripId: string, newStopTimes: GTFSStopTimeCreate[]): Promise<void> {
    // Validar que todos son del mismo trip
    const allSameTrip = newStopTimes.every((st) => st.trip_id === tripId)
    if (!allSameTrip) {
      throw new Error("Todos los stop_times deben pertenecer al trip especificado")
    }

    const batch = writeBatch(db)

    // 1. Eliminar stop_times existentes
    const existingStopTimes = await this.getByTrip(tripId)
    existingStopTimes.forEach((st) => {
      if (st.id) {
        const docRef = this.getDocRef(st.id)
        batch.delete(docRef)
      }
    })

    // 2. Crear nuevos stop_times
    const sortedNewStopTimes = [...newStopTimes].sort(
      (a, b) => a.stop_sequence - b.stop_sequence
    )

    sortedNewStopTimes.forEach((stopTime) => {
      const docRef = this.getCollectionRef().doc() // Generar ID automático
      batch.set(docRef, {
        ...stopTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
  }

  /**
   * Eliminar todos los stop_times de un trip
   */
  async deleteByTrip(tripId: string): Promise<void> {
    const stopTimes = await this.getByTrip(tripId)
    const batch = writeBatch(db)

    stopTimes.forEach((st) => {
      if (st.id) {
        const docRef = this.getDocRef(st.id)
        batch.delete(docRef)
      }
    })

    await batch.commit()
  }

  /**
   * Obtener duración total del trip (en minutos)
   */
  async getTripDuration(tripId: string): Promise<number | null> {
    const firstStop = await this.getFirstStopTime(tripId)
    const lastStop = await this.getLastStopTime(tripId)

    if (!firstStop || !lastStop) return null

    const startSeconds = this.timeToSeconds(firstStop.departure_time)
    const endSeconds = this.timeToSeconds(lastStop.arrival_time)

    return Math.round((endSeconds - startSeconds) / 60)
  }

  /**
   * Convertir tiempo GTFS (HH:MM:SS) a segundos
   */
  private timeToSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(":").map(Number)
    return hours * 3600 + minutes * 60 + seconds
  }

  /**
   * Obtener próximas paradas desde una secuencia específica
   */
  async getUpcomingStops(tripId: string, fromSequence: number): Promise<GTFSStopTime[]> {
    return this.query(
      where("trip_id", "==", tripId),
      where("stop_sequence", ">=", fromSequence),
      orderBy("stop_sequence", "asc")
    )
  }

  /**
   * Validar que un stop_time tiene tiempos válidos
   */
  private validateStopTime(stopTime: GTFSStopTimeCreate): void {
    const arrivalSeconds = this.timeToSeconds(stopTime.arrival_time)
    const departureSeconds = this.timeToSeconds(stopTime.departure_time)

    if (arrivalSeconds > departureSeconds) {
      throw new Error(
        `arrival_time (${stopTime.arrival_time}) debe ser anterior o igual a ` +
          `departure_time (${stopTime.departure_time})`
      )
    }
  }

  /**
   * Crear un stop_time con validación
   */
  async createStopTime(data: GTFSStopTimeCreate): Promise<GTFSStopTime> {
    this.validateStopTime(data)
    return this.create(data)
  }
}

// Exportar instancia singleton
export const stopTimesService = new StopTimesService()
