/**
 * Formulaire Article réutilisable
 * Utilisé pour créer/modifier un article
 */

import { type FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ARTICLE_STATUT_OPTIONS, articlesApi, type Article, type CreateArticleDto } from '../../api/articles';
import { showToast } from '../../utils/toast';

interface ArticleFormProps {
  articleId?: number;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const ArticleForm: FunctionComponent<ArticleFormProps> = ({ articleId, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateArticleDto>({
    Code_article: '',
    Client: '',
    Temps_theorique: undefined,
    Temps_reel: undefined,
    Indice_revision: undefined,
    Date_revision: undefined,
    Nombre_postes: undefined,
    Lien_dossier_client: '',
    Lien_photo: '',
    Lien_dossier_technique: '',
    Ctrl_elect_disponible: 0,
    Commentaire: '',
    valide: true,
    statut: 'normale',
  });

  // Charger l'article si on est en mode édition
  useEffect(() => {
    if (!articleId) {
      setLoading(false);
      return;
    }

    const loadArticle = async () => {
      try {
        const response = await articlesApi.getById(articleId);
        if (response.data.success) {
          const article = response.data.data;
          setFormData({
            Code_article: article.Code_article,
            Client: article.Client || '',
            Temps_theorique: article.Temps_theorique || undefined,
            Temps_reel: article.Temps_reel || undefined,
            Indice_revision: article.Indice_revision || undefined,
            Date_revision: article.Date_revision || undefined,
            Nombre_postes: article.Nombre_postes || undefined,
            Lien_dossier_client: article.Lien_dossier_client || '',
            Lien_photo: article.Lien_photo || '',
            Lien_dossier_technique: article.Lien_dossier_technique || '',
            Ctrl_elect_disponible: article.Ctrl_elect_disponible || 0,
            Commentaire: article.Commentaire || '',
            valide: article.valide,
            statut: article.statut,
          });
        }
      } catch (err: any) {
        const message = err.response?.data?.error || 'Erreur lors du chargement';
        showToast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  const handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = input as any;

    if (type === 'checkbox') {
      const checked = (input as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value || undefined
      }));
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formData.Code_article?.trim()) {
      showToast.error('Le code article est requis');
      return;
    }

    try {
      setSaving(true);

      if (articleId) {
        // Mode édition
        await articlesApi.update(articleId, formData);
        showToast.success('Article modifié avec succès');
      } else {
        // Mode création
        await articlesApi.create(formData);
        showToast.success('Article créé avec succès');
      }

      onSubmit?.();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
      showToast.error(message);
      console.error('Form error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code article */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code article *
          </label>
          <input
            type="text"
            name="Code_article"
            value={formData.Code_article}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <input
            type="text"
            name="Client"
            value={formData.Client || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ARTICLE_STATUT_OPTIONS.map((statut) => (
              <option key={statut} value={statut}>
                {statut === 'nouveau'
                  ? 'Nouveau'
                  : statut === 'passage de révision'
                    ? 'Passage de révision'
                    : statut === 'obsolète'
                      ? 'Obsolète'
                      : 'Normale'}
              </option>
            ))}
          </select>
        </div>

        {/* Temps théorique */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps théorique (minutes)
          </label>
          <input
            type="number"
            name="Temps_theorique"
            value={formData.Temps_theorique || ''}
            onChange={handleChange}
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Temps réel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps réel (minutes)
          </label>
          <input
            type="number"
            name="Temps_reel"
            value={formData.Temps_reel || ''}
            onChange={handleChange}
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Nombre postes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de postes
          </label>
          <input
            type="number"
            name="Nombre_postes"
            value={formData.Nombre_postes || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Indice révision */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indice révision
          </label>
          <input
            type="number"
            name="Indice_revision"
            value={formData.Indice_revision || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date révision */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date révision
          </label>
          <input
            type="date"
            name="Date_revision"
            value={formData.Date_revision || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lien dossier client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien dossier client
          </label>
          <input
            type="url"
            name="Lien_dossier_client"
            value={formData.Lien_dossier_client || ''}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lien photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien photo
          </label>
          <input
            type="url"
            name="Lien_photo"
            value={formData.Lien_photo || ''}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lien dossier technique */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien dossier technique
          </label>
          <input
            type="url"
            name="Lien_dossier_technique"
            value={formData.Lien_dossier_technique || ''}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="valide"
            name="valide"
            checked={formData.valide}
            onChange={handleChange}
            className="rounded"
          />
          <label htmlFor="valide" className="text-sm font-medium text-gray-700">
            Validé
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ctrl_elect"
            name="Ctrl_elect_disponible"
            checked={!!formData.Ctrl_elect_disponible}
            onChange={(e) => {
              const checked = (e.target as HTMLInputElement).checked;
              setFormData(prev => ({
                ...prev,
                Ctrl_elect_disponible: checked ? 1 : 0
              }));
            }}
            className="rounded"
          />
          <label htmlFor="ctrl_elect" className="text-sm font-medium text-gray-700">
            Contrôle électrique disponible
          </label>
        </div>
      </div>

      {/* Commentaires */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commentaires
        </label>
        <textarea
          name="Commentaire"
          value={formData.Commentaire || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Ajoutez des commentaires ou notes sur cet article..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : articleId ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;
