/**
 * API Authentication Service
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

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', credentials),

  // Gardee pour compatibilite; creation user via /api/admin/users
  register: (data: RegisterData) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  refreshToken: (refreshToken?: string) =>
    api.post<ApiResponse<{
      token: string;
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: string | Date;
      accessTokenExpiresIn?: string;
      refreshTokenExpiresAt?: string | Date;
    }>>('/auth/refresh-token', refreshToken ? { refreshToken } : {}),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),

  changePassword: (data: ChangePasswordData) =>
    api.post<ApiResponse<null>>('/auth/change-password', data),

  checkToken: async (): Promise<boolean> => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/profile');
      return response.data.success === true;
    } catch {
      return false;
    }
  }
};

export const {
  login,
  register,
  logout,
  refreshToken,
  getProfile,
  changePassword,
  checkToken
} = authApi;

export default authApi;
