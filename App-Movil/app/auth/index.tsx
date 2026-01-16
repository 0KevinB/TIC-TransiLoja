import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedTextInput } from '../../components/ui/ThemedTextInput';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Icon } from '../../components/ui/Icon';

// Función para traducir errores de Firebase
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Errores de red
  if (errorMessage.includes('network') || errorMessage.includes('Network') || errorCode === 'auth/network-request-failed') {
    return 'Verifica tu conexión a internet e inténtalo de nuevo';
  }

  // Errores de autenticación
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciales incorrectas. Verifica tu correo y contraseña';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde';
    case 'auth/operation-not-allowed':
      return 'Esta operación no está permitida';
    default:
      // Si contiene "Firebase" o es muy técnico, mostrar mensaje genérico
      if (errorMessage.includes('Firebase') || errorMessage.includes('auth/')) {
        return 'Error de autenticación. Inténtalo de nuevo';
      }
      return errorMessage || 'Ha ocurrido un error. Inténtalo de nuevo';
  }
};

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest, resetPassword } = useAuth();
  const { theme } = useTheme();
  const { mode } = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });

  const handleSubmit = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!isForgotPassword && !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!isLogin && !isForgotPassword) {
      if (!formData.displayName) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    try {
      if (isForgotPassword) {
        await resetPassword(formData.email);
        Alert.alert(
          'Correo enviado',
          'Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsForgotPassword(false);
                setFormData({
                  email: '',
                  password: '',
                  displayName: '',
                  confirmPassword: '',
                });
              },
            },
          ]
        );
      } else if (isLogin) {
        console.log('Iniciando sesión desde auth screen...');
        await signIn(formData.email, formData.password);
        console.log('Login exitoso, redirigiendo...');

        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        console.log('Registrando usuario desde auth screen...');
        await signUp(formData.email, formData.password, formData.displayName);
        console.log('Registro exitoso, redirigiendo...');

        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      const errorMessage = getAuthErrorMessage(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    });
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLogin(false);
    setFormData({
      email: formData.email,
      password: '',
      displayName: '',
      confirmPassword: '',
    });
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    });
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Actualizar isLogin cuando cambie el parámetro mode
  useEffect(() => {
    if (mode === 'register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [mode]);

  // Debug para verificar la API key
  useEffect(() => {
    console.log('Auth Screen - Google API Key length:', googleApiKey?.length || 0);
    if (!googleApiKey || googleApiKey.length < 10) {
      console.warn('Auth Screen - Google API Key not properly configured');
    }
  }, [googleApiKey]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container} backgroundColor="background">
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <Icon
              name="directions-bus"
              size="xl"
              color="primary"
              library="material"
            />
            <ThemedText variant="title" style={styles.title}>
              TransiLoja
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.subtitle}>
              Tu compañero de viaje en transporte público
            </ThemedText>
          </ThemedView>

          {/* Formulario de autenticación */}
          <ThemedView style={styles.formContainer}>
            <ThemedText variant="subtitle" weight="bold" style={styles.formTitle}>
              {isForgotPassword ? 'Recuperar Contraseña' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </ThemedText>

            {!isLogin && !isForgotPassword && (
              <ThemedTextInput
                label="Nombre completo"
                value={formData.displayName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                placeholder="Ingresa tu nombre completo"
                icon={<Icon name="person" color="textSecondary" />}
                autoCapitalize="words"
              />
            )}

            <ThemedTextInput
              label="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Icon name="email" color="textSecondary" />}
            />

            {!isForgotPassword && (
              <>
                <ThemedTextInput
                  label="Contraseña"
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry
                  icon={<Icon name="lock" color="textSecondary" />}
                />

                {!isLogin && (
                  <ThemedTextInput
                    label="Confirmar contraseña"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirma tu contraseña"
                    secureTextEntry
                    icon={<Icon name="lock" color="textSecondary" />}
                  />
                )}
              </>
            )}

            <ThemedButton
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitButton}
              testID={isForgotPassword ? "reset-password-button" : isLogin ? "login-submit-button" : "register-submit-button"}
            >
              {isForgotPassword
                ? 'Enviar correo de recuperación'
                : isLogin
                ? 'Iniciar Sesión'
                : 'Registrarse'}
            </ThemedButton>

            {isForgotPassword ? (
              <ThemedButton
                variant="ghost"
                onPress={handleBackToLogin}
                style={styles.toggleButton}
              >
                Volver al inicio de sesión
              </ThemedButton>
            ) : (
              <>
                <ThemedButton
                  variant="ghost"
                  onPress={toggleMode}
                  style={styles.toggleButton}
                >
                  {isLogin
                    ? '¿No tienes cuenta? Regístrate'
                    : '¿Ya tienes cuenta? Inicia sesión'}
                </ThemedButton>
                {isLogin && (
                  <ThemedButton
                    variant="ghost"
                    onPress={handleForgotPassword}
                    style={styles.toggleButton}
                  >
                    <ThemedText color="primary">¿Olvidaste tu contraseña?</ThemedText>
                  </ThemedButton>
                )}
              </>
            )}
          </ThemedView>

          {/* Guest Access Section */}
          <ThemedView style={styles.guestSection}>
            <ThemedView style={styles.divider}>
              <ThemedView style={styles.dividerLine} />
              <ThemedText variant="caption" color="textSecondary" style={styles.dividerText}>
                O
              </ThemedText>
              <ThemedView style={styles.dividerLine} />
            </ThemedView>

            <ThemedText variant="body" color="textSecondary" style={styles.guestDescription}>
              Accede a las funciones básicas sin necesidad de crear una cuenta
            </ThemedText>

            <ThemedButton
              variant="outline"
              size="lg"
              onPress={handleGuestAccess}
              style={styles.guestButton}
              testID="guest-access-button"
            >
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="person-outline" size="md" color="primary" />
                <ThemedText color="primary" weight="semibold"> Continuar como Invitado</ThemedText>
              </ThemedView>
            </ThemedButton>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
  },
  formContainer: {
    width: '100%',
    marginBottom: 32,
  },
  formTitle: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 22,
  },
  submitButton: {
    marginTop: 24,
    width: '100%',
  },
  toggleButton: {
    marginTop: 12,
  },
  guestSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  guestDescription: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
    paddingHorizontal: 12,
  },
  guestButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});