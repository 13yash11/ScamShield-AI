import { User, AuthCredentials, SignUpData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  private tokenKey = 'scamshield_auth_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.removeToken();
        return null;
      }

      const data = await response.json();
      return data.user as User;
    } catch {
      // Backend not yet reachable or offline
      return null;
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          error: err.detail || err.message || `Authentication failed with status ${response.status}.`,
        };
      }

      const data = await response.json();
      if (data.token) {
        this.setToken(data.token);
      }
      return { success: true, user: data.user };
    } catch (err: unknown) {
      return {
        success: false,
        error: 'Authentication service is unreachable. Ensure the FastAPI backend is running.',
      };
    }
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          error: err.detail || err.message || `Registration rejected with status ${response.status}.`,
        };
      }

      const resData = await response.json();
      return { success: true, user: resData.user };
    } catch (err: unknown) {
      return {
        success: false,
        error: 'Registration service unreachable. Backend endpoint /api/v1/auth/signup is currently offline.',
      };
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {
        // Ignore network failure on logout
      }
    }
    this.removeToken();
  }
}

export const authService = new AuthService();
