import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, UserProfile } from '../api/auth';
import { secureStorage } from '../utils/secureStorage';
import { LoginFormData, RegisterFormData } from '../utils/validation';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state securely from hardware storage
  useEffect(() => {
    async function initAuth() {
      try {
        const token = await secureStorage.getAccessToken();
        if (token) {
          const profile = await authApi.getProfile();
          setUser(profile);
        }
      } catch {
        await secureStorage.clearAll();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const authData = await authApi.login(data);
      await secureStorage.saveTokens(authData.accessToken, authData.refreshToken);
      await secureStorage.saveUserData(authData.user);
      setUser(authData.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const authData = await authApi.register(data);
      await secureStorage.saveTokens(authData.accessToken, authData.refreshToken);
      await secureStorage.saveUserData(authData.user);
      setUser(authData.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await secureStorage.clearAll();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
