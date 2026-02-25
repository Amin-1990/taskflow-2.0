import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../api/admin';
import type {
  AdminAuditLog,
  AdminDashboard,
  AdminPermission,
  AdminRole,
  AdminSession,
  AdminUser
} from '../../types/admin.types';

type AdminTab = 'dashboard' | 'users' | 'roles' | 'permissions' | 'sessions' | 'audit';

const tabs: Array<{ key: AdminTab; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Utilisateurs' },
  { key: 'roles', label: 'Roles' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'audit', label: 'Audit' }
];

const boolLabel = (value: number | boolean | null | undefined): string =>
  value === 1 || value === true ? 'Oui' : 'Non';

const parseNumberList = (raw: string): number[] =>
  raw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);

export const AdminPanelPage: FunctionalComponent = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [createUserForm, setCreateUserForm] = useState({
    Username: '',
    Email: '',
    Password: '',
    ID_Personnel: '',
    rolesCsv: ''
  });

  const [createRoleForm, setCreateRoleForm] = useState({
    Code_role: '',
    Nom_role: '',
    Description: '',
    Niveau_priorite: '10'
  });

  const loadDashboard = async () => {
    const response = await adminApi.getDashboard();
    setDashboard(response.data.data || null);
  };

  const loadUsers = async () => {
    const response = await adminApi.listUsers();
    setUsers(response.data.data || []);
  };

  const loadRoles = async () => {
    const response = await adminApi.listRoles();
    setRoles(response.data.data || []);
  };

  const loadPermissions = async () => {
    const response = await adminApi.listPermissions();
    setPermissions(response.data.data || []);
  };

  const loadSessions = async () => {
    const response = await adminApi.listSessions();
    setSessions(response.data.data || []);
  };

  const loadAudit = async () => {
    const response = await adminApi.listAudit(200);
    setAuditLogs(response.data.data || []);
  };

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') await loadDashboard();
      if (tab === 'users') {
        await Promise.all([loadUsers(), loadRoles()]);
      }
      if (tab === 'roles') {
        await Promise.all([loadRoles(), loadPermissions()]);
      }
      if (tab === 'permissions') await loadPermissions();
      if (tab === 'sessions') await loadSessions();
      if (tab === 'audit') await loadAudit();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur chargement administration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const submitCreateUser = async (event: Event) => {
    event.preventDefault();
    try {
      const rolesIds = parseNumberList(createUserForm.rolesCsv);
      await adminApi.createUser({
        Username: createUserForm.Username,
        Email: createUserForm.Email,
        Password: createUserForm.Password,
        ID_Personnel: createUserForm.ID_Personnel ? Number(createUserForm.ID_Personnel) : undefined,
        roles: rolesIds
      });
      showToast.success('Utilisateur cree');
      setCreateUserForm({ Username: '', Email: '', Password: '', ID_Personnel: '', rolesCsv: '' });
      await loadUsers();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur creation utilisateur');
    }
  };

  const submitCreateRole = async (event: Event) => {
    event.preventDefault();
    try {
      await adminApi.createRole({
        Code_role: createRoleForm.Code_role,
        Nom_role: createRoleForm.Nom_role,
        Description: createRoleForm.Description || undefined,
        Niveau_priorite: Number(createRoleForm.Niveau_priorite)
      });
      showToast.success('Role cree');
      setCreateRoleForm({ Code_role: '', Nom_role: '', Description: '', Niveau_priorite: '10' });
      await loadRoles();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur creation role');
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    try {
      const isActive = user.Est_actif === 1 || user.Est_actif === true;
      await adminApi.updateUserStatus(user.ID, { Est_actif: !isActive });
      showToast.success('Statut utilisateur mis a jour');
      await loadUsers();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur statut utilisateur');
    }
  };

  const toggleUserLock = async (user: AdminUser) => {
    try {
      const isLocked = user.Est_verrouille === 1 || user.Est_verrouille === true;
      await adminApi.updateUserStatus(user.ID, { Est_verrouille: !isLocked });
      showToast.success('Verrouillage utilisateur mis a jour');
      await loadUsers();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur verrouillage utilisateur');
    }
  };

  const resetUserPassword = async (userId: number) => {
    const nextPassword = window.prompt('Nouveau mot de passe (min 8, maj/min/chiffre/special):');
    if (!nextPassword) return;
    try {
      await adminApi.resetUserPassword(userId, nextPassword);
      showToast.success('Mot de passe reinitialise');
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur reset mot de passe');
    }
  };

  const forceExpireSessions = async (userId: number) => {
    try {
      await adminApi.forceExpireUserSessions(userId);
      showToast.success('Sessions utilisateur expirees');
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur expiration sessions');
    }
  };

  const updateUserRoles = async (userId: number) => {
    const raw = window.prompt('IDs des roles (csv), ex: 1,2');
    if (raw === null) return;
    try {
      const roleIds = parseNumberList(raw);
      await adminApi.replaceUserRoles(userId, { roleIds });
      showToast.success('Roles utilisateur mis a jour');
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur mise a jour roles');
    }
  };

  const updateRolePermissions = async (roleId: number) => {
    const raw = window.prompt('IDs des permissions (csv), ex: 1,2,3');
    if (raw === null) return;
    try {
      const permissionIds = parseNumberList(raw);
      await adminApi.replaceRolePermissions(roleId, { permissionIds });
      showToast.success('Permissions role mises a jour');
      await loadRoles();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur permissions role');
    }
  };

  const revokeSession = async (sessionId: number) => {
    try {
      await adminApi.revokeSession(sessionId);
      showToast.success('Session revoquee');
      await loadSessions();
    } catch (error: any) {
      showToast.error(error?.error || 'Erreur revocation session');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
        <p className="text-sm text-gray-500">Gestion complete de la securite applicative et des comptes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">Chargement...</div>}

      {!loading && activeTab === 'dashboard' && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Utilisateurs</p><p className="text-2xl font-bold">{dashboard.users.total_users}</p><p className="text-xs text-gray-500">Actifs: {dashboard.users.active_users} | Verrouilles: {dashboard.users.locked_users}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Roles</p><p className="text-2xl font-bold">{dashboard.roles.total_roles}</p><p className="text-xs text-gray-500">Actifs: {dashboard.roles.active_roles}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Permissions</p><p className="text-2xl font-bold">{dashboard.permissions.total_permissions}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Sessions actives</p><p className="text-2xl font-bold">{dashboard.sessions.active_sessions}</p><p className="text-xs text-gray-500">Utilisateurs connectes: {dashboard.sessions.connected_users}</p></div>
          <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-sm text-gray-500">Audit (24h)</p><p className="text-2xl font-bold">{dashboard.audit.logs_last_24h}</p></div>
        </div>
      )}

      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <form className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3" onSubmit={submitCreateUser}>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Username" value={createUserForm.Username} onInput={(e) => setCreateUserForm({ ...createUserForm, Username: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" value={createUserForm.Email} onInput={(e) => setCreateUserForm({ ...createUserForm, Email: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Password" type="password" value={createUserForm.Password} onInput={(e) => setCreateUserForm({ ...createUserForm, Password: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="ID Personnel (optionnel)" value={createUserForm.ID_Personnel} onInput={(e) => setCreateUserForm({ ...createUserForm, ID_Personnel: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Role IDs csv (ex: 1,2)" value={createUserForm.rolesCsv} onInput={(e) => setCreateUserForm({ ...createUserForm, rolesCsv: (e.currentTarget as HTMLInputElement).value })} />
            <button type="submit" className="md:col-span-2 xl:col-span-5 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">Creer utilisateur</button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left"><tr><th className="p-3">ID</th><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Actif</th><th className="p-3">Verrouille</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.ID} className="border-t border-gray-100">
                    <td className="p-3">{u.ID}</td>
                    <td className="p-3">{u.Username}</td>
                    <td className="p-3">{u.Email}</td>
                    <td className="p-3">{boolLabel(u.Est_actif)}</td>
                    <td className="p-3">{boolLabel(u.Est_verrouille)}</td>
                    <td className="p-3 space-x-2">
                      <button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => toggleUserStatus(u)}>Actif</button>
                      <button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => toggleUserLock(u)}>Lock</button>
                      <button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => resetUserPassword(u.ID)}>Reset MDP</button>
                      <button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => forceExpireSessions(u.ID)}>Expirer sessions</button>
                      <button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => updateUserRoles(u.ID)}>Roles</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'roles' && (
        <div className="space-y-4">
          <form className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={submitCreateRole}>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Code role (ex: SUPERVISEUR)" value={createRoleForm.Code_role} onInput={(e) => setCreateRoleForm({ ...createRoleForm, Code_role: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nom role" value={createRoleForm.Nom_role} onInput={(e) => setCreateRoleForm({ ...createRoleForm, Nom_role: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Description" value={createRoleForm.Description} onInput={(e) => setCreateRoleForm({ ...createRoleForm, Description: (e.currentTarget as HTMLInputElement).value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Priorite" value={createRoleForm.Niveau_priorite} onInput={(e) => setCreateRoleForm({ ...createRoleForm, Niveau_priorite: (e.currentTarget as HTMLInputElement).value })} />
            <button type="submit" className="md:col-span-4 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">Creer role</button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left"><tr><th className="p-3">ID</th><th className="p-3">Code</th><th className="p-3">Nom</th><th className="p-3">Priorite</th><th className="p-3">Users</th><th className="p-3">Permissions</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.ID} className="border-t border-gray-100">
                    <td className="p-3">{r.ID}</td>
                    <td className="p-3">{r.Code_role}</td>
                    <td className="p-3">{r.Nom_role}</td>
                    <td className="p-3">{r.Niveau_priorite}</td>
                    <td className="p-3">{r.users_count ?? '-'}</td>
                    <td className="p-3">{r.permissions_count ?? '-'}</td>
                    <td className="p-3"><button type="button" className="px-2 py-1 rounded bg-gray-100" onClick={() => updateRolePermissions(r.ID)}>Definir permissions</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'permissions' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-3">ID</th><th className="p-3">Code</th><th className="p-3">Nom</th><th className="p-3">Categorie</th></tr></thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.ID} className="border-t border-gray-100">
                  <td className="p-3">{p.ID}</td>
                  <td className="p-3">{p.Code_permission}</td>
                  <td className="p-3">{p.Nom_permission}</td>
                  <td className="p-3">{p.Categorie || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'sessions' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-3">ID</th><th className="p-3">User</th><th className="p-3">IP</th><th className="p-3">Connexion</th><th className="p-3">Expiration</th><th className="p-3">Action</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.ID} className="border-t border-gray-100">
                  <td className="p-3">{s.ID}</td>
                  <td className="p-3">{s.Username || `#${s.ID_Utilisateur}`}</td>
                  <td className="p-3">{s.IP_address || '-'}</td>
                  <td className="p-3">{s.Date_connexion || '-'}</td>
                  <td className="p-3">{s.Date_expiration || '-'}</td>
                  <td className="p-3"><button type="button" className="px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => revokeSession(s.ID)}>Revoquer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Action</th><th className="p-3">Table</th><th className="p-3">Utilisateur</th><th className="p-3">IP</th></tr></thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.ID} className="border-t border-gray-100">
                  <td className="p-3">{log.Date_action}</td>
                  <td className="p-3">{log.Action}</td>
                  <td className="p-3">{log.Table_concernee}</td>
                  <td className="p-3">{log.Username_utilisateur || log.Username || '-'}</td>
                  <td className="p-3">{log.IP_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'roles' && permissions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Aide permissions (ID {'->'} code)</p>
          <p>
            {permissions.slice(0, 20).map((p) => `${p.ID}:${p.Code_permission}`).join(' | ')}
            {permissions.length > 20 ? ' ...' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPanelPage;
