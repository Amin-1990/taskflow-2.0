import type { FunctionComponent } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import { AlertTriangle, RefreshCw, Search, Filter } from 'lucide-preact';
import { useAdminMatrice } from '../../hooks/useAdminMatrice';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import type { AdminUser, AdminPermission } from '../../types/admin.types';

const MODULE_COLORS = {
  PRODUCTION: 'bg-blue-100 text-blue-800',
  RH: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  QUALITE: 'bg-purple-100 text-purple-800',
  CATALOGUE: 'bg-cyan-100 text-cyan-800',
  SYSTEME: 'bg-gray-100 text-gray-800',
  ADMIN: 'bg-red-100 text-red-800'
};

export const AdminMatrice: FunctionComponent = () => {
  const { users, permissions, values, loading, error, togglePermission, refresh } = useAdminMatrice();
  const { user } = useAuth();
  const { canRead, canWrite } = usePermissions();
  const [searchUser, setSearchUser] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  // Vérifier la permission d'accès
  useEffect(() => {
    if (user && !user.permissions?.includes('ADMIN_READ')) {
      showToast.error('Accès refusé au module administration');
      route('/');
    }
  }, [user]);

  // Extraire les modules uniques
  const modules = useMemo(() => {
    const mods = new Set(permissions.map(p => p.Nom_module || 'SYSTEME').filter(Boolean));
    return Array.from(mods).sort();
  }, [permissions]);

  // Initialiser la sélection de modules
  useEffect(() => {
    if (modules.length > 0 && selectedModules.length === 0) {
      setSelectedModules(modules);
    }
  }, [modules]);

  // Filtrer les utilisateurs
  const filteredUsers = useMemo(() => {
    if (!searchUser.trim()) return users;
    const term = searchUser.toLowerCase();
    return users.filter(u =>
      u.Username.toLowerCase().includes(term) ||
      u.Email.toLowerCase().includes(term) ||
      (u.Nom_prenom && u.Nom_prenom.toLowerCase().includes(term))
    );
  }, [users, searchUser]);

  // Filtrer les permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p =>
      selectedModules.includes(p.Nom_module || 'SYSTEME')
    );
  }, [permissions, selectedModules]);

  // Grouper les permissions par module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    filteredPermissions.forEach(p => {
      const mod = p.Nom_module || 'SYSTEME';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  const handleToggle = async (userId: number, permissionId: number) => {
    const key = `${userId}-${permissionId}`;
    setToggling(prev => new Set(prev).add(key));

    try {
      const currentValue = values.get(key) || 0;
      const newValue = currentValue === 1 ? 0 : 1;
      await togglePermission(userId, permissionId, newValue);
      showToast.success('Permission mise à jour');
    } catch (err) {
      // Error handling is in the hook
    } finally {
      setToggling(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const toggleModule = (module: string) => {
    setSelectedModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la matrice...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Matrice des Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Gérer les permissions par utilisateur</p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Recherche utilisateur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher un utilisateur
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Username, email ou nom complet..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.currentTarget.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sélection des modules */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Filter className="w-4 h-4" />
            <span>Filtrer les modules</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {modules.map(module => (
              <button
                key={module}
                onClick={() => toggleModule(module)}
                className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                  selectedModules.includes(module)
                    ? MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-100 text-gray-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matrice scrollable */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {/* En-tête */}
            <thead>
              <tr>
                {/* Colonne utilisateurs (figée) */}
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-gray-200 p-3 text-left font-medium text-gray-700 min-w-[240px]">
                  Utilisateur
                </th>

                {/* Colonnes par module */}
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <th
                    key={module}
                    colSpan={perms.length}
                    className={`border-b border-gray-200 p-2 font-medium text-center ${
                      MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {module}
                  </th>
                ))}
              </tr>

              {/* Sous-en-têtes permissions */}
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-gray-200"></th>
                {Object.entries(groupedPermissions).map(([module, perms]) =>
                  perms.map(perm => (
                    <th
                      key={perm.ID}
                      className="border-b border-gray-200 p-2 text-center text-xs font-medium text-gray-600 bg-gray-50 h-12"
                      title={perm.Nom_permission}
                    >
                      <div className="writing-vertical text-rotate-90 whitespace-nowrap">
                        {perm.Code_permission.replace(`${module}_`, '')}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>

            {/* Données */}
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.ID} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* Utilisateur */}
                    <td className="sticky left-0 z-9 bg-white hover:bg-gray-50 p-3 font-medium text-gray-800 border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-800">{user.Username}</div>
                      <div className="text-xs text-gray-500">{user.Email}</div>
                    </td>

                    {/* Permissions */}
                    {Object.entries(groupedPermissions).map(([module, perms]) =>
                      perms.map(perm => {
                        const key = `${user.ID}-${perm.ID}`;
                        const hasPermission = (values.get(key) || 0) === 1;
                        const isToggling = toggling.has(key);

                        return (
                          <td
                            key={perm.ID}
                            className="p-2 text-center border-r border-gray-200"
                          >
                            {canWrite('ADMIN_PERMISSIONS') ? (
                              <button
                                onClick={() => handleToggle(user.ID, perm.ID)}
                                disabled={isToggling}
                                className={`
                                  w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold
                                  transition-colors disabled:opacity-50
                                  ${hasPermission
                                    ? 'bg-green-200 text-green-700 hover:bg-green-300'
                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                  }
                                `}
                                title={hasPermission ? 'Accordé' : 'Refusé'}
                              >
                                {hasPermission ? '✓' : '✗'}
                              </button>
                            ) : (
                              <span className={`text-sm font-bold ${hasPermission ? 'text-green-600' : 'text-gray-400'}`}>
                                {hasPermission ? '✓' : '✗'}
                              </span>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={1 + (Object.values(groupedPermissions).flat()).length} className="p-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">Légende :</p>
        <ul className="space-y-1">
          <li>✓ = Permission accordée</li>
          <li>✗ = Permission refusée</li>
          {canWrite('ADMIN_PERMISSIONS') && <li>Cliquez sur une cellule pour basculer la permission</li>}
        </ul>
      </div>
    </div>
  );
};

export default AdminMatrice;
