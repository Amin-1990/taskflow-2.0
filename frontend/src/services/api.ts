/**
 * Configuration du client HTTP Axios
 */

import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants';

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const config: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: false
};

export const api: AxiosInstance = axios.create(config);

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

api.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: 'Erreur de connexion au serveur. Verifiez votre reseau.'
      });
    }

    const { status, data } = error.response;
    const requestConfig = error.config as RetryableRequestConfig | undefined;
    const requestUrl = requestConfig?.url || '';

    if (status === 401 && requestConfig && !requestConfig._retry) {
      const skipRefresh =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh-token');

      if (!skipRefresh) {
        requestConfig._retry = true;

        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken();
          }

          const refreshed = await refreshPromise;
          isRefreshing = false;
          refreshPromise = null;

          if (refreshed) {
            const newToken = localStorage.getItem('token');
            if (newToken) {
              requestConfig.headers.Authorization = `Bearer ${newToken}`;
              return api.request(requestConfig);
            }
          }
        } catch {
          isRefreshing = false;
          refreshPromise = null;
        }
      }

      clearSession();
      window.location.href = '/login';
      return Promise.reject({
        success: false,
        error: 'Session expiree. Veuillez vous reconnecter.'
      });
    }

    switch (status) {
      case 400:
        return Promise.reject({ success: false, error: data?.error || 'Donnees invalides', details: data?.details || [] });
      case 403:
        return Promise.reject({ success: false, error: 'Acces non autorise a cette ressource' });
      case 404:
        return Promise.reject({ success: false, error: 'Ressource non trouvee' });
      case 409:
        return Promise.reject({ success: false, error: data?.error || 'Conflit avec les donnees existantes' });
      case 422:
        return Promise.reject({ success: false, error: data?.error || 'Erreur de validation', details: data?.details || [] });
      case 429:
        return Promise.reject({ success: false, error: 'Trop de requetes. Veuillez patienter.' });
      case 500:
      case 502:
      case 503:
        return Promise.reject({ success: false, error: 'Erreur serveur. Veuillez reessayer plus tard.' });
      default:
        return Promise.reject({ success: false, error: data?.error || `Erreur ${status}` });
    }
  }
);

async function refreshAccessToken(): Promise<boolean> {
  try {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      return false;
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken: storedRefreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    const data = response.data?.data;
    const nextAccessToken = data?.accessToken || data?.token;
    const nextRefreshToken = data?.refreshToken;

    if (!response.data?.success || !nextAccessToken) {
      return false;
    }

    localStorage.setItem('token', nextAccessToken);

    if (nextRefreshToken) {
      localStorage.setItem('refreshToken', nextRefreshToken);
    }

    return true;
  } catch {
    return false;
  }
}

function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
  localStorage.removeItem('remember');
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearSession();
  window.location.href = '/login';
}

export function setSession(token: string, refreshToken: string | undefined, sessionId: number | undefined, user: unknown): void {
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  if (sessionId) {
    localStorage.setItem('sessionId', sessionId.toString());
  }
  localStorage.setItem('user', JSON.stringify(user));
}

export default api;
