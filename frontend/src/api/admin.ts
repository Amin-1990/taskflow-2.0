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
  ReplaceRolePermissionsPayload,
  AdminListQuery,
  CreatePermissionPayload
} from '../types/admin.types';

export const adminApi = {
  getDashboard: () => api.get<ApiResponse<AdminDashboard>>('/admin/dashboard'),

  listUsers: (params?: AdminListQuery) => api.get<ApiResponse<AdminUser[]>>('/admin/users', { params }),
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
  deleteUser: (id: number) => api.delete<ApiResponse<any>>(`/admin/users/${id}`),

  listRoles: (params?: AdminListQuery) => api.get<ApiResponse<AdminRole[]>>('/admin/roles', { params }),
  getRolePermissions: (id: number) => api.get<ApiResponse<AdminPermission[]>>(`/admin/roles/${id}/permissions`),
  createRole: (payload: CreateRolePayload) => api.post<ApiResponse<any>>('/admin/roles', payload),
  updateRole: (id: number, payload: UpdateRolePayload) => api.patch<ApiResponse<any>>(`/admin/roles/${id}`, payload),
  replaceRolePermissions: (id: number, payload: ReplaceRolePermissionsPayload) =>
    api.put<ApiResponse<any>>(`/admin/roles/${id}/permissions`, payload),
  deleteRole: (id: number) => api.delete<ApiResponse<any>>(`/admin/roles/${id}`),

  listPermissions: (params?: AdminListQuery) => api.get<ApiResponse<AdminPermission[]>>('/admin/permissions', { params }),
  createPermission: (payload: CreatePermissionPayload) => api.post<ApiResponse<any>>('/admin/permissions', payload),
  deletePermission: (id: number) => api.delete<ApiResponse<any>>(`/admin/permissions/${id}`),

  listSessions: (params?: AdminListQuery) => api.get<ApiResponse<AdminSession[]>>('/admin/sessions', { params }),
  revokeSession: (id: number) => api.patch<ApiResponse<any>>(`/admin/sessions/${id}/revoke`),

  listAudit: (params?: AdminListQuery) => api.get<ApiResponse<AdminAuditLog[]>>('/admin/audit', { params }),

  getMatrice: () => api.get<ApiResponse<any>>('/admin/matrice'),
  updateMatrice: (payload: any) => api.patch<ApiResponse<any>>('/admin/matrice', payload)
};

export default adminApi;
