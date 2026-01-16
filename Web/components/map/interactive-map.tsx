"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Route } from "lucide-react"

// Leaflet imports (dynamic to avoid SSR issues)
// let L: any = null
// if (typeof window !== "undefined") {
//   L = require("leaflet")
//   require("leaflet/dist/leaflet.css")

//   // Fix for default markers
//   delete (L.Icon.Default.prototype as any)._getIconUrl
//   L.Icon.Default.mergeOptions({
//     iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//     iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//     shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//   })
// }

const LOJA_COORDS = { lat: -3.99313, lng: -79.20422 }

interface MapMode {
  type: "add-stop" | "create-route" | "select-origin-dest" | "view-only"
  data?: any
}

interface InteractiveMapProps {
  mode: MapMode
  stops: any[]
  routes: any[]
  liveBuses?: any[]
  onBusSelect?: (busId: string) => void
  selectedBusId?: string | null
  onStopAdd?: (lat: number, lng: number) => void
  onStopSelect?: (stop: any) => void
  onRouteStopSelect?: (stopId: string) => void
  selectedStops?: string[]
  className?: string
  initialCenter?: { lat: number; lng: number }
}

export function InteractiveMap({
  mode,
  stops,
  routes,
  liveBuses = [],
  onBusSelect,
  selectedBusId = null,
  onStopAdd,
  onStopSelect,
  onRouteStopSelect,
  selectedStops = [],
  className = "",
}: InteractiveMapProps) {
  const [L, setL] = useState<any>(null) // ← guardará Leaflet
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const busMarkersRef = useRef<Map<string, any>>(new Map())
  const polylinesRef = useRef<Map<string, any>>(new Map())
  const [tempMarker, setTempMarker] = useState<any>(null)

  /* ──────────── Cargar Leaflet dinámicamente ──────────── */
  useEffect(() => {
    if (typeof window === "undefined") return // Solo en cliente
    ;(async () => {
      const leaflet = await import("leaflet")
      await import("leaflet/dist/leaflet.css") // estilos
      // Fix iconos
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })
      setL(leaflet) // ← guardamos Leaflet
    })()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([LOJA_COORDS.lat, LOJA_COORDS.lng], 14)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Try to get user location
    map.locate({ setView: true, maxZoom: 16 })
    map.on("locationfound", (e: any) => {
      // Marcador rojo para "Estás aquí"
      L.marker(e.latlng, {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).addTo(map).bindPopup("¡Estás aquí!").openPopup()
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [L])

  // Handle map clicks based on mode
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng

      if (mode.type === "add-stop") {
        // Remove previous temp marker
        if (tempMarker) {
          mapInstanceRef.current.removeLayer(tempMarker)
        }

        // Add temporary marker (verde para nueva parada)
        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        })
          .addTo(mapInstanceRef.current)
          .bindPopup("Nueva parada - Confirmar ubicación")
          .openPopup()

        setTempMarker(marker)
        onStopAdd?.(lat, lng)
      }
    }

    mapInstanceRef.current.on("click", handleMapClick)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", handleMapClick)
      }
    }
  }, [mode, tempMarker, onStopAdd, L])

  // Render stops on map
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add stop markers
    stops.forEach((stop) => {
      // Support both GTFS and legacy format
      const stopId = (stop as any).stop_id || (stop as any).id
      const stopName = (stop as any).stop_name || (stop as any).name
      const stopLat = (stop as any).stop_lat || (stop as any).lat
      const stopLon = (stop as any).stop_lon || (stop as any).lng

      // Skip stops without coordinates
      if (!stopLat || !stopLon) {
        console.warn(`Stop ${stopId} missing coordinates`, stop)
        return
      }

      // Verificar si la parada está seleccionada (convertir ambos a string para comparar)
      const isSelected = selectedStops.some(id => String(id) === String(stopId))
      const isBus = (stop as any).isBus // Detectar si es un bus

      let iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
      let iconSize: [number, number] = [25, 41]
      let iconAnchor: [number, number] = [12, 41]

      if (isBus) {
        // Icono especial para buses
        const busData = stop as any
        if (busData.isAtStop) {
          iconUrl =
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png"
        } else if (busData.status === "in_transit") {
          iconUrl =
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
        } else {
          iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
        }
        iconSize = [30, 45]
        iconAnchor = [15, 45]
      } else if (isSelected && mode.type === "create-route") {
        // Marcador azul solo para paradas seleccionadas en modo crear ruta
        iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
      } else if (isSelected) {
        // Marcador azul para otros modos (como select-origin-dest)
        iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
      } else {
        // Marcador gris por defecto para paradas no seleccionadas
        iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
      }

      const marker = L.marker([stopLat, stopLon], {
        icon: L.icon({
          iconUrl,
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize,
          iconAnchor,
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).addTo(mapInstanceRef.current)

      // Popup diferente para buses y modo create-route
      if (isBus) {
        const busData = stop as any
        marker.bindPopup(`
        <b>${stopName}</b><br>
        <strong>Estado:</strong> ${busData.isAtStop ? "En parada" : busData.status}<br>
        <strong>Velocidad:</strong> ${busData.speed} km/h<br>
        <strong>Ruta:</strong> ${stop.lines?.[0] || "N/A"}
      `)
      } else if (mode.type === "create-route") {
        const stopIndex = selectedStops.findIndex(id => String(id) === String(stopId))
        if (stopIndex !== -1) {
          marker.bindPopup(`
            <b>${stopName}</b><br>
            <strong style="color: #0284c7;">✓ Parada #${stopIndex + 1} en la ruta</strong><br>
            <small>Haz clic para quitar de la ruta</small>
          `)
        } else {
          marker.bindPopup(`
            <b>${stopName}</b><br>
            <small>Haz clic para añadir a la ruta</small>
          `)
        }
      } else {
        marker.bindPopup(`<b>${stopName}</b><br>Líneas: ${stop.lines?.length || 0}`)
      }

      marker.on("click", () => {
        if (mode.type === "create-route" && !isBus) {
          onRouteStopSelect?.(stopId)
        } else if (!isBus) {
          onStopSelect?.(stop)
        }
      })

      markersRef.current.set(stopId, marker)
    })
  }, [stops, selectedStops, mode, onStopSelect, onRouteStopSelect, L])

  // Render GPS buses on map
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !liveBuses) return

    // Clear existing bus markers
    busMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    busMarkersRef.current.clear()

    // Add bus markers with custom icon
    liveBuses.forEach((bus) => {
      if (!bus.currentLocation?.lat || !bus.currentLocation?.lng) return

      const isSelected = selectedBusId === bus.id

      // Crear un ícono personalizado con emoji de bus
      const busIcon = L.divIcon({
        html: `
          <div style="
            font-size: ${isSelected ? '32px' : '28px'};
            transform: rotate(${bus.heading || 0}deg);
            transition: all 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ${isSelected ? 'animation: pulse 1s infinite;' : ''}
          ">
            🚌
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1) rotate(${bus.heading || 0}deg); }
              50% { transform: scale(1.1) rotate(${bus.heading || 0}deg); }
            }
          </style>
        `,
        className: 'custom-bus-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      })

      const marker = L.marker([bus.currentLocation.lat, bus.currentLocation.lng], {
        icon: busIcon,
        zIndexOffset: 1000, // Asegurar que los buses estén por encima de las paradas
      }).addTo(mapInstanceRef.current)

      // Popup con información del bus
      const conductorInfo = bus.conductorNombre || 'Sin conductor'
      const routeInfo = bus.routeName ? `${bus.routeNumber} - ${bus.routeName}` : 'Sin ruta'
      const speedInfo = bus.speed || 0

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <b>🚌 ${bus.plateNumber}</b><br>
          <strong>Conductor:</strong> ${conductorInfo}<br>
          <strong>Ruta:</strong> ${routeInfo}<br>
          <strong>Velocidad:</strong> ${speedInfo} km/h<br>
          <strong>Coordenadas:</strong> ${bus.currentLocation.lat.toFixed(5)}, ${bus.currentLocation.lng.toFixed(5)}
        </div>
      `)

      marker.on("click", () => {
        if (onBusSelect) {
          onBusSelect(bus.id)
        }
      })

      busMarkersRef.current.set(bus.id, marker)
    })
  }, [liveBuses, selectedBusId, onBusSelect, L])

  // Render routes on map
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => {
      mapInstanceRef.current.removeLayer(polyline)
    })
    polylinesRef.current.clear()

    // Add route polylines
    routes.forEach((route) => {
      // Support both GTFS and legacy format
      const routeId = (route as any).route_id || (route as any).id
      const routeName = (route as any).route_long_name || (route as any).name
      const routeColor = (route as any).route_color || (route as any).color
      const stopIds = (route as any).custom_stop_ids || (route as any).stopIds || []

      if (!stopIds || stopIds.length < 2) return

      const latLngs = stopIds
        .map((stopId: string) => {
          const stop = stops.find((s) => {
            const sId = (s as any).stop_id || (s as any).id
            return sId === stopId
          })
          if (!stop) return null

          const stopLat = (stop as any).stop_lat || (stop as any).lat
          const stopLon = (stop as any).stop_lon || (stop as any).lng

          return stopLat && stopLon ? [stopLat, stopLon] : null
        })
        .filter((coords: any) => coords !== null)

      if (latLngs.length < 2) return

      const polyline = L.polyline(latLngs, {
        color: routeColor ? `#${routeColor.replace('#', '')}` : "#3B82F6",
        weight: 4,
        opacity: 0.7,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${routeName}</b><br>Paradas: ${stopIds.length}`)

      polylinesRef.current.set(routeId, polyline)
    })
  }, [routes, stops, L])

  const confirmTempMarker = () => {
    if (tempMarker) {
      mapInstanceRef.current.removeLayer(tempMarker)
      setTempMarker(null)
    }
  }

  const cancelTempMarker = () => {
    if (tempMarker) {
      mapInstanceRef.current.removeLayer(tempMarker)
      setTempMarker(null)
    }
  }

  if (!L) {
    return (
      <div className={`h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height: '100%', minHeight: '400px' }}>
      <div ref={mapRef} className="w-full rounded-lg z-0" style={{ height: '100%', minHeight: '400px' }} />

      {/* Map controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="p-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {mode.type === "add-stop" && "Añadir Parada"}
              {mode.type === "create-route" && "Crear Ruta"}
              {mode.type === "select-origin-dest" && "Seleccionar Origen/Destino"}
              {mode.type === "view-only" && "Solo Vista"}
            </Badge>
          </div>
        </Card>

        {tempMarker && mode.type === "add-stop" && (
          <Card className="p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nueva parada seleccionada</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmTempMarker} className="bg-sky-500 hover:bg-sky-600">
                  Confirmar
                </Button>
                <Button size="sm" variant="outline" onClick={cancelTempMarker}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-3">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm">Leyenda</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-gray-600" />
              <span>Paradas ({stops.length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Route className="h-3 w-3 text-blue-600" />
              <span>Rutas ({routes.length})</span>
            </div>
            {liveBuses && liveBuses.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span>🚌</span>
                <span>Buses GPS ({liveBuses.length})</span>
              </div>
            )}
            {selectedStops.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span>Seleccionadas ({selectedStops.length})</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
