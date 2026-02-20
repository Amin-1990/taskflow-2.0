/**
 * Page Détail Article
 * Affichage complet des informations de l'article
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ArrowLeft, Edit2, Trash2, AlertCircle } from 'lucide-preact';
import { articlesApi, type Article } from '../../api/articles';
import { showToast } from '../../utils/toast';

interface ArticleDetailProps {
  path?: string;
  id?: string;
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  'passage de révision': 'Passage de révision',
  normale: 'Normale',
  obsolète: 'Obsolète',
};

export const ArticleDetail: FunctionComponent<ArticleDetailProps> = ({ id }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      const articleId = Number(id);
      if (!id || !Number.isFinite(articleId) || articleId <= 0) {
        setError('ID article manquant');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await articlesApi.getById(articleId);
        if (response.data.success) {
          setArticle(response.data.data);
        } else {
          setError('Article non trouvé');
        }
      } catch (err: any) {
        const message = err?.error || err.response?.data?.error || 'Erreur lors du chargement';
        setError(message);
        showToast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  const handleDelete = async () => {
    if (!article) return;
    try {
      await articlesApi.delete(article.ID);
      showToast.success('Article supprimé avec succès');
      route('/articles');
    } catch (err: any) {
      showToast.error('Erreur lors de la suppression');
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

  if (error || !article) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => route('/articles')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux articles</span>
        </button>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'Article non trouvé'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => route('/articles')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{article.Code_article}</h1>
            <p className="text-sm text-gray-500 mt-1">Détails de l'article</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => route(`/articles/gestion/${article.ID}`)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit2 className="w-5 h-5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Informations générales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Code article</label>
              <p className="text-gray-800 font-medium">{article.Code_article}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Client</label>
              <p className="text-gray-800">{article.Client || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Statut</label>
              <p className="text-gray-800">{STATUT_LABELS[article.statut] || article.statut}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Validation</label>
              <p className="text-gray-800">{article.valide ? '✅ Validé' : '❌ Non validé'}</p>
            </div>
          </div>
        </div>

        {/* Section Temps */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Temps de production</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Temps théorique</label>
              <p className="text-gray-800">{article.Temps_theorique ? `${article.Temps_theorique}h` : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Temps réel</label>
              <p className="text-gray-800">{article.Temps_reel ? `${article.Temps_reel}h` : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre de postes</label>
              <p className="text-gray-800">{article.Nombre_postes || '-'}</p>
            </div>
          </div>
        </div>

        {/* Section Révision */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations techniques</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Indice révision</label>
              <p className="text-gray-800">{article.Indice_revision || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Date révision</label>
              <p className="text-gray-800">
                {article.Date_revision ? new Date(article.Date_revision).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Contrôle électrique</label>
              <p className="text-gray-800">{article.Ctrl_elect_disponible ? '✅ Disponible' : '❌ Non disponible'}</p>
            </div>
          </div>
        </div>

        {/* Section Liens */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Liens et ressources</h2>
          <div className="space-y-3">
            {article.Lien_dossier_client && (
              <a
                href={article.Lien_dossier_client}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                📁 Dossier client
              </a>
            )}
            {article.Lien_photo && (
              <a
                href={article.Lien_photo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                📷 Photo
              </a>
            )}
            {article.Lien_dossier_technique && (
              <a
                href={article.Lien_dossier_technique}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                📚 Dossier technique
              </a>
            )}
            {!article.Lien_dossier_client && !article.Lien_photo && !article.Lien_dossier_technique && (
              <p className="text-gray-500 text-sm">Aucun lien</p>
            )}
          </div>
        </div>
      </div>

      {/* Commentaire */}
      {article.Commentaire && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Commentaires</h2>
          <p className="text-gray-700">{article.Commentaire}</p>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
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

export default ArticleDetail;
