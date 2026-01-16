# 🧪 Plan de Pruebas - Buscador de Direcciones

## Checklist de Funcionalidades

### ✅ Búsqueda Básica
- [ ] El botón de búsqueda abre el modal correctamente
- [ ] El input de búsqueda tiene el placeholder correcto
- [ ] El autocompletado aparece después de 3 caracteres
- [ ] Los resultados se muestran con formato correcto
- [ ] El debounce de 800ms funciona correctamente

### ✅ Integración con Google Maps API
- [ ] La API key se carga desde variables de entorno
- [ ] Las búsquedas están limitadas a Ecuador (`country:ec`)
- [ ] Los resultados priorizan lugares cercanos a Loja
- [ ] Se manejan errores de API correctamente
- [ ] Los timeouts se gestionan apropiadamente

### ✅ Selección de Lugares
- [ ] Al seleccionar un resultado, se obtienen coordenadas exactas
- [ ] El modal se cierra después de seleccionar
- [ ] Los datos del lugar se pasan correctamente al callback
- [ ] Se muestra feedback visual durante la carga

### ✅ Navegación y Planificación
- [ ] Desde la pantalla principal, seleccionar un lugar navega al mapa
- [ ] El TripPlanner se abre automáticamente
- [ ] Los parámetros de destino se pasan correctamente
- [ ] La planificación de ruta se ejecuta automáticamente

### ✅ Experiencia de Usuario
- [ ] El diseño es consistente con el tema de la app
- [ ] Las animaciones son suaves y responsivas
- [ ] Los estados de carga son claros
- [ ] Los mensajes de error son informativos
- [ ] El botón "Mi ubicación" funciona correctamente

## Casos de Prueba Específicos

### 🎯 Prueba 1: Universidad Nacional de Loja
```
DADO que el usuario está en la pantalla principal
CUANDO escribe "Universidad Nacional de Loja"
ENTONCES debe aparecer como primer resultado
Y al seleccionarlo debe navegar al mapa
Y debe abrir el planificador automáticamente
```

### 🎯 Prueba 2: Lugar No Encontrado
```
DADO que el usuario busca "asdfghjkl123"
CUANDO no se encuentran resultados
ENTONCES debe mostrar mensaje "No se encontraron lugares"
Y debe sugerir intentar con otro término
```

### 🎯 Prueba 3: Sin Conexión
```
DADO que el dispositivo no tiene conexión a internet
CUANDO el usuario intenta buscar
ENTONCES debe mostrar error de conexión
Y debe sugerir verificar la conexión
```

### 🎯 Prueba 4: Sin Permisos de Ubicación
```
DADO que la app no tiene permisos de ubicación
CUANDO el usuario presiona "Mi ubicación"
ENTONCES debe solicitar permisos
Y si se deniegan, debe mostrar mensaje informativo
```

## Scripts de Prueba

### 📱 Prueba Manual Rápida
1. Abrir la app
2. En la pantalla principal, tocar "¿A dónde quieres ir?"
3. Escribir "Universidad Nacional" (sin completar)
4. Verificar que aparece autocompletado
5. Seleccionar "Universidad Nacional de Loja"
6. Verificar navegación al mapa
7. Verificar que se abre el planificador
8. Verificar que se centra en la universidad

### 🔧 Prueba de Integración
1. Buscar "Parque Central Loja"
2. Verificar que aparece en los resultados
3. Seleccionar el resultado
4. Verificar que navega al mapa con parámetros correctos:
   - `openPlanner: 'true'`
   - `destinationLat: [número]`
   - `destinationLng: [número]`
   - `destinationName: 'Parque Central Loja'`

### ⚡ Prueba de Rendimiento
1. Realizar 10 búsquedas consecutivas
2. Medir tiempo de respuesta promedio
3. Verificar que no hay memory leaks
4. Verificar que la app sigue siendo responsiva

## Métricas de Éxito

### 📊 KPIs
- **Tiempo de respuesta**: < 2 segundos
- **Precisión de resultados**: > 90%
- **Tasa de éxito de planificación**: > 85%
- **Satisfacción del usuario**: > 4/5 estrellas

### 🎯 Criterios de Aceptación
- [x] ✅ Búsqueda funciona con lugares reales de Loja
- [x] ✅ Integración completa con planificador de rutas
- [x] ✅ Manejo robusto de errores
- [x] ✅ UX intuitiva y consistente
- [x] ✅ Rendimiento aceptable en dispositivos medios

## Notas de Testing

### 🐛 Problemas Conocidos
- El primer resultado de búsqueda a veces tarda más en cargar
- En dispositivos lentos, el modal puede tardar en abrir

### 🔧 Configuración de Test
```javascript
// Configurar API key de prueba
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_de_test

// Habilitar logs de debug
__DEV__ && console.log('Debug info:', data);
```

### 📝 Reportar Bugs
Al encontrar un bug, incluir:
1. Pasos para reproducir
2. Resultado esperado vs actual
3. Dispositivo y versión de OS
4. Logs de console si están disponibles

---

*Para ejecutar pruebas: `cd App-Movil && npx expo start`*