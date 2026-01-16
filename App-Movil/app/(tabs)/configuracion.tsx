import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { EditProfileModal } from '../../components/EditProfileModal';
import { LoadingScreen } from '../../components/LoadingScreen';
import { OfflineDataManagerSimple as OfflineDataManager } from '../../components/OfflineDataManagerSimple';

export default function ConfigurationScreen() {
  const { user, userProfile, logout, updateUserProfile, isAuthenticated, isGuest, loading } = useAuth();
  const { theme, toggleTheme, setFontScale, syncWithUserProfile } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Sincronizar tema con perfil de usuario cuando cambie
  useEffect(() => {
    const syncProfile = async () => {
      if (userProfile && isAuthenticated) {
        try {
          await syncWithUserProfile(userProfile);
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      }
    };
    
    syncProfile();
  }, [userProfile, isAuthenticated, syncWithUserProfile]);


  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?\n\nPerderás el acceso a tus favoritos y preferencias guardadas hasta que vuelvas a iniciar sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await logout();
              // Redireccionar según la estructura de rutas
              router.replace('/auth');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };


  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'high-contrast') => {
    try {
      // Aplicar tema inmediatamente
      await toggleTheme(newTheme);
      
      // Guardar en Firebase si el usuario está autenticado
      if (isAuthenticated && userProfile) {
        try {
          const preferences = {
            language: userProfile?.preferences?.language || 'es',
            notifications: userProfile?.preferences?.notifications ?? true,
            fontScale: userProfile?.preferences?.fontScale || 1.0,
            location: userProfile?.preferences?.location ?? true,
            ...userProfile.preferences,
            theme: newTheme,
          };
          
          // Only include defaultLocation if it exists
          if (userProfile?.preferences?.defaultLocation) {
            preferences.defaultLocation = userProfile.preferences.defaultLocation;
          }
          
          await updateUserProfile({ preferences });
          console.log('Theme preference saved to Firebase successfully');
        } catch (firebaseError) {
          console.warn('Failed to save theme to Firebase, but local update succeeded:', firebaseError);
          // No mostrar error ya que el tema sí cambió localmente
        }
      }
      
      // Mostrar confirmación siempre (porque el cambio local sí funcionó)
      Alert.alert('Tema actualizado', `Se cambió al tema ${getThemeDisplayName(newTheme).toLowerCase()}`);
    } catch (error) {
      console.error('Error updating theme locally:', error);
      Alert.alert('Error', 'No se pudo cambiar el tema');
    }
  };

  const handleFontScaleChange = async (newScale: number) => {
    try {
      // Aplicar escala inmediatamente
      await setFontScale(newScale);
      
      // Guardar en Firebase si el usuario está autenticado
      if (isAuthenticated && userProfile) {
        try {
          const preferences = {
            language: userProfile?.preferences?.language || 'es',
            notifications: userProfile?.preferences?.notifications ?? true,
            theme: userProfile?.preferences?.theme || 'light',
            location: userProfile?.preferences?.location ?? true,
            ...userProfile.preferences,
            fontScale: newScale,
          };
          
          // Only include defaultLocation if it exists
          if (userProfile?.preferences?.defaultLocation) {
            preferences.defaultLocation = userProfile.preferences.defaultLocation;
          }
          
          await updateUserProfile({ preferences });
          console.log('Font scale preference saved to Firebase successfully');
        } catch (firebaseError) {
          console.warn('Failed to save font scale to Firebase, but local update succeeded:', firebaseError);
          // No mostrar error ya que el cambio local sí funcionó
        }
      }
      
      // Mostrar confirmación siempre (porque el cambio local sí funcionó)
      Alert.alert('Tamaño de fuente actualizado', `Se cambió a ${getFontSizeDisplayName(newScale)}`);
    } catch (error) {
      console.error('Error updating font scale locally:', error);
      Alert.alert('Error', 'No se pudo cambiar el tamaño de fuente');
    }
  };

  const showThemeSelector = () => {
    console.log('🎨 Mostrando selector de tema');
    Alert.alert(
      'Seleccionar Tema',
      'Elige el tema de la aplicación',
      [
        { text: 'Claro', onPress: () => handleThemeChange('light') },
        { text: 'Oscuro', onPress: () => handleThemeChange('dark') },
        { text: 'Alto Contraste', onPress: () => handleThemeChange('high-contrast') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const showFontSizeSelector = () => {
    console.log('📝 Mostrando selector de tamaño de fuente');
    Alert.alert(
      'Tamaño de Fuente',
      'Selecciona el tamaño de fuente',
      [
        { text: 'Pequeño (0.8x)', onPress: () => handleFontScaleChange(0.8) },
        { text: 'Normal (1.0x)', onPress: () => handleFontScaleChange(1.0) },
        { text: 'Grande (1.2x)', onPress: () => handleFontScaleChange(1.2) },
        { text: 'Muy Grande (1.5x)', onPress: () => handleFontScaleChange(1.5) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const getThemeDisplayName = (mode: string) => {
    switch (mode) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      case 'high-contrast': return 'Alto Contraste';
      default: return 'Claro';
    }
  };

  const getFontSizeDisplayName = (scale: number) => {
    if (scale <= 0.8) return 'Pequeño';
    if (scale <= 1.0) return 'Normal';
    if (scale <= 1.2) return 'Grande';
    return 'Muy Grande';
  };

  const handleLoginPress = () => {
    router.push('/auth');
  };

  // Crear estilos dinámicos basados en configuraciones de accesibilidad
  const createDynamicStyles = () => {
    const minTouchTarget = getMinTouchTarget();
    const scaledPadding = getPaddingScaled(16);
    const scaledMargin = getMarginScaled(16);
    
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
      },
      centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scaledMargin,
      },
      avatarContainer: {
        marginRight: scaledMargin,
      },
      userInfo: {
        flex: 1,
      },
      sectionTitle: {
        marginBottom: scaledMargin,
      },
      preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: getPaddingScaled(12),
        minHeight: minTouchTarget,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      preferenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      preferenceText: {
        marginLeft: getPaddingScaled(12),
        flex: 1,
      },
      settingButton: {
        paddingHorizontal: 0,
        paddingVertical: getPaddingScaled(12),
        minHeight: minTouchTarget,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderRadius: 0,
      },
      settingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: minTouchTarget,
      },
      settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      settingText: {
        marginLeft: getPaddingScaled(12),
        flex: 1,
      },
      loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
      },
      logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
        borderColor: theme.colors.error,
      },
      footer: {
        paddingVertical: getPaddingScaled(32),
        alignItems: 'center',
      },
      footerText: {
        textAlign: 'center',
      },
      logoutWarning: {
        marginTop: getMarginScaled(8),
        textAlign: 'center',
        fontStyle: 'italic',
      },
      editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: getPaddingScaled(8),
      },
      statItem: {
        alignItems: 'center',
        paddingHorizontal: getPaddingScaled(8),
      },
      memberSince: {
        marginTop: getMarginScaled(4),
      },
    });
  };

  const styles = createDynamicStyles();

  // Mostrar loading mientras se determina el estado de autenticación
  if (loading) {
    return (
      <LoadingScreen 
        message="Cargando configuración..." 
        showIcon={true}
        timeout={5000}
      />
    );
  }

  if (isGuest || !isAuthenticated) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        {/* Header */}
        <PageHeader
          title="Configuración"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={tabBarPadding}
          showsVerticalScrollIndicator={false}
        >

          {/* Perfil de invitado */}
          <Card margin="md">
            <ThemedView style={styles.profileInfo}>
              <ThemedView style={styles.avatarContainer}>
                <Icon name="account-circle" size={80} color="textSecondary" />
              </ThemedView>
              <ThemedView style={styles.userInfo}>
                <ThemedText variant="subtitle" weight="semibold">
                  Usuario Invitado
                </ThemedText>
                <ThemedText variant="body" color="textSecondary">
                  Inicia sesión para acceder a todas las funciones
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            <ThemedButton
              variant="primary"
              onPress={handleLoginPress}
              style={styles.loginButton}
              testID="settings-login-button"
            >
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="person" color="background" size="md" />
                <ThemedText color="background" weight="semibold"> Iniciar Sesión</ThemedText>
              </ThemedView>
            </ThemedButton>
          </Card>

          {/* Modo Offline disponible para invitados */}
          <OfflineDataManager />

          {/* Configuración básica disponible para invitados */}
          <Card margin="md">
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Apariencia
            </ThemedText>

            <TouchableOpacity
              onPress={showThemeSelector}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="color-palette" library="ionicons" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Tema
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {getThemeDisplayName(theme.mode)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={showFontSizeSelector}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="text" library="ionicons" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Tamaño de fuente
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {getFontSizeDisplayName(theme.fontScale)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>
          </Card>

          {/* Información de la App */}
          <Card margin="md">
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              Información
            </ThemedText>

            <TouchableOpacity
              onPress={() => Alert.alert(
                'Acerca de TransiLoja', 
                'Versión 1.0.0 Beta\n\nTransiLoja es una aplicación móvil diseñada para mejorar la experiencia del transporte público en Loja, Ecuador.\n\n✨ Características principales:\n• Rutas optimizadas con algoritmo RAPTOR\n• Seguimiento de buses en tiempo real\n• Paradas favoritas personalizables\n• Alertas y notificaciones\n• Modo offline básico\n\n📍 Desarrollada específicamente para el sistema de transporte de Loja\n\n🚀 ¡Gracias por usar TransiLoja!',
                [{ text: 'Entendido' }]
              )}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="information-circle-outline" library="ionicons" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Acerca de
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Versión y información de la app
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-right" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>
          </Card>

          <ThemedView style={styles.footer}>
            <ThemedText variant="caption" color="textSecondary" style={styles.footerText}>
              TransiLoja v1.0.0
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }


  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header */}
      <PageHeader
        title="Configuración"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={tabBarPadding}
        showsVerticalScrollIndicator={false}
      >

        {/* Información del Usuario */}
        <Card margin="md">
          <ThemedView style={styles.profileInfo}>
            <ThemedView style={styles.avatarContainer}>
              <Icon name="account-circle" library="material" size={80} color="primary" />
            </ThemedView>
            <ThemedView style={styles.userInfo}>
              <ThemedText variant="subtitle" weight="semibold">
                {userProfile?.displayName || user?.displayName || 'Usuario'}
              </ThemedText>
              <ThemedText variant="body" color="textSecondary">
                {user?.email}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={styles.memberSince}>
                Miembro desde {userProfile?.createdAt && userProfile.createdAt instanceof Date 
                  ? userProfile.createdAt.toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long' 
                    })
                  : 'Fecha no disponible'
                }
              </ThemedText>
            </ThemedView>
          </ThemedView>
          
          <ThemedButton
            variant="outline"
            size="lg"
            onPress={() => setEditModalVisible(true)}
            style={styles.editButton}
          >
            <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="edit" library="material" size="md" color="primary" />
              <ThemedText color="primary"> Editar Perfil</ThemedText>
            </ThemedView>
          </ThemedButton>
        </Card>

        {/* Modo Offline */}
        <OfflineDataManager />

        {/* Configuración consolidada */}
        <Card margin="md">
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            Ajustes
          </ThemedText>

          <TouchableOpacity
            onPress={showThemeSelector}
            style={[styles.settingButton, { backgroundColor: 'transparent' }]}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.settingContent}>
              <ThemedView style={styles.settingInfo}>
                <Icon name="color-palette" library="ionicons" color="primary" size="md" />
                <ThemedView style={styles.settingText}>
                  <ThemedText variant="body" weight="semibold">
                    Tema
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {getThemeDisplayName(theme.mode)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={showFontSizeSelector}
            style={[styles.settingButton, { backgroundColor: 'transparent' }]}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.settingContent}>
              <ThemedView style={styles.settingInfo}>
                <Icon name="text" library="ionicons" color="primary" size="md" />
                <ThemedView style={styles.settingText}>
                  <ThemedText variant="body" weight="semibold">
                    Tamaño de fuente
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {getFontSizeDisplayName(theme.fontScale)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
            </ThemedView>
          </TouchableOpacity>
        </Card>

        {/* Información de la App */}
        <Card margin="md">
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            Información
          </ThemedText>

          <TouchableOpacity
            onPress={() => Alert.alert(
              'Acerca de TransiLoja', 
              'Versión 1.0.0 Beta\n\nTransiLoja es una aplicación móvil diseñada para mejorar la experiencia del transporte público en Loja, Ecuador.\n\n✨ Características principales:\n• Rutas optimizadas con algoritmo RAPTOR\n• Seguimiento de buses en tiempo real\n• Paradas favoritas personalizables\n• Alertas y notificaciones\n• Modo offline básico\n\n📍 Desarrollada específicamente para el sistema de transporte de Loja\n\n🚀 ¡Gracias por usar TransiLoja!',
              [{ text: 'Entendido' }]
            )}
            style={[styles.settingButton, { backgroundColor: 'transparent' }]}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.settingContent}>
              <ThemedView style={styles.settingInfo}>
                <Icon name="information-circle-outline" library="ionicons" color="primary" size="md" />
                <ThemedView style={styles.settingText}>
                  <ThemedText variant="body" weight="semibold">
                    Acerca de TransiLoja
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Versión 1.0.0 Beta
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
            </ThemedView>
          </TouchableOpacity>
        </Card>

        {/* Cerrar Sesión */}
        <Card margin="md">
          <ThemedButton
            variant="outline"
            onPress={handleLogout}
            loading={actionLoading}
            style={styles.logoutButton}
            testID="logout-button"
          >
            <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="logout" library="material" color="error" size="md" />
              <ThemedText color="error"> Cerrar Sesión</ThemedText>
            </ThemedView>
          </ThemedButton>
          <ThemedText variant="caption" color="textSecondary" style={styles.logoutWarning}>
            Se cerrará tu sesión y tendrás acceso limitado
          </ThemedText>
        </Card>

        <EditProfileModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          userProfile={userProfile}
          onSave={async (data) => {
            try {
              await updateUserProfile(data);
              setEditModalVisible(false);
              Alert.alert('Éxito', 'Perfil actualizado correctamente');
            } catch (error) {
              console.error('Error updating profile:', error);
              Alert.alert('Error', 'No se pudo actualizar el perfil');
            }
          }}
        />

        <ThemedView style={styles.footer}>
          <ThemedText variant="caption" color="textSecondary" style={styles.footerText}>
            TransiLoja v1.0.0 Beta
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
