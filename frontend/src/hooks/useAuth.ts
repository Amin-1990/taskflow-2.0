/**
 * Hook personnalisé pour gérer l'authentification
 * Fournit l'état utilisateur et les fonctions d'auth à tous les composants
 */

import { useEffect, useState, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { authApi } from '../api/auth';
import { setSession, logout as apiLogout, isAuthenticated as checkAuth } from '../services/api';
import { showToast } from '../utils/toast';
import type { User } from '../types/auth.types';

/**
 * Interface pour la valeur de retour du hook
 */
interface UseAuthReturn {
  user: User | null;                    // Utilisateur connecté
  loading: boolean;                      // En cours de chargement
  error: string | null;                  // Message d'erreur
  isAuthenticated: boolean;               // Est connecté ?
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;      // Recharger le profil
  checkAuthStatus: () => boolean;         // Vérifier rapidement
}

/**
 * Hook useAuth
 * @returns {UseAuthReturn} État et fonctions d'authentification
 */
export const useAuth = (): UseAuthReturn => {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeUser = useCallback((raw: any): User | null => {
    if (!raw || typeof raw !== 'object') return null;

    const id = raw.id ?? raw.ID;
    if (!id) return null;

    const username = raw.username ?? raw.Username ?? '';
    const email = raw.email ?? raw.Email ?? raw.personnel_email ?? '';
    const nomPrenom = raw.nom_prenom ?? raw.Nom_prenom ?? username;
    const poste = raw.poste ?? raw.Poste ?? '';

    return {
      id: Number(id),
      username: String(username),
      email: String(email),
      nom_prenom: String(nomPrenom),
      poste: String(poste),
    };
  }, []);

  /**
   * Vérifier l'authentification au chargement
   * Si token présent, on récupère le profil
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        if (response.data.success && response.data.data) {
          const normalized = normalizeUser(response.data.data);
          setUser(normalized);
          console.log('✅ Utilisateur authentifié:', normalized?.nom_prenom || normalized?.username || 'N/A');
        } else {
          // Token invalide ou expiré
          localStorage.removeItem('token');
          localStorage.removeItem('sessionId');
        }
      } catch (err) {
        console.error('❌ Erreur vérification auth:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [normalizeUser]);

  /**
   * Fonction de connexion
   * @param username - Nom d'utilisateur
   * @param password - Mot de passe
   */
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    const toastId = showToast.loading('Connexion en cours...');

    try {
      const response = await authApi.login({ username, password });
      
      if (response.data.success && response.data.data) {
        const { token, user, sessionId } = response.data.data;
        const normalizedUser = normalizeUser(user);
        if (!normalizedUser) {
          throw new Error('Profil utilisateur invalide');
        }
        
        // Sauvegarder la session
        setSession(token, sessionId, normalizedUser);
        setUser(normalizedUser);
        
        console.log('✅ Connexion réussie:', normalizedUser.nom_prenom);
        
        // Mettre à jour le toast
        showToast.update(toastId, `Bienvenue ${normalizedUser.nom_prenom} !`, 'success');
        
        // Rediriger vers le dashboard
        route('/', true);
        
        return { success: true };
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error('❌ Erreur connexion:', err);
      
      // Extraire le message d'erreur
      let errorMessage = 'Erreur de connexion';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast.update(toastId, errorMessage, 'error');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [normalizeUser]);

  /**
   * Fonction de déconnexion
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    const toastId = showToast.loading('Déconnexion...');
    
    try {
      // Appeler l'API de déconnexion
      await authApi.logout();
      showToast.update(toastId, 'À bientôt !', 'success');
    } catch (err) {
      console.error('❌ Erreur déconnexion API:', err);
      showToast.update(toastId, 'Erreur lors de la déconnexion', 'error');
    } finally {
      // Nettoyer le localStorage et l'état
      setTimeout(() => {
        apiLogout(); // Cette fonction redirige déjà vers /login
        setUser(null);
        setLoading(false);
      }, 1000); // Petit délai pour voir le toast
    }
  }, []);

  /**
   * Recharger le profil utilisateur
   * Utile après une mise à jour du profil
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data.success && response.data.data) {
        const normalized = normalizeUser(response.data.data);
        setUser(normalized);
        console.log('✅ Profil mis à jour');
      }
    } catch (err) {
      console.error('❌ Erreur recharge profil:', err);
    }
  }, [normalizeUser]);

  /**
   * Vérifier rapidement l'état d'authentification
   * @returns {boolean} true si authentifié
   */
  const checkAuthStatus = useCallback((): boolean => {
    return checkAuth() && !!user;
  }, [user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    checkAuthStatus
  };
};

export default useAuth;
