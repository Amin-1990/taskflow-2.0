/**
 * Page de détail d'une commande
 * Affiche les informations complètes, historique et suivi
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Package,
  Zap,
} from 'lucide-preact';
import { useCommandes } from '../../hooks/useCommandes';
import { CommandeForm } from '../../components/production/CommandeForm';

interface CommandeDetailProps {
  path?: string;
  id?: string;
}

export const CommandeDetail: FunctionComponent<CommandeDetailProps> = ({ id }) => {
  const {
    commandeDetail,
    loadingDetail,
    articles,
    updateCommande,
    deleteCommande,
    fetchDetail,
    fetchArticles,
  } = useCommandes();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const commandeId = Number(id);
  const hasValidId = Number.isFinite(commandeId) && commandeId > 0;

  // Charger les détails et les articles au montage
  useEffect(() => {
    if (hasValidId) {
      fetchDetail(commandeId);
      fetchArticles();
    }
  }, [hasValidId, commandeId, fetchDetail, fetchArticles]);

  const handleUpdate = async (data: any) => {
    if (!hasValidId) return;
    const result = await updateCommande(commandeId, data);
    if (result) {
      setIsEditing(false);
      await fetchDetail(commandeId);
    }
  };

  const handleDelete = async () => {
    if (!hasValidId) return;
    const result = await deleteCommande(commandeId);
    if (result) {
      // Naviguer vers la liste
      route('/production/commandes');
    }
  };

  if (loadingDetail) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!hasValidId || !commandeDetail) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">Commande non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  const cmd = commandeDetail;
  const statutColors: Record<string, string> = {
    creee: 'bg-gray-100 text-gray-800',
    en_cours: 'bg-blue-100 text-blue-800',
    en_attente: 'bg-yellow-100 text-yellow-800',
    completee: 'bg-green-100 text-green-800',
    annulee: 'bg-red-100 text-red-800',
    en_controle: 'bg-purple-100 text-purple-800',
    emballe: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Retour"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {cmd.numero}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Créée le {new Date(cmd.date_creation).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Formulaire d'édition ou vue détail */}
      {isEditing ? (
        <CommandeForm
          mode="edit"
          commande={cmd}
          articles={articles}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          {/* Cartes d'informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Statut */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-2">Statut</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statutColors[cmd.statut] || 'bg-gray-100 text-gray-800'}`}>
                {cmd.statut.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Priorité */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-2">Priorité</p>
              <p className="text-sm font-medium text-gray-800">
                {cmd.priorite.charAt(0).toUpperCase() + cmd.priorite.slice(1)}
              </p>
            </div>

            {/* Avancement */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-2">Avancement</p>
              <div className="flex items-center justify-between">
                <div className="w-full mr-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cmd.pourcentage_avancement}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium w-10">
                  {cmd.pourcentage_avancement}%
                </span>
              </div>
            </div>

            {/* Conformité */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-2">Conformité</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-green-600">
                  {cmd.taux_conformite}%
                </span>
              </div>
            </div>
          </div>

          {/* Détails principaux */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Article</p>
                <p className="text-base font-medium text-gray-800">{cmd.article_nom}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Lot</p>
                <p className="text-base font-medium text-gray-800">{cmd.lot}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Quantité</p>
                <p className="text-base font-medium text-gray-800">
                  {cmd.quantite_produite}/{cmd.quantite}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Emballée</p>
                <p className="text-base font-medium text-gray-800">
                  {cmd.quantite_emballe}/{cmd.quantite}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date prévue</p>
                <p className="text-base font-medium text-gray-800">
                  {cmd.date_fin_prevue ? new Date(cmd.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Défauts détectés</p>
                <p className="text-base font-medium text-red-600">{cmd.total_defauts}</p>
              </div>
            </div>

            {cmd.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Notes</p>
                <p className="text-sm text-gray-700">{cmd.notes}</p>
              </div>
            )}
          </div>

          {/* Historique des affectations */}
          {cmd.historique_affectations && cmd.historique_affectations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Historique des affectations
              </h2>
              <div className="space-y-3">
                {cmd.historique_affectations.map((affectation, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{affectation.operateur_nom}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Quantité produite</p>
                          <p className="font-medium text-gray-800">{affectation.quantite_produite}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durée</p>
                          <p className="font-medium text-gray-800">
                            {affectation.duree_minutes
                              ? `${Math.floor(affectation.duree_minutes / 60)}h ${affectation.duree_minutes % 60}m`
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Période</p>
                          <p className="font-medium text-gray-800">
                            {new Date(affectation.date_debut).toLocaleDateString('fr-FR')}
                            {affectation.date_fin && ` - ${new Date(affectation.date_fin).toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {affectation.status === 'termine' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Défauts détectés */}
          {cmd.defauts && cmd.defauts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Défauts détectés
              </h2>
              <div className="space-y-3">
                {cmd.defauts.map((defaut, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-800">{defaut.description}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          defaut.type === 'critique'
                            ? 'bg-red-200 text-red-800'
                            : defaut.type === 'majeur'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {defaut.type.charAt(0).toUpperCase() + defaut.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {defaut.nombre_pieces} pièce(s) impactée(s)
                        {defaut.resolu ? ' - Résolu' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la commande {cmd.numero} ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
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

export default CommandeDetail;
