/**
 * Hook personnalisé pour gérer les données du dashboard
 * Récupère les indicateurs depuis l'API et gère les états de chargement
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { indicateursApi } from '../api/indicateurs';
import { showToast } from '../utils/toast';
import type { Indicateurs, Periode } from '../types/dashboard.types';

interface UseDashboardReturn {
  data: Indicateurs | null;
  loading: boolean;
  error: string | null;
  periode: Periode;
  setPeriode: (periode: Periode) => void;
  refresh: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Hook useDashboard
 * @param initialPeriode - Période initiale (défaut: 'jour')
 */
export const useDashboard = (initialPeriode: Periode = 'jour'): UseDashboardReturn => {
  const [data, setData] = useState<Indicateurs | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periode, setPeriode] = useState<Periode>(initialPeriode);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Fonction pour charger les données
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await indicateursApi.getAll(periode);
      
      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setLastUpdate(new Date());
        console.log(`✅ Dashboard mis à jour (${periode})`);
      } else {
        throw new Error('Données non disponibles');
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement dashboard:', err);
      
      let errorMessage = 'Erreur lors du chargement des données';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  /**
   * Charger les données au montage et quand la période change
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Rafraîchir manuellement les données
   */
  const refresh = useCallback(async () => {
    const toastId = showToast.loading('Rafraîchissement...');
    try {
      const response = await indicateursApi.getAll(periode);
      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setLastUpdate(new Date());
        console.log('✅ Données rafraîchies avec succès');
        showToast.update(toastId, 'Données mises à jour', 'success');
      } else {
        throw new Error('Réponse invalide');
      }
    } catch (err: any) {
      console.error('❌ Erreur rafraîchissement:', err);
      let errorMsg = 'Erreur de rafraîchissement';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      showToast.update(toastId, errorMsg, 'error');
    }
  }, [periode]);

  return {
    data,
    loading,
    error,
    periode,
    setPeriode,
    refresh,
    lastUpdate,
  };
};

export default useDashboard;