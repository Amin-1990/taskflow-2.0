/**
 * Configuration du client HTTP Axios pour les appels API
 * Basé sur la documentation du backend Taskflow
 */

import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants';

// Types pour les erreurs API
interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Configuration du client Axios
 */
const config: AxiosRequestConfig = {
  baseURL: API_BASE_URL,                    // URL de base de l'API
  timeout: 30000,                            // Timeout 30 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,                     // Pas besoin de cookies (on utilise JWT)
};

/**
 * Création de l'instance Axios
 */
export const api: AxiosInstance = axios.create(config);

/**
 * INTERCEPTEUR REQUEST
 * S'exécute AVANT chaque requête
 * Rôle : Ajouter le token JWT dans le header Authorization
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Récupérer le token du localStorage
    const token = localStorage.getItem('token');
    
    // Si un token existe, l'ajouter au header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log pour debug (à supprimer en production)
      console.log('🔑 Token ajouté à la requête:', config.url);
    } else {
      console.log('🔓 Requête sans token:', config.url);
    }
    
    // Log de la requête (debug)
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '');
    
    return config;
  },
  (error: AxiosError) => {
    // Erreur avant l'envoi de la requête
    console.error('❌ Erreur request interceptor:', error);
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTEUR RESPONSE
 * S'exécute APRÈS chaque réponse (succès ou erreur)
 * Rôle : Gérer les erreurs globales et le rafraîchissement de token
 */
api.interceptors.response.use(
  (response) => {
    // Succès : on log et on retourne la réponse
    console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    
    // Vérifier si la réponse suit le format standard
    if (response.data && typeof response.data.success === 'boolean') {
      if (!response.data.success) {
        console.warn('⚠️ API retourne success=false mais status 200:', response.data);
      }
    }
    
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Gestion centralisée des erreurs HTTP
    
    // Erreur réseau ou timeout
    if (!error.response) {
      console.error('🌐 Erreur réseau ou timeout:', error.message);
      return Promise.reject({
        success: false,
        error: 'Erreur de connexion au serveur. Vérifiez votre réseau.'
      });
    }

    const { status, data } = error.response;
    
    switch (status) {
      case 400: // Bad Request - Erreur de validation
        console.warn('⚠️ 400 Bad Request:', data);
        return Promise.reject({
          success: false,
          error: data?.error || 'Données invalides',
          details: data?.details || []
        });
      
      case 401: // Unauthorized - Token manquant ou invalide
        console.warn('🔒 401 Unauthorized - Token invalide ou expiré');
        
        // Tentative de rafraîchissement du token
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Token rafraîchi, on réessaie la requête originale
            if (error.config) {
              const newToken = localStorage.getItem('token');
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return api.request(error.config);
            }
          }
        } catch (refreshError) {
          console.error('❌ Échec du rafraîchissement token');
        }
        
        // Pas de token valide, redirection vers login
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        window.location.href = '/login';
        return Promise.reject({
          success: false,
          error: 'Session expirée. Veuillez vous reconnecter.'
        });
      
      case 403: // Forbidden - Accès interdit
        console.warn('🚫 403 Forbidden - Accès non autorisé');
        return Promise.reject({
          success: false,
          error: 'Accès non autorisé à cette ressource'
        });
      
      case 404: // Not Found
        console.warn('🔍 404 Not Found:', error.config?.url);
        return Promise.reject({
          success: false,
          error: 'Ressource non trouvée'
        });
      
      case 409: // Conflict
        console.warn('⚔️ 409 Conflict:', data);
        return Promise.reject({
          success: false,
          error: data?.error || 'Conflit avec les données existantes'
        });
      
      case 422: // Unprocessable Entity
        console.warn('📝 422 Validation Error:', data);
        return Promise.reject({
          success: false,
          error: data?.error || 'Erreur de validation',
          details: data?.details || []
        });
      
      case 429: // Too Many Requests
        console.warn('⏱️ 429 Rate Limit');
        return Promise.reject({
          success: false,
          error: 'Trop de requêtes. Veuillez patienter.'
        });
      
      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
        console.error('💥 Erreur serveur:', status, data);
        return Promise.reject({
          success: false,
          error: 'Erreur serveur. Veuillez réessayer plus tard.'
        });
      
      default:
        console.error(`❌ Erreur non gérée ${status}:`, data);
        return Promise.reject({
          success: false,
          error: data?.error || `Erreur ${status}`
        });
    }
  }
);

/**
 * Rafraîchir le token JWT
 * Utilise le token actuel pour en obtenir un nouveau
 * Basé sur POST /auth/refresh-token
 */
async function refreshToken(): Promise<boolean> {
  try {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return false;

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      {},
      {
        headers: { Authorization: `Bearer ${currentToken}` }
      }
    );

    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.sessionId) {
        localStorage.setItem('sessionId', response.data.data.sessionId.toString());
      }
      console.log('🔄 Token rafraîchi avec succès');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Échec du rafraîchissement token:', error);
    return false;
  }
}

/**
 * Vérifier si l'utilisateur est authentifié
 * @returns true si un token existe et n'est pas expiré
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Optionnel : vérifier l'expiration du token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir en millisecondes
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Déconnexion propre
 * Supprime les données du localStorage
 */
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
  localStorage.removeItem('remember');
  window.location.href = '/login';
}

/**
 * Sauvegarder les données de session après login
 */
export function setSession(token: string, sessionId: number, user: any): void {
  localStorage.setItem('token', token);
  localStorage.setItem('sessionId', sessionId.toString());
  localStorage.setItem('user', JSON.stringify(user));
}

export default api;