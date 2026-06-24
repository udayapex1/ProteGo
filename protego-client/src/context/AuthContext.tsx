import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth.api';
import { LoginPayload, RegisterPayload, UserRole } from '../types/user.types';

interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  pairedWith?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<{ requiresTwoFactor?: boolean; userId?: string }>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  completeTwoFactor: (userId: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistSession = async (accessToken: string, refreshToken: string, userData: AuthUser) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(userData)],
    ]);
    setUser(userData);
  };

  const login = async (payload: LoginPayload) => {
    const result = await authApi.login(payload);

    if (result.requiresTwoFactor) {
      console.log('Login requires two-factor:', {
        userId: result.userId,
      });
      return { requiresTwoFactor: true, userId: result.userId };
    }

    await persistSession(result.accessToken, result.refreshToken, result.user);
    console.log('Login session persisted:', {
      userId: result.user.id,
      role: result.user.role,
    });
    return {};
  };

  const completeTwoFactor = async (userId: string, token: string) => {
    const result = await authApi.validateTwoFactor(userId, token);
    await persistSession(result.accessToken, result.refreshToken, result.user);
  };

  const register = async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    await persistSession(result.accessToken, result.refreshToken, result.user);
    console.log('Register session persisted:', {
      userId: result.user.id,
      role: result.user.role,
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, completeTwoFactor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
