/**
 * Composant JourPlanning
 * Affiche le détail d'une journée avec les commandes planifiées
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Plus, Trash2, Edit2, Clock, Users } from 'lucide-preact';
import type { JourPlanning as JourPlanningType, PlanningCommande } from '../../types/planning.types';

interface JourPlanningProps {
  jour: JourPlanningType;
  onAjouter?: (jour: JourPlanningType) => void;
  onSupprimer?: (commande: PlanningCommande) => void;
  onModifier?: (commande: PlanningCommande) => void;
  disabled?: boolean;
}

const HEURES = Array.from({ length: 9 }, (_, i) => i + 8); // 8h - 16h

export const JourPlanning: FunctionComponent<JourPlanningProps> = ({
  jour,
  onAjouter,
  onSupprimer,
  onModifier,
  disabled = false,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getHeurePosition = (heure: string) => {
    const [h] = heure.split(':').map(Number);
    return ((h - 8) * 60) / 60; // Pixels pour chaque heure
  };

  const getHauteurCommande = (debut: string, fin: string) => {
    const [dh, dm] = debut.split(':').map(Number);
    const [fh, fm] = fin.split(':').map(Number);
    const duree = (fh * 60 + fm) - (dh * 60 + dm);
    return (duree / 60) * 80; // Hauteur basée sur la durée
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prevu': return 'bg-blue-100 border-blue-400';
      case 'en_cours': return 'bg-green-100 border-green-400';
      case 'termine': return 'bg-gray-100 border-gray-400';
      case 'reporte': return 'bg-yellow-100 border-yellow-400';
      case 'annule': return 'bg-red-100 border-red-400';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {jour.date}
          </h3>
          <p className="text-sm text-gray-500">
            {jour.pourcentage_utilisation}% utilisé ({jour.heures_utilisees}h/{jour.heures_disponibles}h)
          </p>
        </div>
        {!disabled && (
          <button
            onClick={() => onAjouter?.(jour)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        )}
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${jour.pourcentage_utilisation}%` }}
          ></div>
        </div>
      </div>

      {/* Timeline des commandes */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Headers des heures */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          <div className="w-20 px-2 py-2 border-r border-gray-200 text-xs font-medium text-gray-600">
            Heure
          </div>
          <div className="flex-1 flex">
            {HEURES.map((h) => (
              <div
                key={h}
                className="flex-1 text-center px-1 py-2 text-xs font-medium text-gray-600 border-r border-gray-200"
              >
                {h}:00
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Grille horaire */}
          <div className="flex">
            <div className="w-20 bg-gray-50 border-r border-gray-200"></div>
            <div className="flex-1 flex relative">
              {HEURES.map((h) => (
                <div
                  key={h}
                  className="flex-1 border-r border-gray-200 h-32"
                ></div>
              ))}
            </div>
          </div>

          {/* Commandes */}
          <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
            <div className="w-20"></div>
            <div className="flex-1 relative">
              {jour.commandes.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  className={`absolute left-0 right-0 border-2 rounded cursor-pointer pointer-events-auto ${getStatusColor(cmd.statut)}`}
                  style={{
                    top: `${getHeurePosition(cmd.heure_debut) * 128 + 4}px`,
                    height: `${getHauteurCommande(cmd.heure_debut, cmd.heure_fin)}px`,
                    left: `${idx * 20}%`,
                    width: `${80 / (idx + 1)}%`,
                    zIndex: idx,
                  }}
                  onClick={() => setExpandedId(expandedId === cmd.id ? null : cmd.id)}
                >
                  <div className="p-2 h-full flex flex-col justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800 truncate">
                        {cmd.commande_numero}
                      </p>
                      <p className="text-gray-600 truncate">
                        {cmd.article_nom}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-700">
                      <Clock className="w-3 h-3" />
                      <span>
                        {cmd.heure_debut}-{cmd.heure_fin}
                      </span>
                    </div>
                  </div>

                  {/* Options au survol */}
                  {!disabled && (
                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onModifier?.(cmd);
                        }}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Modifier"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSupprimer?.(cmd);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Détail commande (si expandée) */}
          {expandedId && (
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              {jour.commandes
                .filter((cmd) => cmd.id === expandedId)
                .map((cmd) => (
                  <div key={cmd.id} className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Commande</p>
                        <p className="font-medium text-gray-800">{cmd.commande_numero}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Article</p>
                        <p className="font-medium text-gray-800">{cmd.article_nom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Horaires</p>
                        <p className="font-medium text-gray-800">
                          {cmd.heure_debut} - {cmd.heure_fin} ({cmd.duree_heures}h)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantité</p>
                        <p className="font-medium text-gray-800">
                          {cmd.quantite_produite}/{cmd.quantite_a_produire}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Opérateurs</p>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-800">
                            {cmd.operateurs_affectes}/{cmd.operateurs_requis}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Statut</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(cmd.statut)}`}>
                          {cmd.statut.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Actions détail */}
                    {!disabled && (
                      <div className="flex space-x-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => onModifier?.(cmd)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => onSupprimer?.(cmd)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {jour.notes && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">{jour.notes}</p>
        </div>
      )}

      {/* Jours fériés/chômés */}
      {(jour.est_ferie || jour.est_chome) && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-800">
            {jour.est_ferie ? '🎉 Jour férié' : '✖️ Jour chômé'}
          </p>
        </div>
      )}
    </div>
  );
};

export default JourPlanning;
