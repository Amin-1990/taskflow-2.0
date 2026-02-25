/**
 * Types pour l'authentification
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  user: User;
  sessionId: number;
  expiresIn: string | Date;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresAt?: string | Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nom_prenom: string;
  poste: string;
  permissions: string[];
}

export interface RegisterData {
  ID_Personnel: number;
  Username: string;
  Email: string;
  Password: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}
