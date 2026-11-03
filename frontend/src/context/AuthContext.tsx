import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthCredentials, SignUpData } from '../types';
import { authService } from '../services/auth';
import { setSessionActive } from '../services/http';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Only the server can read the session cookies.
    const verifySession = async () => {
      try {
        const sessionUser = await authService.getCurrentUser();
        if (active) setUser(sessionUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    verifySession();
    const sessionEnded = () => { setUser(null); setSessionActive(false); };
    window.addEventListener('scamshield:session-ended', sessionEnded);
    localStorage.removeItem('scamshield_auth_token');
    localStorage.removeItem('scamshield_saved_scans');
    sessionStorage.removeItem('scamshield_latest_result');
    return () => { active = false; window.removeEventListener('scamshield:session-ended', sessionEnded); };
  }, []);

  const login = async (credentials: AuthCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      } else {
        const errorMsg = response.error || 'Authentication failed. Please verify your credentials.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'A network error occurred while connecting to authentication service.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signUp(data);
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        const errorMsg = response.error || 'Registration failed. Please check form values.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration error. Could not connect to authentication server.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed. Please retry.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);
  const refreshUser = async () => { setUser(await authService.getCurrentUser()); };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, signUp, logout, clearError, refreshUser }}>
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
