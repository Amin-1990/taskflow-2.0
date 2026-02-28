/**
 * Hook useDefauts
 * Gestion des défauts produit disponibles
 */

import { useState, useEffect } from 'preact/hooks';
import qualiteApi from '../api/qualite';
import type { DefautProduit } from '../types/qualite.types';

interface UseDefautsReturn {
  defauts: DefautProduit[];
  loading: boolean;
  error: string | null;
}

export const useDefauts = (): UseDefautsReturn => {
  const [defauts, setDefauts] = useState<DefautProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefauts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await qualiteApi.getDefautsProduit();
        setDefauts(response.data.data || []);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Erreur lors du chargement des défauts';
        setError(message);
        console.error('Erreur useDefauts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDefauts();
  }, []);

  return {
    defauts,
    loading,
    error
  };
};
