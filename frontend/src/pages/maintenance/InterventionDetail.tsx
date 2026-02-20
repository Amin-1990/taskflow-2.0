/**
 * Page Détail Intervention
 * Informations complètes + suivi
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
    ChevronLeft,
    Edit2,
    Trash2,
    AlertCircle,
    Clock,
    CheckCircle,
    User,
    FileText,
} from 'lucide-preact';
import { useInterventions } from '../../hooks/useInterventions';
import type { InterventionStatut, InterventionPriorite } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';

interface InterventionDetailProps {
    path?: string;
    id?: string;
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
    affectee: 'Affectée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulea: 'Annulée',
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

export const InterventionDetail: FunctionComponent<InterventionDetailProps> = ({ id = '1' }) => {
    const { fetchDetail, interventionDetail, loadingDetail, error, updateStatut } = useInterventions();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetail(parseInt(id));
            console.log(`🔧 Détail intervention #${id}`);
        }
    }, [id, fetchDetail]);

    if (loadingDetail) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des détails...</p>
                </div>
            </div>
        );
    }

    if (error || !interventionDetail) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                        <p className="text-sm text-red-700 mt-1">{error || 'Intervention non trouvée'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleStatusChange = async (newStatus: InterventionStatut) => {
        const success = await updateStatut(interventionDetail.id, newStatus);
        if (success) {
            await fetchDetail(interventionDetail.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => route('/maintenance/interventions')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{interventionDetail.titre}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Intervention {interventionDetail.numero} • Machine {interventionDetail.machine_code}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                        <Edit2 className="w-5 h-5" />
                        <span>Modifier</span>
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span>Supprimer</span>
                    </button>
                </div>
            </div>

            {/* Statut et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 ${STATUT_COLORS[interventionDetail.statut]}`}>
                    <p className="text-sm text-gray-600 mb-1">Statut</p>
                    <p className="text-lg font-bold">{STATUT_LABELS[interventionDetail.statut]}</p>
                    <div className="mt-4 flex space-x-2">
                        {interventionDetail.statut !== 'terminee' && (
                            <button
                                onClick={() => handleStatusChange('en_cours')}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                            >
                                Démarrer
                            </button>
                        )}
                        {interventionDetail.statut !== 'terminee' && (
                            <button
                                onClick={() => handleStatusChange('terminee')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                                Terminer
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-600 mb-2">Priorité</p>
                    <p className={`text-lg font-bold ${PRIORITE_COLORS[interventionDetail.priorite]}`}>
                        {PRIORITE_LABELS[interventionDetail.priorite]}
                    </p>
                    <p className="text-sm text-gray-600 mt-3">Type: {interventionDetail.type}</p>
                </div>
            </div>

            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Détails</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">Machine</label>
                            <p className="text-base font-medium text-gray-800">
                                {interventionDetail.machine_code} - {interventionDetail.machine_nom}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Date de création</label>
                            <p className="text-base font-medium text-gray-800">
                                {new Date(interventionDetail.date_creation).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                        {interventionDetail.date_debut && (
                            <div>
                                <label className="text-sm text-gray-600">Date de début</label>
                                <p className="text-base font-medium text-gray-800">
                                    {new Date(interventionDetail.date_debut).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        )}
                        {interventionDetail.date_fin_prevue && (
                            <div>
                                <label className="text-sm text-gray-600">Date de fin prévue</label>
                                <p className="text-base font-medium text-gray-800">
                                    {new Date(interventionDetail.date_fin_prevue).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Affectation</h2>
                    <div className="space-y-4">
                        {interventionDetail.technicien_nom ? (
                            <div className="flex items-center space-x-3">
                                <User className="w-5 h-5 text-blue-600" />
                                <div>
                                    <label className="text-sm text-gray-600">Technicien assigné</label>
                                    <p className="text-base font-medium text-gray-800">{interventionDetail.technicien_nom}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">Aucun technicien assigné</p>
                            </div>
                        )}

                        {interventionDetail.duree_prevue_heures && (
                            <div className="flex items-center space-x-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <div>
                                    <label className="text-sm text-gray-600">Durée prévue</label>
                                    <p className="text-base font-medium text-gray-800">{interventionDetail.duree_prevue_heures}h</p>
                                </div>
                            </div>
                        )}

                        {interventionDetail.duree_reelle_heures && (
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <label className="text-sm text-gray-600">Durée réelle</label>
                                    <p className="text-base font-medium text-gray-800">{interventionDetail.duree_reelle_heures}h</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {interventionDetail.description && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
                    <p className="text-gray-700">{interventionDetail.description}</p>
                </div>
            )}

            {/* Cause et Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interventionDetail.cause && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cause identifiée</h2>
                        <p className="text-gray-700">{interventionDetail.cause}</p>
                    </div>
                )}

                {interventionDetail.solution && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Solution appliquée</h2>
                        <p className="text-gray-700">{interventionDetail.solution}</p>
                    </div>
                )}
            </div>

            {/* Pièces utilisées */}
            {interventionDetail.pieces_utilisees && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Pièces utilisées</h2>
                    <p className="text-gray-700">{interventionDetail.pieces_utilisees}</p>
                </div>
            )}

            {/* Notes */}
            {interventionDetail.notes && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                    <p className="text-gray-700">{interventionDetail.notes}</p>
                </div>
            )}

            {/* Dialog suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirmer la suppression
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    // Appeler la suppression ici
                                    setShowDeleteConfirm(false);
                                }}
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

export default InterventionDetail;


