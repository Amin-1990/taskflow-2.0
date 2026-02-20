/**
 * Formulaire de création/modification de commande
 * Validation complète et sélection d'article
 */

import { type FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { AlertCircle, Loader } from 'lucide-preact';
import type {
  CreateCommandeDto,
  UpdateCommandeDto,
  Article,
  CommandePriorite,
  Commande,
} from '../../types/production.types';
import { showToast } from '../../utils/toast';

export interface CommandeFormProps {
  mode: 'create' | 'edit';
  commande?: Commande;
  articles: Article[];
  onSubmit: (data: CreateCommandeDto | UpdateCommandeDto) => Promise<any>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

export const CommandeForm: FunctionComponent<CommandeFormProps> = ({
  mode,
  commande,
  articles,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // États du formulaire
  const [formData, setFormData] = useState<CreateCommandeDto | UpdateCommandeDto>({
    ...(mode === 'create' ? {
      ID_Article: 0,              // ✨ Renommé
      Code_article: '',           // ✨ Nouveau
      Lot: '',                    // ✨ Renommé
      Quantite: 0,               // ✨ Renommé
      Date_debut: '',            // ✨ Renommé
      priorite: 'normale' as CommandePriorite,
      notes: '',
    } : {
      statut: commande?.statut,
      priorite: commande?.priorite,
      date_fin_prevue: commande?.date_fin_prevue || '',
      notes: commande?.notes || '',
    }),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialiser le formulaire pour le mode edit
  useEffect(() => {
    if (mode === 'edit' && commande) {
      setFormData({
        statut: commande.statut,
        priorite: commande.priorite,
        date_fin_prevue: commande.date_fin_prevue || '',
        notes: commande.notes || '',
      });
    }
  }, [mode, commande]);

  /**
   * Valider les champs du formulaire
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (mode === 'create') {
      const data = formData as CreateCommandeDto;

      if (!data.ID_Article || data.ID_Article <= 0) {
        newErrors.ID_Article = 'Article requis';
      }

      if (!data.Code_article || data.Code_article.trim() === '') {
        newErrors.Code_article = 'Code article requis';
      }

      if (!data.Lot || data.Lot.trim() === '') {
        newErrors.Lot = 'Numéro de lot requis';
      }

      if (!data.Quantite || data.Quantite <= 0) {
        newErrors.Quantite = 'Quantité doit être > 0';
      }

      if (!data.Date_debut) {
        newErrors.Date_debut = 'Date de début requise';
      } else {
        const dateObj = new Date(data.Date_debut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateObj < today) {
          newErrors.Date_debut = 'La date doit être future';
        }
      }
    } else {
      // Mode edit - validation plus souple
      const data = formData as UpdateCommandeDto;

      if (data.date_fin_prevue) {
        const dateObj = new Date(data.date_fin_prevue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateObj < today) {
          newErrors.date_fin_prevue = 'La date doit être future';
        }
      }

      if (data.quantite !== undefined && data.quantite <= 0) {
        newErrors.quantite = 'Quantité doit être > 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gérer l'envoi du formulaire
   */
  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) {
      showToast.error('Veuillez corriger les erreurs');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Mettre à jour un champ du formulaire
   */
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {mode === 'create' ? 'Nouvelle commande' : 'Modifier commande'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'create'
            ? 'Créer une nouvelle commande de production'
            : `Modifier la commande ${commande?.numero}`}
        </p>
      </div>

      {/* Section Article (create seulement) */}
      {mode === 'create' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article *
              </label>
              <select
                value={(formData as CreateCommandeDto).ID_Article || ''}
                onChange={(e) => {
                  const articleId = parseInt((e.target as HTMLSelectElement).value);
                  const article = articles.find(a => a.id === articleId);
                  updateField('ID_Article', articleId);
                  if (article) updateField('Code_article', article.code);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ID_Article
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un article</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.nom} ({article.code})
                  </option>
                ))}
              </select>
              {errors.ID_Article && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.ID_Article}
                </p>
              )}
            </div>

            {/* Code Article */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Article *
              </label>
              <input
                type="text"
                placeholder="ART-001"
                value={(formData as CreateCommandeDto).Code_article}
                onChange={(e) => updateField('Code_article', (e.target as HTMLInputElement).value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.Code_article ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.Code_article && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.Code_article}
                </p>
              )}
            </div>

            {/* Lot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de lot *
              </label>
              <input
                type="text"
                placeholder="LOT-2024-001"
                value={(formData as CreateCommandeDto).Lot}
                onChange={(e) => updateField('Lot', (e.target as HTMLInputElement).value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.Lot ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.Lot && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.Lot}
                </p>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                min="1"
                placeholder="100"
                value={(formData as CreateCommandeDto).Quantite || ''}
                onChange={(e) => updateField('Quantite', parseInt((e.target as HTMLInputElement).value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.Quantite ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.Quantite && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.Quantite}
                </p>
              )}
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={(formData as CreateCommandeDto).Date_debut || ''}
                onChange={(e) => updateField('Date_debut', (e.target as HTMLInputElement).value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.Date_debut ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.Date_debut && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.Date_debut}
                </p>
              )}
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select
                value={(formData as CreateCommandeDto).priorite || 'normale'}
                onChange={(e) => updateField('priorite', (e.target as HTMLSelectElement).value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Section Statut (edit seulement) */}
      {mode === 'edit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={(formData as UpdateCommandeDto).statut || ''}
              onChange={(e) => updateField('statut', (e.target as HTMLSelectElement).value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ne pas modifier</option>
              <option value="creee">Créée</option>
              <option value="en_cours">En cours</option>
              <option value="en_attente">En attente</option>
              <option value="suspendue">Suspendue</option>
              <option value="completee">Complétée</option>
              <option value="emballe">Emballée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité
            </label>
            <select
              value={(formData as UpdateCommandeDto).priorite || ''}
              onChange={(e) => updateField('priorite', (e.target as HTMLSelectElement).value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ne pas modifier</option>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Date fin prévue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin prévue
            </label>
            <input
              type="date"
              value={(formData as UpdateCommandeDto).date_fin_prevue || ''}
              onChange={(e) => updateField('date_fin_prevue', (e.target as HTMLInputElement).value || undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.date_fin_prevue ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date_fin_prevue && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> {errors.date_fin_prevue}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes (toujours visible) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          placeholder="Ajouter des notes ou des commentaires..."
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', (e.target as HTMLTextAreaElement).value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {(submitting || isLoading) && <Loader className="w-4 h-4 animate-spin" />}
          <span>
            {submitting || isLoading
              ? 'Envoi...'
              : mode === 'create'
              ? 'Créer la commande'
              : 'Mettre à jour'}
          </span>
        </button>
      </div>
    </form>
  );
};

export default CommandeForm;
