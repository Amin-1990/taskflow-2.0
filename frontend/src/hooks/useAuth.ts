/**
 * Hook personnalise pour gerer l'authentification
 */

import { useEffect, useState, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { authApi } from '../api/auth';
import { setSession, logout as apiLogout, isAuthenticated as checkAuth } from '../services/api';
import { showToast } from '../utils/toast';
import type { User } from '../types/auth.types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuthStatus: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
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
    const permissions = raw.permissions ?? raw.Permissions ?? [];

    return {
      id: Number(id),
      username: String(username),
      email: String(email),
      nom_prenom: String(nomPrenom),
      poste: String(poste),
      permissions: Array.isArray(permissions) ? permissions : []
    };
  }, []);

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
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionId');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionId');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [normalizeUser]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    const toastId = showToast.loading('Connexion en cours...');

    try {
      const response = await authApi.login({ username, password });

      if (response.data.success && response.data.data) {
        const { token, accessToken, refreshToken, user, sessionId } = response.data.data;
        const normalizedUser = normalizeUser(user);
        if (!normalizedUser) {
          throw new Error('Profil utilisateur invalide');
        }

        const access = accessToken || token;
        setSession(access, refreshToken, sessionId, normalizedUser);
        setUser(normalizedUser);

        showToast.update(toastId, `Bienvenue ${normalizedUser.nom_prenom} !`, 'success');
        route('/', true);

        return { success: true };
      }

      throw new Error('Reponse invalide du serveur');
    } catch (err: any) {
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

  const logout = useCallback(async () => {
    setLoading(true);

    const toastId = showToast.loading('Deconnexion...');

    try {
      await authApi.logout();
      showToast.update(toastId, 'A bientot !', 'success');
    } catch {
      showToast.update(toastId, 'Erreur lors de la deconnexion', 'error');
    } finally {
      setTimeout(() => {
        apiLogout();
        setUser(null);
        setLoading(false);
      }, 1000);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data.success && response.data.data) {
        const normalized = normalizeUser(response.data.data);
        setUser(normalized);
      }
    } catch {
      // noop
    }
  }, [normalizeUser]);

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
