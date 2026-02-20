/**
 * API Authentication Service
 * Gère tous les appels liés à l'authentification
 * Basé sur la documentation des endpoints /api/auth/*
 */

import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { 
  LoginCredentials, 
  LoginResponse, 
  User, 
  RegisterData, 
  ChangePasswordData 
} from '../types/auth.types';

/**
 * Service d'authentification
 * Regroupe toutes les fonctions pour gérer l'authentification
 */
export const authApi = {
  /**
   * Connexion utilisateur
   * @param credentials - Identifiants (username, password)
   * @returns Promise avec token et infos utilisateur
   * 
   * @example
   * const response = await authApi.login({ 
   *   username: "Amine", 
   *   password: "7410" 
   * });
   * localStorage.setItem('token', response.data.data.token);
   */
  login: (credentials: LoginCredentials) => 
    api.post<ApiResponse<LoginResponse>>('/auth/login', credentials),

  /**
   * Inscription nouvel utilisateur
   * @param data - Données d'inscription (ID_Personnel, Username, Email, Password)
   * @returns Promise avec token et infos utilisateur
   */
  register: (data: RegisterData) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),

  /**
   * Déconnexion
   * Invalide la session côté serveur
   * @returns Promise vide
   */
  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  /**
   * Rafraîchir le token JWT
   * À utiliser quand le token est expiré (401)
   * @returns Promise avec nouveau token
   */
  refreshToken: () =>
    api.post<ApiResponse<{ token: string; sessionId?: number }>>('/auth/refresh-token'),

  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns Promise avec les infos utilisateur
   */
  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),

  /**
   * Changer le mot de passe
   * @param data - Ancien et nouveau mot de passe
   * @returns Promise vide
   */
  changePassword: (data: ChangePasswordData) =>
    api.post<ApiResponse<null>>('/auth/change-password', data),

  /**
   * Vérifier si le token actuel est valide
   * Utilise getProfile pour vérifier sans faire d'opération
   * @returns Promise<boolean> true si token valide
   */
  checkToken: async (): Promise<boolean> => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/profile');
      return response.data.success === true;
    } catch {
      return false;
    }
  }
};

// Export nommé pour utilisation directe
export const { 
  login, 
  register, 
  logout, 
  refreshToken, 
  getProfile, 
  changePassword,
  checkToken 
} = authApi;

// Export par défaut pour importer tout le service
export default authApi;