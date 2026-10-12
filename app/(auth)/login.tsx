import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, LogIn, Fingerprint, ShieldAlert } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiClient, getCleanErrorMessage } from '../../src/api/client';
import { storage } from '../../src/utils/storage';
import { securityService } from '../../src/utils/security';
import { biometricService } from '../../src/services/biometricService';
import { PatternLockModal } from '../../src/components/common/PatternLockModal';

import * as LocalAuthentication from 'expo-local-authentication';

export default function UserLoginScreen() {
  const { loginWithBiometrics, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>(true);
  const [showPatternLock, setShowPatternLock] = useState<boolean>(false);

  useEffect(() => {
    const checkSecurityOptions = async () => {
      // Biometric button is visible by default on mobile platforms
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
        Alert.alert(
          'Biometrics Unavailable',
          'Your device hardware does not support Fingerprint or Face ID authentication.'
        );
        return;
      }

      if (!isEnrolled) {
        Alert.alert(
          'Biometrics Not Enrolled',
          'No Fingerprint or Face ID found. Please set up biometrics in your Android/iOS device Settings first.'
        );
        return;
      }

      const savedBioToken = await biometricService.getSavedToken();

      if (!savedBioToken) {
        // Prompt fingerprint/Face ID scan first to verify hardware works
        const scanResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify Fingerprint / Face ID for KEA App',
          fallbackLabel: 'Use Password',
          cancelLabel: 'Cancel',
        });

        if (scanResult.success) {
          Alert.alert(
            'Biometric Scan Verified ✅',
            'Your biometric scan was successful! Please log in with your Email & Password once to save your session for instant biometric login.'
          );
        } else if (scanResult.error !== 'user_cancel') {
          setError('Biometric authentication failed. Please enter your password.');
        }
        return;
      }

      // Restore session using saved token
      const result = await loginWithBiometrics();

      if (result.success) {
        router.replace('/(tabs)');
        return;
      }

      if (result.reason === 'USER_CANCELLED') {
        return;
      }

      if (result.reason === 'LOCKOUT') {
        setError('Biometric authentication locked due to multiple failed attempts. Please enter your password.');
      } else {
        setError(result.error || 'Biometric authentication failed. Please enter your password.');
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
    if (!formData.email.trim()) {
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

      if (!token || !user) {
        throw new Error(data?.message || 'Invalid login response from server.');
      }

      if (user.role !== 'user') {
        const msg = 'Please use admin login for admin access.';
        setError(msg);
        return;
      }

      if (user.membershipStatus === 'pending') {
        const msg = 'Your membership is pending admin approval.';
        setError(msg);
        return;
      }

      if (user.membershipStatus === 'inactive') {
        const msg = 'Your membership has been deactivated.';
        setError(msg);
        return;
      }

      await storage.setToken(token);
      await storage.setUserData(user);
      await refreshUser();

      // Check if device supports biometrics and enable biometric token automatically
      const { hasHardware, isEnrolled } = await biometricService.checkAvailability();
      const isBioEnabled = await biometricService.isEnabled();

      if (hasHardware && isEnrolled && Platform.OS !== 'web') {
        await biometricService.enableBiometric(token);

        if (!isBioEnabled) {
          Alert.alert(
            'Biometric Login Enabled ✅',
            'Fingerprint / Face ID login is now enabled on your device for fast access next time!',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = getCleanErrorMessage(err);
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Black Banner Container for Logo (Matching Web UI 1:1) */}
          <View style={styles.logoBlackBanner}>
            <Image
              source={require('../../assets/logo1.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>KEA User Login</Text>
            <Text style={styles.subtitle}>
              Access your KEA account to manage your profile, jobs, and events.
            </Text>
          </View>

          {/* Error Message Box */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#9CA3AF" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleInputChange('email', val)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" style={styles.leftIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 36 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => handleInputChange('password', val)}
                />
                <TouchableOpacity
                  style={styles.rightIconBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loginBtnText}>Logging in...</Text>
                </View>
              ) : (
                <View style={styles.loginBtnContent}>
                  <LogIn size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.loginBtnText}>Login</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Biometric Login Icon Button */}
            {canUseBiometrics && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
                accessibilityLabel="Login with Fingerprint / Face ID"
              >
                <Fingerprint size={28} color="#0D9488" />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerBtnText}>Register Now</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2026 Kokani Engineers & Professionals Association. All rights reserved.
        </Text>
      </ScrollView>

      {/* Pattern Lock Verification Modal */}
      <PatternLockModal
        visible={showPatternLock}
        mode="verify"
        onSuccess={() => {
          setShowPatternLock(false);
          router.replace('/(tabs)');
        }}
        onCancel={() => setShowPatternLock(false)}
        onForgotPattern={() => {
          setShowPatternLock(false);
          setError('Pattern lockout. Please log in with your email and password.');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  logoBlackBanner: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '85%',
    height: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  rightIconBtn: {
    padding: 6,
    position: 'absolute',
    right: 8,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  biometricBtn: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    borderRadius: 26,
    width: 52,
    height: 52,
    marginTop: 14,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: '#F3F4F6',
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    maxWidth: 300,
  },
});
