# Política de Seguridad

## Información Sensible Removida

Este repositorio público es una versión sanitizada del proyecto original. La siguiente información sensible ha sido removida o reemplazada por placeholders:

### Archivos Removidos

Los siguientes archivos contienen información sensible y **NO están incluidos** en este repositorio público:

- **`App-Movil/android/app/google-services.json`** - Configuración Firebase para Android (ver `google-services.json.example`)
- **`Web/.env.local`** - Variables de entorno de producción para Next.js
- **`App-Movil/.env`** - Variables de entorno de producción para Expo

### Credenciales Sanitizadas

Las siguientes credenciales han sido reemplazadas por placeholders o variables de entorno:

- ✅ **API Keys de Firebase** - Todas las referencias usan variables de entorno
- ✅ **Google Maps API Keys** - Referencias usando variables de entorno
- ✅ **Credenciales de prueba** - Valores hardcodeados en scripts de testing reemplazados por placeholders genéricos
- ✅ **Tokens de servicios externos** - Configuración externalizada

### Archivos de Ejemplo Proporcionados

Para facilitar la configuración, se incluyen archivos de ejemplo:

- **`Web/.env.example`** - Template de variables de entorno para Next.js
- **`App-Movil/.env.example`** - Template de variables de entorno para Expo
- **`App-Movil/android/app/google-services.json.example`** - Template de configuración Firebase

## Configuración para Desarrollo

Para ejecutar este proyecto localmente, consulta la sección de **Configuración de Seguridad** en el [README.md](./README.md#-configuración-de-seguridad).

## Reportar Vulnerabilidades

Si descubres alguna información sensible que no debería estar en este repositorio público, por favor contacta a los mantenedores del proyecto de inmediato.

## Mejores Prácticas Implementadas

Este proyecto sigue las siguientes mejores prácticas de seguridad:

1. **Separación de configuración** - Todas las credenciales están en archivos `.env` que no se incluyen en el control de versiones
2. **Archivos de ejemplo** - Se proporcionan templates (`.example`) para facilitar la configuración sin exponer datos reales
3. **Variables de entorno** - Uso consistente de variables de entorno en toda la aplicación
4. **`.gitignore` robusto** - Configuración para prevenir commits accidentales de información sensible

## Historial del Repositorio

Este repositorio público fue creado sin el historial de commits del repositorio original para garantizar que ninguna información sensible histórica esté expuesta.
