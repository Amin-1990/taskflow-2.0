/**
 * Hook personnalisé pour gérer les interventions
 * Chargement, filtrage, pagination et recherche
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import * as maintenanceApi from '../api/maintenance';
import { showToast } from '../utils/toast';
import type {
  Intervention,
  FiltresInterventions,
  InterventionSortField,
  InterventionsListResponse,
  CreateInterventionDto,
  UpdateInterventionDto,
} from '../types/maintenance.types';

/**
 * Options de pagination et tri
 */
export interface UseInterventionsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: InterventionSortField;
  initialOrder?: 'asc' | 'desc';
}

/**
 * Valeur retournée par le hook
 */
interface UseInterventionsReturn {
  // Données
  interventions: Intervention[];
  interventionDetail: Intervention | null;

  // États
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;

  // Pagination
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Filtres
  filtres: FiltresInterventions;
  setFiltres: (filtres: Partial<FiltresInterventions>) => void;
  clearFiltres: () => void;

  // Tri
  sort: InterventionSortField;
  order: 'asc' | 'desc';
  setSort: (field: InterventionSortField, order?: 'asc' | 'desc') => void;

  // Recherche
  recherche: string;
  setRecherche: (terme: string) => void;

  // Actions
  fetchInterventions: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  createIntervention: (data: CreateInterventionDto) => Promise<Intervention | null>;
  updateIntervention: (id: number, data: UpdateInterventionDto) => Promise<Intervention | null>;
  deleteIntervention: (id: number) => Promise<boolean>;
  updateStatut: (id: number, statut: string) => Promise<boolean>;
  assignTechnicien: (id: number, technicienId: number) => Promise<boolean>;
}

/**
 * Hook useInterventions
 * Gère toute la logique de chargement et manipulation des interventions
 */
export const useInterventions = (
  options: UseInterventionsOptions = {}
): UseInterventionsReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'date_creation',
    initialOrder = 'desc',
  } = options;

  // États de données
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [interventionDetail, setInterventionDetail] = useState<Intervention | null>(null);

  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  // Filtres
  const [filtres, setFiltresState] = useState<FiltresInterventions>({});

  // Tri
  const [sort, setSort] = useState<InterventionSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Recherche
  const [recherche, setRecherche] = useState('');

  /**
   * Charger la liste des interventions
   */
  const fetchInterventions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await maintenanceApi.getInterventions(
        { ...filtres, recherche: recherche || undefined },
        page,
        limit
      );

      setInterventions(response.data || []);
      setTotal(response.total || 0);
      console.log(`✅ ${(response.data || []).length} interventions chargées`);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement interventions:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filtres, recherche]);

  /**
   * Charger les détails d'une intervention
   */
  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await maintenanceApi.getInterventionById(id);
      setInterventionDetail(response);
      console.log(`✅ Détails intervention ${id} chargés`);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement détails:', err);
      showToast.error(errorMsg);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  /**
   * Créer une nouvelle intervention
   */
  const createIntervention = useCallback(async (data: CreateInterventionDto) => {
    const toastId = showToast.loading('Création de l\'intervention...');

    try {
      const response = await maintenanceApi.createIntervention(data);
      showToast.update(toastId, `Intervention créée: ${response.numero}`, 'success');
      console.log('✅ Intervention créée:', response.numero);
      setPage(1);
      await fetchInterventions();
      return { id: response.id } as Intervention;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur création:', err);
    }
    return null;
  }, [fetchInterventions]);

  /**
   * Mettre à jour une intervention
   */
  const updateIntervention = useCallback(async (id: number, data: UpdateInterventionDto) => {
    const toastId = showToast.loading('Mise à jour...');

    try {
      const response = await maintenanceApi.updateIntervention(id, data);
      showToast.update(toastId, 'Intervention mise à jour', 'success');
      console.log('✅ Intervention mise à jour');
      await fetchInterventions();
      if (interventionDetail?.id === id) {
        await fetchDetail(id);
      }
      return { id: response.id } as Intervention;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur mise à jour:', err);
    }
    return null;
  }, [fetchInterventions, interventionDetail?.id, fetchDetail]);

  /**
   * Supprimer une intervention
   */
  const deleteIntervention = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      await maintenanceApi.deleteIntervention(id);
      showToast.update(toastId, 'Intervention supprimée', 'success');
      console.log('✅ Intervention supprimée');
      await fetchInterventions();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur suppression:', err);
    }
    return false;
  }, [fetchInterventions]);

  /**
   * Mettre à jour le statut d'une intervention
   */
  const updateInterventionStatut = useCallback(async (id: number, statut: string) => {
    try {
      await maintenanceApi.changeInterventionStatut(id, statut);
      showToast.success('Statut mis à jour');
      console.log('✅ Statut mise à jour');
      await fetchInterventions();
      if (interventionDetail?.id === id) {
        await fetchDetail(id);
      }
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.error(errorMsg);
      console.error('❌ Erreur mise à jour statut:', err);
    }
    return false;
  }, [fetchInterventions, interventionDetail?.id, fetchDetail]);

  /**
   * Affecter un technicien
   */
  const assignTechnicienAction = useCallback(async (id: number, technicienId: number) => {
    const toastId = showToast.loading('Affectation du technicien...');

    try {
      await maintenanceApi.assignIntervention(id, technicienId);
      showToast.update(toastId, 'Technicien affecté', 'success');
      console.log('✅ Technicien affecté');
      await fetchInterventions();
      if (interventionDetail?.id === id) {
        await fetchDetail(id);
      }
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur affectation:', err);
    }
    return false;
  }, [fetchInterventions, interventionDetail?.id, fetchDetail]);

  /**
   * Mettre à jour les filtres
   */
  const setFiltres = useCallback((newFiltres: Partial<FiltresInterventions>) => {
    setFiltresState(prev => ({ ...prev, ...newFiltres }));
    setPage(1);
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setPage(1);
  }, []);

  /**
   * Changer le tri
   */
  const handleSetSort = useCallback((field: InterventionSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  /**
   * Charger les interventions quand les paramètres changent
   */
  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  return {
    interventions,
    interventionDetail,
    loading,
    loadingDetail,
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
    fetchInterventions,
    fetchDetail,
    createIntervention,
    updateIntervention,
    deleteIntervention,
    updateStatut: updateInterventionStatut,
    assignTechnicien: assignTechnicienAction,
  };
};

export default useInterventions;



