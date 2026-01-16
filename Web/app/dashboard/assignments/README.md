# Sistema de Asignación Masiva de Viajes

## Descripción

Este módulo permite gestionar la asignación de buses y conductores a viajes de manera masiva, siguiendo el estándar GTFS (General Transit Feed Specification).

## Características

### 1. Asignación Masiva
- Selecciona múltiples viajes simultáneamente
- Asigna un bus y/o conductor a todos los viajes seleccionados
- Filtra viajes por ruta, calendario o estado de asignación
- Visualiza estadísticas en tiempo real

### 2. Historial de Asignaciones
- Registro completo de todas las asignaciones realizadas
- Tracking de kilometraje y consumo de combustible
- Estados: programada, en_curso, completada, cancelada
- Auditoría de quién realizó cada asignación

### 3. Filtros Avanzados
- Por ruta específica
- Por calendario (días operativos)
- Por estado de asignación (asignado/sin asignar)

## Uso

### Asignar Buses y Conductores

1. Filtra los viajes según tus necesidades
2. Selecciona los viajes marcando los checkboxes
3. Selecciona un bus y/o conductor en los selectores
4. Haz clic en "Asignar (N)" donde N es el número de viajes seleccionados
5. Los viajes quedarán actualizados con las asignaciones

### Limpiar Asignaciones

1. Selecciona los viajes que deseas limpiar
2. Haz clic en "Limpiar"
3. Las asignaciones de bus y conductor serán removidas

### Ver Historial

1. Ve a la pestaña "Historial"
2. Visualiza todas las asignaciones realizadas
3. Filtra por fecha, viaje, bus o conductor

## Modelo de Datos

### AsignacionHistorial

```typescript
interface AsignacionHistorial {
  id_asignacion: string
  id_viaje: string
  id_bus?: string
  id_conductor?: string
  fecha_asignacion: Date
  fecha_inicio_efectiva: Date
  fecha_fin_efectiva?: Date
  estado: "programada" | "en_curso" | "completada" | "cancelada"
  kilometraje_inicio?: number
  kilometraje_fin?: number
  combustible_consumido?: number
  observaciones?: string
  asignado_por?: string
  motivo_cambio?: string
  createdAt: Date
  updatedAt: Date
}
```

## Estructura GTFS

Este módulo sigue el estándar GTFS donde:

- **Bus**: Entidad física del vehículo (sin asignación fija)
- **Conductor**: Entidad del conductor (sin asignación fija)
- **Trip (Viaje)**: Instancia específica que relaciona:
  - Ruta
  - Calendario (días operativos)
  - Bus asignado
  - Conductor asignado
  - Horarios de frecuencia

### Ventajas de esta estructura

1. **Flexibilidad Operativa**: Un bus puede operar en diferentes rutas
2. **Rotación de Personal**: Conductores pueden cambiar de bus
3. **Mantenimiento**: Buses en mantenimiento no afectan las rutas
4. **Escalabilidad**: Fácil agregar más buses o conductores
5. **Auditoría**: Historial completo de asignaciones

## Colecciones Firebase

### trips
- Almacena viajes con `busId` y `conductorId` opcionales
- Se actualiza cuando se realiza una asignación

### asignaciones_historial
- Registro histórico de todas las asignaciones
- Útil para reportes y auditorías

### buses
- Sin `routeId` ni `conductorId` fijos
- Solo información del vehículo

### conductores
- Sin `busId` fijo
- Solo información del conductor

## Próximas Mejoras

1. **Validación de Conflictos**: Evitar que un bus/conductor esté en 2 viajes simultáneos
2. **Asignación Inteligente**: Sugerir buses/conductores basado en disponibilidad
3. **Notificaciones**: Alertar a conductores sobre sus asignaciones
4. **Reportes**: Estadísticas de utilización de buses y conductores
5. **Integración con App Móvil**: Que conductores vean sus asignaciones

## Soporte

Para más información sobre GTFS, consulta: https://gtfs.org/
