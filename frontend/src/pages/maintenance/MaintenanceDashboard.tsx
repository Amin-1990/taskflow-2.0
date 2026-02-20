/**
 * Dashboard Maintenance
 * KPIs, graphiques et alertes
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
    TrendingUp,
    AlertTriangle,
    Wrench,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Zap,
} from 'lucide-preact';
import * as maintenanceApi from '../../api/maintenance';
import type { MaintenanceDashboardData, MaintenanceKPIs } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';

interface MaintenanceDashboardProps {
    path?: string;
}

export const MaintenanceDashboard: FunctionComponent<MaintenanceDashboardProps> = () => {
    const [data, setData] = useState<MaintenanceDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('📊 Module Maintenance - Dashboard');
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const dashboardData = await maintenanceApi.getMaintenanceDashboard();
            setData(dashboardData);
            console.log('✅ Dashboard data chargées');
        } catch (err: any) {
            const errorMsg = err.message || 'Erreur lors du chargement du dashboard';
            setError(errorMsg);
            console.error('❌ Erreur dashboard:', err);
            showToast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const global = data.global || {};
    const topPannes = data.top_pannes || [];
    const perfTechniciens = data.performance_techniciens || [];

    // KPIs basées sur les données globales
    const totalDemandes = global.total_demandes || 0;
    const enAttente = global.en_attente || 0;
    const affectees = global.affectees || 0;
    const enCours = global.en_cours || 0;
    const terminees = global.terminees || 0;
    const tempsAttenteMoyen = global.temps_attente_moyen || 0;
    const dureeMoyenne = global.duree_moyenne || 0;

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Maintenance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Suivi des machines et interventions
                    </p>
                </div>
                <ActionButton onClick={loadDashboardData} icon={RefreshCw}>
                    Actualiser
                </ActionButton>
            </div>

            {/* KPIs - Première ligne */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI: Total demandes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Total demandes</h3>
                        <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{totalDemandes}</p>
                    <p className="text-xs text-gray-500 mt-2">
                        {terminees} terminées
                    </p>
                </div>

                {/* KPI: En attente */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">En attente</h3>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{enAttente}</p>
                    <p className="text-xs text-gray-500 mt-2">Demandes d'intervention</p>
                </div>

                {/* KPI: Temps d'attente moyen */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Temps d'attente moyen</h3>
                        <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{tempsAttenteMoyen}</p>
                    <p className="text-xs text-gray-500 mt-2">Minutes (ce mois)</p>
                </div>

                {/* KPI: Durée moyenne d'intervention */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Durée moyenne</h3>
                        <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{dureeMoyenne}</p>
                    <p className="text-xs text-gray-500 mt-2">Minutes d'intervention</p>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique: État des demandes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-6">État des demandes d'intervention</h3>
                    <div className="space-y-4">
                        {/* Barre En attente */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">En attente</span>
                                <span className="text-sm font-medium text-red-600">
                                    {enAttente}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full"
                                    style={{ width: `${totalDemandes > 0 ? (enAttente / totalDemandes) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Barre Affectées */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Affectées</span>
                                <span className="text-sm font-medium text-blue-600">
                                    {affectees}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${totalDemandes > 0 ? (affectees / totalDemandes) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Barre En cours */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">En cours</span>
                                <span className="text-sm font-medium text-yellow-600">
                                    {enCours}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-600 h-2 rounded-full"
                                    style={{ width: `${totalDemandes > 0 ? (enCours / totalDemandes) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Barre Terminées */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Terminées</span>
                                <span className="text-sm font-medium text-green-600">
                                    {terminees}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${totalDemandes > 0 ? (terminees / totalDemandes) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphique: Top pannes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-6">Top 5 des pannes</h3>
                    <div className="space-y-3">
                        {topPannes.length > 0 ? (
                            topPannes.map((item, index) => {
                                const maxPannes = Math.max(...topPannes.map(p => p.nb_occurrences), 1);
                                const pourcentage = (item.nb_occurrences / maxPannes) * 100;
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600 truncate">{item.Nom_defaut || 'Sans défaut'}</span>
                                            <span className="text-sm font-medium text-gray-800">{item.nb_occurrences}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-600 h-2 rounded-full"
                                                style={{ width: `${pourcentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500">Aucune panne enregistrée</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance des techniciens */}
            {perfTechniciens.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-4">Performance des techniciens</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Technicien</th>
                                    <th className="text-center py-2 px-3 text-gray-600 font-medium">Interventions</th>
                                    <th className="text-center py-2 px-3 text-gray-600 font-medium">Durée moyenne (min)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perfTechniciens.map((tech, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-gray-800">{tech.Nom_prenom || 'N/A'}</td>
                                        <td className="py-2 px-3 text-center text-gray-600">{tech.interventions}</td>
                                        <td className="py-2 px-3 text-center text-gray-600">{tech.duree_moyenne}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pas de données */}
            {totalDemandes === 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-blue-800">Pas de données</h3>
                            <p className="text-sm text-blue-700 mt-1">Aucune demande d'intervention pour ce mois</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceDashboard;

