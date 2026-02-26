import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Mail,
  User,
  Calendar,
  Lock,
  LockOpen,
  Trash2
} from 'lucide-preact';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../api/admin';

interface Props {
  id?: string;
}

/**
 * Convertit une valeur numérique en booléen
 */
const toBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
};

export const AdminUserDetail: FunctionComponent<Props> = ({ id = '0' }) => {
  const userId = Number(id);
  const { data, loading, error, refresh } = useAdminUserDetail(userId);
  const { currentUser } = useAuth();
  const { canRead, canWrite } = usePermissions();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Vérifier la permission d'accès
  useEffect(() => {
    if (currentUser && !currentUser.permissions?.includes('ADMIN_READ')) {
      showToast.error('Accès refusé au module administration');
      route('/');
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Réessayer
            </button>
            <button
              onClick={() => route('/admin/utilisateurs')}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Utilisateur non trouvé</p>
      </div>
    );
  }

  const { user, roles, permissions, sessions } = data;
  const est_actif = toBoolean(user.Est_actif);
  const est_verrouille = toBoolean(user.Est_verrouille);

  const handleToggleLock = async () => {
    try {
      await adminApi.updateUserStatus(user.ID, {
        Est_actif: est_actif,
        Est_verrouille: !est_verrouille
      });
      await refresh();
      showToast.success(est_verrouille ? 'Utilisateur déverrouillé' : 'Utilisateur verrouillé');
    } catch (err: any) {
      showToast.error(err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteUser(user.ID);
      showToast.success('Utilisateur supprimé');
      route('/admin/utilisateurs');
    } catch (err: any) {
      showToast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => route('/admin/utilisateurs')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux utilisateurs</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Infos utilisateur */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations principales */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informations utilisateur</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Username</label>
                <p className="text-gray-800 text-base mt-1">{user.Username}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <p className="text-gray-800 text-base mt-1">{user.Email}</p>
              </div>

              {user.Nom_prenom && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Nom complet</label>
                  <p className="text-gray-800 text-base mt-1">{user.Nom_prenom}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Statut</label>
                <div className="mt-1 flex items-center space-x-2">
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
              </div>

              {user.Derniere_connexion && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Dernière connexion</span>
                  </label>
                  <p className="text-gray-800 text-base mt-1">
                    {new Date(user.Derniere_connexion).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canWrite('ADMIN_USERS') && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>

              <div className="space-y-2">
                <button
                  onClick={handleToggleLock}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-medium transition-colors ${
                    est_verrouille
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  {est_verrouille ? (
                    <>
                      <LockOpen className="w-4 h-4" />
                      <span>Déverrouiller l'utilisateur</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verrouiller l'utilisateur</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg flex items-center justify-center space-x-2 font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer l'utilisateur</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rôles */}
      {roles && roles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Rôles assignés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map((role) => (
              <div key={role.ID} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <p className="font-medium text-blue-900">{role.Nom_role}</p>
                {role.Description && (
                  <p className="text-xs text-blue-700 mt-1">{role.Description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      {permissions && permissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Permissions directes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Permission</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {permissions.map((perm) => (
                  <tr key={perm.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-800">{perm.Nom_permission}</div>
                      <div className="text-xs text-gray-500">{perm.Code_permission}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          perm.Type === 'ACCORDER'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {perm.Type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {perm.Expiration
                        ? new Date(perm.Expiration).toLocaleDateString('fr-FR')
                        : 'Illimitée'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sessions actives */}
      {sessions && sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sessions actives</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.ID} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {session.IP_address || 'Adresse IP inconnue'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.Date_connexion
                        ? new Date(session.Date_connexion).toLocaleString('fr-FR')
                        : 'Date inconnue'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      toBoolean(session.Est_active)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {toBoolean(session.Est_active) ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.Username}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
