# Guía de Migración - Página de Stops

Esta guía compara la versión antigua (`page.tsx`) con la versión nueva (`page-new.tsx`) usando servicios GTFS.

## 📊 Comparación de Código

| Métrica | Versión Antigua | Versión Nueva | Mejora |
|---------|-----------------|---------------|--------|
| Líneas de código | 693 | ~400 | ✅ -42% |
| Queries directas | 6+ | 0 | ✅ 100% |
| Validación manual | Sí | No (automática) | ✅ |
| Límites de queries | No | Sí (100 paradas) | ✅ |
| Manejo de errores | Básico | Completo con toasts | ✅ |
| Tipos | Legacy (any en varios lugares) | GTFS estándar | ✅ |

## 🔄 Cambios Principales

### 1. ❌ ANTES: Queries Directas de Firestore

```typescript
// ❌ ANTIGUO (page.tsx)
const fetchStops = async () => {
  setLoading(true)
  try {
    const querySnapshot = await getDocs(collection(db, "stops"))
    const stopsData: Stop[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      stopsData.push({
        id: doc.id,
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        // ... conversión manual
      } as Stop)
    })
    setStops(stopsData)
  } catch (error) {
    console.error("Error:", error)
  } finally {
    setLoading(false)
  }
}
```

### ✅ AHORA: Hook Personalizado

```typescript
// ✅ NUEVO (page-new.tsx)
const {
  stops,
  loading,
  creating,
  updating,
  deleting,
  createStop,
  updateStop,
  deleteStop,
} = useStops({ limit: 100 }) // ✅ Límite de 100 paradas
```

**Beneficios:**
- ✅ Validación automática con Zod
- ✅ Límites de queries incorporados
- ✅ Manejo de errores centralizado
- ✅ Código reutilizable
- ✅ Menos propenso a bugs

---

### 2. ❌ ANTES: Tipos Legacy Inconsistentes

```typescript
// ❌ ANTIGUO
interface Stop {
  id: string
  name: string      // ❌ No GTFS
  lat: number       // ❌ No GTFS
  lng: number       // ❌ No GTFS
  routeIds: string[]
  // ...
}
```

### ✅ AHORA: Tipos GTFS Estándar

```typescript
// ✅ NUEVO
import { GTFSStop, GTFSStopCreate } from "@/lib/types"

// GTFSStop tiene:
// - stop_id (GTFS estándar)
// - stop_name (GTFS estándar)
// - stop_lat (GTFS estándar)
// - stop_lon (GTFS estándar)
// - location_type (GTFS estándar)
// - wheelchair_boarding (GTFS estándar)
// - etc.
```

**Beneficios:**
- ✅ Compatible con GTFS oficial
- ✅ Importación/exportación de datos estándar
- ✅ Validación automática
- ✅ Interoperabilidad con otras herramientas

---

### 3. ❌ ANTES: Validación Manual

```typescript
// ❌ ANTIGUO
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!formData.name || !formData.lat || !formData.lng) {
    toast({
      title: "Error",
      description: "Nombre y coordenadas son obligatorios",
      variant: "destructive",
    })
    return
  }

  const lat = Number.parseFloat(formData.lat)
  const lng = Number.parseFloat(formData.lng)

  if (isNaN(lat) || isNaN(lng)) {
    toast({
      title: "Error",
      description: "Las coordenadas deben ser números válidos",
      variant: "destructive",
    })
    return
  }

  // ... más validación manual
}
```

### ✅ AHORA: Validación Automática con Zod

```typescript
// ✅ NUEVO
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const stopData: GTFSStopCreate = {
    stop_id: editingStop?.stop_id || `stop_${Date.now()}`,
    stop_name: formData.stop_name!,
    stop_lat: formData.stop_lat!,
    stop_lon: formData.stop_lon!,
    // ... otros campos
  }

  // ✅ Validación automática dentro de createStop/updateStop
  if (editingStop) {
    await updateStop(editingStop.stop_id, stopData)
  } else {
    await createStop(stopData)
  }
}
```

**Beneficios:**
- ✅ Validación centralizada en el schema
- ✅ Mensajes de error consistentes
- ✅ Menos código repetitivo
- ✅ Validación de tipos en runtime

---

### 4. ❌ ANTES: Sin Límites de Queries

```typescript
// ❌ ANTIGUO - Trae TODAS las paradas
const querySnapshot = await getDocs(collection(db, "stops"))
```

**Problema:** Si hay 5,000 paradas, se cargan TODAS. Esto causa:
- 💸 Costo excesivo de Firebase
- 🐌 Lentitud extrema
- 💥 Posible crash del navegador

### ✅ AHORA: Límites Automáticos

```typescript
// ✅ NUEVO - Máximo 100 paradas
const { stops } = useStops({ limit: 100 })
```

**Beneficios:**
- ✅ Queries eficientes
- ✅ Menor costo de Firebase
- ✅ Carga rápida
- ✅ Escalable

---

### 5. ❌ ANTES: Código Duplicado

La página antigua tiene ~100 líneas de código duplicado para:
- Conversión manual de datos
- Validación de formularios
- Manejo de errores
- Estado de loading

### ✅ AHORA: Código Reutilizable

Todo eso está centralizado en:
- `hooks/useStops.ts` - Hook reutilizable
- `lib/services/gtfs/stops-service.ts` - Servicio con validación
- `lib/schemas/gtfs/stops.ts` - Schema de validación

**Beneficios:**
- ✅ DRY (Don't Repeat Yourself)
- ✅ Fácil de testear
- ✅ Mantenimiento centralizado

---

## 🚀 Pasos para Migrar

### 1. Hacer Backup

```bash
cp app/dashboard/stops/page.tsx app/dashboard/stops/page.OLD.tsx
```

### 2. Reemplazar el Archivo

```bash
mv app/dashboard/stops/page-new.tsx app/dashboard/stops/page.tsx
```

### 3. Instalar Dependencias (si no están)

```bash
cd Web/
npm install
```

### 4. Ejecutar Migración de Datos

```bash
npm run migrate:gtfs -- --collection=stops --dry-run
```

Revisar el output, y si todo está bien:

```bash
npm run migrate:gtfs -- --collection=stops
```

### 5. Desplegar Índices

```bash
firebase deploy --only firestore:indexes
```

### 6. Probar en Desarrollo

```bash
npm run dev
```

Ir a `http://localhost:3000/dashboard/stops` y probar:
- ✅ Crear parada
- ✅ Editar parada
- ✅ Eliminar parada
- ✅ Buscar parada

### 7. Verificar en Firebase Console

- Revisar la colección `gtfs_stops`
- Verificar que los datos se guardaron correctamente

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/hooks/useStops'"

```bash
# Verificar que el archivo existe
ls hooks/useStops.ts

# Si no existe, revisar que se creó correctamente
```

### Error: "stopsService is not defined"

```bash
# Verificar que los servicios se exportan correctamente
cat lib/services/index.ts
```

### Error de Validación: "stop_lat is required"

El schema de Zod valida que `stop_lat` y `stop_lon` sean números válidos.
Asegúrate de que los campos no estén vacíos en el formulario.

### Las paradas no aparecen

1. Verifica que ejecutaste la migración de datos
2. Revisa la consola del navegador para errores
3. Verifica en Firebase Console que la colección `gtfs_stops` tiene datos

---

## 📈 Próximos Pasos

Después de migrar Stops, aplica el mismo patrón a:

1. **Routes** (`app/dashboard/routes/page.tsx`)
   - Usar `useRoutes` hook
   - Tipos GTFS estándar
   - Límites de queries

2. **Trips** (`app/dashboard/trips/page.tsx`)
   - Crear `useTrips` hook
   - Migrar a GTFS estándar

3. **Buses** (`app/dashboard/buses/page.tsx`)
   - Crear `useBuses` hook
   - Ya tiene schema en `extensions/buses`

4. **Drivers** (`app/dashboard/drivers/page.tsx`)
   - Crear `useDrivers` hook
   - Ya tiene schema en `extensions/drivers`

---

## ✅ Checklist de Migración

- [ ] Backup de `page.tsx`
- [ ] Reemplazar con `page-new.tsx`
- [ ] Ejecutar migración de datos (dry-run)
- [ ] Ejecutar migración de datos (real)
- [ ] Desplegar índices de Firestore
- [ ] Probar en desarrollo
- [ ] Verificar en Firebase Console
- [ ] Eliminar archivo `page.OLD.tsx` (después de confirmar que todo funciona)

---

**Documentación adicional:**
- `GTFS-COMPATIBILITY.md` - Guía de compatibilidad GTFS
- `scripts/README.md` - Guía de migración de datos
