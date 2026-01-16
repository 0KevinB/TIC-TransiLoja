"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  TextInput,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ThemedView } from "./ui/ThemedView";
import { ThemedText } from "./ui/ThemedText";
import { ThemedButton } from "./ui/ThemedButton";
import { Icon } from "./ui/Icon";
import { Card } from "./ui/Card";
import { googleMapsService, type Place } from "../lib/googleMaps";
import { useLocation } from "../hooks/useLocation";

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    name: string;
    place_id: string;
  }) => void;
  showCurrentLocation?: boolean;
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  visible,
  onClose,
  title = "¿A dónde quieres ir?",
  placeholder = "Ej: Universidad Nacional de Loja",
  onLocationSelect,
  showCurrentLocation = true,
}) => {
  const { theme } = useTheme();
  const { location, getCurrentLocation } = useLocation();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setSearchText("");
      setSearchResults([]);
      setSelectedItem(null);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 500);
    }
  }, [visible]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchText.trim());
      }, 800);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await googleMapsService.searchPlaces(
        query,
        location
          ? { latitude: location.latitude, longitude: location.longitude }
          : undefined,
        50000
      );
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching places:", error);
      Alert.alert("Error", "No se pudo realizar la búsqueda. Intenta nuevamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: Place) => {
    if (selectedItem === place.place_id) return;

    setSelectedItem(place.place_id);
    Keyboard.dismiss();

    try {
      const placeDetails = await googleMapsService.getPlaceDetails(place.place_id);
      if (placeDetails) {
        const locationData = {
          latitude: placeDetails.location.latitude,
          longitude: placeDetails.location.longitude,
          name: place.description,
          place_id: place.place_id,
        };
        onLocationSelect(locationData);
        onClose();
      } else {
        Alert.alert("Error", "No se pudieron obtener los detalles del lugar");
      }
    } catch (error) {
      console.error("Error getting place details:", error);
      Alert.alert("Error", "Error al obtener detalles del lugar");
    } finally {
      setSelectedItem(null);
    }
  };

  const renderSearchResult = ({ item }: { item: Place }) => {
    const isSelected = selectedItem === item.place_id;
    const mainText = item.structured_formatting?.main_text || item.description;
    const secondaryText = item.structured_formatting?.secondary_text || "";

    return (
      <Card
        interactive
        onPress={() => handleSelectPlace(item)}
        disabled={isSelected}
        padding="md"
        margin="xs"
        style={styles.resultCard}
      >
        <ThemedView style={styles.resultContent}>
          <ThemedView style={styles.resultIcon}>
            {isSelected ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon name="place" size="md" color="primary" />
            )}
          </ThemedView>
          <ThemedView style={styles.resultTextContainer}>
            <ThemedText variant="body" weight="medium" numberOfLines={1}>
              {mainText}
            </ThemedText>
            {secondaryText && (
              <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                {secondaryText}
              </ThemedText>
            )}
          </ThemedView>
          <Icon
            name={isSelected ? "check" : "chevron-right"}
            size="sm"
            color={isSelected ? "primary" : "textSecondary"}
          />
        </ThemedView>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <ThemedView style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            Buscando lugares...
          </ThemedText>
        </ThemedView>
      );
    }

    if (searchText.trim().length < 3) {
      return (
        <Card margin="md" padding="lg" style={styles.emptyCard}>
          <Icon name="search" size="xl" color="textSecondary" />
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            {searchText.trim().length === 0
              ? "Escribe para buscar tu destino"
              : `Faltan ${3 - searchText.trim().length} caracteres`}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={styles.exampleText}>
            Ej: "Universidad Nacional de Loja"
          </ThemedText>
        </Card>
      );
    }

    return (
      <Card margin="md" padding="lg" style={styles.emptyCard}>
        <Icon name="search-off" size="xl" color="textSecondary" />
        <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
          No se encontraron lugares
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={styles.exampleText}>
          Intenta con otro término de búsqueda
        </ThemedText>
      </Card>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
      marginTop: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 16 : 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
    },
    headerSpacer: {
      width: 40,
    },
    searchContainer: {
      padding: 16,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 12,
    },
    clearButton: {
      padding: 4,
    },
    resultsList: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    resultCard: {
      marginVertical: 4,
    },
    resultContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    resultIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
    },
    resultTextContainer: {
      flex: 1,
      gap: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    emptyCard: {
      alignItems: 'center',
      gap: 16,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      lineHeight: 24,
    },
    exampleText: {
      textAlign: "center",
      fontSize: 14,
      lineHeight: 18,
      fontStyle: "italic",
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container} backgroundColor="background">
        <ThemedView style={styles.header} backgroundColor="background">
          <ThemedButton variant="ghost" size="sm" onPress={onClose}>
            <Icon name="close" size="md" color="textPrimary" />
          </ThemedButton>
          <ThemedView style={styles.headerTitleContainer}>
            <ThemedText variant="subtitle" weight="semibold">
              {title}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <ThemedView style={styles.searchContainer} backgroundColor="background">
          <ThemedView style={styles.searchInputContainer} backgroundColor="surface">
            <Icon name="search" size="md" color="textSecondary" />
            <TextInput
              ref={textInputRef}
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="words"
              autoCorrect={true}
              returnKeyType="search"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (searchText.trim().length >= 3) {
                  performSearch(searchText.trim());
                }
              }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearButton}>
                <Icon name="close" size="sm" color="textSecondary" />
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>

        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.place_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={renderEmptyState}
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </Modal>
  );
};
