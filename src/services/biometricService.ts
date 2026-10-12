import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  BIOMETRIC_TOKEN: 'kea_secure_biometric_token',
  BIOMETRIC_ENABLED: 'kea_biometric_enabled',
};

export type BiometricAuthReason =
  | 'SUCCESS'
  | 'NOT_AVAILABLE'
  | 'NOT_ENROLLED'
  | 'USER_CANCELLED'
  | 'SYSTEM_CANCELLED'
  | 'LOCKOUT'
  | 'NO_SAVED_TOKEN'
  | 'FAILED'
  | 'WEB_UNSUPPORTED';

export interface BiometricCheckResult {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isAvailable: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  reason: BiometricAuthReason;
  error?: string;
  token?: string | null;
}

export const biometricService = {
  /**
   * Checks if the device supports biometric hardware and has enrolled biometrics.
   */
  async checkAvailability(): Promise<BiometricCheckResult> {
    if (Platform.OS === 'web') {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        isAvailable: false,
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isAvailable: hasHardware && isEnrolled,
      };
    } catch (err: any) {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        isAvailable: false,
      };
    }
  },

  /**
   * Checks if user has enabled biometric authentication in app settings & has a saved token.
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const enabledVal = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
      if (enabledVal !== 'true') return false;
      const savedToken = await this.getSavedToken();
      return !!savedToken;
    } catch {
      return false;
    }
  },

  /**
   * Enable biometric authentication and save the auth token securely.
   */
  async enableBiometric(token: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      await SecureStore.setItemAsync(KEYS.BIOMETRIC_TOKEN, token);
      await SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, 'true');
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Disable biometric authentication and clear saved biometric token.
   */
  async disableBiometric(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync(KEYS.BIOMETRIC_TOKEN);
      await SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, 'false');
    } catch {
      // Ignore clear errors
    }
  },

  /**
   * Save or update stored biometric token securely.
   */
  async saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(KEYS.BIOMETRIC_TOKEN, token);
    } catch {
      // Ignore write errors
    }
  },

  /**
   * Retrieve saved biometric token securely.
   */
  async getSavedToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      return await SecureStore.getItemAsync(KEYS.BIOMETRIC_TOKEN);
    } catch {
      return null;
    }
  },

  /**
   * Prompts user for biometric authentication (Fingerprint / Face ID).
   */
  async authenticate(promptMessage = 'Authenticate to access KEA App'): Promise<BiometricAuthResult> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        reason: 'WEB_UNSUPPORTED',
        error: 'Biometric authentication is not supported on Web browser.',
      };
    }

    const { isAvailable, hasHardware, isEnrolled } = await this.checkAvailability();

    if (!hasHardware) {
      return {
        success: false,
        reason: 'NOT_AVAILABLE',
        error: 'Device hardware does not support biometrics.',
      };
    }

    if (!isEnrolled) {
      return {
        success: false,
        reason: 'NOT_ENROLLED',
        error: 'No biometric credentials (fingerprint/face) enrolled on device.',
      };
    }

    const token = await this.getSavedToken();
    if (!token) {
      return {
        success: false,
        reason: 'NO_SAVED_TOKEN',
        error: 'No saved session token found for biometric authentication.',
      };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return {
          success: true,
          reason: 'SUCCESS',
          token,
        };
      }

      if (result.error === 'user_cancel') {
        return {
          success: false,
          reason: 'USER_CANCELLED',
          error: 'Biometric authentication was cancelled by user.',
        };
      }

      if (result.error === 'system_cancel') {
        return {
          success: false,
          reason: 'SYSTEM_CANCELLED',
          error: 'Biometric authentication was cancelled by system.',
        };
      }

      if (result.error === 'lockout' || (result.error as string) === 'lockout_permanent') {
        return {
          success: false,
          reason: 'LOCKOUT',
          error: 'Too many failed attempts. Biometrics locked out.',
        };
      }

      return {
        success: false,
        reason: 'FAILED',
        error: 'Biometric verification failed.',
      };
    } catch (err: any) {
      return {
        success: false,
        reason: 'FAILED',
        error: err?.message || 'Biometric authentication encounterd an unexpected error.',
      };
    }
  },
};
