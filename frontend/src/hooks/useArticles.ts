/**
 * Hook useArticles
 * Gestion complète de l'état et des opérations sur les articles
 */

import { useState, useCallback, useEffect } from 'preact/hooks';
import { articlesApi, type Article, type FiltresArticles } from '../api/articles';
import { showToast } from '../utils/toast';

interface UseArticlesReturn {
  articles: Article[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  recherche: string;
  setRecherche: (search: string) => void;
  filtres: FiltresArticles;
  setFiltres: (filtres: Partial<FiltresArticles>) => void;
  clearFiltres: () => void;
  deleteArticle: (id: number) => Promise<boolean>;
  toggleValide: (id: number, valide: boolean) => Promise<boolean>;
}

export const useArticles = (): UseArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [filtres, setFiltresState] = useState<FiltresArticles>({});

  // Charger les articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await articlesApi.getList({
        page,
        limit,
        search: recherche || undefined,
        ...filtres,
      });

      if (response.data.success) {
        const payload: any = response.data.data;

        // Format pagine: { data: Article[], total, pages }
        if (payload && Array.isArray(payload.data)) {
          setArticles(payload.data);
          setTotal(Number(payload.total || payload.data.length || 0));
          setPages(Number(payload.pages || Math.max(1, Math.ceil((payload.total || payload.data.length || 0) / limit))));
          console.log(`✅ ${payload.data.length} articles chargés`);
          return;
        }

        // Format simple backend actuel: data = Article[]
        if (Array.isArray(payload)) {
          const filtered = payload.filter((article: Article) => {
            const matchesSearch = !recherche
              || article.Code_article?.toLowerCase().includes(recherche.toLowerCase())
              || article.Client?.toLowerCase().includes(recherche.toLowerCase());
            const matchesStatut = !filtres.statut || article.statut === filtres.statut;
            const matchesValide = filtres.valide === undefined || article.valide === filtres.valide;
            return matchesSearch && matchesStatut && matchesValide;
          });

          const computedPages = Math.max(1, Math.ceil(filtered.length / limit));
          if (page > computedPages) {
            setPage(computedPages);
            return;
          }

          const start = (page - 1) * limit;
          const paged = filtered.slice(start, start + limit);
          setArticles(paged);
          setTotal(filtered.length);
          setPages(computedPages);
          console.log(`✅ ${paged.length} articles chargés (mode liste simple)`);
        }
      }
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors du chargement des articles';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, recherche, filtres]);

  // Charger les articles au changement de page/filtres
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Supprimer un article
  const deleteArticle = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await articlesApi.delete(id);
      if (response.data.success) {
        showToast.success('Article supprimé avec succès');
        await loadArticles();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la suppression';
      showToast.error(message);
      return false;
    }
  }, [loadArticles]);

  // Valider/Invalider un article
  const toggleValide = useCallback(async (id: number, valide: boolean): Promise<boolean> => {
    try {
      const response = await articlesApi.toggleValide(id, valide);
      if (response.data.success) {
        showToast.success(`Article ${valide ? 'validé' : 'invalidé'} avec succès`);
        await loadArticles();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la validation';
      showToast.error(message);
      return false;
    }
  }, [loadArticles]);

  // Mettre à jour les filtres
  const setFiltres = useCallback((newFiltres: Partial<FiltresArticles>) => {
    setFiltresState(prev => ({
      ...prev,
      ...newFiltres
    }));
    setPage(1); // Réinitialiser à la page 1
  }, []);

  // Réinitialiser les filtres
  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setRecherche('');
    setPage(1);
  }, []);

  return {
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
  };
};
