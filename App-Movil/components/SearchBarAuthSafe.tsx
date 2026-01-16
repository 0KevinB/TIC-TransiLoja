import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Keyboard,
  Alert,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SearchBarAuthSafeProps {
  placeholder?: string;
  googleApiKey?: string;
}

export function SearchBarAuthSafe({ 
  placeholder = "Buscar lugares, calles, establecimientos...", 
  googleApiKey = ''
}: SearchBarAuthSafeProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Verificar si la API key está disponible
  const isApiKeyValid = googleApiKey && googleApiKey.length > 10;

  console.log('SearchBarAuthSafe render:', {
    isModalVisible,
    isApiKeyValid,
    googleApiKeyLength: googleApiKey?.length || 0,
    error
  });

  const openSearchModal = () => {
    console.log('SearchBarAuthSafe - Opening modal');
    try {
      if (!isApiKeyValid) {
        Alert.alert(
          'Configuración requerida',
          'La búsqueda de lugares requiere configurar la API Key de Google Maps. Por favor contacta al administrador.',
          [{ text: 'OK' }]
        );
        return;
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error opening modal:', error);
      setError('Error al abrir búsqueda');
    }
  };

  const closeSearchModal = () => {
    console.log('SearchBarAuthSafe - Closing modal');
    try {
      setIsModalVisible(false);
      setError(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  };

  const handleNavigateToMap = () => {
    try {
      // Navegar al mapa directamente para testing
      router.push('/map');
      closeSearchModal();
    } catch (error) {
      console.error('Error navigating:', error);
    }
  };

  const SafeModal = ({ children }: { children: React.ReactNode }) => {
    try {
      return (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeSearchModal}
        >
          {children}
        </Modal>
      );
    } catch (error) {
      console.error('SafeModal error:', error);
      return null;
    }
  };

  const SafeView = ({ children, style }: { children: React.ReactNode; style?: any }) => {
    try {
      return (
        <ThemedView style={style}>
          {children}
        </ThemedView>
      );
    } catch (error) {
      console.error('SafeView error:', error);
      return <View style={style}><Text>Error en componente</Text></View>;
    }
  };

  return (
    <>
      {/* Barra de búsqueda compacta */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          { 
            backgroundColor: theme?.colors?.background || '#ffffff',
            borderColor: theme?.colors?.border || '#cccccc',
          }
        ]}
        onPress={openSearchModal}
        activeOpacity={0.7}
      >
        <Icon 
          name="search" 
          color={theme?.colors?.textSecondary || '#666666'} 
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
          color={theme?.colors?.primary || '#0066cc'} 
          size="sm" 
        />
      </TouchableOpacity>

      {/* Modal de búsqueda SUPER SEGURO */}
      {isModalVisible && (
        <SafeModal>
          <SafeView style={styles.modalContainer}>
            {/* Header del modal */}
            <View style={[
              styles.modalHeader,
              { borderBottomColor: theme?.colors?.border || '#cccccc' }
            ]}>
              <TouchableOpacity 
                onPress={closeSearchModal}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon 
                  name="arrow-back" 
                  color={theme?.colors?.text || '#000000'} 
                  size="lg" 
                />
              </TouchableOpacity>
              <ThemedText variant="subtitle" weight="semibold" style={styles.modalTitle}>
                Búsqueda de lugares
              </ThemedText>
              <View style={styles.placeholder} />
            </View>

            {/* Contenido simplificado para testing */}
            <View style={styles.testContent}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="error" color="#ff0000" size="lg" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.infoContainer}>
                    <Icon name="info" color={theme?.colors?.primary || '#0066cc'} size="lg" />
                    <ThemedText variant="body" style={styles.infoText}>
                      Versión de prueba - Sin Google Places
                    </ThemedText>
                  </View>

                  <ThemedButton
                    variant="primary"
                    size="lg"
                    onPress={handleNavigateToMap}
                    style={styles.testButton}
                  >
                    <Icon name="map" size="md" color="background" />
                    <ThemedText color="background"> Ir al mapa</ThemedText>
                  </ThemedButton>

                  <ThemedButton
                    variant="outline"
                    size="lg"
                    onPress={closeSearchModal}
                    style={styles.testButton}
                  >
                    Cerrar
                  </ThemedButton>
                </>
              )}
            </View>
          </SafeView>
        </SafeModal>
      )}
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

  // Contenido de prueba
  testContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 24,
  },
  infoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    minWidth: 200,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
  },
});