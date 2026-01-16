"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import type { User } from "./types"

// Lazy imports de Firebase para reducir bundle inicial
let auth: any
let db: any
let onAuthStateChanged: any
let signInWithEmailAndPassword: any
let signOut: any
let createUserWithEmailAndPassword: any
let sendPasswordResetEmail: any
let doc: any
let getDoc: any
let setDoc: any

// Función para cargar Firebase de manera diferida
const loadFirebase = async () => {
  if (!auth) {
    const [firebaseModule, firebaseAuthModule, firestoreModule] = await Promise.all([
      import("./firebase"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ])

    auth = firebaseModule.auth
    db = firebaseModule.db
    onAuthStateChanged = firebaseAuthModule.onAuthStateChanged
    signInWithEmailAndPassword = firebaseAuthModule.signInWithEmailAndPassword
    signOut = firebaseAuthModule.signOut
    createUserWithEmailAndPassword = firebaseAuthModule.createUserWithEmailAndPassword
    sendPasswordResetEmail = firebaseAuthModule.sendPasswordResetEmail
    doc = firestoreModule.doc
    getDoc = firestoreModule.getDoc
    setDoc = firestoreModule.setDoc
  }
}

// Helper to convert Firestore timestamps to Date (moved outside component for performance)
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

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let initStarted = false

    const initAuth = async () => {
      if (initStarted) return
      initStarted = true

      await loadFirebase()

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
        setFirebaseUser(firebaseUser)

        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()

              try {
                setUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  name: userData.name || "Usuario",
                  role: userData.role || "user",
                  favoriteStops: userData.favoriteStops || [],
                  favoriteRoutes: userData.favoriteRoutes || [],
                  createdAt: toDate(userData.createdAt),
                  updatedAt: toDate(userData.updatedAt),
                })
              } catch (mappingError) {
                console.error("Error mapping user data:", mappingError)
              }
            }
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error)
          }
        } else {
          setUser(null)
        }

        setLoading(false)
      })
    }

    // Retrasar init hasta que el usuario interactúe o después de 1 segundo
    const timeout = setTimeout(initAuth, 1000)

    // También iniciar en interacción del usuario
    const handleInteraction = () => {
      clearTimeout(timeout)
      initAuth()
      document.removeEventListener('mousedown', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }

    document.addEventListener('mousedown', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      clearTimeout(timeout)
      if (unsubscribe) unsubscribe()
      document.removeEventListener('mousedown', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await loadFirebase()
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    await loadFirebase()
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

    const userData = {
      name,
      email,
      role: "user",
      favoriteStops: [],
      favoriteRoutes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, "users", firebaseUser.uid), userData)
  }, [])

  const logout = useCallback(async () => {
    await loadFirebase()
    await signOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await loadFirebase()
    await sendPasswordResetEmail(auth, email)
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ user, firebaseUser, loading, signIn, signUp, logout, resetPassword }),
    [user, firebaseUser, loading, signIn, signUp, logout, resetPassword]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
