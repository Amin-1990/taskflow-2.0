/**
 * Page Détail Machine
 * Informations complètes + historique des interventions
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Wrench,
} from 'lucide-preact';
import { useMachines } from '../../hooks/useMachines';
import type { MachineStatut } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';

interface MachineDetailProps {
  path?: string;
  id?: string;
}

const STATUT_COLORS: Record<MachineStatut, string> = {
  operationnelle: 'bg-green-100 text-green-800',
  en_panne: 'bg-red-100 text-red-800',
  en_maintenance: 'bg-blue-100 text-blue-800',
  en_attente: 'bg-yellow-100 text-yellow-800',
  hors_service: 'bg-gray-100 text-gray-800',
};

const STATUT_LABELS: Record<MachineStatut, string> = {
  operationnelle: 'Opérationnelle',
  en_panne: 'En panne',
  en_maintenance: 'En maintenance',
  en_attente: 'En attente',
  hors_service: 'Hors service',
};

export const MachineDetail: FunctionComponent<MachineDetailProps> = ({ id = '1' }) => {
  const { fetchDetail, machineDetail, loadingDetail, error } = useMachines();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id));
      console.log(`🔧 Détail machine #${id}`);
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

  if (error || !machineDetail) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">{error || 'Machine non trouvée'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {/* Naviguer vers /maintenance/machines */}}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{machineDetail.nom}</h1>
            <p className="text-sm text-gray-500 mt-1">Code: {machineDetail.code}</p>
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

      {/* Information de statut */}
      <div className={`rounded-lg p-4 ${STATUT_COLORS[machineDetail.statut]}`}>
        <div className="flex items-center space-x-3">
          {machineDetail.statut === 'en_panne' && (
            <AlertTriangle className="w-5 h-5" />
          )}
          <div>
            <p className="text-sm font-medium">Statut actuel</p>
            <p className="text-lg font-bold">{STATUT_LABELS[machineDetail.statut]}</p>
          </div>
        </div>
      </div>

      {/* Détails généraux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Type</label>
              <p className="text-base font-medium text-gray-800">{machineDetail.type}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Localisation</label>
              <p className="text-base font-medium text-gray-800">{machineDetail.localisation}</p>
            </div>
            {machineDetail.numero_serie && (
              <div>
                <label className="text-sm text-gray-600">Numéro de série</label>
                <p className="text-base font-medium text-gray-800">{machineDetail.numero_serie}</p>
              </div>
            )}
            {machineDetail.date_acquisition && (
              <div>
                <label className="text-sm text-gray-600">Date d'acquisition</label>
                <p className="text-base font-medium text-gray-800">
                  {new Date(machineDetail.date_acquisition).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques maintenance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Maintenance</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <label className="text-sm text-gray-600">Heures de fonctionnement</label>
                <p className="text-base font-medium text-gray-800">{machineDetail.heures_fonctionnement}h</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Wrench className="w-5 h-5 text-orange-600" />
              <div>
                <label className="text-sm text-gray-600">Heures en intervention</label>
                <p className="text-base font-medium text-gray-800">{machineDetail.heures_intervention}h</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Dernière maintenance</label>
              <p className="text-base font-medium text-gray-800">
                {machineDetail.date_derniere_maintenance
                  ? new Date(machineDetail.date_derniere_maintenance).toLocaleDateString('fr-FR')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Prochaine maintenance prévue</label>
              <p className="text-base font-medium text-gray-800">
                {machineDetail.date_prochaine_maintenance
                  ? new Date(machineDetail.date_prochaine_maintenance).toLocaleDateString('fr-FR')
                  : 'À planifier'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {machineDetail.description && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
          <p className="text-gray-700">{machineDetail.description}</p>
        </div>
      )}

      {/* Notes */}
      {machineDetail.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
          <p className="text-gray-700">{machineDetail.notes}</p>
        </div>
      )}

      {/* Historique des interventions */}
      {machineDetail.interventions_recentes && machineDetail.interventions_recentes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Interventions récentes ({machineDetail.interventions_recentes.length})
          </h2>
          <div className="space-y-4">
            {machineDetail.interventions_recentes.map((intervention) => (
              <div key={intervention.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{intervention.numero}</p>
                    <p className="text-base font-medium text-gray-800 mt-1">{intervention.titre}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(intervention.date_creation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {intervention.description && (
                  <p className="text-sm text-gray-600 mt-2">{intervention.description}</p>
                )}
              </div>
            ))}
          </div>
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
              Êtes-vous sûr de vouloir supprimer cette machine ? Cette action est irréversible.
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

export default MachineDetail;



