# 🔗 Enlaces GitHub por Sprint - TransiLoja

Este documento proporciona los enlaces directos al código fuente en GitHub para cada sprint del proyecto TransiLoja.

**Repositorio Principal**: https://github.com/0KevinB/TIC-TransiLoja

---

## 📋 Tabla de Enlaces por Sprint

### Sprint 0: Diseño del Modelo de Base de Datos
**Objetivo**: Definición y Diseño del Modelo de Datos  
**Historia de Usuario**: HU2  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente
- **Esquema de Base de Datos**: [Esquema de datos de TransiLoja.json](https://github.com/0KevinB/TIC-TransiLoja/blob/main/anexos/Esquema%20de%20datos%20de%20TransiLoja.json)
- **Diagrama C4**: [Diagrama-C4-TransiLoja.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/anexos/Diagrama-C4-TransiLoja.md)
- **Configuración Firebase Web**: [firebase.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase.ts)
- **Configuración Firebase Móvil**: [firebase.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase.ts)

---

### Sprint 1: Autenticación de Administrador
**Objetivo**: Gestión de Autenticación de Admin  
**Historia de Usuario**: HU3  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Login**: [page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/page.tsx)
- **Contexto de Autenticación**: [auth-context.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/auth-context.tsx)
- **Layout Dashboard**: [dashboard/layout.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/layout.tsx)
- **Página No Autorizado**: [unauthorized/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/unauthorized/page.tsx)

#### 🧪 Tests
- **E2E Autenticación**: [auth.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/auth.cy.ts)

---

### Sprint 2: Gestión de Paradas y Horarios por Ruta
**Objetivo**: Asociación de Paradas y Horarios  
**Historia de Usuario**: HU5  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Paradas**: [stops/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/stops/page.tsx)
- **Página de Horarios**: [stop-times/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/stop-times/page.tsx)
- **Hook de Paradas**: [useStops.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/hooks/useStops.ts)

#### 🧪 Tests
- **E2E Paradas**: [paradas.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/paradas.cy.ts)

---

### Sprint 3: Gestión Inicial de Rutas
**Objetivo**: Gestión Básica de Rutas  
**Historia de Usuario**: HU4  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Rutas**: [routes/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/routes/page.tsx)
- **Hook de Rutas**: [useRoutes.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/hooks/useRoutes.ts)

#### 🧪 Tests
- **E2E Rutas**: [rutas.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/rutas.cy.ts)

---

### Sprint 4: Gestión de Alertas y Notificaciones
**Objetivo**: Gestión de Alertas y Notificaciones para Administrador  
**Historia de Usuario**: HU6  
**Prioridad**: Media | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Alertas**: [alerts/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/alerts/page.tsx)
- **Servicio de Push Notifications**: [pushNotifications.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/pushNotifications.ts)
- **API Notificaciones**: [api/notifications/send/route.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/api/notifications/send/route.ts)

---

### Sprint 5: Gestión de Cuentas de Usuario
**Objetivo**: Gestión de Cuentas de Usuario (Usuario Móvil)  
**Historia de Usuario**: HU7  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla de Autenticación**: [auth/index.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/auth/index.tsx)
- **Pantalla de Perfil**: [profile.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/profile.tsx)
- **Configuración Firebase**: [firebase.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase.ts)

---

### Sprint 6: Implementación del Mapa y Visualización de Paradas
**Objetivo**: Identificación de Paradas en Mapa  
**Historia de Usuario**: HU9  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla Principal con Mapa**: [index.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/index.tsx)
- **Pantalla de Paradas**: [stops.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/stops.tsx)
- **Detalle de Parada**: [stop-detail.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/stop-detail.tsx)
- **Hook de Ubicación**: [useLocation.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useLocation.ts)
- **Servicio de Google Maps**: [googleMaps.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/googleMaps.ts)

#### 🧪 Tests
- **Screen Home**: [Home.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/screens/Home.test.tsx)
- **Hook useLocation**: [useLocation.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/hooks/useLocation.test.ts)

---

### Sprint 7: Consulta de Horarios y Detalles de Rutas
**Objetivo**: Visualización de Horarios e Información Detallada de Rutas  
**Historias de Usuario**: HU8, HU10  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla de Rutas**: [routes.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/routes.tsx)
- **Lista de Rutas**: [routes-list.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/routes-list.tsx)
- **Detalle de Ruta**: [route-detail.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/route-detail.tsx)
- **Pantalla de Horarios**: [horarios.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/horarios.tsx)
- **Hook de Horarios**: [useStopTimes.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useStopTimes.ts)

#### 🧪 Tests
- **Component RouteCard**: [RouteCard.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/components/RouteCard.test.tsx)

---

### Sprint 8: Planificación de Viajes y Gestión de Conductores
**Objetivo**: Planificación de Viajes y Gestión de Conductores  
**Historias de Usuario**: HU12, HU13, HU17  
**Prioridad**: Alta | **Duración**: 1.5 semanas

#### 📁 Código Fuente (Móvil - Planificación)
- **Pantalla de Exploración/Búsqueda**: [explore.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/explore.tsx)
- **Pantalla de Mapa**: [map.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/map.tsx)
- **Algoritmo RAPTOR**: [raptor.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/raptor.ts)
- **Manager RAPTOR**: [raptorManager.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/raptorManager.ts)
- **Hook de Routing**: [useRouting.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useRouting.ts)
- **Hook de Direcciones**: [useDirections.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useDirections.ts)
- **Búsqueda Optimizada**: [useOptimizedSearch.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useOptimizedSearch.ts)

#### 📁 Código Fuente (Web - Conductores)
- **Página de Conductores**: [drivers/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/drivers/page.tsx)
- **Página de Asignaciones**: [assignments/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/assignments/page.tsx)

#### 🧪 Tests
- **E2E Conductores**: [conductores.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/conductores.cy.ts)

---

### Sprint 9: Funcionalidades de Personalización
**Objetivo**: Rutas Favoritas y Notificaciones Real Time  
**Historias de Usuario**: HU11, HU14  
**Prioridad**: Media | **Duración**: 1.5 semanas

#### 📁 Código Fuente (Móvil)
- **Pantalla de Favoritos**: [favoritos.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/favoritos.tsx)
- **Pantalla de Alertas**: [alertas.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/alertas.tsx)
- **Servicio de Notificaciones**: [notificationService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/notificationService.ts)
- **Hook de Notificaciones**: [useNotifications.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useNotifications.ts)

---

### Sprint 10: Modo Offline
**Objetivo**: Modo Offline de Consulta  
**Historia de Usuario**: HU15  
**Prioridad**: Media | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Servicio de Caché**: [cacheService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/cacheService.ts)
- **Servicio de Datos Offline**: [offlineDataService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/offlineDataService.ts)
- **Storage Offline**: [offlineStorage.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/offlineStorage.ts)
- **Servicio Híbrido**: [hybridDataService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/hybridDataService.ts)
- **Servicio de Red**: [networkService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/networkService.ts)
- **Hook de Cache**: [useCache.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useCache.ts)
- **Hook de Network Status**: [useNetworkStatus.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useNetworkStatus.ts)
- **Hook de Servicios Offline**: [useOfflineServices.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useOfflineServices.ts)
- **Caché de Rutas**: [routeCache.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/routeCache.ts)
- **Caché de Direcciones**: [directionsCache.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/directionsCache.ts)

#### 🧪 Tests
- **Integración Offline**: [offline.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/offline.integration.test.ts)

---

### Sprint 11: Gestión de Viajes
**Objetivo**: Gestión de Buses y Viajes Simulados  
**Historia de Usuario**: HU16  
**Prioridad**: Alta | **Duración**: 2 semanas

#### 📁 Código Fuente (Web)
- **Página de Buses**: [buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/buses/page.tsx)
- **Página de Viajes**: [trips/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/trips/page.tsx)
- **Página de Buses en Vivo**: [live-buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/live-buses/page.tsx)
- **Página de Buses en Tiempo Real**: [real-time-buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/real-time-buses/page.tsx)

#### 📁 Código Fuente (Móvil)
- **Pantalla Mis Buses**: [my-buses.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/my-buses.tsx)
- **Simulador de Bus**: [simulador-bus.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/simulador-bus.tsx)
- **Tracking de Conductor**: [conductor-tracking.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/conductor-tracking.tsx)
- **Servicio de Ubicación del Conductor**: [driverLocationService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/driverLocationService.ts)
- **Hook de Buses en Vivo**: [useLiveBuses.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useLiveBuses.ts)

#### 🧪 Tests
- **E2E Buses**: [buses.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/buses.cy.ts)
- **E2E Viajes**: [viajes.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/viajes.cy.ts)

---

### Sprint 12: Importación de Datos
**Objetivo**: Módulos para Gestión de Datos de Paradas  
**Historia de Usuario**: HU19  
**Prioridad**: Alta | **Duración**: 2 semanas

#### 📁 Código Fuente (Web)
- **Página de Importación**: [import/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/import/page.tsx)
- **Librería GTFS (Web)**: [lib/gtfs/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/lib/gtfs)
- **Servicios GTFS (Web)**: [lib/services/gtfs/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/lib/services/gtfs)
- **Servicios GTFS (Móvil)**: [lib/services/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/lib/services)

#### 📁 Recursos
- **Esquemas GTFS**: [Esquema de archivos GTFS/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos/Esquema%20de%20archivos%20GTFS)
- **Datos OSM**: [Estructura de datos exportados (OSM).geojson](https://github.com/0KevinB/TIC-TransiLoja/blob/main/anexos/Estructura%20de%20datos%20exportados%20(OSM).geojson)
- **Visor de Esquemas**: [Esquemas-Datos.html](https://github.com/0KevinB/TIC-TransiLoja/blob/main/anexos/Esquemas-Datos.html)

---

### Sprint 13: Personalización de Aplicativo
**Objetivo**: Configuración y Personalización Visual  
**Historia de Usuario**: HU18  
**Prioridad**: Media | **Duración**: 1 semana

#### 📁 Código Fuente
- **Página de Configuración (Web)**: [settings/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/settings/page.tsx)
- **Página de Configuración (Móvil)**: [configuracion.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/configuracion.tsx)
- **Hook de Configuración de App**: [useAppConfiguration.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useAppConfiguration.ts)
- **Hook de Preferencias**: [useUserPreferences.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useUserPreferences.ts)
- **Configuración**: [config.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/config.ts)

---

### Sprint 14: Vista de Usuarios
**Objetivo**: Módulo de Visualización de Usuarios  
**Historia de Usuario**: HU20  
**Prioridad**: Baja | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Usuarios**: [users/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/users/page.tsx)

---

### Sprint 15: Buses en Tiempo Real
**Objetivo**: Visualización de Buses en Tiempo Real  
**Historia de Usuario**: HU21  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla Principal con Buses**: [index.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/index.tsx)
- **Pantalla de Buses**: [buses.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/buses.tsx)
- **Hook de Buses en Vivo**: [useLiveBuses.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useLiveBuses.ts)

#### 📁 Código Fuente (Web)
- **Página de Buses en Vivo**: [live-buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/live-buses/page.tsx)
- **Página de Buses en Tiempo Real**: [real-time-buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/dashboard/real-time-buses/page.tsx)

#### 🧪 Tests
- **Component BusMarker**: [BusMarker.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/components/BusMarker.test.tsx)

---

## 📊 Pruebas y Tests

### Tests Web
- **Tests E2E (Cypress)**: [cypress/e2e/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/cypress/e2e)
- **Tests Unitarios**: [__tests__/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/__tests__)

### Tests Móvil
- **Tests de Accesibilidad**: [__tests__/accessibility/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/__tests__/accessibility)
- **Tests de Componentes**: [__tests__/components/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/__tests__/components)
- **Tests de Integración**: [__tests__/integration/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/__tests__/integration)
- **Tests de Performance**: [__tests__/performance/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/__tests__/performance)

---

## 📊 Recursos Adicionales

### Documentación General
- **README Principal**: [README.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/README.md)
- **Resultados de Sprints**: [RESULTADOS_SPRINTS.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/RESULTADOS_SPRINTS.md)
- **Seguridad**: [SECURITY.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/SECURITY.md)

### Anexos y Recursos
- **Carpeta de Anexos**: [anexos/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos)
- **Resultados Web**: [anexos/Web-Resultados/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos/Web-Resultados)
- **Resultados Móvil**: [anexos/App-Movil-Resultados/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos/App-Movil-Resultados)
- **Página de Anexos**: [app/anexos/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/anexos/page.tsx)
- **Diagrama C4**: [app/anexos/diagrama-c4/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/anexos/diagrama-c4/page.tsx)
- **Esquema de Pruebas**: [app/anexos/esquema-pruebas/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/anexos/esquema-pruebas/page.tsx)
- **GTFS**: [app/anexos/gtfs/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/anexos/gtfs/page.tsx)

### Código Completo por Plataforma
- **Aplicación Web**: [Web/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web)
- **Aplicación Móvil**: [App-Movil/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil)

### Servicios y Utilidades
- **Servicios Web**: [Web/lib/services/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/lib/services)
- **Servicios Móvil**: [App-Movil/lib/services/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/lib/services)
- **Hooks Web**: [Web/hooks/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/hooks)
- **Hooks Móvil**: [App-Movil/hooks/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil/hooks)

---

## 📝 Notas Importantes

> [!IMPORTANT]
> Este repositorio contiene todo el código de los 16 sprints en la rama `main`. Los enlaces apuntan a archivos y carpetas específicas donde se encuentra implementada cada funcionalidad.

> [!NOTE]
> Algunos archivos pueden contener código de múltiples sprints, ya que las funcionalidades se fueron expandiendo y mejorando a lo largo del proyecto.

> [!WARNING]
> El repositorio es de demostración. Ciertas credenciales y archivos sensibles han sido excluidos por motivos de seguridad (ver [SECURITY.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/SECURITY.md)).

---

**Última actualización**: Enero 2026  
**Versión**: 2.0  
**Nota**: Todos los enlaces han sido verificados contra la estructura real del repositorio.
