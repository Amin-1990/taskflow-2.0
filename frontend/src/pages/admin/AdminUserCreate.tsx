import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ArrowLeft, AlertTriangle, Eye, EyeOff } from 'lucide-preact';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../api/admin';
import type { CreateAdminUserPayload, AdminRole } from '../../types/admin.types';

export const AdminUserCreate: FunctionComponent = () => {
  const { user } = useAuth();
  const { canRead, canWrite } = usePermissions();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    Username: '',
    Email: '',
    Password: '',
    selectedRoles: [] as number[]
  });

  // Vérifier la permission d'accès
  useEffect(() => {
    if (user && (!user.permissions?.includes('ADMIN_READ') || !user.permissions?.includes('ADMIN_USERS_WRITE'))) {
      showToast.error('Accès refusé');
      route('/');
    }
  }, [user]);

  // Charger les rôles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await adminApi.listRoles();
        if (res.data?.data) {
          setRoles(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (err: any) {
        showToast.error('Erreur lors du chargement des rôles');
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formData.Username.trim()) {
      showToast.error('Le username est requis');
      return;
    }

    if (!formData.Email.trim()) {
      showToast.error('L\'email est requis');
      return;
    }

    if (!formData.Password) {
      showToast.error('Le mot de passe est requis');
      return;
    }

    try {
      setLoading(true);

      const payload: CreateAdminUserPayload = {
        Username: formData.Username,
        Email: formData.Email,
        Password: formData.Password as any,
        roles: formData.selectedRoles.length > 0 ? formData.selectedRoles : undefined
      };

      const res = await adminApi.createUser(payload);
      
      if (res.data?.data) {
        showToast.success('Utilisateur créé avec succès');
        route('/admin/utilisateurs');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((r) => r !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => route('/admin/utilisateurs')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux utilisateurs</span>
        </button>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Créer un utilisateur</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.Username}
              onChange={(e) =>
                setFormData({ ...formData, Username: e.currentTarget.value })
              }
              placeholder="Entrer le username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.Email}
              onChange={(e) =>
                setFormData({ ...formData, Email: e.currentTarget.value })
              }
              placeholder="Entrer l'email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.Password}
                onChange={(e) =>
                  setFormData({ ...formData, Password: e.currentTarget.value })
                }
                placeholder="Entrer le mot de passe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Rôles */}
          {!loadingRoles && roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rôles
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.ID} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedRoles.includes(role.ID)}
                      onChange={() => handleRoleToggle(role.ID)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{role.Nom_role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center space-x-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => route('/admin/utilisateurs')}
              disabled={loading}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserCreate;
