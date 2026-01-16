# TransiLoja - Aplicación Móvil 🚌

Aplicación móvil de TransiLoja para usuarios, conductores y administradores del sistema de transporte público.

Esta es una aplicación [Expo](https://expo.dev) con [React Native](https://reactnative.dev/) y [TypeScript](https://www.typescriptlang.org/).

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Iniciar la Aplicación

```bash
npx expo start
```

En la salida, encontrarás opciones para abrir la app en:

- [Expo Go](https://expo.dev/go) - La forma más rápida de probar (recomendado para desarrollo)
- [Emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)

### 3. Desarrollo

Edita los archivos en el directorio **app**. Este proyecto usa [file-based routing](https://docs.expo.dev/router/introduction) con Expo Router.

## 🧪 Testing

TransiLoja incluye una suite completa de tests:

### Tests Unitarios y de Integración

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Solo tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests de rendimiento
npm run test:performance

# Tests de accesibilidad
npm run test:a11y
```

### Tests E2E con Maestro

Los tests end-to-end usan [Maestro](https://maestro.mobile.dev/) y están configurados para trabajar con **Expo Go**.

**Requisitos:**
- Maestro instalado: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Expo Go instalado en dispositivo/emulador
- ADB configurado (para Android)

**Credenciales de prueba:**
- Email: `carolalvaradojime@gmail.com`
- Password: `123456`

**Ejecutar tests E2E:**

```bash
# Con Expo Go (recomendado)
npm run test:e2e:expo

# O usando el script directo:
# Windows
.\scripts\test-expo-go.ps1

# Linux/macOS
./scripts/test-expo-go.sh

# Tests específicos
npm run test:e2e:offline    # Modo offline
npm run test:e2e:gps        # GPS sharing
npm run test:e2e:trip       # Creación de viajes
npm run test:e2e:perf       # Performance
npm run test:e2e:a11y       # Accesibilidad
```

**Documentación completa:** Ver [e2e/README.md](e2e/README.md)

### Reportes de Tests

```bash
# Generar reporte completo de tests
npm run test:report

# Tests + Coverage + Reporte
npm run test:full
```

Los resultados se guardan en:
- **Jest Tests:** `Resultados/Jest/`
- **Maestro E2E:** `Resultados/Maestro/`

## 📱 Build y Deploy

### Android

```bash
# Development build
npm run android

# Clean build
npm run android:clean
```

### iOS

```bash
npm run ios
```

### Prebuild (Native projects)

```bash
# Generar carpetas android/ e ios/
npm run prebuild

# Prebuild limpio
npm run prebuild:clean
```

## 🔧 Scripts Útiles

```bash
# Limpiar cache de Expo
npm run start:clean

# Verificar configuración de notificaciones
npm run check-notifications

# Verificar configuración de Firebase
npm run check-firebase

# Linting
npm run lint
```

## 📁 Estructura del Proyecto

```
App-Movil/
├── app/                    # Rutas y pantallas (Expo Router)
├── components/             # Componentes reutilizables
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y servicios
├── constants/              # Constantes y configuración
├── assets/                 # Imágenes, fuentes, etc.
├── e2e/                    # Tests end-to-end con Maestro
├── __tests__/              # Tests unitarios y de integración
├── scripts/                # Scripts de utilidad
└── Resultados/             # Reportes de tests
```

## 🛠️ Tecnologías Principales

- **React Native** 0.79.5
- **Expo SDK** ~53
- **TypeScript** ~5.8
- **Expo Router** ~5.1 (File-based routing)
- **React Native Maps** (Mapas)
- **Expo Location** (Geolocalización)
- **Expo Notifications** (Notificaciones push)
- **Firebase** (Analytics, Crashlytics, Performance)
- **NativeWind** (Tailwind CSS para React Native)
- **Jest** (Testing)
- **Maestro** (E2E Testing)

## 📚 Recursos de Aprendizaje

### Expo
- [Documentación de Expo](https://docs.expo.dev/)
- [Tutorial de Expo](https://docs.expo.dev/tutorial/introduction/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

### Testing
- [Jest](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Maestro Mobile Testing](https://maestro.mobile.dev/)

### React Native
- [Documentación de React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

## 🤝 Comunidad

- [Expo en GitHub](https://github.com/expo/expo)
- [Discord de Expo](https://chat.expo.dev)

## 📝 Notas

- Este proyecto usa **Expo Router** para navegación basada en archivos
- Los builds nativos requieren **Android Studio** (Android) o **Xcode** (iOS)
- Para producción, usa **EAS Build**: `eas build`
- El modo **Expo Go** tiene algunas limitaciones (ver [documentación](https://docs.expo.dev/workflow/expo-go/))

