# 🌐 Anexos Públicos en TransiLoja Web

## 📋 Descripción

Los anexos están integrados directamente en la aplicación web de Next.js (`/Web`) y son accesibles públicamente sin necesidad de autenticación. Esto permite que la documentación técnica, diagramas y esquemas de datos estén disponibles en el mismo dominio que la aplicación principal, pero completamente separados del dashboard administrativo.

## 🎯 Características

- ✅ **Sin autenticación**: Accesible públicamente sin necesidad de login
- ✅ **Integrado en la web**: Mismo dominio que la aplicación principal
- ✅ **Separado del dashboard**: No interfiere con la funcionalidad administrativa
- ✅ **Responsive**: Diseño adaptable a todos los dispositivos
- ✅ **Visualizador interactivo**: HTML con búsqueda y pestañas para esquemas de datos

## 📂 Estructura de Archivos

```
Web/
├── app/
│   └── anexos/
│       └── page.tsx          # Página de índice de anexos (/anexos)
│
└── public/
    └── Esquemas-Datos.html    # Visualizador de esquemas (/Esquemas-Datos.html)
```

## 🌐 URLs Disponibles

### Desarrollo (local)
- **Página de Anexos**: `http://localhost:3000/anexos`
- **Visualizador de Esquemas**: `http://localhost:3000/Esquemas-Datos.html`

### Producción
- **Página de Anexos**: `https://tu-dominio.com/anexos`
- **Visualizador de Esquemas**: `https://tu-dominio.com/Esquemas-Datos.html`

## 🚀 Cómo Funciona

### 1. Página de Anexos (`/anexos`)

La página `/anexos` es una ruta de Next.js que:
- No requiere autenticación (fuera del directorio `/dashboard`)
- Muestra un índice organizado de todos los recursos
- Incluye enlaces a:
  - Diagrama C4 en GitHub
  - Visualizador interactivo de esquemas
  - Archivos de datos (JSON, GeoJSON)
  - Resultados de pruebas (App Móvil y Web)

### 2. Visualizador de Esquemas (`/Esquemas-Datos.html`)

El archivo HTML está en el directorio `public/`:
- Se sirve estáticamente por Next.js
- Incluye toda la funcionalidad interactiva
- Pestañas para GTFS, Firebase y OSM
- Búsqueda integrada
- Sintaxis highlighting

## 🔄 Actualizar Contenido

### Actualizar la Página de Anexos

Edita el archivo `Web/app/anexos/page.tsx`:

```bash
cd Web
# Editar el archivo según necesites
code app/anexos/page.tsx

# Los cambios se reflejan automáticamente en desarrollo (hot reload)
npm run dev
```

### Actualizar el Visualizador de Esquemas

1. Edita el archivo original en `anexos/Esquemas-Datos.html`
2. Copia el archivo actualizado a `Web/public/`:

```bash
cd Web
Copy-Item "..\anexos\Esquemas-Datos.html" -Destination "public\Esquemas-Datos.html"
```

## 🚢 Despliegue

Los anexos se despliegan automáticamente junto con la aplicación web. No requieren configuración adicional.

### Vercel (Recomendado)

```bash
cd Web
npm run build    # Verificar que compile correctamente
vercel --prod    # Desplegar a producción
```

### Otros Servicios

Los anexos funcionarán con cualquier proveedor de hosting que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- etc.

## 📝 Notas Importantes

1. **Archivos estáticos**: Los archivos en `public/` se sirven tal cual, sin procesamiento de Next.js
2. **Rutas públicas**: Las rutas fuera de `/dashboard` son públicas por defecto
3. **Sin CORS**: Al estar todo en el mismo dominio, no hay problemas de CORS
4. **SEO**: La página `/anexos` es indexable por motores de búsqueda
5. **Cache**: Los archivos estáticos pueden ser cacheados por CDN para mejor rendimiento

## 🔗 Enlaces de Referencia

Desde la página de anexos se enlazan recursos en:
- GitHub (para archivos markdown, JSON, GeoJSON)
- Mismo dominio (para el visualizador HTML)

Esto permite:
- Ver archivos con sintaxis highlighting en GitHub
- Tener el visualizador interactivo en el mismo dominio
- Mantener todo organizado y accesible

---

**Última actualización:** Diciembre 2025
