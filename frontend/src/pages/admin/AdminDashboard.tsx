import type { FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import {
    Users,
    Lock,
    Key,
    Activity,
    AlertTriangle,
    Clock
} from 'lucide-preact';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import { showToast } from '../../utils/toast';

/**
 * Formate une date en temps relatif (ex: "il y a 2 minutes")
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
        if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
        if (diffHour < 24) return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
        if (diffDay < 30) return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
        return date.toLocaleDateString('fr-FR');
    } catch {
        return 'N/A';
    }
};

export const AdminDashboard: FunctionComponent = () => {
    const { data, logs, loading, error, refresh } = useAdminDashboard();
    const { canRead } = usePermissions();

    // Vérifier la permission d'accès
    const { user } = useAuth();
    useEffect(() => {
        if (user && !user.permissions?.includes('ADMIN_READ')) {
            showToast.error('Accès refusé au module administration');
            route('/');
        }
    }, [user]);

    // Toast de bienvenue
    useEffect(() => {
        if (!loading && data) {
            showToast.success('Dashboard administrateur chargé');
        }
    }, [loading, data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement du dashboard administrateur...</p>
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
            <PageHeader
                title="Administration"
                subtitle="Tableau de bord du module administration"
                showRefresh={true}
                onRefresh={refresh}
                isRefreshing={loading}
            />

            {/* Cartes de statistiques */}
            {data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Utilisateurs */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    Total
                                </span>
                            </div>
                            <h3 className="text-sm text-gray-500 mb-1">Utilisateurs</h3>
                            <div className="flex items-baseline">
                                <span className="text-2xl font-bold text-gray-800">
                                    {data.users.total_users}
                                </span>
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Actifs :</span>
                                    <span className="font-medium text-green-600">{data.users.active_users}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Verrouillés :</span>
                                    <span className="font-medium text-red-600">{data.users.locked_users}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rôles */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Lock className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                    {data.roles?.active_roles || 0}
                                </span>
                            </div>
                            <h3 className="text-sm text-gray-500 mb-1">Rôles</h3>
                            <div className="flex items-baseline">
                                <span className="text-2xl font-bold text-gray-800">
                                    {data.roles?.total_roles || 0}
                                </span>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                                Rôles actifs : <span className="font-medium">{data.roles?.active_roles || 0}</span>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Key className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    Total
                                </span>
                            </div>
                            <h3 className="text-sm text-gray-500 mb-1">Permissions</h3>
                            <div className="flex items-baseline">
                                <span className="text-2xl font-bold text-gray-800">
                                    {data.permissions.total_permissions}
                                </span>
                            </div>
                            <div className="mt-3 text-sm text-gray-500">
                                Permissions définies
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Activity className="w-6 h-6 text-yellow-600" />
                                </div>
                                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                                    Actives
                                </span>
                            </div>
                            <h3 className="text-sm text-gray-500 mb-1">Sessions</h3>
                            <div className="flex items-baseline">
                                <span className="text-2xl font-bold text-gray-800">
                                    {data.sessions.active_sessions}
                                </span>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                                Utilisateurs connectés : <span className="font-medium">{data.sessions.connected_users}</span>
                            </div>
                        </div>
                    </div>

                    {/* Logs d'audit récents */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Activité récente</h2>
                            <Clock className="w-5 h-5 text-gray-400" />
                        </div>

                        {logs && logs.length > 0 ? (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div key={log.ID} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {log.Username || 'Utilisateur inconnu'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {log.Action} sur {log.Table_concernee}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {log.Date_action
                                                        ? formatRelativeTime(log.Date_action)
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                            {log.IP_address && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    IP: {log.IP_address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Aucune activité récente</p>
                            </div>
                        )}
                    </div>

                    {/* Alertes d'audit */}
                    {data.audit.logs_last_24h > 100 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Activité importante
                                    </h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        {data.audit.logs_last_24h} actions enregistrées dans les 24 dernières heures
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
