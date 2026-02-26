/**
 * Page Liste des Articles
 * Affichage avec tableau, filtres et recherche
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
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
  Download,
  Upload,
  CheckCircle,
} from 'lucide-preact';
import { useArticles } from '../../hooks/useArticles';
import { showToast } from '../../utils/toast';
import { ARTICLE_STATUT_OPTIONS, articlesApi, type ArticleStatut } from '../../api/articles';
import ActionButton from '../../components/common/ActionButton';
import { usePermissions } from '../../hooks/usePermissions';

interface ArticlesListProps {
  path?: string;
}

const STATUT_COLORS: Record<string, string> = {
  nouveau: 'bg-cyan-100 text-cyan-800',
  'passage de rÃ©vision': 'bg-amber-100 text-amber-800',
  normale: 'bg-blue-100 text-blue-800',
  'obsol\u00E8te': 'bg-gray-200 text-gray-700',
};

const STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  'passage de rÃ©vision': 'Passage de rÃ©vision',
  normale: 'Normale',
  'obsol\u00E8te': 'Obsol\u00E8te',
};

export const Articles: FunctionComponent<ArticlesListProps> = () => {
  const { canWrite } = usePermissions();
  const {
    articles,
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
    deleteArticle,
    toggleValide,
  } = useArticles();

  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('ðŸ“¦ Module Articles - Liste');
  }, []);

  const handleExportXLSX = async () => {
    try {
      setIsExporting(true);
      const response = await articlesApi.exportXLSX();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articles_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Articles exportés avec succès');
    } catch (error) {
      showToast.error('Erreur lors de l\'export');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await articlesApi.getTemplateImport();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_articles.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Template tÃ©lÃ©chargÃ©');
    } catch (error) {
      showToast.error('Erreur lors du tÃ©lÃ©chargement du template');
      console.error('Template download error:', error);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await articlesApi.importArticles(file);
      showToast.success('Articles importÃ©s avec succÃ¨s');
      setRecherche('');
      setFiltres({});
      setPage(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      const details = error.response?.data?.details;
      const errorMsg = apiError || error.response?.data?.message || 'Erreur lors de l\'import';
      showToast.error(errorMsg);
      if (Array.isArray(details) && details.length > 0) {
        showToast.error(details.slice(0, 3).join(' | '));
      }
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteArticle(id);
    if (success) {
      setDeleteId(null);
    }
  };

  if (loading && (!articles || articles.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tÃªte */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {total} article{total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite('ARTICLES') && (
            <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
              {isDownloadingTemplate ? 'Template...' : 'Template'}
            </ActionButton>
          )}
          {canWrite('ARTICLES') && (
            <ActionButton onClick={handleImportClick} loading={isImporting} icon={Upload}>
              {isImporting ? 'Import...' : 'Importer'}
            </ActionButton>
          )}
          <ActionButton onClick={handleExportXLSX} loading={isExporting} icon={Download}>
            {isExporting ? 'Export...' : 'Exporter'}
          </ActionButton>
          {canWrite('ARTICLES') && (
            <ActionButton onClick={() => route('/articles/gestion')} icon={Plus} variant="accent">
              Nouvel article
            </ActionButton>
          )}
        </div>
      </div>

      {/* Hidden file input for imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

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
              placeholder="Rechercher par code ou client..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filtres.statut || ''}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val) setFiltres({ statut: val as ArticleStatut });
                  else setFiltres({ statut: undefined });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {ARTICLE_STATUT_OPTIONS.map((statut) => (
                  <option key={statut} value={statut}>
                    {STATUT_LABELS[statut]}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation
              </label>
              <select
                value={filtres.valide ? 'validÃ©' : filtres.valide === false ? 'non-validÃ©' : ''}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val === 'validÃ©') setFiltres({ valide: true });
                  else if (val === 'non-validÃ©') setFiltres({ valide: false });
                  else setFiltres({ valide: undefined });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="validÃ©">ValidÃ©s</option>
                <option value="non-validÃ©">Non validÃ©s</option>
              </select>
            </div>

            {/* Bouton RÃ©initialiser */}
            <div className="flex items-end">
              <button
                onClick={clearFiltres}
                className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                RÃ©initialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!articles || articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun article trouvÃ©</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Temps theo.</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Temps rÃ©el</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">ValidÃ©</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {article.Code_article}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{article.Client || '-'}</td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {article.Temps_theorique ? `${article.Temps_theorique}h` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {article.Temps_reel ? `${article.Temps_reel}h` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[article.statut] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUT_LABELS[article.statut] || article.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {article.valide ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          title="Voir les dÃ©tails"
                          onClick={() => route(`/articles/${article.ID}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite('ARTICLES') && (
                          <button
                            title="Modifier"
                            onClick={() => route(`/articles/gestion/${article.ID}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canWrite('ARTICLES') && (
                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteClick(article.ID)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
            {Array.from({ length: pages }).map((_, i) => (
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
              ÃŠtes-vous sÃ»r de vouloir supprimer cet article ? Cette action est irrÃ©versible.
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

export default Articles;



