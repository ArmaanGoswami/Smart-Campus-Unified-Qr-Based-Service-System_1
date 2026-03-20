import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const ROLES = ['Student', 'Warden', 'Guard'];
const STORAGE_KEY = 'smartgate_user_id';
const VALIDATION = {
  idPattern: /^[a-zA-Z0-9]{4,10}$/,
  minPassword: 6,
};

export default function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errors, setErrors] = useState({ userId: null, password: null });

  const passwordRef = useRef(null);

  useEffect(() => {
    const restoreSavedUserId = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUserId) {
          setUserId(savedUserId);
          setRememberMe(true);
        }
      } catch (error) {
        console.warn('Could not restore saved ID:', error?.message || error);
      }
    };

    restoreSavedUserId();
  }, []);

  const sanitizeInput = (value) => value.trim().replace(/[<>"']/g, '').slice(0, 100);

  const validateInputs = (idValue, passwordValue) => {
    const nextErrors = { userId: null, password: null };

    if (!idValue) {
      nextErrors.userId = 'ID is required';
    } else if (!VALIDATION.idPattern.test(idValue)) {
      nextErrors.userId = 'ID must be 4-10 alphanumeric characters';
    }

    if (!passwordValue) {
      nextErrors.password = 'Password is required';
    } else if (passwordValue.length < VALIDATION.minPassword) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(nextErrors);
    return !nextErrors.userId && !nextErrors.password;
  };

  const saveRememberedId = async (idValue) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(STORAGE_KEY, idValue);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Could not persist remember me setting:', error?.message || error);
    }
  };

  const handleUserIdChange = (text) => {
    setUserId(text);
    if (errors.userId) {
      validateInputs(sanitizeInput(text), password);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (errors.password) {
      validateInputs(userId, text);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    const cleanUserId = sanitizeInput(userId);
    const cleanPassword = sanitizeInput(password);

    if (!validateInputs(cleanUserId, cleanPassword)) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields.');
      return;
    }

    setIsLoading(true);

    try {
      await saveRememberedId(cleanUserId);

      // Simulated async login; replace with real API integration.
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setPassword('');
      navigation.replace(role, { userId: cleanUserId, role });
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFF1DD', '#FEC992', '#FF9A58', '#FF7A3E']}
      start={{ x: 0.05, y: 0.08 }}
      end={{ x: 0.95, y: 0.92 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF8C42" />

      <View pointerEvents="none" style={styles.bgLayer}>
        <View style={[styles.bgBlob, styles.bgBlobOne]} />
        <View style={[styles.bgBlob, styles.bgBlobTwo]} />
        <View style={[styles.bgBlob, styles.bgBlobThree]} />

        <LinearGradient
          colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.auroraOne}
        />
        <LinearGradient
          colors={['rgba(255, 199, 146, 0.22)', 'rgba(255, 199, 146, 0.01)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.auroraTwo}
        />

        <View style={[styles.bgRing, styles.bgRingOne]} />
        <View style={[styles.bgRing, styles.bgRingTwo]} />

        <View style={styles.dotCluster}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`dot-${i}`} style={styles.dot} />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.cardGlow} />
            <View pointerEvents="none" style={styles.cardSheen} />

            <View style={styles.glassChipRow}>
              <View style={styles.glassChip}>
                <Text style={styles.glassChipText}>Live Gate</Text>
              </View>
              <View style={styles.glassChip}>
                <Text style={styles.glassChipText}>QR Secure</Text>
              </View>
            </View>

            <LinearGradient
              colors={['#FF8C42', '#FF6B35']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>🎓 Smart Campus QR Suite</Text>
            </LinearGradient>

            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Secure access to campus services</Text>

            <View style={styles.roleContainer}>
              {ROLES.map((r) => {
                const isActive = role === r;

                return (
                  <Pressable
                    key={r}
                    style={({ hovered, pressed }) => [
                      styles.roleButton,
                      hovered && !isActive && styles.roleButtonHover,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setRole(r)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${r} role`}
                    accessibilityState={{ selected: isActive }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={['#FF8C42', '#FF6B35']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.activeRoleGradient}
                      >
                        <Text style={styles.activeText}>{r}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.inactiveText}>{r}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>ID NUMBER</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'userId' && styles.inputFocused,
                errors.userId && styles.inputError,
              ]}
              placeholder="Enter your ID"
              placeholderTextColor="#9A9A9A"
              value={userId}
              onChangeText={handleUserIdChange}
              onFocus={() => setFocusedInput('userId')}
              onBlur={() => {
                setFocusedInput(null);
                validateInputs(sanitizeInput(userId), password);
              }}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              accessibilityLabel="ID Number"
            />
            {errors.userId ? <Text style={styles.errorText}>{errors.userId}</Text> : null}

            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  styles.passwordInput,
                  focusedInput === 'password' && styles.inputFocused,
                  errors.password && styles.inputError,
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#9A9A9A"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => {
                  setFocusedInput(null);
                  validateInputs(userId, sanitizeInput(password));
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
                accessibilityLabel="Password"
              />
              <Pressable
                style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <View style={styles.rowBetween}>
              <Pressable
                style={({ pressed }) => [styles.rememberRow, pressed && styles.pressed]}
                onPress={() => setRememberMe((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityLabel="Remember me"
                accessibilityState={{ checked: rememberMe }}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert('Info', 'Please contact admin to reset your password.')
                }
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ hovered, pressed }) => [
                styles.loginButtonWrap,
                hovered && !isLoading && styles.loginButtonHover,
                pressed && styles.loginButtonPressed,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={`Login as ${role}`}
            >
              <LinearGradient
                colors={['#FF8C42', '#FF6B35']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Login as {role}</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.footerRow}>
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                accessibilityRole="image"
                accessibilityLabel="Shield icon"
              >
                <Path
                  d="M12 2L4 5V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V5L12 2ZM12 12.5C10.62 12.5 9.5 11.38 9.5 10C9.5 8.62 10.62 7.5 12 7.5C13.38 7.5 14.5 8.62 14.5 10C14.5 11.38 13.38 12.5 12 12.5ZM12 20.2C9.9 19.39 7 15.42 7 11.15V7.04L12 5.15L17 7.04V11.15C17 15.42 14.1 19.39 12 20.2Z"
                  fill="#999999"
                />
              </Svg>
              <Text style={styles.footerText}>
                Secure QR access for hostel and campus movement
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    zIndex: 2,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgBlobOne: {
    width: 360,
    height: 360,
    top: -150,
    left: -110,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bgBlobTwo: {
    width: 320,
    height: 320,
    right: -90,
    top: 220,
    backgroundColor: 'rgba(255, 195, 132, 0.28)',
  },
  bgBlobThree: {
    width: 220,
    height: 220,
    top: 120,
    left: -70,
    backgroundColor: 'rgba(255, 226, 184, 0.2)',
  },
  auroraOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 160,
    top: 20,
    left: 110,
    transform: [{ rotate: '28deg' }],
  },
  auroraTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 140,
    bottom: 30,
    right: 40,
    transform: [{ rotate: '-16deg' }],
  },
  bgRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  bgRingOne: {
    width: 170,
    height: 170,
    right: 90,
    top: 90,
  },
  bgRingTwo: {
    width: 120,
    height: 120,
    right: 180,
    bottom: 80,
  },
  dotCluster: {
    position: 'absolute',
    left: 72,
    bottom: 86,
    width: 86,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    opacity: 0.38,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 248, 236, 0.92)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.54)',
    paddingHorizontal: Platform.select({ web: 48, default: 28 }),
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#7D3F23',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 30,
    elevation: 9,
    overflow: 'hidden',
    position: 'relative',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  cardGlow: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  cardSheen: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  glassChipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  glassChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  glassChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5E42',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    padding: 6,
    borderRadius: 14,
    gap: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  roleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  roleButtonHover: {
    backgroundColor: '#F1F1F1',
  },
  activeRoleGradient: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  inactiveText: {
    color: '#5A5A5A',
    fontWeight: '600',
    fontSize: 14,
  },
  inputLabel: {
    color: '#4E4E4E',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputFocused: {
    borderColor: '#FF8C42',
    backgroundColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#FF8C42',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: '#D94545',
    backgroundColor: '#FFF6F6',
  },
  errorText: {
    color: '#D94545',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 76,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 8,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.3,
  },
  rowBetween: {
    marginTop: 4,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 4,
    paddingRight: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#B6B6B6',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.64)',
  },
  checkboxActive: {
    borderColor: '#FF8C42',
    backgroundColor: '#FF8C42',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rememberText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
  forgotText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButtonWrap: {
    borderRadius: 12,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  loginButton: {
    minHeight: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loginButtonHover: {
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.38,
  },
  loginButtonPressed: {
    transform: [{ translateY: 0 }],
  },
  loginButtonDisabled: {
    opacity: 0.72,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.92,
  },
});