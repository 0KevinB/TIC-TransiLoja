/**
 * Base Service para operaciones CRUD de Firestore
 *
 * Proporciona métodos genéricos con validación automática usando Zod.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  serverTimestamp,
  Timestamp,
  FirestoreError,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ZodSchema } from "zod"

/**
 * Opciones para queries paginadas
 */
export interface PaginationOptions {
  limit?: number
  startAfter?: DocumentSnapshot
  orderByField?: string
  orderDirection?: "asc" | "desc"
}

/**
 * Resultado de query paginada
 */
export interface PaginatedResult<T> {
  items: T[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
  total?: number
}

/**
 * Clase base abstracta para servicios de Firestore
 */
export abstract class BaseService<T extends { id?: string }> {
  protected collectionName: string
  protected schema: ZodSchema<T>

  constructor(collectionName: string, schema: ZodSchema<T>) {
    this.collectionName = collectionName
    this.schema = schema
  }

  /**
   * Obtener referencia de la colección
   */
  protected getCollectionRef() {
    return collection(db, this.collectionName)
  }

  /**
   * Obtener referencia de un documento
   */
  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id)
  }

  /**
   * Convertir DocumentSnapshot a tipo T con validación
   */
  protected fromFirestore(doc: DocumentSnapshot): T {
    if (!doc.exists()) {
      throw new Error(`Document ${doc.id} does not exist in ${this.collectionName}`)
    }

    try {
      const data = {
        id: doc.id,
        ...doc.data(),
      }

      return this.schema.parse(data)
    } catch (error) {
      console.error(`Validation error in ${this.collectionName}/${doc.id}:`, error)
      throw error
    }
  }

  /**
   * Obtener todos los documentos (con límite opcional)
   */
  async getAll(limitCount?: number): Promise<T[]> {
    try {
      const constraints: QueryConstraint[] = []

      if (limitCount) {
        constraints.push(limit(limitCount))
      }

      const q = query(this.getCollectionRef(), ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => this.fromFirestore(doc))
    } catch (error) {
      this.handleError("getAll", error)
      throw error
    }
  }

  /**
   * Obtener documento por ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id)
      const snapshot = await getDoc(docRef)

      if (!snapshot.exists()) {
        return null
      }

      return this.fromFirestore(snapshot)
    } catch (error) {
      this.handleError("getById", error, { id })
      throw error
    }
  }

  /**
   * Consulta personalizada con validación
   */
  async query(...constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(this.getCollectionRef(), ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => this.fromFirestore(doc))
    } catch (error) {
      this.handleError("query", error)
      throw error
    }
  }

  /**
   * Consulta paginada
   */
  async queryPaginated(
    options: PaginationOptions,
    ...additionalConstraints: QueryConstraint[]
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        limit: limitCount = 10,
        startAfter: startAfterDoc,
        orderByField = "createdAt",
        orderDirection = "desc",
      } = options

      const constraints: QueryConstraint[] = [
        ...additionalConstraints,
        orderBy(orderByField, orderDirection),
        limit(limitCount + 1), // +1 para detectar si hay más
      ]

      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc))
      }

      const q = query(this.getCollectionRef(), ...constraints)
      const snapshot = await getDocs(q)

      const hasMore = snapshot.docs.length > limitCount
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs
      const items = docs.map((doc) => this.fromFirestore(doc))
      const lastDoc = docs[docs.length - 1] || null

      return {
        items,
        lastDoc,
        hasMore,
      }
    } catch (error) {
      this.handleError("queryPaginated", error)
      throw error
    }
  }

  /**
   * Crear nuevo documento
   */
  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(this.getCollectionRef(), docData)
      const snapshot = await getDoc(docRef)

      return this.fromFirestore(snapshot)
    } catch (error) {
      this.handleError("create", error, { data })
      throw error
    }
  }

  /**
   * Actualizar documento existente
   */
  async update(id: string, data: Partial<Omit<T, "id" | "createdAt">>): Promise<void> {
    try {
      const docRef = this.getDocRef(id)

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(docRef, updateData)
    } catch (error) {
      this.handleError("update", error, { id, data })
      throw error
    }
  }

  /**
   * Eliminar documento
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id)
      await deleteDoc(docRef)
    } catch (error) {
      this.handleError("delete", error, { id })
      throw error
    }
  }

  /**
   * Verificar si un documento existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id)
      const snapshot = await getDoc(docRef)
      return snapshot.exists()
    } catch (error) {
      this.handleError("exists", error, { id })
      throw error
    }
  }

  /**
   * Contar documentos (con filtros opcionales)
   */
  async count(...constraints: QueryConstraint[]): Promise<number> {
    try {
      const q = query(this.getCollectionRef(), ...constraints)
      const snapshot = await getDocs(q)
      return snapshot.size
    } catch (error) {
      this.handleError("count", error)
      throw error
    }
  }

  /**
   * Manejo centralizado de errores
   */
  protected handleError(method: string, error: unknown, context?: Record<string, any>): void {
    console.error(`[${this.collectionName}Service.${method}] Error:`, {
      error,
      context,
      timestamp: new Date().toISOString(),
    })

    // Aquí podrías integrar con un servicio de logging/monitoreo (Sentry, etc.)
  }
}

/**
 * Error personalizado para operaciones de servicio
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = "ServiceError"
  }
}
