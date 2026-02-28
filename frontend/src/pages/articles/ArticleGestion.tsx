/**
 * Page Gestion Articles
 * Formulaire pour créer/modifier un article
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ArrowLeft, Save, AlertCircle } from 'lucide-preact';
import { ARTICLE_STATUT_OPTIONS, articlesApi, type Article, type CreateArticleDto } from '../../api/articles';
import { showToast } from '../../utils/toast';

interface ArticleGestionProps {
  path?: string;
  id?: string;
}

export const ArticleGestion: FunctionComponent<ArticleGestionProps> = ({ id }) => {
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (!id) return;
    const articleId = Number(id);
    if (!Number.isFinite(articleId) || articleId <= 0) {
      setError('ID article invalide');
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
        setError(message);
        showToast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

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

      if (id) {
        // Mode édition
        await articlesApi.update(Number(id), formData);
        showToast.success('Article modifié avec succès');
      } else {
        // Mode création
        await articlesApi.create(formData);
        showToast.success('Article créé avec succès');
      }

      route('/articles');
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => route('/articles')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'Modifier l\'article' : 'Créer un nouvel article'}
          </h1>
        </div>
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

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Informations générales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h2>
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Section Temps */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Temps de production</h2>
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Section Révision */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations techniques</h2>
          <div className="space-y-4">
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
        </div>

        {/* Section Liens */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Liens et ressources</h2>
          <div className="space-y-4">
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
        </div>

        {/* Section Commentaires */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Commentaires</h2>
          <textarea
            name="Commentaire"
            value={formData.Commentaire || ''}
            onChange={handleChange}
            rows={4}
            placeholder="Ajoutez des commentaires ou notes sur cet article..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Boutons d'action */}
        <div className="md:col-span-2 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => route('/articles')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleGestion;
