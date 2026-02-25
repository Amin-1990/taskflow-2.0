import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type {
  AdminDashboard,
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminSession,
  AdminAuditLog,
  AdminUserDetail,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UpdateAdminUserStatusPayload,
  ReplaceUserRolesPayload,
  ReplaceUserPermissionsPayload,
  CreateRolePayload,
  UpdateRolePayload,
  ReplaceRolePermissionsPayload
} from '../types/admin.types';

export const adminApi = {
  getDashboard: () => api.get<ApiResponse<AdminDashboard>>('/admin/dashboard'),

  listUsers: () => api.get<ApiResponse<AdminUser[]>>('/admin/users'),
  getUserDetail: (id: number) => api.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`),
  createUser: (payload: CreateAdminUserPayload) => api.post<ApiResponse<any>>('/admin/users', payload),
  updateUser: (id: number, payload: UpdateAdminUserPayload) => api.patch<ApiResponse<any>>(`/admin/users/${id}`, payload),
  updateUserStatus: (id: number, payload: UpdateAdminUserStatusPayload) => api.patch<ApiResponse<any>>(`/admin/users/${id}/status`, payload),
  resetUserPassword: (id: number, newPassword: string) =>
    api.patch<ApiResponse<any>>(`/admin/users/${id}/password-reset`, { New_password: newPassword }),
  forceExpireUserSessions: (id: number) => api.patch<ApiResponse<any>>(`/admin/users/${id}/expire-sessions`),
  replaceUserRoles: (id: number, payload: ReplaceUserRolesPayload) => api.put<ApiResponse<any>>(`/admin/users/${id}/roles`, payload),
  replaceUserPermissions: (id: number, payload: ReplaceUserPermissionsPayload) =>
    api.put<ApiResponse<any>>(`/admin/users/${id}/permissions`, payload),

  listRoles: () => api.get<ApiResponse<AdminRole[]>>('/admin/roles'),
  createRole: (payload: CreateRolePayload) => api.post<ApiResponse<any>>('/admin/roles', payload),
  updateRole: (id: number, payload: UpdateRolePayload) => api.patch<ApiResponse<any>>(`/admin/roles/${id}`, payload),
  replaceRolePermissions: (id: number, payload: ReplaceRolePermissionsPayload) =>
    api.put<ApiResponse<any>>(`/admin/roles/${id}/permissions`, payload),

  listPermissions: () => api.get<ApiResponse<AdminPermission[]>>('/admin/permissions'),

  listSessions: () => api.get<ApiResponse<AdminSession[]>>('/admin/sessions'),
  revokeSession: (id: number) => api.patch<ApiResponse<any>>(`/admin/sessions/${id}/revoke`),

  listAudit: (limit = 200) => api.get<ApiResponse<AdminAuditLog[]>>('/admin/audit', { params: { limit } })
};

export default adminApi;
