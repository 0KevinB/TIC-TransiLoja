import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Keyboard,
  FlatList,
  Alert,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { router } from 'expo-router';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface PlaceResult {
  description: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SearchBarAuthProps {
  placeholder?: string;
  googleApiKey: string;
}

export function SearchBarAuth({ 
  placeholder = "Buscar lugares, calles, establecimientos...", 
  googleApiKey 
}: SearchBarAuthProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchText, setSearchText] = useState('');
  const { theme } = useTheme();
  const googlePlacesRef = useRef(null);

  // Verificar si la API key está disponible
  const isApiKeyValid = googleApiKey && googleApiKey.length > 10;

  const openSearchModal = () => {
    if (!isApiKeyValid) {
      Alert.alert(
        'Configuración requerida',
        'La búsqueda de lugares requiere configurar la API Key de Google Maps. Por favor contacta al administrador.',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsModalVisible(true);
  };

  const handlePlaceSelect = (data: any, details: any) => {
    console.log('Place selected:', { data, details });
    
    if (details && details.geometry && details.geometry.location) {
      const place: PlaceResult = {
        description: data.description || 'Lugar desconocido',
        place_id: data.place_id || '',
        geometry: {
          location: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
          },
        },
      };
      
      // Agregar a resultados para mostrar opciones
      setSearchResults([place]);
      setSearchText(data.description || 'Lugar seleccionado');
    } else {
      console.error('Invalid place data:', { data, details });
      Alert.alert('Error', 'No se pudo obtener la información del lugar seleccionado');
    }
  };


  const closeSearchModal = () => {
    setIsModalVisible(false);
    setSearchResults([]);
    setSearchText('');
    Keyboard.dismiss();
  };

  const handleViewOnMap = (place: PlaceResult) => {
    try {
      console.log('Navigating to map with place:', place);
      
      if (!place.geometry?.location?.lat || !place.geometry?.location?.lng) {
        Alert.alert('Error', 'Ubicación inválida');
        return;
      }

      // Navegar al mapa con el lugar seleccionado
      router.push({
        pathname: '/map',
        params: {
          centerLat: place.geometry.location.lat.toString(),
          centerLng: place.geometry.location.lng.toString(),
          selectedPlace: place.description,
        },
      });
      closeSearchModal();
    } catch (error) {
      console.error('Error navigating to map:', error);
      Alert.alert('Error', 'No se pudo navegar al mapa');
    }
  };

  const handleGetDirections = (place: PlaceResult) => {
    try {
      console.log('Getting directions to place:', place);
      
      if (!place.geometry?.location?.lat || !place.geometry?.location?.lng) {
        Alert.alert('Error', 'Ubicación inválida para direcciones');
        return;
      }

      // Navegar al mapa con el planificador abierto
      router.push({
        pathname: '/map',
        params: {
          openPlanner: 'true',
          destinationLat: place.geometry.location.lat.toString(),
          destinationLng: place.geometry.location.lng.toString(),
          destinationName: place.description,
        },
      });
      closeSearchModal();
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Error', 'No se pudo obtener direcciones');
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    if (googlePlacesRef.current) {
      (googlePlacesRef.current as any).setAddressText('');
    }
  };

  const renderPlaceItem = ({ item }: { item: PlaceResult }) => {
    if (!item || !item.description) return null;
    
    return (
      <Card style={styles.placeItem} padding="md" margin="sm">
        <View style={styles.placeContent}>
          <View style={styles.placeIcon}>
            <Icon name="place" color={theme.colors.primary} size="lg" />
          </View>
          
          <View style={styles.placeInfo}>
            <ThemedText variant="body" weight="semibold" numberOfLines={2}>
              {item.description}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              📍 Ubicación encontrada
            </ThemedText>
          </View>
          
          <View style={styles.placeActions}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => handleViewOnMap(item)}
              style={styles.actionButton}
            >
              <Icon name="map" size="sm" color="primary" />
              <ThemedText color="primary" variant="caption"> Ver</ThemedText>
            </ThemedButton>
            
            <ThemedButton
              variant="primary"
              size="sm"
              onPress={() => handleGetDirections(item)}
              style={styles.actionButton}
            >
              <Icon name="directions" size="sm" color="background" />
              <ThemedText color="background" variant="caption"> Ir</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </Card>
    );
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
        onPress={openSearchModal}
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
          {searchText || placeholder}
        </ThemedText>
        <Icon 
          name="explore" 
          color={theme.colors.primary} 
          size="sm" 
        />
      </TouchableOpacity>

      {/* Modal de búsqueda */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSearchModal}
      >
        <ThemedView style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={[
            styles.modalHeader,
            { borderBottomColor: theme.colors.border }
          ]}>
            <TouchableOpacity 
              onPress={closeSearchModal}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon 
                name="arrow-back" 
                color={theme.colors.text} 
                size="lg" 
              />
            </TouchableOpacity>
            <ThemedText variant="subtitle" weight="semibold" style={styles.modalTitle}>
              Explorar lugares
            </ThemedText>
            <TouchableOpacity 
              onPress={clearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon 
                name="clear" 
                color={theme.colors.textSecondary} 
                size="md" 
              />
            </TouchableOpacity>
          </View>

          {/* Búsqueda con Google Places */}
          <View style={styles.searchContainer}>
            {isApiKeyValid ? (
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder={placeholder}
                onPress={handlePlaceSelect}
                query={{
                  key: googleApiKey,
                  language: 'es',
                  location: '-4.0194,-79.2044', // Loja, Ecuador
                  radius: 50000, // 50km radius
                  components: 'country:ec', // Solo Ecuador
                  types: 'establishment|geocode', // Establecimientos y direcciones
                }}
                fetchDetails={true}
                enablePoweredByContainer={false}
                onFail={(error) => {
                  console.error('Google Places API Error:', error);
                  Alert.alert('Error de búsqueda', 'No se pudo realizar la búsqueda. Verifica tu conexión a internet.');
                }}
                onNotFound={() => {
                  console.log('No places found');
                }}
                onTimeout={() => {
                  console.log('Google Places API timeout');
                  Alert.alert('Tiempo de espera', 'La búsqueda está tardando mucho. Intenta de nuevo.');
                }}
                styles={{
                textInputContainer: [
                  styles.textInputContainer,
                  { backgroundColor: theme.colors.background }
                ],
                textInput: [
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  }
                ],
                listView: [
                  styles.listView,
                  { backgroundColor: theme.colors.background }
                ],
                row: [
                  styles.row,
                  { backgroundColor: theme.colors.background }
                ],
                description: {
                  color: theme.colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                },
                predefinedPlacesDescription: {
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                },
                poweredContainer: {
                  display: 'none',
                },
              }}
              textInputProps={{
                placeholderTextColor: theme.colors.textSecondary,
                autoFocus: true,
                returnKeyType: 'search',
              }}
              listEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Icon 
                    name="explore" 
                    color={theme.colors.textSecondary} 
                    size="xl" 
                  />
                  <ThemedText 
                    variant="body" 
                    color="textSecondary" 
                    style={styles.emptyText}
                  >
                    Busca lugares, calles o establecimientos
                  </ThemedText>
                  <ThemedText 
                    variant="caption" 
                    color="textSecondary" 
                    style={styles.emptySubtext}
                  >
                    Descubre qué hay cerca de ti en Loja
                  </ThemedText>
                </View>
              )}
              renderLeftButton={() => (
                <View style={styles.searchIcon}>
                  <Icon 
                    name="search" 
                    color={theme.colors.textSecondary} 
                    size="md" 
                  />
                </View>
              )}
            />
            ) : (
              <View style={styles.apiKeyError}>
                <Icon name="warning" color={theme.colors.textSecondary} size="lg" />
                <ThemedText variant="body" color="textSecondary" style={styles.errorText}>
                  Búsqueda no disponible
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary" style={styles.errorSubtext}>
                  La configuración de Google Maps no está disponible
                </ThemedText>
              </View>
            )}
          </View>

          {/* Resultados con acciones */}
          {searchResults && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <ThemedText variant="subtitle" weight="bold" style={styles.resultsTitle}>
                📍 Lugar encontrado
              </ThemedText>
              <FlatList
                data={searchResults || []}
                renderItem={renderPlaceItem}
                keyExtractor={(item) => item?.place_id || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
              
              <View style={styles.actionHint}>
                <Icon name="info" color={theme.colors.primary} size="sm" />
                <ThemedText variant="caption" color="primary" style={styles.hintText}>
                  Usa "Ver" para explorar o "Ir" para obtener direcciones
                </ThemedText>
              </View>
            </View>
          )}

          {/* Sugerencias cuando no hay búsqueda */}
          {searchResults.length === 0 && !searchText && (
            <View style={styles.suggestionsContainer}>
              <ThemedText variant="subtitle" weight="bold" style={styles.suggestionsTitle}>
                🔍 Explora Loja
              </ThemedText>
              
              <Card style={styles.suggestionCard} padding="md">
                <ThemedText variant="body" color="textSecondary" style={styles.suggestionText}>
                  Busca restaurantes, hospitales, parques, centros comerciales, o cualquier dirección en Loja.
                </ThemedText>
              </Card>

              <View style={styles.quickSuggestions}>
                <ThemedText variant="body" weight="semibold" style={styles.quickTitle}>
                  Búsquedas populares:
                </ThemedText>
                {['Hospital Isidro Ayora', 'Parque Central Loja', 'Terminal Terrestre', 'Universidad Nacional'].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => {
                      if (googlePlacesRef.current) {
                        (googlePlacesRef.current as any).setAddressText(suggestion);
                      }
                    }}
                  >
                    <Icon name="trending-up" size="sm" color={theme.colors.primary} />
                    <ThemedText variant="caption" color="primary">
                      {suggestion}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
  clearButton: {
    padding: 4,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },

  // Google Places Autocomplete
  searchContainer: {
    paddingTop: 8,
  },
  textInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 48,
    fontSize: 16,
    borderWidth: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 20,
    zIndex: 1,
  },
  listView: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    maxHeight: height * 0.3,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0,
    minHeight: 58,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },

  // Resultados con acciones
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsTitle: {
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 16,
  },
  placeItem: {
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    justifyContent: 'center',
    gap: 4,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
  },

  // Sugerencias
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  suggestionsTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  suggestionText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  quickSuggestions: {
    gap: 12,
  },
  quickTitle: {
    marginBottom: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  // Error de API Key
  apiKeyError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 4,
  },
  errorSubtext: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});