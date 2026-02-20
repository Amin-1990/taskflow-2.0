/**
 * Page Liste des Interventions
 * Affichage avec tableau, filtres et recherche
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Eye,
    AlertCircle,
    AlertTriangle,
    Clock,
} from 'lucide-preact';
import { useInterventions } from '../../hooks/useInterventions';
import type { InterventionStatut, InterventionPriorite } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';

interface InterventionsListProps {
    path?: string;
}

const STATUT_COLORS: Record<InterventionStatut, string> = {
    ouverte: 'bg-gray-100 text-gray-800',
    affectee: 'bg-blue-100 text-blue-800',
    en_cours: 'bg-purple-100 text-purple-800',
    terminee: 'bg-green-100 text-green-800',
    annulee: 'bg-red-100 text-red-800',
};

const STATUT_LABELS: Record<InterventionStatut, string> = {
    ouverte: 'Ouverte',
    affectee: 'AffectÃ©e',
    en_cours: 'En cours',
    terminee: 'TerminÃ©e',
    annulee: 'AnnulÃ©e',
};

const PRIORITE_COLORS: Record<InterventionPriorite, string> = {
    basse: 'text-gray-600',
    normale: 'text-blue-600',
    haute: 'text-orange-600',
    urgente: 'text-red-600',
};

const PRIORITE_LABELS: Record<InterventionPriorite, string> = {
    basse: 'Basse',
    normale: 'Normale',
    haute: 'Haute',
    urgente: 'Urgente',
};

export const Interventions: FunctionComponent<InterventionsListProps> = () => {
    const {
        interventions,
        loading,
        error,
        page,
        limit,
        total,
        pages,
        setPage,
        setLimit,
        recherche,
        setRecherche,
        filtres,
        setFiltres,
        clearFiltres,
        deleteIntervention,
        updateStatut,
    } = useInterventions();

    const [showFilters, setShowFilters] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        console.log('ðŸ”§ Module Maintenance - Interventions');
    }, []);

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async (id: number) => {
        const success = await deleteIntervention(id);
        if (success) {
            setDeleteId(null);
        }
    };

    if (loading && (!interventions || interventions.length === 0)) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des interventions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tÃªte */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Interventions de maintenance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Total: {total} intervention{total > 1 ? 's' : ''}
                    </p>
                </div>
                <ActionButton
                    onClick={() => route('/maintenance/interventions/nouveau')}
                    icon={Plus}
                    variant="accent"
                >
                    Nouvelle intervention
                </ActionButton>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                {/* Recherche */}
                <div className="flex space-x-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par numÃ©ro ou titre..."
                            value={recherche}
                            onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${showFilters
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>Filtres</span>
                    </button>
                </div>

                {/* Filtres (masquÃ©s par dÃ©faut) */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                        {/* Filtre Statut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={filtres.statut || ''}
                                onChange={(e) => {
                                    const val = (e.target as HTMLSelectElement).value;
                                    if (val) setFiltres({ statut: val as InterventionStatut });
                                    else setFiltres({ statut: undefined });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="ouverte">Ouverte</option>
                                <option value="affectee">AffectÃ©e</option>
                                <option value="en_cours">En cours</option>
                                <option value="terminee">TerminÃ©e</option>
                                <option value="annulee">AnnulÃ©e</option>
                            </select>
                        </div>

                        {/* Filtre PrioritÃ© */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PrioritÃ©
                            </label>
                            <select
                                value={filtres.priorite || ''}
                                onChange={(e) => {
                                    const val = (e.target as HTMLSelectElement).value;
                                    if (val) setFiltres({ priorite: val as InterventionPriorite });
                                    else setFiltres({ priorite: undefined });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Toutes les prioritÃ©s</option>
                                <option value="basse">Basse</option>
                                <option value="normale">Normale</option>
                                <option value="haute">Haute</option>
                                <option value="urgente">Urgente</option>
                            </select>
                        </div>

                        {/* Filtre Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                value={filtres.type || ''}
                                onChange={(e) => {
                                    const val = (e.target as HTMLSelectElement).value;
                                    if (val) setFiltres({ type: val as any });
                                    else setFiltres({ type: undefined });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Tous les types</option>
                                <option value="preventive">PrÃ©ventive</option>
                                <option value="curative">Curative</option>
                                <option value="ameliorative">AmÃ©liorative</option>
                            </select>
                        </div>

                        {/* Filtre Machine */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Machine
                            </label>
                            <input
                                type="text"
                                placeholder="Code machine..."
                                value={filtres.machine_id?.toString() || ''}
                                onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) setFiltres({ machine_id: parseInt(val) });
                                    else setFiltres({ machine_id: undefined });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Bouton RÃ©initialiser */}
                        <div className="flex items-end">
                            <button
                                onClick={clearFiltres}
                                className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                            >
                                RÃ©initialiser
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!interventions || interventions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>Aucune intervention trouvÃ©e</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">NumÃ©ro</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Machine</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Titre</th>
                                    <th className="px-6 py-3 text-center font-semibold text-gray-700">PrioritÃ©</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Technicien</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {interventions.map((intervention) => (
                                    <tr key={intervention.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-blue-600">
                                            {intervention.numero}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <div className="font-medium">{intervention.machine_code}</div>
                                            <div className="text-xs text-gray-500">{intervention.machine_nom}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{intervention.titre}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-medium ${PRIORITE_COLORS[intervention.priorite]}`}>
                                                {PRIORITE_LABELS[intervention.priorite]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[intervention.statut]}`}>
                                                {STATUT_LABELS[intervention.statut]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {intervention.technicien_nom || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    title="Voir les dÃ©tails"
                                                    onClick={() => route(`/maintenance/interventions/${intervention.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Modifier"
                                                    onClick={() => route(`/maintenance/interventions/${intervention.id}/modifier`)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Supprimer"
                                                    onClick={() => handleDeleteClick(intervention.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Page {page} sur {pages} â€¢ {total} rÃ©sultat{total > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setPage(i + 1)}
                                className={`px-3 py-1 rounded-lg ${page === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(Math.min(pages, page + 1))}
                            disabled={page === pages}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Dialog de confirmation de suppression */}
            {deleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirmer la suppression
                        </h3>
                        <p className="text-gray-600 mb-6">
                            ÃŠtes-vous sÃ»r de vouloir supprimer cette intervention ? Cette action est irrÃ©versible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleConfirmDelete(deleteId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interventions;








