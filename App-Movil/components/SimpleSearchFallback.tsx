import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

interface SimpleSearchFallbackProps {
  placeholder?: string;
  onSearchComplete?: () => void;
}

// Lugares predefinidos de Loja para búsqueda rápida
const PREDEFINED_PLACES = [
  {
    name: 'Hospital Isidro Ayora',
    coordinates: { lat: -3.9966, lng: -79.2063 },
    category: 'hospital',
  },
  {
    name: 'Parque Central Loja',
    coordinates: { lat: -3.9929, lng: -79.2045 },
    category: 'parque',
  },
  {
    name: 'Terminal Terrestre Loja',
    coordinates: { lat: -4.0008, lng: -79.2021 },
    category: 'transporte',
  },
  {
    name: 'Universidad Nacional de Loja',
    coordinates: { lat: -3.9986, lng: -79.1976 },
    category: 'educacion',
  },
  {
    name: 'Centro Comercial La Pradera',
    coordinates: { lat: -3.9932, lng: -79.2012 },
    category: 'comercio',
  },
  {
    name: 'Catedral de Loja',
    coordinates: { lat: -3.9929, lng: -79.2045 },
    category: 'religion',
  },
];

export function SimpleSearchFallback({ 
  placeholder = "Buscar lugares en Loja...",
  onSearchComplete 
}: SimpleSearchFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { theme } = useTheme();

  const filteredPlaces = PREDEFINED_PLACES.filter(place =>
    place.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePlaceSelect = (place: typeof PREDEFINED_PLACES[0]) => {
    // Navegar al mapa con el lugar seleccionado
    router.push({
      pathname: '/map',
      params: {
        centerLat: place.coordinates.lat.toString(),
        centerLng: place.coordinates.lng.toString(),
        selectedPlace: place.name,
      },
    });
    setIsModalVisible(false);
    onSearchComplete?.();
  };

  const handleGetDirections = (place: typeof PREDEFINED_PLACES[0]) => {
    // Navegar al mapa con el planificador abierto
    router.push({
      pathname: '/map',
      params: {
        openPlanner: 'true',
        destinationLat: place.coordinates.lat.toString(),
        destinationLng: place.coordinates.lng.toString(),
        destinationName: place.name,
      },
    });
    setIsModalVisible(false);
    onSearchComplete?.();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hospital': return 'local-hospital';
      case 'parque': return 'park';
      case 'transporte': return 'directions-bus';
      case 'educacion': return 'school';
      case 'comercio': return 'shopping-mall';
      case 'religion': return 'church';
      default: return 'place';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hospital': return '#EF4444';
      case 'parque': return '#10B981';
      case 'transporte': return '#3B82F6';
      case 'educacion': return '#8B5CF6';
      case 'comercio': return '#F59E0B';
      case 'religion': return '#6B7280';
      default: return theme.colors.primary;
    }
  };

  return (
    <>
      {/* Barra de búsqueda compacta */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          { 
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Icon 
          name="search" 
          color={theme.colors.textSecondary} 
          size="md" 
        />
        <ThemedText 
          variant="body" 
          color="textSecondary" 
          style={styles.searchButtonText}
          numberOfLines={1}
        >
          {placeholder}
        </ThemedText>
        <Icon 
          name="explore" 
          color={theme.colors.primary} 
          size="sm" 
        />
      </TouchableOpacity>

      {/* Modal de búsqueda simplificada */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <ThemedView style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={[
            styles.modalHeader,
            { borderBottomColor: theme.colors.border }
          ]}>
            <TouchableOpacity 
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon 
                name="arrow-back" 
                color={theme.colors.text} 
                size="lg" 
              />
            </TouchableOpacity>
            <ThemedText variant="subtitle" weight="semibold" style={styles.modalTitle}>
              Lugares en Loja
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Búsqueda simple */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }
              ]}
              placeholder="Buscar entre lugares conocidos..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Lista de lugares */}
          <View style={styles.placesContainer}>
            <ThemedText variant="subtitle" weight="bold" style={styles.placesTitle}>
              📍 Lugares populares
            </ThemedText>
            
            {filteredPlaces.map((place, index) => (
              <Card key={index} style={styles.placeCard} padding="md" margin="sm">
                <View style={styles.placeContent}>
                  <View style={[
                    styles.placeIcon,
                    { backgroundColor: `${getCategoryColor(place.category)}20` }
                  ]}>
                    <Icon 
                      name={getCategoryIcon(place.category)} 
                      color={getCategoryColor(place.category)} 
                      size="lg" 
                    />
                  </View>
                  
                  <View style={styles.placeInfo}>
                    <ThemedText variant="body" weight="semibold" numberOfLines={2}>
                      {place.name}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      📍 {place.category}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.placeActions}>
                    <ThemedButton
                      variant="outline"
                      size="sm"
                      onPress={() => handlePlaceSelect(place)}
                      style={styles.actionButton}
                    >
                      <Icon name="map" size="sm" color="primary" />
                    </ThemedButton>
                    
                    <ThemedButton
                      variant="primary"
                      size="sm"
                      onPress={() => handleGetDirections(place)}
                      style={styles.actionButton}
                    >
                      <Icon name="directions" size="sm" color="background" />
                    </ThemedButton>
                  </View>
                </View>
              </Card>
            ))}

            {filteredPlaces.length === 0 && searchText.length > 0 && (
              <View style={styles.noResults}>
                <Icon name="search-off" color={theme.colors.textSecondary} size="lg" />
                <ThemedText variant="body" color="textSecondary" style={styles.noResultsText}>
                  No se encontraron lugares con "{searchText}"
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Intenta con otro nombre o explora los lugares disponibles
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Barra de búsqueda compacta
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },

  // Modal
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },
  placeholder: {
    width: 32,
  },

  // Búsqueda
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },

  // Lugares
  placesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  placesTitle: {
    marginBottom: 16,
  },
  placeCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    gap: 4,
  },
  placeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  // Sin resultados
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  noResultsText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 4,
  },
});