"use client";

import { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTransport } from "../../context/TransportContext";
import { useLocation } from "../../hooks/useLocation";
import { useTabBarPadding } from "../../hooks/useTabBarPadding";
import { useAccessibleFont } from "../../hooks/useAccessibleFont";
import { ThemedView } from "../../components/ui/ThemedView";
import { ThemedText } from "../../components/ui/ThemedText";
import { ThemedButton } from "../../components/ui/ThemedButton";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { useTheme } from "../../context/ThemeContext";
import { SmartAddressSearch } from "../../components/SmartAddressSearch";

// Constantes de diseño unificadas
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export default function HomeScreen() {
  const { userProfile, isAuthenticated, isGuest } = useAuth();
  const { refreshData } = useTransport();
  const { getCurrentLocation } = useLocation();
  const { theme } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("HomeScreen montado, datos se cargan automáticamente");
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await getCurrentLocation();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDisplayName = () => {
    if (isAuthenticated && userProfile?.displayName) {
      return userProfile.displayName;
    }
    if (isGuest) {
      return "Invitado";
    }
    return "Usuario";
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[tabBarPadding, styles.scrollContent]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Pantalla principal de TransiLoja"
        accessibilityHint="Desliza hacia abajo para actualizar la información"
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText
                variant="title"
                weight="bold"
                style={styles.welcomeText}
                color="background"
              >
                Nos alegra verte, {getDisplayName()}
              </ThemedText>
              {isGuest && (
                <View style={styles.guestBadge}>
                  <Icon
                    name="information-circle-outline"
                    library="ionicons"
                    color={theme.colors.background}
                    size="xs"
                  />
                  <ThemedText
                    variant="caption"
                    color="background"
                    style={styles.guestText}
                  >
                    Modo invitado
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          <ThemedText
            variant="subtitle"
            style={styles.headerSubtitle}
            color="background"
          >
            Busca tu punto de destino, ¡Planificamos por ti!
          </ThemedText>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <SmartAddressSearch
            onDestinationSelect={(destination) => {
              router.push({
                pathname: "/map",
                params: {
                  openPlanner: "true",
                  destinationLat: destination.latitude.toString(),
                  destinationLng: destination.longitude.toString(),
                  destinationName: destination.name,
                },
              });
            }}
            showQuickPlan={true}
            accessibilityLabel="Buscador de destinos"
            accessibilityHint="Escribe una dirección para buscar rutas de transporte"
          />
        </View>

        {/* Accesos Rápidos */}
        <View style={styles.section}>
          <ThemedText
            variant="subtitle"
            weight="bold"
            style={styles.sectionTitle}
          >
            Servicios móviles
          </ThemedText>

          {/* Acciones Principales Destacadas */}
          <View style={styles.featuredActionsContainer}>
            <View style={styles.featuredActionCard}>
              <Card
                interactive
                variant="filled"
                padding="none"
                onPress={() => router.push("/map")}
                style={styles.featuredCard}
                accessibilityLabel="Ver Mapa"
                accessibilityHint="Abre el mapa para ver rutas y paradas en tiempo real"
                accessibilityRole="button"
              >
                <View style={styles.featuredActionContent}>
                  <View
                    style={[
                      styles.featuredIcon,
                      { backgroundColor: "rgba(34, 197, 94, 0.15)" },
                    ]}
                  >
                    <Icon name="map" color="#22C55E" size="xl" />
                  </View>
                  <View style={styles.featuredTextContainer}>
                    <ThemedText style={{ fontSize: 16, fontWeight: "bold" }}>
                      Ver Mapa
                    </ThemedText>

                    <ThemedText variant="caption" color="textSecondary">
                      Rutas y paradas en tiempo real
                    </ThemedText>
                  </View>
                  <Icon name="chevron-right" color="textSecondary" size="md" />
                </View>
              </Card>
            </View>

            <View style={styles.featuredActionCard}>
              <Card
                interactive
                variant="filled"
                padding="none"
                onPress={() => router.push("/map?openPlanner=true")}
                style={styles.featuredCard}
                accessibilityLabel="Planificar Viaje"
                accessibilityHint="Abre el planificador para encontrar la mejor ruta a tu destino"
                accessibilityRole="button"
              >
                <View style={styles.featuredActionContent}>
                  <View
                    style={[
                      styles.featuredIcon,
                      { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                    ]}
                  >
                    <Icon name="directions" color="#3B82F6" size="xl" />
                  </View>
                  <View style={styles.featuredTextContainer}>
                    <ThemedText  style={{ fontSize: 16, fontWeight: "bold" }} weight="bold">
                      Planificar Viaje
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Encuentra la mejor ruta
                    </ThemedText>
                  </View>
                  <Icon name="chevron-right" color="textSecondary" size="md" />
                </View>
              </Card>
            </View>
          </View>

          {/* Grid de Acciones Secundarias */}
          <View style={styles.secondaryActionsGrid}>
            <View style={styles.secondaryActionCard}>
              <Card
                interactive
                variant="outlined"
                padding="none"
                onPress={() => router.push("/routes-list")}
                accessibilityLabel="Ver Rutas"
                accessibilityHint="Muestra todas las rutas de transporte disponibles"
                accessibilityRole="button"
              >
                <View style={styles.secondaryActionContent}>
                  <View
                    style={[
                      styles.secondaryActionIcon,
                      { backgroundColor: "rgba(168, 85, 247, 0.1)" },
                    ]}
                  >
                    <Icon name="route" color="#A855F7" size="lg" />
                  </View>
                  <ThemedText
                    variant="body"
                    weight="semibold"
                    style={styles.secondaryActionTitle}
                  >
                    Rutas
                  </ThemedText>
                </View>
              </Card>
            </View>

            <View style={styles.secondaryActionCard}>
              <Card
                interactive
                variant="outlined"
                padding="none"
                onPress={() => router.push("/(tabs)/stops")}
                accessibilityLabel="Ver Paradas"
                accessibilityHint="Muestra todas las paradas de transporte cercanas"
                accessibilityRole="button"
              >
                <View style={styles.secondaryActionContent}>
                  <View
                    style={[
                      styles.secondaryActionIcon,
                      { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                    ]}
                  >
                    <Icon name="location-on" color="#EF4444" size="lg" />
                  </View>
                  <ThemedText
                    variant="body"
                    weight="semibold"
                    style={styles.secondaryActionTitle}
                  >
                    Paradas
                  </ThemedText>
                </View>
              </Card>
            </View>

            <View style={styles.secondaryActionCard}>
              <Card
                interactive
                variant="outlined"
                padding="none"
                onPress={() => router.push("/horarios")}
                accessibilityLabel="Ver Horarios"
                accessibilityHint="Consulta los horarios de las rutas de transporte"
                accessibilityRole="button"
              >
                <View style={styles.secondaryActionContent}>
                  <View
                    style={[
                      styles.secondaryActionIcon,
                      { backgroundColor: "rgba(6, 182, 212, 0.1)" },
                    ]}
                  >
                    <Icon name="schedule" color="#06B6D4" size="lg" />
                  </View>
                  <ThemedText
                    variant="body"
                    weight="semibold"
                    style={styles.secondaryActionTitle}
                  >
                    Horarios
                  </ThemedText>
                </View>
              </Card>
            </View>

            {/* Buses - Solo para conductores */}
            {userProfile?.role === 'conductor' && (
              <View style={styles.secondaryActionCard}>
                <Card
                  interactive
                  variant="outlined"
                  padding="none"
                  onPress={() => router.push("/(tabs)/my-buses")}
                  accessibilityLabel="Mis Buses"
                  accessibilityHint="Gestión de buses asignados"
                  accessibilityRole="button"
                >
                  <View style={styles.secondaryActionContent}>
                    <View
                      style={[
                        styles.secondaryActionIcon,
                        { backgroundColor: "rgba(251, 146, 60, 0.1)" },
                      ]}
                    >
                      <Icon name="directions-bus" color="#FB923C" size="lg" />
                    </View>
                    <ThemedText
                      variant="body"
                      weight="semibold"
                      style={styles.secondaryActionTitle}
                    >
                      Mis Buses
                    </ThemedText>
                  </View>
                </Card>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0, // Ajustado para el nuevo header
    paddingBottom: SPACING.xxl * 2,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60, // Espacio para la barra de estado
    paddingBottom: SPACING.xxl + SPACING.xl, // Espacio extra para la curva y el buscador
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    width: "100%",
    alignSelf: "center",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: SPACING.xs,
  },
  guestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    opacity: 0.8,
  },
  guestText: {
    fontSize: 13,
  },
  avatarContainer: {
    padding: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: SPACING.sm,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    opacity: 0.9,
  },

  // Buscador
  searchContainer: {
    paddingHorizontal: SPACING.xl, // Unificar margen con las secciones
    marginTop: -25, // Ajuste para centrar visualmente entre el banner y el contenido
    marginBottom: SPACING.lg,
    maxWidth: 640, // Un poco más ancho que el contenido para un buen efecto
    width: "100%",
    alignSelf: "center",
    zIndex: 10, // Asegura que esté por encima del contenido
  },

  // Secciones
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    marginTop: SPACING.lg, // Espacio para separar del buscador
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  // Acciones Principales Destacadas
  featuredActionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  featuredActionCard: {
    width: "100%",
  },
  featuredCard: {
    borderRadius: BORDER_RADIUS.lg,
  },
  featuredActionContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },

  // Grid de Acciones Secundarias
  secondaryActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  secondaryActionCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: SPACING.md,
  },
  secondaryActionContent: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.md,
    minHeight: 110,
    justifyContent: "center",
  },
  secondaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionTitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
