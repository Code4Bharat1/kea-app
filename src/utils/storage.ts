import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kea_user_token';
const USER_KEY = 'kea_user_data';

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get auth token', e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save auth token', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove auth token', e);
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      let json: string | null = null;
      if (Platform.OS === 'web') {
        json = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      } else {
        json = await SecureStore.getItemAsync(USER_KEY);
      }
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Failed to get user data from storage', e);
      return null;
    }
  },

  async setUserData(userData: any): Promise<void> {
    try {
      const json = JSON.stringify(userData);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, json);
        return;
      }
      await SecureStore.setItemAsync(USER_KEY, json);
    } catch (e) {
      console.error('Failed to save user data in storage', e);
    }
  },

  async removeUserData(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.error('Failed to remove user data from storage', e);
    }
  },

  async clearSession(): Promise<void> {
    await Promise.all([this.removeToken(), this.removeUserData()]);
  },

  async getRememberEmail(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem('kea_remember_email') : null;
      }
      return await SecureStore.getItemAsync('kea_remember_email');
    } catch {
      return null;
    }
  },

  async setRememberEmail(email: string | null): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          if (email) localStorage.setItem('kea_remember_email', email);
          else localStorage.removeItem('kea_remember_email');
        }
        return;
      }
      if (email) await SecureStore.setItemAsync('kea_remember_email', email);
      else await SecureStore.deleteItemAsync('kea_remember_email');
    } catch {
      // ignore
    }
  }
};
