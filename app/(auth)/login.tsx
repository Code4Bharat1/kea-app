import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  AlertCircle,
  ChevronRight,
  Check,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { storage } from '../../src/utils/storage';
import { securityService } from '../../src/utils/security';
import { biometricService } from '../../src/services/biometricService';
import { PatternLockModal } from '../../src/components/common/PatternLockModal';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen() {
  const { login, loginWithBiometrics, user: currentUser } = useAuth();

  // Form State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Security / Biometrics State
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>(true);
  const [showPatternLock, setShowPatternLock] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const passwordRef = useRef<TextInput>(null);

  // Load Remembered Email and Security Options on mount
  useEffect(() => {
    const initScreen = async () => {
      // 1. Check remembered email
      try {
        const savedEmail = await storage.getRememberEmail();
        if (savedEmail) {
          setFormData((prev) => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }
      } catch {
        // ignore
      }

      // 2. Check biometrics and pattern lock
      if (Platform.OS === 'web') {
        setCanUseBiometrics(false);
        return;
      }
      setCanUseBiometrics(true);
      try {
        const isPatternOn = await securityService.isPatternEnabled();
        const savedToken = await storage.getToken();
        if (isPatternOn && savedToken) {
          setShowPatternLock(true);
        }
      } catch {
        // ignore
      }
    };

    initScreen();
  }, []);

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleBiometricLogin = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Notice', 'Biometric authentication is supported on mobile devices (Android & iOS).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { hasHardware, isEnrolled } = await biometricService.checkAvailability();
      if (!hasHardware) {
        Alert.alert('Biometrics Unavailable', 'Your device does not support Fingerprint or Face ID authentication.');
        return;
      }
      if (!isEnrolled) {
        Alert.alert('Biometrics Not Enrolled', 'No Fingerprint or Face ID found. Please configure biometrics in your device settings.');
        return;
      }
      const savedBioToken = await biometricService.getSavedToken();
      if (!savedBioToken) {
        const scanResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify Fingerprint / Face ID for KEA App',
          fallbackLabel: 'Use Password',
          cancelLabel: 'Cancel',
        });
        if (scanResult.success) {
          Alert.alert('Biometric Verified ✅', 'Log in once with Email & Password to enable instant biometric access.');
        } else if (scanResult.error !== 'user_cancel') {
          setError('Biometric authentication failed. Please enter your password.');
        }
        return;
      }

      const result = await loginWithBiometrics();
      if (result.success) {
        const storedUser = await storage.getUserData();
        if (storedUser?.role === 'admin' || storedUser?.role === 'superadmin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(tabs)');
        }
        return;
      }
      if (result.reason === 'USER_CANCELLED') return;
      if (result.reason === 'LOCKOUT') {
        setError('Biometric locked due to multiple failed attempts. Please use your password.');
      } else {
        setError(result.error || 'Biometric authentication failed.');
      }
    } catch {
      setError('Biometric authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Authenticate via unified login handler (handles both User and Admin accounts)
      const authResponse = await login({
        email: cleanEmail,
        password: formData.password,
      });

      const authenticatedUser = authResponse.user;
      if (!authenticatedUser || !authenticatedUser.role) {
        throw new Error('Account role could not be verified by backend authorization.');
      }

      // Handle "Remember Me"
      if (rememberMe) {
        await storage.setRememberEmail(cleanEmail);
      } else {
        await storage.setRememberEmail(null);
      }

      // Mobile Biometrics prompt if applicable
      if (Platform.OS !== 'web') {
        try {
          const { hasHardware, isEnrolled } = await biometricService.checkAvailability();
          const isBioEnabled = await biometricService.isEnabled();
          if (hasHardware && isEnrolled) {
            await biometricService.enableBiometric(authResponse.token);
          }
        } catch {
          // non-critical, continue
        }
      }

      // Automatic Role-Based Dashboard Redirection
      if (authenticatedUser.role === 'admin' || authenticatedUser.role === 'superadmin') {
        // Redirect to Admin Dashboard
        router.replace('/(admin)');
      } else if (authenticatedUser.role === 'user') {
        // Verify user membership status
        if (authenticatedUser.membershipStatus === 'pending') {
          setError('Your membership is pending approval. You will receive an email once approved.');
          return;
        }
        if (
          authenticatedUser.membershipStatus === 'rejected' ||
          (authenticatedUser.membershipStatus as string) === 'inactive'
        ) {
          setError('Your membership application was not approved or has been deactivated. Please contact support.');
          return;
        }

        // Redirect to User Dashboard
        router.replace('/(tabs)');
      } else {
        setError('Unauthorized access: Account role is unrecognized or unsupported.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#07122A" />

      {/* Deep KEA Blue Base Background */}
      <View style={styles.bgFull} />

      {/* Soft KEA Brand Glow Orbs */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>

            {/* Official KEA Logo Brand Card */}
            <LinearGradient
              colors={['#0A1D40', '#0F2F68', '#1E4DB7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadgeCard}
            >
              <View style={styles.logoHighlightAura} />
              <Image
                source={require('../../assets/kea-logo.png')}
                style={styles.logoBadgeImage}
                resizeMode="contain"
              />
            </LinearGradient>

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>
                Sign in to your Kokani Engineers Association account
              </Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <Mail
                  size={17}
                  color={emailFocused ? '#2563EB' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={formData.email}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onChangeText={(val) => handleInputChange('email', val)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Lock
                  size={17}
                  color={passwordFocused ? '#2563EB' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { paddingRight: 44 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  value={formData.password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={(val) => handleInputChange('password', val)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              {/* Remember Me Checkbox */}
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkboxBase,
                    rememberMe && styles.checkboxActive,
                  ]}
                >
                  {rememberMe && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.rememberMeLabel}>Remember me</Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Action Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1D4ED8', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                {loading ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.signInBtnText}>Signing in...</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.signInBtnText}>Sign In</Text>
                    <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Quick Biometric Login (Mobile only) */}
            {canUseBiometrics && (
              <TouchableOpacity
                style={styles.bioBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.8}
              >
                <View style={styles.bioIconWrap}>
                  <Fingerprint size={20} color="#2563EB" />
                </View>
                <View style={styles.bioTextWrap}>
                  <Text style={styles.bioTitle}>Quick Biometric Login</Text>
                  <Text style={styles.bioSub}>Fingerprint · Face ID verification</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            {/* Sign Up / Registration Divider & Link */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>New to KEA?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.registerBtnText}>Create an Account</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>

      {/* Pattern Lock Verification Modal */}
      <PatternLockModal
        visible={showPatternLock}
        mode="verify"
        onSuccess={async () => {
          setShowPatternLock(false);
          const storedUser = await storage.getUserData();
          if (storedUser?.role === 'admin' || storedUser?.role === 'superadmin') {
            router.replace('/(admin)');
          } else {
            router.replace('/(tabs)');
          }
        }}
        onCancel={() => setShowPatternLock(false)}
        onForgotPattern={() => {
          setShowPatternLock(false);
          setError('Pattern locked. Please log in with your email and password.');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07122A',
  },

  bgFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#07122A',
  },

  // Ambient Glow Orbs
  glowOrb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -90,
    right: -80,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  glowOrb2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 50,
    left: -70,
    backgroundColor: 'rgba(30, 64, 175, 0.12)',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  cardContainer: {
    alignItems: 'center',
    width: '100%',
  },

  // White Card with Clean KEA Styling
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 9,
  },

  // Logo Container
  logoBadgeCard: {
    width: '100%',
    height: 116,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  logoHighlightAura: {
    position: 'absolute',
    width: '92%',
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(37, 99, 235, 0.32)',
  },
  logoBadgeImage: {
    width: '94%',
    height: 98,
    zIndex: 1,
  },

  // Header
  cardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Error Banner
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Form Fields
  fieldGroup: {
    width: '100%',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 13,
  },
  inputWrapperFocused: {
    borderColor: '#2563EB',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },

  // Remember Me & Forgot Password Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBase: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rememberMeLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Sign In Button
  signInBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Biometric Button
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 12,
  },
  bioIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    backgroundColor: '#EFF6FF',
  },
  bioTextWrap: {
    flex: 1,
  },
  bioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  bioSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // Register Button
  registerBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
});
