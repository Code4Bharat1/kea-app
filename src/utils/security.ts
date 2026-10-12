import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const KEYS = {
  SECURE_TOKEN: 'kea_secure_token',
  BIOMETRIC_ENABLED: 'kea_biometric_enabled',
  PATTERN_ENABLED: 'kea_pattern_enabled',
  PATTERN_HASH: 'kea_pattern_hash',
};

// Simple secure hashing for pattern dots
const hashPattern = (pattern: number[]): string => {
  const patternString = pattern.join('-');
  let hash = 0;
  for (let i = 0; i < patternString.length; i++) {
    const char = patternString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `KEA_SEC_${Math.abs(hash)}_${patternString.length}`;
};

export const securityService = {
  // Secure Item Methods
  async setSecureItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async getSecureItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async deleteSecureItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },

  // Token Methods
  async saveAuthToken(token: string): Promise<void> {
    await this.setSecureItem(KEYS.SECURE_TOKEN, token);
  },

  async getAuthToken(): Promise<string | null> {
    return await this.getSecureItem(KEYS.SECURE_TOKEN);
  },

  async clearAuthToken(): Promise<void> {
    await this.deleteSecureItem(KEYS.SECURE_TOKEN);
  },

  // Biometric Methods
  async checkBiometricStatus(): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> {
    if (Platform.OS === 'web') {
      return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return { hasHardware, isEnrolled, supportedTypes };
    } catch {
      return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
    }
  },

  async authenticateBiometric(promptMessage = 'Authenticate to access KEA App'): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { hasHardware, isEnrolled } = await this.checkBiometricStatus();
      if (!hasHardware || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Pattern / Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  },

  async isBiometricEnabled(): Promise<boolean> {
    const val = await this.getSecureItem(KEYS.BIOMETRIC_ENABLED);
    return val === 'true';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setSecureItem(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  },

  // Pattern Lock Methods
  async savePattern(pattern: number[]): Promise<boolean> {
    if (pattern.length < 4) return false;
    const hashed = hashPattern(pattern);
    await this.setSecureItem(KEYS.PATTERN_HASH, hashed);
    await this.setSecureItem(KEYS.PATTERN_ENABLED, 'true');
    return true;
  },

  async verifyPattern(pattern: number[]): Promise<boolean> {
    const savedHash = await this.getSecureItem(KEYS.PATTERN_HASH);
    if (!savedHash) return false;
    const inputHash = hashPattern(pattern);
    return savedHash === inputHash;
  },

  async isPatternEnabled(): Promise<boolean> {
    const val = await this.getSecureItem(KEYS.PATTERN_ENABLED);
    return val === 'true';
  },

  async disablePattern(): Promise<void> {
    await this.deleteSecureItem(KEYS.PATTERN_HASH);
    await this.setSecureItem(KEYS.PATTERN_ENABLED, 'false');
  },

  // Clear All Security State on Logout
  async clearAllSecurityOnLogout(): Promise<void> {
    await this.clearAuthToken();
    // Note: We preserve user's biometric & pattern settings unless explicitly reset
  }
};
