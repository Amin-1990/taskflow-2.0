export interface AdminDashboard {
  users: {
    total_users: number;
    active_users: number;
    locked_users: number;
  };
  roles: {
    total_roles: number;
    active_roles: number;
  };
  permissions: {
    total_permissions: number;
  };
  sessions: {
    active_sessions: number;
    connected_users: number;
  };
  audit: {
    logs_last_24h: number;
  };
}

export interface AdminUser {
  ID: number;
  ID_Personnel?: number | null;
  Username: string;
  Email: string;
  Est_actif: number | boolean;
  Est_verifie: number | boolean;
  Est_verrouille: number | boolean;
  Tentatives_echec?: number;
  Derniere_connexion?: string | null;
  Date_creation?: string;
  Date_modification?: string;
  Nom_prenom?: string | null;
  Roles_labels?: string | null;
}

export interface AdminPermission {
  ID: number;
  Code_permission: string;
  Nom_permission: string;
  Description?: string | null;
  Categorie?: string | null;
  Nom_module?: string | null;
  Date_creation?: string;
  roles_count?: number;
  roles_labels?: string | null;
  used_by_system_role?: number | boolean;
}

export interface AdminRole {
  ID: number;
  Code_role: string;
  Nom_role: string;
  Description?: string | null;
  Niveau_priorite: number;
  Est_systeme?: number | boolean;
  Est_actif?: number | boolean;
  users_count?: number;
  permissions_count?: number;
}

export interface AdminSession {
  ID: number;
  ID_Utilisateur: number;
  Username?: string;
  Email?: string;
  IP_address?: string | null;
  User_agent?: string | null;
  Date_connexion?: string;
  Derniere_activite?: string;
  Date_expiration?: string;
  Est_active?: number | boolean;
}

export interface AdminAuditLog {
  ID: number;
  ID_Utilisateur?: number | null;
  Username?: string | null;
  Username_utilisateur?: string | null;
  Action: string;
  Table_concernee: string;
  Ancienne_valeur?: string | null;
  Nouvelle_valeur?: string | null;
  Date_action: string;
  IP_address?: string | null;
}

export interface AdminListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

export interface AdminUserDetail {
  user: AdminUser;
  roles: AdminRole[];
  permissions: Array<AdminPermission & { Type: 'ACCORDER' | 'REFUSER'; Expiration?: string | null }>;
  sessions: AdminSession[];
}

export interface CreateAdminUserPayload {
  Username: string;
  Email: string;
  Password: string;
  ID_Personnel?: number;
  roles?: number[];
}

export interface UpdateAdminUserPayload {
  Username?: string;
  Email?: string;
  ID_Personnel?: number;
  Est_verifie?: boolean;
}

export interface UpdateAdminUserStatusPayload {
  Est_actif?: boolean;
  Est_verrouille?: boolean;
}

export interface ReplaceUserRolesPayload {
  roleIds: number[];
}

export interface ReplaceUserPermissionsPayload {
  permissions: Array<{
    permissionId: number;
    type: 'ACCORDER' | 'REFUSER';
    expiration?: string;
  }>;
}

export interface CreateRolePayload {
  Code_role: string;
  Nom_role: string;
  Description?: string;
  Niveau_priorite?: number;
  Est_systeme?: number;
  Est_actif?: number;
}

export interface UpdateRolePayload {
  Nom_role?: string;
  Description?: string;
  Niveau_priorite?: number;
  Est_actif?: number;
}

export interface ReplaceRolePermissionsPayload {
  permissionIds: number[];
}

export interface CreatePermissionPayload {
  Code_permission: string;
  Nom_permission: string;
  Description?: string;
  Categorie?: string;
}
