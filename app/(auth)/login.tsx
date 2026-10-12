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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import { storage } from '../../src/utils/storage';
import { securityService } from '../../src/utils/security';
import { biometricService } from '../../src/services/biometricService';
import { PatternLockModal } from '../../src/components/common/PatternLockModal';

import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/theme';

export default function UserLoginScreen() {
  const { loginWithBiometrics, refreshUser } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>(true);
  const [showPatternLock, setShowPatternLock] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const checkSecurityOptions = async () => {
      if (Platform.OS === 'web') {
        setCanUseBiometrics(false);
        return;
      }
      setCanUseBiometrics(true);
      const isPatternOn = await securityService.isPatternEnabled();
      const savedToken = await storage.getToken();
      if (isPatternOn && savedToken) {
        setShowPatternLock(true);
      }
    };
    checkSecurityOptions();
  }, []);

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
        Alert.alert('Biometrics Not Enrolled', 'No Fingerprint or Face ID found. Please set up biometrics in your device settings first.');
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
          Alert.alert('Biometric Verified ✅', 'Scan successful! Log in once with Email & Password to enable instant biometric access.');
        } else if (scanResult.error !== 'user_cancel') {
          setError('Biometric authentication failed. Please enter your password.');
        }
        return;
      }
      const result = await loginWithBiometrics();
      if (result.success) { router.replace('/(tabs)'); return; }
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

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!formData.email.trim()) { setError('Please enter your email address'); return; }
    if (!formData.password) { setError('Please enter your password'); return; }
    setError('');
    setLoading(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const response = await apiClient.post<any>('/auth/login', {
        email: cleanEmail,
        password: formData.password,
      });
      const data = response.data;
      const token = data.token || data.accessToken || data.data?.token;
      const user =
        data.user ||
        data.data?.user ||
        (typeof data.data === 'object' && data.data?._id ? data.data : undefined);
      if (!token || !user) throw new Error(data?.message || 'Invalid login response from server.');
      if (user.role !== 'user') { setError('Please use admin login for admin access.'); return; }
      if (user.membershipStatus === 'pending') { setError('Your membership is pending admin approval.'); return; }
      if (user.membershipStatus === 'inactive') { setError('Your membership has been deactivated.'); return; }
      await storage.setToken(token);
      await storage.setUserData(user);
      await refreshUser();
      const { hasHardware, isEnrolled } = await biometricService.checkAvailability();
      const isBioEnabled = await biometricService.isEnabled();
      if (hasHardware && isEnrolled && Platform.OS !== 'web') {
        await biometricService.enableBiometric(token);
        if (!isBioEnabled) {
          Alert.alert('Biometric Login Enabled ✅', 'Fingerprint / Face ID login is now active for fast access!', [
            { text: 'Great!', onPress: () => router.replace('/(tabs)') },
          ]);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#060E2B" />

      {/* Rich deep navy background */}
      <View style={styles.bgFull} />

      {/* Decorative glow orbs */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>

            {/* Standardized KEA Official Brand Logo Card */}
            <LinearGradient
              colors={['#081A3C', '#0E306E', '#184A96']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadgeCard}
            >
              {/* Soft Backlight Aura for Maximum Visibility & Contrast */}
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
              <Text style={styles.cardSubtitle}>Sign in to your KEA account</Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                <Mail size={17} color={emailFocused ? '#3B6EFF' : '#A0ABBB'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#A0ABBB"
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
                <Lock size={17} color={passwordFocused ? '#3B6EFF' : '#A0ABBB'} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { paddingRight: 44 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0ABBB"
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
                >
                  {showPassword ? (
                    <EyeOff size={17} color="#A0ABBB" />
                  ) : (
                    <Eye size={17} color="#A0ABBB" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.75}
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
            </TouchableOpacity>

            {/* Biometric Row */}
            {canUseBiometrics && (
              <TouchableOpacity
                style={styles.bioBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.8}
              >
                <View style={styles.bioIconWrap}>
                  <Fingerprint size={20} color="#3B6EFF" />
                </View>
                <View style={styles.bioTextWrap}>
                  <Text style={styles.bioTitle}>Use Biometric Login</Text>
                  <Text style={styles.bioSub}>Fingerprint · Face ID</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>New to KEA?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Button */}
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

      <PatternLockModal
        visible={showPatternLock}
        mode="verify"
        onSuccess={() => { setShowPatternLock(false); router.replace('/(tabs)'); }}
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
    backgroundColor: '#0B1437',
  },

  // Full background
  bgFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#060E2B',
  },

  // Decorative glow orbs
  glowOrb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(26, 75, 255, 0.12)',
    top: -80,
    right: -80,
  },
  glowOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 110, 255, 0.07)',
    bottom: 60,
    left: -60,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
  },

  // Card Container
  cardContainer: {
    paddingHorizontal: 0,
    alignItems: 'center',
    width: '100%',
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#DCE6F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },

  // KEA Logo Badge Card (High Visibility & Standardized)
  logoBadgeCard: {
    width: '100%',
    height: 112,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#071630',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  logoHighlightAura: {
    position: 'absolute',
    width: '90%',
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.28)',
  },
  logoBadgeImage: {
    width: '94%',
    height: 98,
    zIndex: 1,
  },

  // Card Header
  cardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0A1628',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
  },

  // Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 13,
    color: '#BE123C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Form Fields
  fieldGroup: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A4BFF',
    textTransform: 'none',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 11,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },

  // Sign In Button
  signInBtn: {
    backgroundColor: '#1E3A8A',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  bioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bioTextWrap: {
    flex: 1,
  },
  bioTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  bioSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
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

  // Register Button (Create an Account)
  registerBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  registerBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
});
