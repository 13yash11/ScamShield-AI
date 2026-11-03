import { User, AuthCredentials, SignUpData } from '../types';
import { ApiError, apiRequest, jsonBody, setSessionActive } from './http';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

class AuthService {
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setSessionActive(true);
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const data = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', ...jsonBody(credentials) }, false);
      if (!data.success || !data.user) return { success: false, error: 'The server did not establish an authenticated session.' };
      setSessionActive(true);
      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign-in failed.' };
    }
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      return await apiRequest<AuthResponse>('/auth/signup', { method: 'POST', ...jsonBody(data) }, false);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed.' };
    }
  }

  async logout(): Promise<void> {
    await apiRequest<void>('/auth/logout', { method: 'POST' }, false);
    setSessionActive(false);
    localStorage.removeItem('scamshield_auth_token');
    localStorage.removeItem('scamshield_saved_scans');
    sessionStorage.removeItem('scamshield_latest_result');
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await apiRequest('/auth/password', { method: 'POST', ...jsonBody({ currentPassword, newPassword, confirmPassword }) });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiRequest('/auth/forgot-password', { method: 'POST', ...jsonBody({ email }) }, false);
  }

  async resetPassword(accessToken: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    return apiRequest('/auth/reset-password', { method: 'POST', ...jsonBody({ accessToken, newPassword, confirmPassword }) }, false);
  }
}

export const authService = new AuthService();
