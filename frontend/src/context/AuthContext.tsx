import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CandidateProfile } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<CandidateProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('interviewer_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (token) {
        const userData = await authApi.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Failed to load user profile with token:', e);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('interviewer_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        full_name: fullName,
        email,
        password,
        role: 'candidate'
      });
      localStorage.setItem('interviewer_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('interviewer_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<CandidateProfile>) => {
    const updated = await authApi.updateProfile(profileData);
    if (user) {
      setUser({ ...user, profile: updated });
    }
  };

  const setAuthSession = (accessToken: string, userData: User) => {
    localStorage.setItem('interviewer_token', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        setAuthSession,
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
