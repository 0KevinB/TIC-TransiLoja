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
- **Configuración Firebase Web**: [firebaseConfig.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/firebaseConfig.ts)
- **Configuración Firebase Móvil**: [firebaseConfig.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/firebaseConfig.ts)

---

### Sprint 1: Autenticación de Administrador
**Objetivo**: Gestión de Autenticación de Admin  
**Historia de Usuario**: HU3  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Login**: [login/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/login/page.tsx)
- **Hook useAuth**: [useAuth.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/hooks/useAuth.tsx)
- **Contexto de Auth**: [AuthContext.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/context/AuthContext.tsx)
- **Servicio de Autenticación**: [authService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/authService.ts)

#### 🧪 Tests
- **E2E Login**: [login.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/login.cy.ts)
- **Unit useAuth**: [useAuth.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/__tests__/hooks/useAuth.test.tsx)

---

### Sprint 2: Gestión de Paradas y Horarios por Ruta
**Objetivo**: Asociación de Paradas y Horarios  
**Historia de Usuario**: HU5  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Paradas**: [paradas/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/paradas/page.tsx)
- **Servicio de Paradas**: [stopsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/stopsService.ts)
- **Componentes de Paradas**: [stops/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/components/stops)

#### 🧪 Tests
- **E2E Paradas**: [stops.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/stops.cy.ts)

---

### Sprint 3: Gestión Inicial de Rutas
**Objetivo**: Gestión Básica de Rutas  
**Historia de Usuario**: HU4  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Rutas**: [rutas/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/rutas/page.tsx)
- **Servicio de Rutas**: [routesService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/routesService.ts)
- **Componentes de Rutas**: [routes/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/components/routes)

#### 🧪 Tests
- **E2E Rutas**: [routes.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/routes.cy.ts)

---

### Sprint 4: Gestión de Alertas y Notificaciones
**Objetivo**: Gestión de Alertas y Notificaciones para Administrador  
**Historia de Usuario**: HU6  
**Prioridad**: Media | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Alertas**: [alertas/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/alertas/page.tsx)
- **Servicio de Alertas**: [alertsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/alertsService.ts)
- **Componentes de Alertas**: [alerts/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web/components/alerts)

---

### Sprint 5: Gestión de Cuentas de Usuario
**Objetivo**: Gestión de Cuentas de Usuario (Usuario Móvil)  
**Historia de Usuario**: HU7  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla de Login**: [login.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/login.tsx)
- **Pantalla de Registro**: [signup.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/signup.tsx)
- **Contexto de Auth**: [AuthContext.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/context/AuthContext.tsx)
- **Servicio de Auth**: [authService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/authService.ts)

---

### Sprint 6: Implementación del Mapa y Visualización de Paradas
**Objetivo**: Identificación de Paradas en Mapa  
**Historia de Usuario**: HU9  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla Principal con Mapa**: [index.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/index.tsx)
- **Hook de Ubicación**: [useLocation.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useLocation.ts)
- **Utilidades de Ubicación**: [locationUtils.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/utils/locationUtils.ts)
- **Servicio de Paradas**: [stopsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/stopsService.ts)

#### 🧪 Tests
- **Screen Home**: [Home.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/screens/Home.test.tsx)
- **Hook useLocation**: [useLocation.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/hooks/useLocation.test.ts)
- **Integración GPS**: [gps-tracking.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/gps-tracking.integration.test.ts)

---

### Sprint 7: Consulta de Horarios y Detalles de Rutas
**Objetivo**: Visualización de Horarios e Información Detallada de Rutas  
**Historias de Usuario**: HU8, HU10  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla de Rutas**: [routes.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/routes.tsx)
- **Componente RouteCard**: [RouteCard.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/components/RouteCard.tsx)
- **Servicio de Rutas**: [routesService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/routesService.ts)

#### 🧪 Tests
- **Component RouteCard**: [RouteCard.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/components/RouteCard.test.tsx)

---

### Sprint 8: Planificación de Viajes y Gestión de Conductores
**Objetivo**: Planificación de Viajes y Gestión de Conductores  
**Historias de Usuario**: HU12, HU13, HU17  
**Prioridad**: Alta | **Duración**: 1.5 semanas

#### 📁 Código Fuente (Móvil - Planificación)
- **Pantalla de Buscador**: [search.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/search.tsx)
- **Algoritmo RAPTOR**: [raptor.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/algorithms/raptor.ts)
- **Hook useRouteSearch**: [useRouteSearch.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useRouteSearch.ts)

#### 📁 Código Fuente (Web - Conductores)
- **Página de Conductores**: [conductores/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/conductores/page.tsx)
- **Servicio de Conductores**: [driversService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/driversService.ts)

#### 🧪 Tests
- **E2E Búsqueda de Rutas**: [route-search.e2e.js](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/e2e/route-search.e2e.js)
- **Unit RAPTOR**: [raptor.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/__tests__/lib/algorithms/raptor.test.ts)
- **E2E Conductores**: [drivers.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/drivers.cy.ts)

---

### Sprint 9: Funcionalidades de Personalización
**Objetivo**: Rutas Favoritas y Notificaciones Real Time  
**Historias de Usuario**: HU11, HU14  
**Prioridad**: Media | **Duración**: 1.5 semanas

#### 📁 Código Fuente (Móvil)
- **Pantalla de Favoritos**: [favorites.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/favorites.tsx)
- **Hook useFavorites**: [useFavorites.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useFavorites.ts)
- **Servicio de Favoritos**: [favoritesService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/favoritesService.ts)
- **Servicio de Notificaciones**: [notificationsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/notificationsService.ts)

#### 🧪 Tests
- **E2E Favoritos**: [favorites.e2e.js](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/e2e/favorites.e2e.js)
- **Integración Favoritos**: [favorites-offline.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/favorites-offline.integration.test.ts)

---

### Sprint 10: Modo Offline
**Objetivo**: Modo Offline de Consulta  
**Historia de Usuario**: HU15  
**Prioridad**: Media | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Servicio de Caché**: [cacheService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/services/cacheService.ts)
- **Servicio de Sincronización**: [syncService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/services/syncService.ts)
- **Hook de Conectividad**: [useConnectivity.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useConnectivity.ts)
- **Hook de Paradas Cercanas**: [useNearbyStops.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useNearbyStops.ts)

#### 🧪 Tests
- **Integración Offline**: [offline-mode.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/offline-mode.integration.test.ts)
- **Conectividad**: [connectivity.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/connectivity.integration.test.ts)
- **Favoritos Offline**: [favorites-offline.integration.test.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/integration/favorites-offline.integration.test.ts)

---

### Sprint 11: Gestión de Viajes
**Objetivo**: Gestión de Buses y Viajes Simulados  
**Historia de Usuario**: HU16  
**Prioridad**: Alta | **Duración**: 2 semanas

#### 📁 Código Fuente (Web)
- **Página de Buses**: [buses/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/buses/page.tsx)
- **Página de Viajes**: [viajes/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/viajes/page.tsx)
- **Servicio de Buses**: [busesService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/busesService.ts)
- **Servicio de Viajes**: [tripsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/tripsService.ts)
- **Servicio de Simulación**: [busSimulationService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/services/busSimulationService.ts)

#### 🧪 Tests
- **E2E Buses**: [buses.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/buses.cy.ts)
- **E2E Viajes**: [trips.cy.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/cypress/e2e/trips.cy.ts)

---

### Sprint 12: Importación de Datos
**Objetivo**: Módulos para Gestión de Datos de Paradas  
**Historia de Usuario**: HU19  
**Prioridad**: Alta | **Duración**: 2 semanas

#### 📁 Código Fuente (Web)
- **Página de Importación**: [importacion/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/importacion/page.tsx)
- **Servicio de Importación**: [importService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/services/importService.ts)

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
- **Página de Configuración (Web)**: [configuracion/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/configuracion/page.tsx)
- **Servicio de Configuración (Web)**: [settingsService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/settingsService.ts)
- **Hook de Configuración (Móvil)**: [useSettings.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useSettings.ts)

---

### Sprint 14: Vista de Usuarios
**Objetivo**: Módulo de Visualización de Usuarios  
**Historia de Usuario**: HU20  
**Prioridad**: Baja | **Duración**: 1 semana

#### 📁 Código Fuente (Web)
- **Página de Usuarios**: [usuarios/page.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/app/(dashboard)/usuarios/page.tsx)
- **Servicio de Usuarios**: [usersService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/Web/lib/firebase/usersService.ts)

---

### Sprint 15: Buses en Tiempo Real
**Objetivo**: Visualización de Buses en Tiempo Real  
**Historia de Usuario**: HU21  
**Prioridad**: Alta | **Duración**: 1 semana

#### 📁 Código Fuente (Móvil)
- **Pantalla Principal con Buses**: [index.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/app/(tabs)/index.tsx)
- **Componente BusMarker**: [BusMarker.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/components/BusMarker.tsx)
- **Hook useBuses**: [useBuses.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/hooks/useBuses.ts)
- **Servicio de Buses**: [busesService.ts](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/lib/firebase/busesService.ts)

#### 🧪 Tests
- **Component BusMarker**: [BusMarker.test.tsx](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/__tests__/components/BusMarker.test.tsx)
- **E2E Buses**: [bus-tracking.e2e.js](https://github.com/0KevinB/TIC-TransiLoja/blob/main/App-Movil/e2e/bus-tracking.e2e.js)

---

## 📊 Recursos Adicionales

### Documentación General
- **README Principal**: [README.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/README.md)
- **Resultados de Sprints**: [RESULTADOS_SPRINTS.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/RESULTADOS_SPRINTS.md)
- **Seguridad**: [SECURITY.md](https://github.com/0KevinB/TIC-TransiLoja/blob/main/SECURITY.md)

### Anexos
- **Carpeta de Anexos**: [anexos/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos)
- **Resultados Web**: [anexos/Web-Resultados/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos/Web-Resultados)
- **Resultados Móvil**: [anexos/App-Movil-Resultados/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/anexos/App-Movil-Resultados)

### Código Completo
- **Aplicación Web**: [Web/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/Web)
- **Aplicación Móvil**: [App-Movil/](https://github.com/0KevinB/TIC-TransiLoja/tree/main/App-Movil)

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
**Versión**: 1.0
