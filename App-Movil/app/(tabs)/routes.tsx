import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ThemedView } from '../../components/ui/ThemedView';

export default function RoutesScreen() {
  // Redirigir inmediatamente al mapa principal
  useEffect(() => {
    router.replace('/map');
  }, []);

  // Mostrar una pantalla vacía mientras se redirige
  return <ThemedView style={{ flex: 1 }} backgroundColor="background" />;
}