import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

export interface DemoUserPreset {
  key: 'admin' | 'john' | 'alice';
  name: string;
  email: string;
  password: string;
  role: UserRole;
  description: string;
}

export const DEMO_USERS: DemoUserPreset[] = [
  {
    key: 'john',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    description: 'Resident Student (Block A - Room 204)',
  },
  {
    key: 'alice',
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'user123',
    role: 'user',
    description: 'Resident Student (Block B - Room 108)',
  },
  {
    key: 'admin',
    name: 'Laundry Facility Admin',
    email: 'admin@laundry.com',
    password: 'admin123',
    role: 'admin',
    description: 'Hostel Facility Management',
  },
];

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  backendOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, isAdmin?: boolean) => Promise<void>;
  quickLogin: (presetKey: 'admin' | 'john' | 'alice') => Promise<void>;
  setSessionToken: (newToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
      setBackendOnline(true);
    } catch (err) {
      // If unauthorized, clear token
      setUser(null);
      setStoredToken(null);
      setToken(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const stored = getStoredToken();
      if (stored) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setToken(stored);
          setBackendOnline(true);
        } catch {
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  // Heartbeat backend check
  useEffect(() => {
    const check = async () => {
      const isUp = await api.checkConnection();
      setBackendOnline(isUp);
    };
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await api.login(email, password);
      setToken(authData.access_token);
      const profile = await api.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, isAdmin: boolean = false) => {
    setIsLoading(true);
    try {
      await api.register({ email, password, full_name: fullName, is_admin: isAdmin });
      // Auto login
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (presetKey: 'admin' | 'john' | 'alice') => {
    const preset = DEMO_USERS.find((u) => u.key === presetKey);
    if (!preset) return;
    await login(preset.email, preset.password);
  };

  const setSessionToken = useCallback(async (newToken: string) => {
    setIsLoading(true);
    setStoredToken(newToken);
    setToken(newToken);
    try {
      const profile = await api.getMe();
      setUser(profile);
      setBackendOnline(true);
    } catch {
      setUser(null);
      setStoredToken(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        backendOnline,
        login,
        register,
        quickLogin,
        setSessionToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
