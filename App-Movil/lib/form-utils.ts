import { useState } from 'react';

/**
 * Utilidades para formularios en React Native
 * Ayuda a prevenir el error "changing an uncontrolled input to be controlled"
 */

/**
 * Asegura que un valor de input siempre sea una cadena (nunca undefined o null)
 * @param value - Valor que puede ser string | null | undefined
 * @param defaultValue - Valor por defecto (default: cadena vacía)
 * @returns Valor controlado como string
 */
export function controlledValue(value: string | null | undefined, defaultValue: string = ""): string {
  return value ?? defaultValue;
}

/**
 * Asegura que un valor numérico de input siempre sea una cadena (nunca undefined o null)
 * @param value - Valor numérico que puede ser number | null | undefined
 * @param defaultValue - Valor por defecto (default: cadena vacía)
 * @returns Valor controlado como string
 */
export function controlledNumberValue(value: number | null | undefined, defaultValue: string = ""): string {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return value.toString();
}

/**
 * Convierte un objeto con valores potencialmente undefined a valores controlados
 * @param obj - Objeto con valores que pueden ser undefined/null
 * @returns Objeto con todos los valores como cadenas vacías si son undefined/null
 */
export function controlledFormData<T extends Record<string, any>>(obj: Partial<T>): T {
  const result: any = {};

  for (const key in obj) {
    const value = obj[key];

    if (value === null || value === undefined) {
      result[key] = "";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Recursivo para objetos anidados
      result[key] = controlledFormData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Hook para manejar estado de formularios con valores controlados en React Native
 * @example
 * const { formData, updateField, updateFields, reset } = useControlledForm({
 *   nombre: "",
 *   email: "",
 *   edad: 0
 * })
 *
 * // Actualizar un campo
 * updateField('nombre', 'Juan')
 *
 * // Actualizar múltiples campos
 * updateFields({ nombre: 'Juan', email: 'juan@example.com' })
 *
 * // Resetear formulario
 * reset()
 */
export function useControlledForm<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(controlledFormData(initialState));

  const updateField = (field: keyof T, value: any) => {
    setState((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
  };

  const updateFields = (fields: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      ...controlledFormData(fields),
    }));
  };

  const reset = () => {
    setState(controlledFormData(initialState));
  };

  return {
    formData: state,
    setFormData: setState,
    updateField,
    updateFields,
    reset,
  };
}

/**
 * Convierte una Parada del formato Firebase al formato de la app móvil
 * @param firebaseStop - Parada en formato Firebase (Web)
 * @returns Parada en formato de app móvil
 */
export function convertFirebaseStopToMobile(firebaseStop: any): any {
  return {
    id: firebaseStop.id,
    id_parada: firebaseStop.id,
    nombre: firebaseStop.name || "",
    ubicacion: {
      latitud: firebaseStop.lat || 0,
      longitud: firebaseStop.lng || 0,
    },
    coordenadas: {
      lat: firebaseStop.lat || 0,
      lng: firebaseStop.lng || 0,
    },
    codigo: firebaseStop.code || null,
    municipio_id: firebaseStop.municipio_id || "",
    activa: true,
    created_at: firebaseStop.createdAt?.toDate?.() || new Date(),
    updated_at: firebaseStop.updatedAt?.toDate?.() || new Date(),
    routeIds: firebaseStop.routeIds || [],
    operator: firebaseStop.operator || null,
    network: firebaseStop.network || null,
    amenities: firebaseStop.amenities || {
      shelter: false,
      bench: false,
      lighting: false,
      bin: false,
      wifi: false,
      realTimeDisplay: false,
    },
    desc: firebaseStop.desc || null,
    zoneId: firebaseStop.zoneId || null,
    url: firebaseStop.url || null,
    locationType: firebaseStop.locationType || null,
    wheelchairBoarding: firebaseStop.wheelchairBoarding || null,
    levelId: firebaseStop.levelId || null,
    platformCode: firebaseStop.platformCode || null,
    distancia: 0, // Se calculará después
  };
}

/**
 * Convierte una Ruta del formato Firebase al formato de la app móvil
 * @param firebaseRoute - Ruta en formato Firebase (Web)
 * @returns Ruta en formato de app móvil
 */
export function convertFirebaseRouteToMobile(firebaseRoute: any): any {
  return {
    id: firebaseRoute.id,
    id_ruta: firebaseRoute.id,
    numero: firebaseRoute.shortName || firebaseRoute.numero || "",
    nombre: firebaseRoute.name || "",
    color: firebaseRoute.color || "#FF0000",
    paradas: firebaseRoute.stopIds || [],
    stopIds: firebaseRoute.stopIds || [],
    municipio_id: firebaseRoute.municipio_id || "",
    activa: true,
    created_at: firebaseRoute.createdAt?.toDate?.() || new Date(),
    updated_at: firebaseRoute.updatedAt?.toDate?.() || new Date(),
    shortName: firebaseRoute.shortName || null,
    description: firebaseRoute.description || null,
    textColor: firebaseRoute.textColor || "#FFFFFF",
    type: firebaseRoute.type || "bus",
    agencyId: firebaseRoute.agencyId || null,
    sortOrder: firebaseRoute.sortOrder || null,
    url: firebaseRoute.url || null,
    continuousPickup: firebaseRoute.continuousPickup || null,
    continuousDropOff: firebaseRoute.continuousDropOff || null,
    networkId: firebaseRoute.networkId || null,
    operatingStartTime: firebaseRoute.operatingStartTime || null,
    operatingEndTime: firebaseRoute.operatingEndTime || null,
    frequency: firebaseRoute.frequency || null,
    averageTravelTime: firebaseRoute.averageTravelTime || null,
  };
}
