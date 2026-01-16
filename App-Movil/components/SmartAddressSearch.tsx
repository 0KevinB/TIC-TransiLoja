"use client"

import type React from "react"
import { useState } from "react"
import { StyleSheet, TouchableOpacity, Alert } from "react-native"
import { router } from "expo-router"
import { ThemedView } from "./ui/ThemedView"
import { ThemedText } from "./ui/ThemedText"
import { ThemedButton } from "./ui/ThemedButton"
import { Icon } from "./ui/Icon"
import { Card } from "./ui/Card"
import { AddressSearchModal } from "./AddressSearchModal"
import { useTheme } from "../context/ThemeContext"
import { useLocation } from "../hooks/useLocation"

interface SmartAddressSearchProps {
  onDestinationSelect?: (destination: {
    latitude: number
    longitude: number
    name: string
    place_id: string
  }) => void
  showQuickPlan?: boolean
}

export const SmartAddressSearch: React.FC<SmartAddressSearchProps> = ({
  onDestinationSelect,
  showQuickPlan = true,
}) => {
  const { theme } = useTheme()
  const { location } = useLocation()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<{
    latitude: number
    longitude: number
    name: string
    place_id: string
  } | null>(null)

  const handleLocationSelect = (locationData: {
    latitude: number
    longitude: number
    name: string
    place_id: string
  }) => {
    setSelectedDestination(locationData)

    // Llamar al callback si existe
    if (onDestinationSelect) {
      onDestinationSelect(locationData)
    }

    console.log("Destino seleccionado:", locationData)
  }

  const handlePlanTrip = () => {
    if (!selectedDestination) {
      Alert.alert("Información", "Primero selecciona un destino")
      return
    }

    if (!location) {
      Alert.alert(
        "Ubicación requerida",
        "Para planificar un viaje necesitamos tu ubicación actual. ¿Quieres activar la ubicación?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Activar",
            onPress: () => {
              // Navegar a configuración o solicitar permisos
              Alert.alert("Información", "Ve a configuración para activar la ubicación")
            },
          },
        ],
      )
      return
    }

    // Navegar al mapa con los parámetros del viaje
    router.push({
      pathname: "/map",
      params: {
        openPlanner: "true",
        destinationLat: selectedDestination.latitude.toString(),
        destinationLng: selectedDestination.longitude.toString(),
        destinationName: selectedDestination.name,
      },
    })
  }

  const handleViewOnMap = () => {
    if (!selectedDestination) {
      Alert.alert("Información", "Primero selecciona un destino")
      return
    }

    // Navegar al mapa centrado en el lugar seleccionado
    router.push({
      pathname: "/map",
      params: {
        centerLat: selectedDestination.latitude.toString(),
        centerLng: selectedDestination.longitude.toString(),
        selectedPlace: selectedDestination.name,
      },
    })
  }

  const clearDestination = () => {
    setSelectedDestination(null)
  }

  const styles = StyleSheet.create({
    container: {
      gap: 12,
    },
    helperText: {
      fontSize: 12,
      marginBottom: -4,
      paddingHorizontal: 4,
    },
    searchBar: {
      backgroundColor: theme.colors.background,
      borderRadius: 25, // Hace que la barra sea completamente redondeada
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
      height: 50, // Altura fija para una apariencia más fina
      justifyContent: "center",
    },
    searchTouchable: {
      flex: 1,
      justifyContent: "center",
    },
    searchContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 12,
    },
    searchTextContainer: {
      flex: 1,
    },
    searchPlaceholder: {
      fontSize: 16,
      fontWeight: "400",
    },
    destinationCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary,
    },
    destinationHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    destinationInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      gap: 16,
    },
    destinationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.colors.primary}${theme.mode === 'dark' ? '40' : '20'}`,
      justifyContent: "center",
      alignItems: "center",
    },
    destinationTextContainer: {
      flex: 1,
      gap: 4,
    },
    destinationName: {
      fontSize: 16,
      lineHeight: 20,
    },
    clearButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    destinationActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
    },
  })

  return (
    <ThemedView style={styles.container}>

      {/* Buscador principal */}
      <ThemedView style={styles.searchBar}>
        <TouchableOpacity
          style={styles.searchTouchable}
          onPress={() => setShowSearchModal(true)}
          activeOpacity={0.7}
        >
          <ThemedView style={styles.searchContent}>
            <Icon name="search" size="md" color="textSecondary" />

            <ThemedView style={styles.searchTextContainer}>
              <ThemedText
                variant="body"
                color="textSecondary"
                style={styles.searchPlaceholder}
              >
                ¿A dónde quieres ir?
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>

      {/* Destino seleccionado */}
      {selectedDestination && (
        <Card style={styles.destinationCard}>
          <ThemedView style={styles.destinationHeader}>
            <ThemedView style={styles.destinationInfo}>
              <ThemedView style={styles.destinationIcon}>
                <Icon name="place" size="lg" color="primary" />
              </ThemedView>

              <ThemedView style={styles.destinationTextContainer}>
                <ThemedText variant="caption" color="primary" weight="semibold">
                  VIAJE ACTUAL
                </ThemedText>
                <ThemedText variant="body" weight="medium" numberOfLines={2} style={styles.destinationName}>
                  {selectedDestination.name}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  📍 {selectedDestination.latitude.toFixed(4)}, {selectedDestination.longitude.toFixed(4)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Acciones del destino */}
          {showQuickPlan && (
            <ThemedView style={styles.destinationActions}>
              <ThemedButton variant="outline" size="md" onPress={handleViewOnMap} style={styles.actionButton}>
                <Icon name="map" size="sm" color="accent" />
                <ThemedText color="accent"> Ver en mapa</ThemedText>
              </ThemedButton>

              <ThemedButton variant="outline" size="md" onPress={clearDestination} style={styles.actionButton}>
                <Icon name="close" size="sm" color="error" />
                <ThemedText color="error"> Cancelar viaje</ThemedText>
              </ThemedButton>
            </ThemedView>
          )}
        </Card>
      )}

      {/* Modal de búsqueda */}
      <AddressSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="¿A dónde quieres ir?"
        placeholder="Ej: Universidad Nacional de Loja"
        onLocationSelect={handleLocationSelect}
        showCurrentLocation={true}
      />
    </ThemedView>
  )
}
