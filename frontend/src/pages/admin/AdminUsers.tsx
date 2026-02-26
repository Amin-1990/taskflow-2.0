import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
  Eye,
  Trash2,
  Lock,
  LockOpen,
  Plus,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-preact';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import type { AdminUser } from '../../types/admin.types';

/**
 * Convertit une valeur numérique en booléen
 */
const toBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
};

export const AdminUsers: FunctionComponent = () => {
  const { users, loading, error, page, limit, search, setPage, setSearch, refresh, deleteUser, toggleUserStatus } = useAdminUsers();
  const { user } = useAuth();
  const { canRead, canWrite } = usePermissions();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Vérifier la permission d'accès
  useEffect(() => {
    if (user && !user.permissions?.includes('ADMIN_READ')) {
      showToast.error('Accès refusé au module administration');
      route('/');
    }
  }, [user]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      showToast.success('Utilisateur supprimé');
      setDeleteConfirm(null);
    } catch (err: any) {
      showToast.error(err.message);
    }
  };

  const handleToggleLock = async (user: AdminUser) => {
    try {
      const est_actif = toBoolean(user.Est_actif);
      const est_verrouille = toBoolean(user.Est_verrouille);
      // Inverser le verrouillage
      await toggleUserStatus(user.ID, est_actif, !est_verrouille);
      showToast.success(est_verrouille ? 'Utilisateur déverrouillé' : 'Utilisateur verrouillé');
    } catch (err: any) {
      showToast.error(err.message);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des utilisateurs de l'application</p>
        </div>

        {canWrite('ADMIN_USERS') && (
          <button
            onClick={() => route('/admin/utilisateurs/nouveau')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un utilisateur</span>
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou username..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => {
                  const est_actif = toBoolean(user.Est_actif);
                  const est_verrouille = toBoolean(user.Est_verrouille);

                  return (
                    <tr key={user.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">
                          {user.Username}
                        </div>
                        {user.Nom_prenom && (
                          <div className="text-xs text-gray-500">
                            {user.Nom_prenom}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.Email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              est_actif
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {est_actif ? 'Actif' : 'Inactif'}
                          </span>
                          {est_verrouille && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Verrouillé
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.Derniere_connexion
                          ? new Date(user.Derniere_connexion).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Voir le détail */}
                          <button
                            onClick={() => route(`/admin/utilisateurs/${user.ID}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir le détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Verrouiller/Déverrouiller */}
                          {canWrite('ADMIN_USERS') && (
                            <button
                              onClick={() => handleToggleLock(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                est_verrouille
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title={est_verrouille ? 'Déverrouiller' : 'Verrouiller'}
                            >
                              {est_verrouille ? (
                                <LockOpen className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Supprimer */}
                          {canWrite('ADMIN_USERS') && (
                            <>
                              <button
                                onClick={() => setDeleteConfirm(deleteConfirm === user.ID ? null : user.ID)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Confirmation de suppression */}
                              {deleteConfirm === user.ID && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-red-200 p-3 z-10">
                                  <p className="text-xs font-medium text-gray-800 mb-2">
                                    Confirmer la suppression?
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleDeleteUser(user.ID)}
                                      className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    >
                                      Supprimer
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="flex-1 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{page}</span> · {users.length} résultats
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-sm text-gray-600">
              <input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(Math.max(1, Number(e.currentTarget.value)))}
                className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
              />
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={users.length < limit}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
