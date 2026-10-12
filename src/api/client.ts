import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const getInitialBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:7101/api';
    }
    return `http://${hostname}:7101/api`;
  }
  // Default to local server port 7101 or hosted production API
  return 'http://192.168.1.172:7101/api';
};

export const apiClient = axios.create({
  baseURL: getInitialBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

// Request Interceptor to attach Bearer Token only if it's a valid 3-part JWT
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token && typeof token === 'string' && token.split('.').length === 3) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle session expiration and server errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error?.config?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn('⚠️ 401 Unauthorized detected on protected route. Session expired.');
      await storage.clearSession();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    } else if (error.response && error.response.status >= 500) {
      if (error.response.data && typeof error.response.data === 'object') {
        if (!error.response.data.message) {
          error.response.data.message = `Server Error (${error.response.status}): Internal server error on backend.`;
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a clean, user-friendly error message from any Axios error or network error
 */
export const getCleanErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';

  // 1. Exact message string returned by Express backend
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string' && data.length < 200) return data;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error === 'string') return data.error;
  }

  // 2. Status code based fallback messages
  if (err?.response?.status) {
    const status = err.response.status;
    if (status === 401) return 'Invalid email or password.';
    if (status === 403) return 'Access denied. You do not have permission for this action.';
    if (status === 404) return 'Requested endpoint or resource not found.';
    if (status >= 500) return 'Server error. Please try again later.';
  }

  // 3. Network or connection errors
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
    return 'Unable to connect to backend server. Please check your network connection.';
  }

  // 4. Custom clean message
  if (err?.message && typeof err.message === 'string') {
    if (!err.message.includes('AxiosError') && !err.message.includes('status code')) {
      return err.message;
    }
  }

  return 'An error occurred while connecting to the server.';
};

export const isServerError = (err: any): boolean => {
  return !!(err?.response && err.response.status >= 500);
};

export const isNetworkOrServerError = (err: any): boolean => {
  return !err?.response || (err.response && (err.response.status >= 500 || err.response.status === 401)) || err.code === 'ERR_NETWORK';
};


