"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, setDoc, updateDoc, query, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Palette, 
  Upload,
  Smartphone,
  Save,
  Image as ImageIcon
} from "lucide-react"
import { toast } from "sonner"

interface ConfiguracionVisual {
  nombre_app: string
  logo_url: string
  color_primario: string
  color_secundario: string
}

export default function PersonalizacionPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [configuracion, setConfiguracion] = useState<ConfiguracionVisual>({
    nombre_app: "TransiLoja",
    logo_url: "",
    color_primario: "#0ea5e9",
    color_secundario: "#64748b"
  })
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      setCargando(true)
      const configSnap = await getDocs(
        query(collection(db, "configuracion_app"), where("activa", "==", true))
      )
      
      if (!configSnap.empty) {
        const configData = configSnap.docs[0].data() as ConfiguracionVisual
        setConfiguracion(configData)
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setCargando(false)
    }
  }

  const subirLogo = async (archivo: File): Promise<string> => {
    try {
      setSubiendoLogo(true)
      const timestamp = Date.now()
      const nombreArchivo = `logos/app-logo-${timestamp}.${archivo.name.split('.').pop()}`
      const logoRef = ref(storage, nombreArchivo)
      
      await uploadBytes(logoRef, archivo)
      const downloadURL = await getDownloadURL(logoRef)
      
      return downloadURL
    } catch (error) {
      console.error("Error subiendo logo:", error)
      throw new Error("Error al subir el logo")
    } finally {
      setSubiendoLogo(false)
    }
  }

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true)

      if (!configuracion.nombre_app.trim()) {
        toast.error("El nombre de la app es obligatorio")
        return
      }

      let logoUrl = configuracion.logo_url
      
      // Subir nuevo logo si se seleccionó uno
      if (archivoLogo) {
        logoUrl = await subirLogo(archivoLogo)
      }

      const configData: ConfiguracionVisual = {
        ...configuracion,
        logo_url: logoUrl
      }

      // Guardar en la colección
      await setDoc(doc(db, "configuracion_app", "principal"), {
        ...configData,
        activa: true,
        updatedAt: new Date()
      })

      setConfiguracion(configData)
      setArchivoLogo(null)
      toast.success("Configuración guardada exitosamente")
      
    } catch (error) {
      console.error("Error guardando configuración:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  const manejarCambioLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) {
      // Validar tipo de archivo
      if (!archivo.type.startsWith('image/')) {
        toast.error("Por favor selecciona un archivo de imagen")
        return
      }
      
      // Validar tamaño (max 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        toast.error("El archivo es muy grande. Máximo 5MB.")
        return
      }
      
      setArchivoLogo(archivo)
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3" />
        <div className="h-32 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personalización de la App</h1>
        <p className="text-gray-600">
          Configure la apariencia y branding de la aplicación móvil
        </p>
      </div>

      {/* Configuración Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo y Nombre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo y Branding
            </CardTitle>
            <CardDescription>
              Configure el logo y nombre de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_app">Nombre de la Aplicación</Label>
              <Input
                id="nombre_app"
                value={configuracion.nombre_app}
                onChange={(e) => setConfiguracion({...configuracion, nombre_app: e.target.value})}
                placeholder="TransiLoja"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Logo de la App</Label>
              <div className="flex items-center gap-4">
                {configuracion.logo_url && (
                  <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50">
                    <img 
                      src={configuracion.logo_url} 
                      alt="Logo actual" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={manejarCambioLogo}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {archivoLogo ? `Seleccionado: ${archivoLogo.name}` : "PNG, JPG o SVG. Máximo 5MB."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Esquema de Colores
            </CardTitle>
            <CardDescription>
              Defina los colores principales de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color_primario">Color Primario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_primario"
                  type="color"
                  value={configuracion.color_primario}
                  onChange={(e) => setConfiguracion({...configuracion, color_primario: e.target.value})}
                  className="w-20"
                />
                <Input
                  value={configuracion.color_primario}
                  onChange={(e) => setConfiguracion({...configuracion, color_primario: e.target.value})}
                  placeholder="#0ea5e9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color_secundario">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_secundario"
                  type="color"
                  value={configuracion.color_secundario}
                  onChange={(e) => setConfiguracion({...configuracion, color_secundario: e.target.value})}
                  className="w-20"
                />
                <Input
                  value={configuracion.color_secundario}
                  onChange={(e) => setConfiguracion({...configuracion, color_secundario: e.target.value})}
                  placeholder="#64748b"
                />
              </div>
            </div>
            
            {/* Vista previa de colores */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Vista Previa</h4>
              <div className="flex gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: configuracion.color_primario }}
                >
                  Principal
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: configuracion.color_secundario }}
                >
                  Secundario
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Previa de la App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Vista Previa de la App
          </CardTitle>
          <CardDescription>
            Así se verá la aplicación móvil con la configuración actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-64 h-96 bg-gray-100 rounded-3xl p-4 border-8 border-gray-300">
              {/* Simulación de header de app móvil */}
              <div 
                className="h-16 rounded-t-2xl flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: configuracion.color_primario }}
              >
                {configuracion.logo_url ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={configuracion.logo_url} 
                      alt="Logo" 
                      className="w-8 h-8 object-contain"
                    />
                    <span>{configuracion.nombre_app}</span>
                  </div>
                ) : (
                  <span>{configuracion.nombre_app}</span>
                )}
              </div>
              
              {/* Simulación de contenido de app */}
              <div className="bg-white rounded-b-2xl p-4 h-full">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div 
                    className="h-8 rounded flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: configuracion.color_secundario }}
                  >
                    Botón de Ejemplo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Botón para guardar */}
      <div className="flex justify-end">
        <Button 
          onClick={guardarConfiguracion} 
          disabled={guardando || subiendoLogo}
          className="bg-sky-500 hover:bg-sky-600"
        >
          {subiendoLogo ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Subiendo logo...
            </>
          ) : guardando ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>

    </div>
  )
}