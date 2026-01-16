import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { offlineDataService } from '../lib/offlineDataService';

export interface ConfiguracionVisual {
  nombre_app: string;
  logo_url: string;
  color_primario: string;
  color_secundario: string;
}

export interface AppConfiguration {
  configuracion: ConfiguracionVisual | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultConfig: ConfiguracionVisual = {
  nombre_app: "TransiLoja",
  logo_url: "",
  color_primario: "#0ea5e9",
  color_secundario: "#64748b"
};

export const useAppConfiguration = (): AppConfiguration => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionVisual | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero intentar cargar desde el caché offline
      const offlineData = await offlineDataService.getOfflineData();
      if (offlineData?.configuracion) {
        setConfiguracion(offlineData.configuracion);
        console.log('📱 Usando configuración desde caché offline');
      }

      // Luego intentar actualizar desde Firebase
      try {
        const configRef = collection(db(), "configuracion_app");
        const configQuery = query(configRef, where("activa", "==", true));
        const configSnap = await getDocs(configQuery);

        if (!configSnap.empty) {
          const configData = configSnap.docs[0].data() as ConfiguracionVisual;
          setConfiguracion(configData);
          console.log('🌐 Configuración actualizada desde Firebase');
        } else if (!offlineData?.configuracion) {
          // Solo usar configuración por defecto si no hay offline ni Firebase
          setConfiguracion(defaultConfig);
        }
      } catch (firebaseError) {
        console.log('⚠️ No se pudo conectar a Firebase, usando caché offline');
        // Si no hay caché offline, usar configuración por defecto
        if (!offlineData?.configuracion) {
          setConfiguracion(defaultConfig);
        }
      }
    } catch (err) {
      console.error("Error cargando configuración de la app:", err);
      setError("Error al cargar la configuración de la aplicación");

      // Configuración fallback
      setConfiguracion(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const refetch = async () => {
    await loadConfiguration();
  };

  return {
    configuracion,
    isLoading,
    error,
    refetch,
  };
};