/**
 * Composant PlanningHebdo
 * Vue calendrier du planning hebdomadaire avec drag & drop
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-preact';
import type { Planning, JourPlanning, PlanningCommande } from '../../types/planning.types';
import { JourPlanning as JourPlanningComponent } from './JourPlanning';

interface PlanningHebdoProps {
  planning: Planning | null;
  loading?: boolean;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onAjouterCommande?: (jour: JourPlanning) => void;
  onSupprimerCommande?: (commande: PlanningCommande) => void;
  onModifierCommande?: (commande: PlanningCommande) => void;
  onExporterPDF?: () => void;
  onExporterExcel?: () => void;
  disabled?: boolean;
}

export const PlanningHebdo: FunctionComponent<PlanningHebdoProps> = ({
  planning,
  loading = false,
  onNavigatePrevious,
  onNavigateNext,
  onAjouterCommande,
  onSupprimerCommande,
  onModifierCommande,
  onExporterPDF,
  onExporterExcel,
  disabled = false,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'compact' | 'list'>('timeline');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucun planning pour cette semaine</p>
        <p className="text-sm text-gray-500 mt-1">
          Créez un nouveau planning pour commencer
        </p>
      </div>
    );
  }

  const jours = planning.jours || [];
  const joursOuvrables = jours.filter((j) => !['samedi', 'dimanche'].includes(j.jour));

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Titre et dates */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Semaine {planning.numero_semaine} - {planning.annee}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {planning.date_debut} à {planning.date_fin}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigatePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onNavigateNext}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Semaine suivante"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Statut et actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Statut */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              planning.statut === 'confirme' ? 'bg-green-100 text-green-800' :
              planning.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
              planning.statut === 'termine' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {(planning.statut || 'brouillon').replace(/_/g, ' ').toUpperCase()}
            </span>

            {/* Charge globale */}
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(planning.charge_totale || 0)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {(planning.charge_totale || 0)}%
              </span>
            </div>

            {/* Infos */}
            <span className="text-sm text-gray-600">
              {(planning.commandes_planifiees || 0)} commande(s)
            </span>
          </div>

          {/* Export */}
          {!disabled && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onExporterPDF}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                title="Exporter en PDF"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={onExporterExcel}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                title="Exporter en Excel"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Erreurs de validation */}
      {!planning.est_valide && planning.erreurs.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {planning.erreurs.map((erreur, idx) => (
              <li key={idx}>• {erreur}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Jours du planning */}
      <div className="grid grid-cols-1 gap-6">
        {joursOuvrables.map((jour) => (
          <JourPlanningComponent
            key={jour.id}
            jour={jour}
            onAjouter={onAjouterCommande}
            onSupprimer={onSupprimerCommande}
            onModifier={onModifierCommande}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Résumé */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé de la semaine</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {joursOuvrables.map((jour) => (
            <div key={jour.id} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 capitalize">
                {jour.jour.substring(0, 3)}
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {jour.pourcentage_utilisation}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {jour.heures_utilisees}h / {jour.heures_disponibles}h
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes du planning */}
      {planning.notes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Notes</h3>
          <p className="text-sm text-yellow-700">{planning.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PlanningHebdo;
