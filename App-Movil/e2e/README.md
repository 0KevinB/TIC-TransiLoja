# Tests E2E con Maestro para TransiLoja

Esta carpeta contiene los tests end-to-end (E2E) para la aplicación móvil TransiLoja, usando [Maestro](https://maestro.mobile.dev/).

## 🚀 Inicio Rápido (Expo Go)

### ⚠️ IMPORTANTE con Expo Go

Las pruebas de Expo Go **NO pueden lanzar la app automáticamente**. Debes seguir estos pasos en orden:

### Paso 1: Abre la app en Expo Go

**Terminal 1:**
```bash
cd App-Movil
npx expo start
```

Luego presiona `a` para abrir en Android (o abre manualmente en Expo Go).

**Espera** a que la app cargue completamente y veas el home screen de TransiLoja.

### Paso 2: Ejecuta las pruebas

**Terminal 2 (PowerShell):**
```powershell
cd App-Movil
.\e2e\run-tests.ps1 expo-simple-test
```

**Linux/macOS:**
```bash
cd App-Movil
chmod +x e2e/run-tests.sh  # Solo la primera vez
./e2e/run-tests.sh expo-simple-test
```

### Paso 3: Pruebas adicionales

```powershell
# Login completo
.\e2e\run-tests.ps1 expo-login

# Suite completa
.\e2e\run-tests.ps1 expo-full-flow
```

**Los resultados se guardarán en:** `Resultados/Maestro/`

**Credenciales de prueba:**
- Email: `carolalvaradojime@gmail.com`
- Password: `123456`

## 📋 Requisitos Previos

### Instalación de Maestro

**Windows:**
```powershell
# Usando curl (requiere curl.exe disponible)
curl -Ls "https://get.maestro.mobile.dev" | bash

# O descargar manualmente desde: https://github.com/mobile-dev-inc/maestro/releases
```

**macOS/Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Verifica la instalación:
```bash
maestro --version
```

### Configuración de Android

1. **Android Studio** o **Android SDK** instalado
2. **ADB** disponible en el PATH
3. **Emulador Android** o **dispositivo físico** conectado
4. **Expo Go** instalado en el dispositivo/emulador

Para instalar Expo Go:
- Desde Google Play Store, o
- Via ADB: `adb install expo-go.apk`

## 🧪 Credenciales de Prueba

Los tests usan las siguientes credenciales configuradas:

- **Email:** `carolalvaradojime@gmail.com`
- **Password:** `123456`

Estas credenciales están configuradas en:
- `scripts/test-expo-go.sh` (Linux/macOS)
- `scripts/test-expo-go.ps1` (Windows)

## 🚀 Ejecución de Tests

### ⚠️ IMPORTANTE: Modo Desarrollo vs Producción

**Si estás usando `npx expo start` (Development Client):**
- Usa las pruebas con el servidor corriendo
- NO uses `clearState: true` (desconecta el dev server)
- Ejecuta: `maestro test e2e/dev-simple-test.yaml`

**Si tienes un build de producción/release:**
- Usa las pruebas normales con `clearState: true`
- Ejecuta: `maestro test e2e/login.yaml` o cualquier otra

### Opción 1: Con Expo Development Client (Desarrollo)

**Requisitos:**
1. Servidor Expo corriendo: `npx expo start`
2. App instalada en el emulador/dispositivo
3. App conectada al servidor de desarrollo

**Ejecutar prueba simple:**
```powershell
# Con el servidor Expo corriendo en otra terminal
maestro test e2e/dev-simple-test.yaml
```

### Opción 2: Con Expo Go (Recomendado para desarrollo)

**Windows:**
```powershell
# Ejecutar todos los tests
.\scripts\test-expo-go.ps1

# Ejecutar un test específico
.\scripts\test-expo-go.ps1 login
.\scripts\test-expo-go.ps1 accessibility-modes
```

**Linux/macOS:**
```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/test-expo-go.sh

# Ejecutar todos los tests
./scripts/test-expo-go.sh

# Ejecutar un test específico
./scripts/test-expo-go.sh login
```

**Usando npm scripts:**
```bash
npm run test:e2e:expo
```

### Opción 2: Con Build Nativo (APK)

```bash
# Primero, generar el APK
npm run android

# Ejecutar tests
npm run test:e2e
```

### Opción 3: Tests Individuales con Expo Go ⭐

**Pruebas para Expo Go (recomendadas):**

```bash
# Prueba simple (30 segundos)
maestro test e2e/expo-simple-test.yaml

# Autenticación completa (1 minuto)
maestro test e2e/expo-login.yaml

# Navegación por tabs (1 minuto)
maestro test e2e/expo-navigation.yaml

# Sistema de alertas (45 segundos)
maestro test e2e/expo-alerts.yaml

# Configuración y accesibilidad (1 minuto)
maestro test e2e/expo-settings.yaml

# Suite completa (4-6 minutos)
maestro test e2e/expo-full-flow.yaml
```

### Opción 4: Tests con Build Nativo

**Pruebas para build nativo (com.transiloja.app):**

```bash
# Suite completa (ejecuta todos los flujos)
maestro test e2e/full-flow.yaml

# Autenticación (login, logout, modo invitado)
maestro test e2e/login.yaml

# Navegación por tabs
maestro test e2e/navigation.yaml

# Home screen y acciones rápidas
maestro test e2e/home.yaml

# Sistema de alertas
maestro test e2e/alerts.yaml

# Búsqueda de paradas
maestro test e2e/stops.yaml

# Configuración y accesibilidad
maestro test e2e/settings.yaml
```

## 📁 Estructura de Tests

### Tests para Build Nativo (appId: com.transiloja.app)
```
e2e/
├── login.yaml          # Test de autenticación (login, logout, modo invitado)
├── navigation.yaml     # Navegación por tabs y pantallas principales
├── home.yaml           # Home screen y acciones rápidas
├── alerts.yaml         # Sistema de alertas y filtros
├── stops.yaml          # Búsqueda y visualización de paradas
├── settings.yaml       # Configuración y accesibilidad
├── full-flow.yaml      # Suite completa
├── simple-test.yaml    # Prueba simple de verificación
└── dev-simple-test.yaml # Prueba para Development Client
```

### Tests para Expo Go (appId: host.exp.exponent) ⭐ RECOMENDADO
```
e2e/
├── expo-simple-test.yaml    # Prueba simple para verificar setup
├── expo-login.yaml          # Autenticación completa
├── expo-navigation.yaml     # Navegación por tabs
├── expo-alerts.yaml         # Sistema de alertas
├── expo-settings.yaml       # Configuración y accesibilidad
└── expo-full-flow.yaml      # Suite completa (4-6 minutos)
```

## 🔧 Configuración de Variables de Entorno

Los tests soportan variables de entorno para flexibilidad:

### APP_ID
- **Por defecto:** `com.transiloja.app` (build nativo)
- **Expo Go:** `host.exp.exponent`

### TEST_USER_EMAIL
- Email del usuario de prueba
- Por defecto: `carolalvaradojime@gmail.com`

### TEST_USER_PASSWORD
- Contraseña del usuario de prueba
- Por defecto: `123456`

### Uso Manual de Variables

```bash
# Ejecutar con variables personalizadas
maestro test e2e/login.yaml \
  --env APP_ID=host.exp.exponent \
  --env TEST_USER_EMAIL=otro@email.com \
  --env TEST_USER_PASSWORD=otrapass
```

## 📊 Resultados de Tests

Los resultados se guardan en:
```
Resultados/Maestro/
├── flows/          # Reportes JUnit XML
└── screenshots/    # Capturas en caso de fallo
```

## 🐛 Troubleshooting

### Error: "Expo Go no está instalado"
**Solución:** Instala Expo Go desde Play Store o:
```bash
# Descarga el APK desde expo.dev e instala
adb install expo-go.apk
```

### Error: "No hay dispositivo conectado"
**Solución:**
```bash
# Verificar dispositivos
adb devices

# Iniciar emulador si es necesario
# O conectar dispositivo físico con USB debugging habilitado
```

### Error: "Servidor Expo no responde"
**Solución:**
```bash
# Matar procesos de Expo anteriores
# Windows (PowerShell)
Get-Process | Where-Object {$_.ProcessName -like "*expo*"} | Stop-Process

# Linux/macOS
pkill -f "expo start"

# Reiniciar
npm run start:clean
```

### El test falla en "launchApp"
**Solución para Expo Go:**
1. Asegúrate de que la app esté corriendo en Expo (`npm run start`)
2. Abre la app manualmente en Expo Go primero
3. Verifica que `APP_ID=host.exp.exponent` esté configurado

### Error de timeout en pasos de login
**Solución:**
- Aumenta los timeouts en `login.yaml` si tu dispositivo es lento
- Verifica la conexión de red (el login requiere backend)
- Confirma que las credenciales sean correctas

## 📖 Descripción de Tests

### Tests para Expo Go (Prefijo `expo-`)

#### expo-simple-test.yaml - Verificación Básica
**Cubre:**
- ✅ Lanzamiento de Expo Go
- ✅ Carga de la app en Expo
- ✅ Verificación de home screen
- ✅ Navegación básica (Alertas → Inicio)

**Duración aproximada:** 30 segundos

#### expo-login.yaml - Autenticación Completa
**Cubre:**
- ✅ Detección automática de estado (login/home)
- ✅ Logout si hay sesión activa
- ✅ Login con credenciales
- ✅ Logout completo
- ✅ Modo invitado

**Duración aproximada:** 1-2 minutos

#### expo-navigation.yaml - Navegación
**Cubre:**
- ✅ Navegación por todas las tabs (Inicio, Alertas, Servicio, Favoritos, Ajustes)
- ✅ Navegación a pantalla de Paradas
- ✅ Back navigation
- ✅ Verificación de contenido en cada tab

**Duración aproximada:** 1 minuto

#### expo-alerts.yaml - Sistema de Alertas
**Cubre:**
- ✅ Navegación a alertas
- ✅ Filtros (Todas, Activas, Próximas, Finalizadas)
- ✅ Pull to refresh

**Duración aproximada:** 45 segundos

#### expo-settings.yaml - Configuración
**Cubre:**
- ✅ Cambio de tema (Claro, Oscuro, Alto Contraste)
- ✅ Cambio de tamaño de fuente (Normal, Grande)
- ✅ Verificación de persistencia de cambios

**Duración aproximada:** 1 minuto

#### expo-full-flow.yaml - Suite Completa
**Cubre:**
- ✅ **Todos los flujos anteriores en secuencia**
- ✅ Setup automático de estado inicial
- ✅ Autenticación → Navegación → Alertas → Paradas → Configuración → Logout → Modo Invitado

**Duración aproximada:** 4-6 minutos

---

### Tests para Build Nativo (Sin prefijo)

### 1. login.yaml - Autenticación
**Cubre:**
- ✅ Login exitoso con credenciales válidas
- ✅ Verificación del home screen después del login
- ✅ Logout con confirmación
- ✅ Modo invitado (guest access)

**Duración aproximada:** 30-45 segundos

### 2. navigation.yaml - Navegación
**Cubre:**
- ✅ Navegación por todas las tabs principales (Inicio, Alertas, Servicio, Favoritos, Ajustes)
- ✅ Navegación a pantallas específicas desde home
- ✅ Navegación a Paradas y Horarios
- ✅ Verificación de back navigation

**Duración aproximada:** 45-60 segundos

### 3. home.yaml - Home Screen
**Cubre:**
- ✅ Verificación de todas las acciones rápidas (Ver Mapa, Planificar Viaje, Rutas, Paradas, Horarios, En Vivo)
- ✅ Indicador de modo invitado
- ✅ Mensaje de bienvenida
- ✅ Pull to refresh
- ✅ Interacción con cada acción rápida

**Duración aproximada:** 60-90 segundos

### 4. alerts.yaml - Sistema de Alertas
**Cubre:**
- ✅ Navegación a la pestaña de alertas
- ✅ Verificación de filtros (Todas, Activas, Próximas, Finalizadas)
- ✅ Aplicación de cada filtro
- ✅ Apertura de detalles de alerta (si existen)
- ✅ Pull to refresh

**Duración aproximada:** 30-45 segundos

### 5. stops.yaml - Búsqueda de Paradas
**Cubre:**
- ✅ Navegación a pantalla de paradas
- ✅ Búsqueda por texto
- ✅ Limpieza de búsqueda
- ✅ Filtro de paradas cercanas (si está disponible)
- ✅ Selección de parada y visualización de detalles
- ✅ Scroll en lista de paradas

**Duración aproximada:** 45-60 segundos

### 6. settings.yaml - Configuración y Accesibilidad
**Cubre:**
- ✅ Navegación a configuración
- ✅ Verificación de modo invitado
- ✅ Cambio de tema (Claro, Oscuro, Alto Contraste)
- ✅ Cambio de tamaño de fuente (Normal, Grande, Muy Grande)
- ✅ Visualización de "Acerca de TransiLoja"

**Duración aproximada:** 60-75 segundos

### 7. full-flow.yaml - Suite Completa
**Cubre:**
- ✅ **Todos los flujos anteriores en secuencia**
- ✅ Login → Navegación → Home → Paradas → Alertas → Configuración → Logout → Modo Invitado

**Duración aproximada:** 4-6 minutos

## 📝 Mejores Prácticas

### Al crear nuevos tests:

1. **Usa variables de entorno** para datos sensibles
```yaml
- inputText: ${TEST_USER_EMAIL|default@test.com}
```

2. **Agrega timeouts explícitos** para animaciones
```yaml
- waitForAnimationToEnd:
    timeout: 5000
```

3. **Incluye assertions frecuentes** para debugging
```yaml
- assertVisible: "Expected Element"
```

4. **Documenta cada paso** con comentarios claros
```yaml
# 1. Hacer X cosa
- tapOn: "Button"
```

5. **Maneja el teclado** en Expo Go
```yaml
- hideKeyboard  # Después de inputText
```

## 🔗 Referencias

- [Documentación de Maestro](https://maestro.mobile.dev/getting-started/installing-maestro)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/cli-reference)
- [Testing with Expo Go](https://maestro.mobile.dev/platform-support/react-native#expo-go)
- [Expo Documentation](https://docs.expo.dev/)

## 📞 Soporte

Si encuentras problemas:
1. Revisa la sección de Troubleshooting
2. Verifica los logs en `Resultados/Maestro/`
3. Revisa los screenshots de fallos
4. Consulta la documentación oficial de Maestro
