import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { AlertTriangle, RefreshCw, X, Globe, Clock, Wifi } from 'lucide-preact';
import { useAdminSessions } from '../../hooks/useAdminSessions';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import type { AdminSession } from '../../types/admin.types';

/**
 * Extrait le navigateur du User Agent
 */
const extractBrowser = (userAgent: string | null | undefined): string => {
  if (!userAgent) return 'Navigateur inconnu';

  const ua = userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('chromium')) {
    const match = ua.match(/chrome\/([\d.]+)/);
    return `Chrome ${match ? match[1] : ''}`.trim();
  }
  if (ua.includes('firefox')) {
    const match = ua.match(/firefox\/([\d.]+)/);
    return `Firefox ${match ? match[1] : ''}`.trim();
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    const match = ua.match(/version\/([\d.]+)/);
    return `Safari ${match ? match[1] : ''}`.trim();
  }
  if (ua.includes('edg')) {
    const match = ua.match(/edg\/([\d.]+)/);
    return `Edge ${match ? match[1] : ''}`.trim();
  }
  if (ua.includes('opera') || ua.includes('opr')) {
    const match = ua.match(/opr\/([\d.]+)/);
    return `Opera ${match ? match[1] : ''}`.trim();
  }

  return 'Navigateur inconnu';
};

/**
 * Formate une date en temps relatif (ex: "il y a 2 minutes")
 */
const formatRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';

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

/**
 * Convertit une valeur numérique en booléen
 */
const toBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
};

export const AdminSessions: FunctionComponent = () => {
  const { sessions, loading, error, refresh, revokeSession } = useAdminSessions();
  const { user } = useAuth();
  const { canRead, canWrite } = usePermissions();
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);
  const [revoking, setRevoking] = useState<Set<number>>(new Set());

  // Vérifier la permission d'accès
  useEffect(() => {
    if (user && !user.permissions?.includes('ADMIN_READ')) {
      showToast.error('Accès refusé au module administration');
      route('/');
    }
  }, [user]);

  const handleRevokeSession = async (sessionId: number) => {
    try {
      setRevoking(prev => new Set(prev).add(sessionId));
      await revokeSession(sessionId);
      showToast.success('Session révoquée');
      setRevokeConfirm(null);
    } catch (err: any) {
      showToast.error(err.message);
    } finally {
      setRevoking(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des sessions...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Sessions Actives</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} active{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bouton rafraîchir */}
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
          title="Rafraîchir (auto-refresh: 30s)"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grille de sessions */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const browser = extractBrowser(session.User_agent);
            const isRevoking = revoking.has(session.ID);

            return (
              <div key={session.ID} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                {/* En-tête session */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-800">
                      {session.Username || 'Utilisateur inconnu'}
                    </h3>
                    <p className="text-xs text-gray-500">{session.Email}</p>
                  </div>

                  {/* Statut actif */}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${
                    toBoolean(session.Est_active)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {toBoolean(session.Est_active) ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Infos de la session */}
                <div className="space-y-3 mb-4">
                  {/* Navigateur */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">{browser}</span>
                  </div>

                  {/* IP */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Wifi className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 font-mono text-xs">{session.IP_address || 'IP inconnue'}</span>
                  </div>

                  {/* Début de session */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="text-gray-600 text-xs">
                      <div>
                        Connexion:{' '}
                        {session.Date_connexion
                          ? new Date(session.Date_connexion).toLocaleDateString('fr-FR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Dernière activité */}
                  {session.Derniere_activite && (
                    <div className="text-xs text-gray-500">
                      Dernière activité: {formatRelativeTime(session.Derniere_activite)}
                    </div>
                  )}
                </div>

                {/* Bouton révoque session */}
                {canWrite('SESSION_MANAGE') && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setRevokeConfirm(revokeConfirm === session.ID ? null : session.ID)}
                        disabled={isRevoking}
                        className="w-full px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Terminer la session</span>
                      </button>

                      {/* Confirmation */}
                      {revokeConfirm === session.ID && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-red-200 rounded-lg shadow-lg p-3 z-10">
                          <p className="text-xs font-medium text-gray-800 mb-2">
                            Terminer cette session ?
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRevokeSession(session.ID)}
                              disabled={isRevoking}
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {isRevoking ? 'Révocation...' : 'Confirmer'}
                            </button>
                            <button
                              onClick={() => setRevokeConfirm(null)}
                              disabled={isRevoking}
                              className="flex-1 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">Aucune session active</p>
        </div>
      )}

      {/* Note auto-refresh */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <p className="font-medium mb-1">ℹ️ Auto-refresh actif</p>
        <p>Cette page se met à jour automatiquement toutes les 30 secondes.</p>
      </div>
    </div>
  );
};

export default AdminSessions;
