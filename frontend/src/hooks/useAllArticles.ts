/**
 * Hook useAllArticles
 * Charge TOUS les articles sans pagination (pour SelectSearch)
 */

import { useState, useEffect } from 'preact/hooks';
import { articlesApi, type Article } from '../api/articles';

interface UseAllArticlesReturn {
  articles: Article[];
  loading: boolean;
  error: string | null;
}

export const useAllArticles = (): UseAllArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger avec une limite très haute pour obtenir tous les articles
        const response = await articlesApi.getList({
          page: 1,
          limit: 999999,
        });

        if (response.data.success) {
          const payload: any = response.data.data;

          // Format pagine: { data: Article[], total, pages }
          if (payload && Array.isArray(payload.data)) {
            setArticles(payload.data);
            console.log(`✅ ${payload.data.length} articles chargés`);
            return;
          }

          // Format simple: data = Article[]
          if (Array.isArray(payload)) {
            setArticles(payload);
            console.log(`✅ ${payload.length} articles chargés (mode liste simple)`);
          }
        }
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Erreur lors du chargement des articles';
        setError(message);
        console.error('Erreur useAllArticles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllArticles();
  }, []);

  return {
    articles,
    loading,
    error
  };
};
