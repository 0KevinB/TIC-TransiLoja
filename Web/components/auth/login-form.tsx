"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bus, Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (isForgotPassword) {
        await resetPassword(email)
        setSuccess("Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.")
        setEmail("")
      } else if (isSignUp) {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 opacity-75 blur-lg animate-pulse"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-full p-3 shadow-xl">
                <Bus className="h-8 w-8 text-sky-500 dark:text-sky-400" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            <span className="text-sky-700 dark:text-sky-300">Transi</span>Loja
          </CardTitle>
          <CardDescription>
            {isForgotPassword
              ? "Recupera tu contraseña"
              : isSignUp
              ? "Crear cuenta de administrador"
              : "Iniciar sesión en el dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-sky-700 hover:bg-sky-800" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isForgotPassword ? "Enviar correo de recuperación" : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </Button>

            {isForgotPassword ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsForgotPassword(false)
                  setError("")
                  setSuccess("")
                }}
              >
                Volver al inicio de sesión
              </Button>
            ) : (
              <>
                <Button type="button" variant="ghost" className="w-full" onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                  setSuccess("")
                }}>
                  {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                </Button>
                {!isSignUp && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    onClick={() => {
                      setIsForgotPassword(true)
                      setError("")
                      setSuccess("")
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                )}
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
