// Tipos para el sistema de transporte público

export interface Parada {
  distancia: number;
  id: string;
  id_parada?: string; // Para compatibilidad con el mapa
  nombre: string;
  ubicacion: {
    latitud: number;
    longitud: number;
  };
  coordenadas?: { // Estructura adicional para compatibilidad con el mapa
    lat: number;
    lng: number;
  };
  codigo?: string;
  municipio_id: string;
  activa: boolean;
  created_at: Date;
  updated_at: Date;

  // ✅ NUEVOS CAMPOS GTFS (compatibles con Web)
  routeIds?: string[]; // IDs de rutas que pasan por esta parada
  operator?: string | null; // Operador de transporte (ej: "SITU")
  network?: string | null; // Red de transporte
  amenities?: {
    shelter?: boolean; // Refugio/techo
    bench?: boolean; // Banca/asiento
    lighting?: boolean; // Iluminación
    bin?: boolean; // Basurero
    wifi?: boolean; // WiFi disponible
    realTimeDisplay?: boolean; // Pantalla de información en tiempo real
  };

  // Campos GTFS estándar opcionales
  desc?: string | null; // Descripción de la parada
  zoneId?: string | null; // ID de zona tarifaria
  url?: string | null; // URL con información
  locationType?: '0' | '1' | '2' | '3' | '4' | null; // 0=parada, 1=estación, 2=entrada, 3=nodo, 4=boarding area
  wheelchairBoarding?: '0' | '1' | '2' | null; // 0=sin info, 1=accesible, 2=no accesible
  levelId?: string | null; // ID del nivel (para estaciones multinivel)
  platformCode?: string | null; // Código de plataforma
}

export interface Ruta {
  id: string;
  id_ruta?: string; // Para compatibilidad con el mapa
  numero: string;
  nombre: string;
  color: string;
  paradas: string[]; // IDs de paradas
  stopIds?: string[]; // Estructura adicional para compatibilidad con el mapa
  municipio_id: string;
  activa: boolean;
  created_at: Date;
  updated_at: Date;

  // ✅ NUEVOS CAMPOS GTFS (compatibles con Web)
  shortName?: string; // Nombre corto (ej: "L5", "12")
  description?: string; // Descripción de la ruta
  textColor?: string; // Color del texto (para contraste con el color de fondo)
  type?: 'bus' | 'metro' | 'tram' | 'ferry' | 'cable_car' | 'gondola' | 'funicular' | 'trolleybus' | 'monorail'; // Tipo de transporte
  agencyId?: string; // ID de la agencia operadora
  sortOrder?: number; // Orden de clasificación

  // Campos GTFS estándar opcionales
  url?: string | null; // URL con información sobre la ruta
  continuousPickup?: '0' | '1' | '2' | '3' | null; // Política de recogida continua
  continuousDropOff?: '0' | '1' | '2' | null; // Política de bajada continua
  networkId?: string | null; // ID de red de rutas

  // Campos operativos
  operatingStartTime?: string; // Hora de inicio de operación (HH:MM)
  operatingEndTime?: string; // Hora de fin de operación (HH:MM)
  frequency?: number; // Frecuencia en minutos
  averageTravelTime?: number; // Tiempo promedio de viaje en minutos
}

export interface Bus {
  id: string;
  plateNumber?: string;
  numero_placa?: string;
  model?: string;
  year?: number;
  capacity?: number;
  numero_interno?: string;
  // ✅ GTFS: Sin asignación fija de ruta o conductor
  // routeId y conductorId se asignan ahora en Viaje, no en Bus
  features?: {
    airConditioning?: boolean;
    wheelchair?: boolean;
    wifi?: boolean;
    gps?: boolean;
  };
  ubicacion_actual?: {
    latitud: number;
    longitud: number;
    timestamp: Date;
  };
  coordenadas_actuales?: { // Estructura original
    lat: number;
    lng: number;
  };
  coordenadas?: { // Estructura adicional para compatibilidad con el mapa
    lat: number;
    lng: number;
  };
  status?: 'active' | 'inactive' | 'maintenance';
  estado?: 'activo' | 'inactivo' | 'mantenimiento';
  municipio_id?: string;
  createdAt?: any;
  updatedAt?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface Conductor {
  id?: string;
  id_conductor?: string;
  nombre: string;
  apellidos?: string;
  apellido?: string;
  cedula: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo_licencia?: string;
  licencia_numero?: string;
  licencia_vencimiento?: Date;
  fecha_licencia?: any;
  fecha_vencimiento_licencia?: any;
  fecha_nacimiento?: any;
  experiencia_anos?: number;
  observaciones?: string;
  estado?: 'activo' | 'inactivo';
  bus_asignado?: string;
  municipio_id?: string;
  activo?: boolean;
  createdAt?: any;
  updatedAt?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface Viaje {
  id: string;
  routeId?: string;
  ruta_id?: string;
  // ✅ GTFS: Asignación de recursos por viaje
  busId?: string; // Bus físico asignado a este viaje específico
  bus_id?: string; // Alias para compatibilidad
  conductorId?: string; // Conductor asignado a este viaje específico
  conductor_id?: string; // Alias para compatibilidad
  calendarId?: string;
  headsign?: string;
  direction?: number;
  startTime?: string;
  endTime?: string;
  frequency?: {
    startTime: string;
    endTime: string;
    headwaySecs: number;
  } | number; // Soportar ambos formatos
  hora_inicio?: Date;
  hora_fin?: Date;
  estado?: 'programado' | 'en_curso' | 'completado' | 'cancelado';
  paradas_visitadas?: {
    parada_id: string;
    hora_llegada?: Date;
    hora_salida?: Date;
  }[];
  municipio_id?: string;
  createdAt?: any;
  updatedAt?: any;
  created_at?: Date;
  updated_at?: Date;
}

// Tipo específico para asignaciones de servicio (Trip en el contexto del sistema)
export interface AsignacionServicio {
  id: string;
  routeId: string;
  routeName?: string;
  busId: string;
  busPlate?: string;
  conductorId: string;
  conductorName?: string;
  calendarId?: string;
  headsign?: string;
  direction?: number;
  startTime: string;
  endTime: string;
  frequency?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Alerta {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'informacion' | 'advertencia' | 'critica';
  ruta_ids?: string[];
  parada_ids?: string[];
  alternativeRoute?: string;
  fecha_inicio: Date;
  fecha_fin?: Date;
  activa: boolean;
  municipio_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Municipio {
  id: string;
  nombre: string;
  codigo: string;
  configuracion: {
    colores: {
      primario: string;
      secundario: string;
      acento: string;
    };
    logo_url?: string;
  };
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tipos para el algoritmo RAPTOR
export interface EstadoRAPTOR {
  parada_id: string;
  tiempo_llegada: number;
  ruta_tomada?: string;
  parada_anterior?: string;
  numero_transferencias: number;
}

export interface SegmentoViaje {
  tipo: 'caminar' | 'autobus';
  desde: string;
  hasta: string;
  id_ruta?: string;
  ruta_id?: string; // Mantener compatibilidad
  tiempo_inicio: number | string;
  tiempo_fin: number | string;
  duracion_seg?: number;
  distancia?: number; // en metros
  distancia_metros?: number; // Estructura alternativa
  instrucciones?: string;
}

export interface RutaOptima {
  origen?: string;
  destino?: string;
  segmentos: SegmentoViaje[];
  tiempo_total?: number;
  tiempo_total_seg: number;
  numero_transferencias?: number;
  numero_transbordos: number;
  distancia_caminata: number;
  costo?: number;
}

// Tipos para la interfaz de usuario
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
}

export interface AppTheme {
  fonts: any;
  mode: 'light' | 'dark' | 'high-contrast';
  colors: ThemeColors;
  fontScale: number;
  municipalityColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Tipos para la ubicación del usuario
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// Tipos para las notificaciones
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledTime?: Date;
  read: boolean;
  created_at: Date;
}

// ✅ Sistema de Notificaciones Push (compatible con Web)
export interface NotificacionPush {
  id_notificacion: string;
  titulo: string;
  cuerpo: string;
  tipo: "alerta" | "actualizacion" | "recordatorio" | "info";
  datos?: Record<string, any>; // Datos adicionales para deep linking
  imagen_url?: string;
  icono?: string;
  // Metadata
  alerta_id?: string;
  ruta_id?: string;
  parada_id?: string;
  // Control
  programada_para?: Date;
  enviada?: boolean;
  fecha_envio?: Date;
  createdAt?: Date;
  createdBy?: string;
  // Para uso local en la app
  read?: boolean;
  received_at?: Date;
}

// Tipos para calendarios y horarios
export interface Calendario {
  id: string;
  name: string;
  routeId?: string; // Si el calendario está asociado a una ruta específica
  routeName?: string; // Nombre de la ruta para mostrar
  operatingStartTime?: string; // Formato "HH:MM"
  operatingEndTime?: string; // Formato "HH:MM"
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: Date; // Fecha de inicio de vigencia
  endDate: Date; // Fecha de fin de vigencia
  holidays: string[]; // Array de fechas en formato "YYYY-MM-DD"
  municipio_id?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Tipo para categorizar calendarios
export type CalendarioCategoria =
  | 'laborables' // Días de lunes a viernes
  | 'fines_semana' // Sábados y domingos
  | 'feriados' // Días feriados
  | 'especial' // Eventos especiales o celebraciones
  | 'ruta_especifica' // Horario específico de una ruta
  | 'general'; // Horario general para todas las rutas

// ✅ GTFS: Historial de Asignaciones (compatibilidad con Web)
export interface AsignacionHistorial {
  id_asignacion: string;
  id_viaje: string;
  id_bus?: string;
  id_conductor?: string;
  fecha_asignacion: Date;
  fecha_inicio_efectiva: Date;  // Cuando realmente inició el viaje
  fecha_fin_efectiva?: Date;     // Cuando terminó el viaje
  estado: "programada" | "en_curso" | "completada" | "cancelada";
  kilometraje_inicio?: number;
  kilometraje_fin?: number;
  combustible_consumido?: number;
  observaciones?: string;
  asignado_por?: string;  // ID del usuario que hizo la asignación
  motivo_cambio?: string; // Si hubo cambio de bus/conductor
  created_at?: Date;
  updated_at?: Date;
  createdAt?: any;
  updatedAt?: any;
}

// Tipo para buses en vivo con asignaciones
export interface BusEnVivo {
  id: string;
  tripId?: string; // ID del viaje que está ejecutando
  busId: string; // ✅ GTFS: Bus físico en operación
  conductorId?: string; // ✅ GTFS: Conductor asignado
  routeId?: string;
  lat: number;
  lng: number;
  bearing?: number; // Dirección en grados
  speed?: number; // Velocidad en km/h
  direction?: number;
  currentStopIndex?: number;
  currentStopId?: string;
  nextStopId?: string;
  isAtStop?: boolean;
  status?: "stopped" | "moving" | "delayed";
  delay?: number; // Segundos de retraso
  scheduleDeviation?: number;
  timestamp: Date;
  stopArrivalTime?: Date;
  asignacionId?: string; // ✅ GTFS: Referencia al historial de asignación
}