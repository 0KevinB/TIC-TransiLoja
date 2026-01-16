/**
 * Utilidades para formularios
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
 * Hook para manejar estado de formularios con valores controlados
 * @example
 * const [formData, setFormData] = useControlledForm({
 *   name: "",
 *   email: "",
 *   age: 0
 * })
 */
export function useControlledForm<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = React.useState<T>(controlledFormData(initialState));

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

// Re-exportar React si es necesario
import * as React from "react";
