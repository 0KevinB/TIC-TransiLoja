# TransiLoja

# 🚍 Sistema de Transporte Público de Loja

> [!IMPORTANT]
> **Repositorio Público - Versión No Funcional**
> 
> Este es un repositorio público que muestra el código fuente del proyecto TransiLoja con fines demostrativos. 
> 
> **Las credenciales de API, claves de Firebase y archivos de configuración sensibles han sido removidos por seguridad.** Para ejecutar el proyecto localmente, necesitarás:
> - Crear tu propio proyecto de Firebase
> - Obtener tus propias API keys de Google Maps
> - Configurar archivos de entorno según los ejemplos proporcionados
> 
> Este repositorio demuestra la arquitectura, implementación técnica y calidad del código desarrollado.
> 
> 📋 **[Ver Política de Seguridad](./SECURITY.md)** - Información detallada sobre qué datos fueron removidos.

Una solución tecnológica integral para la gestión y consulta del transporte urbano en la ciudad de Loja, Ecuador. El proyecto incluye un dashboard administrativo web y una aplicación móvil para usuarios.

> 📚 **[Ver Anexos Técnicos](https://transi-loja.vercel.app/anexos)** - Diagramas de arquitectura, esquemas de datos y resultados de pruebas disponibles públicamente en la web.

---

## 📱 ¿Qué es TransiLoja?

TransiLoja es un sistema completo de gestión de transporte público que consta de dos componentes principales:

1. **Aplicación Web**: Dashboard administrativo para la gestión del sistema de transporte (rutas, buses, conductores, viajes, tarifas, etc.)
2. **Aplicación Móvil**: App para usuarios que permite consultar rutas optimizadas, ver buses en tiempo real y recibir alertas

---

## 🌟 Características Principales

### Para Administradores (Web)
- 📊 **Dashboard de métricas**: Visualización de KPIs operativos y financieros
- 🚌 **Gestión de flota**: Administración de buses, conductores y asignaciones
- 🗺️ **Gestión de rutas**: Creación y edición de rutas y paradas
- 🎫 **Sistema de tarifas**: Gestión de precios y tipos de tarifas
- 📍 **Tracking en vivo**: Monitoreo de buses en tiempo real
- 🚨 **Sistema de alertas**: Notificaciones para usuarios
- 📈 **Reportes**: Generación de reportes operativos y financieros

### Para Usuarios (Móvil)
- 🗺️ **Planificador de rutas**: Búsqueda optimizada usando algoritmo RAPTOR
- 🚌 **Buses en vivo**: Visualización de buses en tiempo real
- 📍 **Paradas cercanas**: Encuentra paradas próximas a tu ubicación
- 🚨 **Alertas**: Recibe notificaciones sobre el servicio
- 👤 **Perfil de usuario**: Gestión de cuenta y preferencias

---

## 🛠️ Tecnologías Utilizadas

### Aplicación Web (`/Web`)
- **Framework**: Next.js 15.2.4 (App Router) + TypeScript
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Mapas**: Leaflet
- **Algoritmo de rutas**: RAPTOR (Routing Algorithm for Public Transport Optimization)
- **Gestión de paquetes**: pnpm

### Aplicación Móvil (`/App-Movil`)
- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Mapas**: react-native-maps (Google Maps SDK)
- **Navegación**: Expo Router / React Navigation
- **Estilos**: NativeWind (Tailwind para React Native)
- **Algoritmo de rutas**: RAPTOR

### Backend y Base de Datos
- **Firebase Auth**: Autenticación de usuarios
- **Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Storage**: Almacenamiento de archivos
- **Cloud Functions**: Funciones serverless (futuro)

---

## 🚀 Inicio Rápido

### Aplicación Web

```bash
cd Web/
npm install
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`

**Comandos disponibles:**
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run lint` - Linting
- `npm start` - Servidor de producción

### Aplicación Móvil

```bash
cd App-Movil/
npm install
npx expo start
```

**Comandos disponibles:**
- `npx expo start` - Iniciar servidor Expo
- `npx expo run:android` - Ejecutar en Android
- `npx expo run:ios` - Ejecutar en iOS (solo macOS)
- `eas build -p android` - Build para Android
- `eas build -p ios` - Build para iOS

---

## 📁 Estructura del Proyecto

```
TransiLoja/
├── Web/                    # Aplicación web (Next.js)
│   ├── app/               # App Router de Next.js
│   ├── components/        # Componentes reutilizables
│   ├── lib/              # Utilidades, tipos, Firebase config
│   └── hooks/            # Hooks personalizados
│
├── App-Movil/             # Aplicación móvil (Expo)
│   ├── app/              # Navegación principal
│   ├── components/       # Componentes reutilizables
│   ├── lib/             # Configuración Firebase y utilidades
│   ├── hooks/           # Hooks personalizados
│   ├── context/         # Contextos globales
│   └── screens/         # Pantallas principales
│
├── firebase.json          # Configuración de Firebase
├── firestore.rules       # Reglas de seguridad de Firestore
└── firestore.indexes.json # Índices de Firestore
```

---

## 🧩 Módulos del Sistema

### Dashboard Web
- Dashboard principal
- Paradas
- Rutas
- Buses
- Conductores
- Viajes
- Buses en Vivo
- Alertas
- Tarifas
- Usuarios
- Municipios

### App Móvil
- Home (mapa y buses en vivo)
- Planificador de rutas
- Paradas cercanas
- Alertas y notificaciones
- Perfil de usuario

---

## 🔐 Configuración de Seguridad

### ⚠️ Archivos Requeridos (No Incluidos)

Los siguientes archivos contienen información sensible y **NO están incluidos** en este repositorio público. Debes crearlos siguiendo los ejemplos proporcionados:

#### Aplicación Web
- **`Web/.env.local`** - Variables de entorno para Next.js
  - Ver [`Web/.env.example`](./Web/.env.example) como plantilla

#### Aplicación Móvil  
- **`App-Movil/.env`** - Variables de entorno para Expo
  - Ver [`App-Movil/.env.example`](./App-Movil/.env.example) como plantilla
- **`App-Movil/android/app/google-services.json`** - Configuración Firebase para Android
  - Ver [`App-Movil/android/app/google-services.json.example`](./App-Movil/android/app/google-services.json.example) como plantilla

### 📋 Configuración Paso a Paso

#### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Habilita los siguientes servicios:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**
   - **Cloud Messaging** (para notificaciones push)

#### 2. Configurar Aplicación Web

```bash
cd Web/
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local y completar con tus credenciales de Firebase
# Obtén estas credenciales desde Firebase Console > Project Settings > General
```

**Variables requeridas en `Web/.env.local`:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Para pruebas E2E (crea un usuario de prueba en Firebase)
CYPRESS_TEST_USER_EMAIL=test@example.com
CYPRESS_TEST_USER_PASSWORD=tu_password_prueba
LIGHTHOUSE_TEST_EMAIL=test@example.com
LIGHTHOUSE_TEST_PASSWORD=tu_password_prueba
```

#### 3. Configurar Aplicación Móvil

```bash
cd App-Movil/
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y completar con tus credenciales
```

**Variables requeridas en `App-Movil/.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_key
EXPO_PUBLIC_PROJECT_ID=tu_expo_project_id
```

**Configurar `google-services.json` para Android:**

1. En Firebase Console, ve a tu proyecto
2. Añade una app Android con package name: `com.transiloja.app`
3. Descarga el archivo `google-services.json`
4. Colócalo en `App-Movil/android/app/google-services.json`

#### 4. Obtener Google Maps API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps SDK for Android
   - Places API
   - Directions API
   - Distance Matrix API
   - Geocoding API
4. Crea credenciales (API Key)
5. Agrega la API key a tus archivos `.env`

#### 5. Configurar Firestore (Opcional pero Recomendado)

Si deseas usar datos de ejemplo, puedes importar la estructura de base de datos:

```bash
# Las reglas de seguridad están en firestore.rules
# Los índices requeridos están en firestore.indexes.json
```

---

## 🚀 Inicio Rápido

> **Nota**: Asegúrate de completar la [Configuración de Seguridad](#-configuración-de-seguridad) antes de continuar.

### Aplicación Web

Proyecto en desarrollo activo con funcionalidades core implementadas.

### Implementado
- Sistema de autenticación
- CRUD completo para todas las entidades
- Algoritmo RAPTOR para optimización de rutas
- Tracking de buses en tiempo real
- Sistema de alertas
- Reportes operativos y financieros
- Suite de pruebas (unitarias, integración, E2E, accesibilidad)

### En Desarrollo
- Mejoras en la experiencia de usuario móvil
- Optimizaciones de rendimiento
- Funcionalidades offline avanzadas

---

## 🧪 Testing

El proyecto incluye una suite completa de pruebas:

```bash
# En /Web
npm run test              # Pruebas unitarias
npm run test:e2e         # Pruebas E2E
npm run test:a11y        # Pruebas de accesibilidad
npm run test:coverage    # Cobertura de pruebas
```

### 📊 Resultados de Pruebas

- 📋 **[RESULTADOS_SPRINTS.md](./RESULTADOS_SPRINTS.md)**: Documento completo con resultados detallados de los 16 sprints, incluyendo:
  - Resultados funcionales por sprint
  - Pruebas realizadas con tasas de éxito
  - 319 tests totales (Web: 100% éxito - 106 tests, Móvil: 89.2% éxito - 213 tests)
  - Métricas de calidad y cobertura de código
- 📊 **[Esquema de Pruebas](./anexos/Esquema%20de%20pruebas%20TransiLoja%20-%20Hoja%201.csv)**: Listado completo de 96 casos de prueba

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📚 Documentación

Para más información sobre el desarrollo y arquitectura del proyecto, consulta:
- **[RESULTADOS_SPRINTS.md](./RESULTADOS_SPRINTS.md)**: Resultados detallados de los 16 sprints con tests y funcionalidades
- **[CLAUDE.md](./CLAUDE.md)**: Guía completa de desarrollo
- **[anexos/](./anexos/)**: Diagramas, esquemas de datos y resultados de pruebas

---

## 📄 Licencia

Este proyecto se desarrolla con fines académicos y comunitarios. Su uso es libre siempre que se reconozca la autoría correspondiente.

---

## 👥 Autores

Proyecto desarrollado como parte de un proyecto académico para mejorar el transporte público en Loja, Ecuador.
