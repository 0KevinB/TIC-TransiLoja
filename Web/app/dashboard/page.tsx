"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Route, Users, AlertTriangle, TrendingUp, Clock, Radio, Bus, Calendar, Navigation, Globe, ArrowRight } from "lucide-react"

interface DashboardStats {
  totalStops: number
  totalRoutes: number
  totalUsers: number
  totalBuses: number
  activeAlerts: number
  liveBuses: number
  totalTrips: number
  totalCalendars: number
}

interface RecentAlert {
  id: string
  title: string
  type: "info" | "warning" | "error" | "success"
  createdAt: Date
}

interface RecentTrip {
  id: string
  routeName: string
  busPlate: string
  startTime: string
  createdAt: Date
}

export default function Dashboard() {
  const { user: currentUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStops: 0,
    totalRoutes: 0,
    totalUsers: 0,
    totalBuses: 0,
    activeAlerts: 0,
    liveBuses: 0,
    totalTrips: 0,
    totalCalendars: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // Cargar stats de forma progresiva para mejorar LCP
    fetchStatsProgressive()
    // Cargar actividad después (prioridad baja)
    setTimeout(() => fetchRecentActivity(), 100)
  }, [])

  useEffect(() => {
    // Set current date only on client to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
  }, [])

  // Carga progresiva de estadísticas para mejorar LCP
  const fetchStatsProgressive = async () => {
    try {
      // Cargar las stats más importantes primero (critical path)
      const criticalStats = await Promise.all([
        getCountFromServer(collection(db, "stops")),
        getCountFromServer(collection(db, "routes")),
        getCountFromServer(collection(db, "buses")),
      ]);

      setStats(prev => ({
        ...prev,
        totalStops: criticalStats[0].data().count,
        totalRoutes: criticalStats[1].data().count,
        totalBuses: criticalStats[2].data().count,
      }));

      // Mostrar contenido crítico inmediatamente
      setLoading(false);

      // Cargar stats secundarias en segundo plano
      const secondaryStats = await Promise.all([
        getCountFromServer(collection(db, "trips")),
        getCountFromServer(collection(db, "users")),
        getCountFromServer(query(collection(db, "alerts"), where("isActive", "==", true))),
        getCountFromServer(collection(db, "liveBuses")),
        getCountFromServer(collection(db, "calendars")),
      ]);

      setStats(prev => ({
        ...prev,
        totalTrips: secondaryStats[0].data().count,
        totalUsers: secondaryStats[1].data().count,
        activeAlerts: secondaryStats[2].data().count,
        liveBuses: secondaryStats[3].data().count,
        totalCalendars: secondaryStats[4].data().count,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent alerts
      const recentAlertsSnap = await getDocs(query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(3)));
      const alerts: RecentAlert[] = recentAlertsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          type: data.type,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setRecentAlerts(alerts);

      // Fetch recent trips and their related data efficiently to avoid N+1 queries
      const recentTripsSnap = await getDocs(query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(3)));
      const tripDocs = recentTripsSnap.docs;

      if (tripDocs.length > 0) {
        const routeIds = [...new Set(tripDocs.map(doc => doc.data().routeId).filter(id => id))];
        const busIds = [...new Set(tripDocs.map(doc => doc.data().busId).filter(id => id))];

        const routesDataMap = new Map<string, any>();
        if (routeIds.length > 0) {
          // Firestore "in" queries are limited to 10 items
          const limitedRouteIds = routeIds.slice(0, 10);
          const routesQuery = query(collection(db, "routes"), where("__name__", "in", limitedRouteIds));
          const routesSnapshot = await getDocs(routesQuery);
          routesSnapshot.forEach(doc => routesDataMap.set(doc.id, doc.data()));
        }

        const busesDataMap = new Map<string, any>();
        if (busIds.length > 0) {
          // Firestore "in" queries are limited to 10 items
          const limitedBusIds = busIds.slice(0, 10);
          const busesQuery = query(collection(db, "buses"), where("__name__", "in", limitedBusIds));
          const busesSnapshot = await getDocs(busesQuery);
          busesSnapshot.forEach(doc => busesDataMap.set(doc.id, doc.data()));
        }

        const trips: RecentTrip[] = tripDocs.map(tripDoc => {
          const tripData = tripDoc.data();
          const routeData = routesDataMap.get(tripData.routeId);
          const routeName = (routeData?.route_short_name || routeData?.shortName) || "Ruta desconocida";
          const busPlate = busesDataMap.get(tripData.busId)?.plateNumber || "Bus desconocido";
          return {
            id: tripDoc.id,
            routeName,
            busPlate,
            startTime: tripData.startTime,
            createdAt: tripData.createdAt?.toDate() || new Date(),
          };
        });
        setRecentTrips(trips);
      } else {
        setRecentTrips([]);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  }

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      case "success":
        return "default"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton - mismo tamaño que el real */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="h-9 w-64 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-96 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>

        {/* Stats Grid Skeleton - con altura fija para evitar CLS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 min-h-[272px]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[120px] bg-gray-200 animate-pulse rounded-lg border-2 border-transparent" />
          ))}
        </div>

        {/* Quick Actions Skeleton - altura fija */}
        <div className="h-[220px] bg-gray-200 animate-pulse rounded-lg" />

        {/* System Status Skeleton - altura fija */}
        <div className="h-[180px] bg-gray-200 animate-pulse rounded-lg" />

        {/* Recent Activity Skeleton - altura fija */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Bienvenido, {currentUser?.name || "Usuario"}
            </h1>
            {currentUser?.role === "admin" && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                Administrador
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Resumen del sistema de transporte TransiLoja{currentDate && ` • ${currentDate}`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 min-h-[272px]">
        <StatsCard
          title="Paradas"
          value={stats.totalStops}
          icon={MapPin}
          borderColorClass="border-sky-500"
          iconColorClass="text-sky-500"
        />

        <StatsCard
          title="Rutas"
          value={stats.totalRoutes}
          icon={Route}
          borderColorClass="border-emerald-500"
          iconColorClass="text-emerald-500"
        />

        <StatsCard
          title="Buses"
          value={stats.totalBuses}
          icon={Bus}
          borderColorClass="border-amber-500"
          iconColorClass="text-amber-500"
        />

        <StatsCard
          title="Viajes"
          value={stats.totalTrips}
          icon={Clock}
          borderColorClass="border-indigo-500"
          iconColorClass="text-indigo-500"
        />

        <StatsCard
          title="Buses en Vivo"
          value={stats.liveBuses}
          icon={Radio}
          borderColorClass="border-rose-500"
          iconColorClass="text-rose-500"
        />

        <StatsCard
          title="Calendarios"
          value={stats.totalCalendars}
          icon={Calendar}
          borderColorClass="border-cyan-500"
          iconColorClass="text-cyan-500"
        />

        <StatsCard
          title="Usuarios"
          value={stats.totalUsers}
          icon={Users}
          borderColorClass="border-lime-500"
          iconColorClass="text-lime-500"
        />

        <StatsCard
          title="Alertas Activas"
          value={stats.activeAlerts}
          icon={AlertTriangle}
          borderColorClass="border-pink-500"
          iconColorClass="text-pink-500"
        />
      </div>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Herramientas principales del sistema TransiLoja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <a
              href="/dashboard/drivers"
              className="group flex items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Gestión de Conductores</h3>
                <p className="text-sm text-gray-500">Administrar conductores</p>
              </div>
            </a>

            <a
              href="/dashboard/municipalities"
              className="group flex items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Personalización</h3>
                <p className="text-sm text-gray-500">Logo, colores, nombre de app</p>
              </div>
            </a>

            <a
              href="/dashboard/live-buses"
              className="group flex items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Radio className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Monitoreo en Vivo</h3>
                <p className="text-sm text-gray-500">Ubicación de buses</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            Estado del Sistema
          </CardTitle>
          <CardDescription>Indicadores clave de rendimiento del sistema de transporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Cobertura de Paradas</span>
                <span className="text-sm font-bold text-sky-700">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-sky-500 to-sky-700 h-3 rounded-full transition-all duration-500 shadow-lg" style={{ width: "85%" }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Buses Activos</span>
                <span className="text-sm font-bold text-emerald-700">72%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-3 rounded-full transition-all duration-500 shadow-lg" style={{ width: "72%" }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Precisión de Horarios</span>
                <span className="text-sm font-bold text-amber-700">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-amber-500 to-amber-700 h-3 rounded-full transition-all duration-500 shadow-lg" style={{ width: "68%" }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Satisfacción de Usuarios</span>
                <span className="text-sm font-bold text-purple-600">91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-lg" style={{ width: "91%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertTriangle className="h-5 w-5 text-pink-600" />
              </div>
              Alertas Recientes
            </CardTitle>
            <CardDescription>Últimas alertas del sistema de transporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.02] border border-gray-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.createdAt.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant={getAlertBadgeVariant(alert.type)} className="capitalize">
                      {alert.type === 'error' ? 'Error' : alert.type === 'warning' ? 'Advertencia' : alert.type === 'success' ? 'Éxito' : 'Info'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay alertas recientes</p>
                </div>
              )}
            </div>
            {recentAlerts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <a
                  href="/dashboard/alerts"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
                >
                  Ver más alertas
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              Viajes Recientes
            </CardTitle>
            <CardDescription>Últimos viajes programados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-3">
              {recentTrips.length > 0 ? (
                recentTrips.map((trip, index) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.02] border border-gray-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bus className="h-4 w-4 text-indigo-600" />
                        <p className="text-sm font-semibold text-gray-900">
                          {trip.routeName}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">
                        Bus: {trip.busPlate}
                      </p>
                      <p className="text-xs text-gray-500 ml-6 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {trip.startTime} • {trip.createdAt.toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Programado
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bus className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay viajes recientes</p>
                </div>
              )}
            </div>
            {recentTrips.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <a
                  href="/dashboard/trips"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Ver más viajes
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
