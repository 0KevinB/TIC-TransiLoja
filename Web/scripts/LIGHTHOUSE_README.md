# Lighthouse Testing con Autenticación

Este script ejecuta pruebas de Lighthouse en modo Desktop para todas las páginas públicas y autenticadas de TransiLoja.

## Características

- **Autenticación automática**: Usa Puppeteer para hacer login y mantener la sesión activa durante todas las pruebas
- **Contexto de sesión preservado**: Mantiene tokens de Firebase (localStorage/IndexedDB) activos para todas las páginas autenticadas
- **Desktop mode**: Configurado para pruebas en desktop (1350x940)
- **Throttling optimizado**: Configuración de red similar a las pruebas manuales
- **Reportes organizados**: Genera reportes HTML separados para cada URL

## Configuración

### Variables de Entorno (Recomendado)

Crea un archivo `.env` en la raíz del proyecto con:

```env
LIGHTHOUSE_TEST_EMAIL=tu-email-de-prueba@ejemplo.com
LIGHTHOUSE_TEST_PASSWORD=tu-password-seguro
```

### Valores por Defecto

Si no configuras variables de entorno, el script usa:
- Email: `admin@transiloja.com`
- Password: `Admin123!`

**IMPORTANTE**: Cambia estos valores en el archivo `run-lighthouse.js` (líneas 6-7) o usa variables de entorno.

## Uso

```bash
# Ejecutar todas las pruebas
npm run test:lighthouse

# O directamente con node
node scripts/run-lighthouse.js
```

## URLs Testeadas

### Páginas Públicas
- `/` (Login)

### Páginas Autenticadas
- `/dashboard` (Dashboard principal)
- `/dashboard/buses` (Gestión de buses)
- `/dashboard/routes` (Gestión de rutas)
- `/dashboard/stops` (Gestión de paradas)
- `/dashboard/trips` (Gestión de viajes)
- `/dashboard/drivers` (Gestión de conductores)
- `/dashboard/alerts` (Alertas del sistema)
- `/dashboard/reports` (Reportes)

Puedes agregar más URLs editando los arrays `publicUrls` y `authenticatedUrls` en el script.

## Resultados

Los reportes HTML se guardan en: `Resultados/Lighthouse/`

Cada reporte incluye:
- **Performance**: Velocidad de carga y métricas Core Web Vitals
- **Accessibility**: Accesibilidad web (WCAG)
- **Best Practices**: Mejores prácticas de desarrollo
- **SEO**: Optimización para motores de búsqueda

## Fases de Ejecución

El script ejecuta en 3 fases usando una única instancia de browser:

1. **FASE 1**: Analiza páginas públicas (sin autenticación)
2. **FASE 2**: Realiza login automático manteniendo la sesión activa
3. **FASE 3**: Analiza páginas autenticadas usando el mismo browser con tokens de Firebase preservados

**Clave del funcionamiento**: El script mantiene una única sesión de Puppeteer activa durante todas las pruebas, lo que preserva correctamente los tokens de Firebase Auth almacenados en localStorage e IndexedDB. Lighthouse se conecta al mismo browser, garantizando que todas las páginas autenticadas se prueben correctamente.

## Troubleshooting

### Error: "Failed to authenticate"
- Verifica que las credenciales sean correctas
- Asegúrate de que la aplicación esté disponible en https://transi-loja.vercel.app/
- Revisa que el formulario de login no haya cambiado

### Scores bajos en Performance
- Verifica la configuración de throttling (líneas 29-36)
- Compara con pruebas manuales usando las DevTools de Chrome
- Considera ejecutar las pruebas en localhost para mayor control

### Timeout errors
- Aumenta los timeouts en las líneas 56, 62, 63, 73, 82, 116
- Verifica tu conexión a internet
- La aplicación puede estar lenta o no disponible

## Optimización de Throttling

El script está configurado con throttling reducido para simular una conexión de red rápida:

```javascript
throttling: {
  rttMs: 40,                      // Latencia de red
  throughputKbps: 10240,          // Ancho de banda
  cpuSlowdownMultiplier: 1,       // Sin slowdown de CPU
}
```

Esto permite obtener scores más cercanos a las pruebas manuales.

## Próximos Pasos

Si necesitas agregar más URLs:

1. Edita `run-lighthouse.js`
2. Agrega URLs a `publicUrls` (sin auth) o `authenticatedUrls` (con auth)
3. Ejecuta `npm run test:lighthouse`

## Notas de Seguridad

- **NO** commitees credenciales en el código
- Usa variables de entorno para producción
- Considera crear un usuario específico para testing
- Los reportes HTML pueden contener información sensible
