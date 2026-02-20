/**
 * Hook personnalisé pour gérer les semaines
 * Chargement, filtrage, pagination et recherche
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { semainesApi } from '../api/semaines';
import { showToast } from '../utils/toast';
import type {
  Semaine,
  SemainesListResponse,
  FiltresSemaines,
  SemaineSortField,
} from '../types/semaines.types';

/**
 * Options de pagination et tri
 */
export interface UseSemainesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: SemaineSortField;
  initialOrder?: 'asc' | 'desc';
}

/**
 * Valeur retournée par le hook
 */
interface UseSemainesReturn {
  // Données
  semaines: Semaine[];

  // États
  loading: boolean;
  loadingImport: boolean;
  error: string | null;

  // Pagination
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Filtres
  filtres: FiltresSemaines;
  setFiltres: (filtres: Partial<FiltresSemaines>) => void;
  clearFiltres: () => void;

  // Tri
  sort: SemaineSortField;
  order: 'asc' | 'desc';
  setSort: (field: SemaineSortField, order?: 'asc' | 'desc') => void;

  // Recherche
  recherche: string;
  setRecherche: (terme: string) => void;

  // Actions
  fetchSemaines: () => Promise<void>;
  importSemaines: (file: File) => Promise<boolean>;
  loadDefaultSemaines: () => Promise<boolean>;
  exportSemaines: () => Promise<void>;
  deleteSemaine: (id: number) => Promise<boolean>;
}

/**
 * Hook useSemaines
 * Gère toute la logique de chargement et manipulation des semaines
 */
export const useSemaines = (
  options: UseSemainesOptions = {}
): UseSemainesReturn => {
  const {
    initialPage = 1,
    initialLimit = 52,
    initialSort = 'Numero_semaine',
    initialOrder = 'asc',
  } = options;

  // États de données
  const [semaines, setSemaines] = useState<Semaine[]>([]);

  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  // Filtres
  const [filtres, setFiltresState] = useState<FiltresSemaines>({});

  // Tri
  const [sort, setSort] = useState<SemaineSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Recherche
  const [recherche, setRecherche] = useState('');

  /**
   * Charger la liste des semaines
   */
  const fetchSemaines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await semainesApi.getList({
        page,
        limit,
        sort,
        order,
        ...filtres,
        recherche: recherche || undefined,
      });

      if (response.data.success && response.data.data) {
        const { data, total } = response.data.data;
        setSemaines(data || []);
        setTotal(total || 0);
        console.log(`✅ ${(data || []).length} semaines chargées`);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement semaines:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, filtres, recherche]);

  /**
   * Importer des semaines via fichier
   */
  const handleImportSemaines = useCallback(async (file: File) => {
    setLoadingImport(true);
    const toastId = showToast.loading('Import des semaines en cours...');

    try {
      const response = await semainesApi.import(file);

      if (response.data.success) {
        const count = response.data.data?.count || 0;
        showToast.update(
          toastId,
          `${count} semaine${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''} avec succès`,
          'success'
        );
        console.log(`✅ ${count} semaines importées`);
        setPage(1);
        await fetchSemaines();
        return true;
      } else {
        throw new Error(response.data.data?.message || 'Erreur lors de l\'import');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur lors de l\'import';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur import:', err);
      return false;
    } finally {
      setLoadingImport(false);
    }
  }, [fetchSemaines]);

  /**
   * Charger les 52 semaines par défaut
   */
  const handleLoadDefaultSemaines = useCallback(async () => {
    setLoadingImport(true);
    const toastId = showToast.loading('Chargement des 52 semaines (2026)...');

    try {
      const response = await semainesApi.loadDefault();

      if (response.data.success) {
        const count = response.data.data?.count || 0;
        showToast.update(
          toastId,
          `${count} semaines chargées avec succès`,
          'success'
        );
        console.log(`✅ ${count} semaines chargées par défaut`);
        setPage(1);
        await fetchSemaines();
        return true;
      } else {
        throw new Error(response.data.data?.message || 'Erreur lors du chargement');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur chargement par défaut:', err);
      return false;
    } finally {
      setLoadingImport(false);
    }
  }, [fetchSemaines]);

  /**
   * Exporter les semaines
   */
  const handleExportSemaines = useCallback(async () => {
    const toastId = showToast.loading('Export des semaines...');

    try {
      const response = await semainesApi.exportExcel(filtres);
      const blob = (response as any).data ?? response;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `semaines_2026_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast.update(toastId, 'Export réussi', 'success');
      console.log('✅ Semaines exportées');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur export:', err);
    }
  }, [filtres]);

  /**
   * Supprimer une semaine
   */
  const handleDeleteSemaine = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      const response = await semainesApi.delete(id);

      if (response.data.success) {
        showToast.update(toastId, 'Semaine supprimée', 'success');
        console.log('✅ Semaine supprimée');
        await fetchSemaines();
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur suppression:', err);
    }
    return false;
  }, [fetchSemaines]);

  /**
   * Mettre à jour les filtres
   */
  const setFiltres = useCallback((newFiltres: Partial<FiltresSemaines>) => {
    setFiltresState(prev => ({ ...prev, ...newFiltres }));
    setPage(1);
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setRecherche('');
    setPage(1);
  }, []);

  /**
   * Changer le tri
   */
  const handleSetSort = useCallback((field: SemaineSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  /**
   * Charger les semaines quand les paramètres changent
   */
  useEffect(() => {
    fetchSemaines();
  }, [fetchSemaines]);

  return {
    semaines,
    loading,
    loadingImport,
    error,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    setPage,
    setLimit,
    filtres,
    setFiltres,
    clearFiltres,
    sort,
    order,
    setSort: handleSetSort,
    recherche,
    setRecherche,
    fetchSemaines,
    importSemaines: handleImportSemaines,
    loadDefaultSemaines: handleLoadDefaultSemaines,
    exportSemaines: handleExportSemaines,
    deleteSemaine: handleDeleteSemaine,
  };
};

export default useSemaines;
