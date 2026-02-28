/**
 * Hook usePostes
 * Charge tous les postes disponibles
 */

import { useState, useEffect } from 'preact/hooks';
import postesApi from '../api/postes';
import type { Poste } from '../api/postes';

interface UsePostesReturn {
  postes: Poste[];
  loading: boolean;
  error: string | null;
}

export const usePostes = (): UsePostesReturn => {
  const [postes, setPostes] = useState<Poste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPostes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await postesApi.getAll();
        setPostes(response.data.data || []);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Erreur lors du chargement des postes';
        setError(message);
        console.error('Erreur usePostes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPostes();
  }, []);

  return {
    postes,
    loading,
    error
  };
};
