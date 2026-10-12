import { apiClient } from './client';
import { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  profile?: {
    headline?: string;
    phone?: string;
    company?: string;
    position?: string;
    category?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email ? payload.email.trim().toLowerCase() : '';
    console.log('📥 [Login Request]: Base URL:', apiClient.defaults.baseURL, '| Email:', cleanEmail);
    try {
      const res = await apiClient.post<any>('/auth/login', {
        email: cleanEmail,
        password: payload.password,
      });
      console.log('📤 [Login Response Status]:', res.status, '| Received Keys:', Object.keys(res.data || {}));
      const data = res.data;
      const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
      const user = data.user || data.data?.user || (typeof data.data === 'object' && data.data?._id ? data.data : undefined);

      if (!token || !user) {
        throw new Error(data.message || 'Invalid authentication payload received from server.');
      }
      return { token, user, message: data.message };
    } catch (err: any) {
      if (err?.response) {
        const status = err.response.status;
        const backendMsg = err.response.data?.message;

        console.warn(`⚠️ [Login Response Error Code ${status}]:`, backendMsg);

        if (backendMsg) {
          throw new Error(backendMsg);
        }

        switch (status) {
          case 401:
            throw new Error('Invalid email or password. Please verify your login credentials.');
          case 403:
            throw new Error('Your account is pending verification or admin approval.');
          case 404:
            throw new Error('No registered account found with this email address.');
          case 500:
          default:
            throw new Error(`Server Error (${status}): Internal server error on authentication service.`);
        }
      }

      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        console.warn('⚠️ [Login Network Error]: Could not reach backend server at', apiClient.defaults.baseURL);
        throw new Error(`Connection Error: Could not reach backend API server at ${apiClient.defaults.baseURL}. Please verify server is running and reachable.`);
      }

      throw err;
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email ? payload.email.trim().toLowerCase() : '';
    try {
      const res = await apiClient.post<any>('/auth/register', {
        ...payload,
        email: cleanEmail,
      });
      const data = res.data;
      const token = data.token || data.data?.token || '';
      const user = data.user || data.data?.user || data.data;
      return { token, user, message: data.message };
    } catch (err: any) {
      if (err?.response) {
        const status = err.response.status;
        const backendMsg = err.response.data?.message;

        if (backendMsg) {
          throw new Error(backendMsg);
        }

        if (status === 400 || status === 409) {
          throw new Error('An account with this email address already exists.');
        } else if (status >= 500) {
          throw new Error(`Server Error (${status}): Internal server error during registration.`);
        }
      }

      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        throw new Error(`Connection Error: Unable to reach backend API at ${apiClient.defaults.baseURL}.`);
      }

      throw err;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    try {
      const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email: cleanEmail });
      return res.data;
    } catch (err: any) {
      if (err?.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        throw new Error('Connection Error: Unable to reach backend server.');
      }
      throw err;
    }
  }
};
