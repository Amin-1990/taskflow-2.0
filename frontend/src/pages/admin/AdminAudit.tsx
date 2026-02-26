import type { FunctionComponent } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import {
  AlertTriangle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Layers
} from 'lucide-preact';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import { adminApi } from '../../api/admin';
import type { AdminUser } from '../../types/admin.types';

const MODULE_COLORS = {
  utilisateurs: 'bg-blue-100 text-blue-800',
  permissions: 'bg-red-100 text-red-800',
  roles: 'bg-purple-100 text-purple-800',
  matrice_autorisation: 'bg-indigo-100 text-indigo-800',
  sessions: 'bg-yellow-100 text-yellow-800',
  logs_audit: 'bg-gray-100 text-gray-800'
};

/**
 * Formate une date en temps relatif
 */
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'à l\'instant';
    if (diffMin < 60) return `il y a ${diffMin}m`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay < 30) return `il y a ${diffDay}j`;
    return date.toLocaleDateString('fr-FR');
  } catch {
    return 'N/A';
  }
};

/**
 * Affiche une valeur avec indicateur ✓/✗ pour 0/1
 */
const ValueDisplay: FunctionComponent<{ value?: string | null }> = ({ value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  if (value === '1' || value?.includes('1')) {
    return <span className="text-green-600 font-bold">✓</span>;
  }
  if (value === '0' || value?.includes('0')) {
    return <span className="text-red-600 font-bold">✗</span>;
  }

  return <span className="text-xs text-gray-600 max-w-xs truncate">{value}</span>;
};

export const AdminAudit: FunctionComponent = () => {
  const { logs, loading, error, page, limit, filters, setPage, setFilters, refresh } = useAdminAudit();
  const { user } = useAuth();
  const { canRead } = usePermissions();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [modules, setModules] = useState<string[]>([]);

  // Vérifier la permission d'accès
  useEffect(() => {
    if (user && !user.permissions?.includes('ADMIN_READ')) {
      showToast.error('Accès refusé au module administration');
      route('/');
    }
  }, [user]);

  // Charger les utilisateurs pour le filtre
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await adminApi.listUsers();
        if (res.data?.data) {
          setUsers(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (err) {
        // Silencieusement
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Extraire les modules uniques
  useEffect(() => {
    const mods = new Set(logs.map((l) => l.Table_concernee).filter(Boolean));
    setModules(Array.from(mods).sort());
  }, [logs]);

  const handleExportCsv = () => {
    try {
      // Créer le CSV
      const headers = ['Date', 'Utilisateur', 'Action', 'Module', 'Ancienne valeur', 'Nouvelle valeur', 'IP'];
      const rows = logs.map((log) => [
        new Date(log.Date_action).toLocaleString('fr-FR'),
        log.Username || 'Inconnu',
        log.Action,
        log.Table_concernee,
        log.Ancienne_valeur || '-',
        log.Nouvelle_valeur || '-',
        log.IP_address || '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      showToast.success('Export CSV téléchargé');
    } catch (err: any) {
      showToast.error('Erreur lors de l\'export');
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du journal d'audit...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Journal d'Audit</h1>
          <p className="text-sm text-gray-500 mt-1">Historique des modifications</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

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

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Période */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Période</span>
          </label>
          <select
            value={filters.period}
            onChange={(e) =>
              setFilters({
                period: e.currentTarget.value as 'today' | 'week' | 'month'
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
          </select>
        </div>

        {/* Utilisateur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>Utilisateur</span>
          </label>
          <select
            value={filters.userId || ''}
            onChange={(e) =>
              setFilters({
                userId: e.currentTarget.value ? Number(e.currentTarget.value) : null
              })
            }
            disabled={usersLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => (
              <option key={u.ID} value={u.ID}>
                {u.Username}
              </option>
            ))}
          </select>
        </div>

        {/* Module */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
            <Layers className="w-4 h-4" />
            <span>Module</span>
          </label>
          <select
            value={filters.module}
            onChange={(e) =>
              setFilters({
                module: e.currentTarget.value
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les modules</option>
            {modules.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>

        {/* Type d'action */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'action</label>
          <select
            value={filters.actionType}
            onChange={(e) =>
              setFilters({
                actionType: e.currentTarget.value as 'all' | 'accorded' | 'revoked'
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="accorded">Permissions accordées</option>
            <option value="revoked">Permissions révoquées</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ancienne
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nouvelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="font-medium">{new Date(log.Date_action).toLocaleString('fr-FR')}</div>
                      <div className="text-gray-400">{formatRelativeTime(log.Date_action)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {log.Username || 'Inconnu'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {log.Action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          MODULE_COLORS[log.Table_concernee as keyof typeof MODULE_COLORS] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {log.Table_concernee}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ValueDisplay value={log.Ancienne_valeur} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ValueDisplay value={log.Nouvelle_valeur} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {log.IP_address || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun log trouvé pour ces critères
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{page}</span> · {logs.length} résultats
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
              disabled={logs.length < limit}
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

export default AdminAudit;
