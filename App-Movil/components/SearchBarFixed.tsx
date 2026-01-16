import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SearchBarProps {
  placeholder?: string;
  onPlaceSelected: (place: {
    description: string;
    place_id: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }) => void;
  googleApiKey: string;
}

export function SearchBarFixed({ 
  placeholder = "¿A dónde quieres ir?", 
  onPlaceSelected,
  googleApiKey 
}: SearchBarProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const googlePlacesRef = useRef(null);

  // Verificar si la API key está disponible
  const isApiKeyValid = googleApiKey && googleApiKey.length > 10;

  const handlePlaceSelect = (data: any, details: any) => {
    try {
      console.log('SearchBar - Place selected:', { data, details });
      
      // Validar que los datos no sean undefined o null
      if (!data || !details || !details.geometry || !details.geometry.location) {
        console.error('SearchBar - Invalid place data:', { data, details });
        Alert.alert('Error', 'No se pudo obtener la información del lugar seleccionado');
        return;
      }

      const place = {
        description: data.description || 'Lugar desconocido',
        place_id: data.place_id || '',
        geometry: {
          location: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
          },
        },
      };

      onPlaceSelected(place);
      setSearchText(data.description || 'Lugar seleccionado');
      setIsModalVisible(false);
      setError(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error('SearchBar - Error handling place selection:', error);
      setError('Error inesperado al seleccionar el lugar');
      Alert.alert('Error', 'Error inesperado al seleccionar el lugar');
    }
  };

  const openSearchModal = () => {
    if (!isApiKeyValid) {
      Alert.alert(
        'Configuración requerida',
        'La búsqueda de lugares requiere configurar la API Key de Google Maps.',
        [{ text: 'OK' }]
      );
      return;
    }
    setError(null);
    setIsModalVisible(true);
  };

  const closeSearchModal = () => {
    setIsModalVisible(false);
    setError(null);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchText('');
    setError(null);
    if (googlePlacesRef.current) {
      try {
        (googlePlacesRef.current as any).setAddressText('');
      } catch (error) {
        console.error('Error clearing search:', error);
      }
    }
  };

  const handleApiError = (error: any) => {
    console.error('Google Places API Error:', error);
    setError('Error de conexión con el servicio de búsqueda');
    Alert.alert('Error de búsqueda', 'No se pudo realizar la búsqueda. Verifica tu conexión a internet.');
  };

  const handleTimeout = () => {
    console.log('Google Places API timeout');
    setError('Tiempo de espera agotado');
    Alert.alert('Tiempo agotado', 'La búsqueda está tardando mucho. Intenta de nuevo.');
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
        {searchText ? (
          <TouchableOpacity 
            onPress={clearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name="close" 
              color={theme.colors.textSecondary} 
              size="sm" 
            />
          </TouchableOpacity>
        ) : null}
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
              Buscar destino
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Mostrar error si existe */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="warning" color="#F59E0B" size="md" />
              <ThemedText variant="caption" color="textSecondary">
                {error}
              </ThemedText>
            </View>
          )}

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
                onFail={handleApiError}
                onNotFound={() => {
                  console.log('No places found');
                }}
                onTimeout={handleTimeout}
                requestUrl={{
                  useOnPlatform: 'web', // Evitar problemas en native
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
                      name="search-off" 
                      color={theme.colors.textSecondary} 
                      size="xl" 
                    />
                    <ThemedText 
                      variant="body" 
                      color="textSecondary" 
                      style={styles.emptyText}
                    >
                      Escribe para buscar lugares
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
                debounce={300}
                minLength={2}
              />
            ) : (
              <View style={styles.emptyState}>
                <Icon 
                  name="warning" 
                  color={theme.colors.textSecondary} 
                  size="xl" 
                />
                <ThemedText 
                  variant="body" 
                  color="textSecondary" 
                  style={styles.emptyText}
                >
                  Configuración de Google Maps no disponible
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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

  // Error container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },

  // Google Places Autocomplete
  searchContainer: {
    flex: 1,
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
    maxHeight: height * 0.6,
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
    fontSize: 14,
  },
});