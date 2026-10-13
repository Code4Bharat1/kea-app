import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { storage } from '../utils/storage';
import { authApi, LoginPayload, RegisterPayload, AuthResponse } from '../api/auth.api';
import { userApi } from '../api/user.api';
import { setOnUnauthorizedCallback } from '../api/client';
import { MOCK_USER } from '../constants/mockData';
import { biometricService, BiometricAuthResult } from '../services/biometricService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  loginDemo: () => Promise<void>;
  loginWithBiometrics: () => Promise<BiometricAuthResult>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-restore session from SecureStore on startup
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUserData();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);

          // Verify token against backend GET /api/users/me
          try {
            const freshUser = await userApi.getMe();
            if (isMounted && freshUser) {
              setUser(freshUser);
              await storage.setUserData(freshUser);
            }
          } catch {
            console.log('Backend verification failed, using stored user data.');
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Register 401 callback for automatic logout
    setOnUnauthorizedCallback(() => {
      if (isMounted) {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const data = await authApi.unifiedLogin(payload);
      setToken(data.token);
      setUser(data.user);
      await storage.setToken(data.token);
      await storage.setUserData(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const demoToken = 'mock_jwt_token_demo_123456';
      const demoUser = { ...MOCK_USER };
      setToken(demoToken);
      setUser(demoUser);
      await storage.setToken(demoToken);
      await storage.setUserData(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async (): Promise<BiometricAuthResult> => {
    setIsLoading(true);
    try {
      const authResult = await biometricService.authenticate('Authenticate to access KEA App');

      if (!authResult.success || !authResult.token) {
        return authResult;
      }

      // Restore session in state & local secure storage
      const activeToken = authResult.token;
      setToken(activeToken);
      await storage.setToken(activeToken);

      const storedUser = await storage.getUserData();
      if (storedUser) {
        setUser(storedUser);
      }

      // Attempt to refresh latest user details from API
      try {
        const freshUser = await userApi.getMe();
        if (freshUser) {
          setUser(freshUser);
          await storage.setUserData(freshUser);
        }
      } catch {
        // If offline, use stored user object
      }

      return authResult;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      setToken(data.token);
      setUser(data.user);
      await storage.setToken(data.token);
      await storage.setUserData(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await storage.clearSession();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = await userApi.updateMe(profile);
    setUser(updatedUser);
    await storage.setUserData(updatedUser);
  };

  const refreshUser = async () => {
    const activeToken = token || (await storage.getToken());
    if (!activeToken) return;
    try {
      setToken(activeToken);
      const freshUser = await userApi.getMe();
      if (freshUser) {
        setUser(freshUser);
        await storage.setUserData(freshUser);
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
      const storedUser = await storage.getUserData();
      if (storedUser) setUser(storedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        loginDemo,
        loginWithBiometrics,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
