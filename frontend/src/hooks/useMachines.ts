/**
 * Hook personnalisé pour gérer les machines
 * Chargement, filtrage, pagination et recherche
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import * as maintenanceApi from '../api/maintenance';
import { showToast } from '../utils/toast';
import type {
  Machine,
  MachineDetail,
  FiltresMachines,
  MachineSortField,
  MachinesListResponse,
  CreateMachineDto,
  UpdateMachineDto,
} from '../types/maintenance.types';

/**
 * Options de pagination et tri
 */
export interface UseMachinesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: MachineSortField;
  initialOrder?: 'asc' | 'desc';
}

/**
 * Valeur retournée par le hook
 */
interface UseMachinesReturn {
  // Données
  machines: Machine[];
  machineDetail: MachineDetail | null;

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
  filtres: FiltresMachines;
  setFiltres: (filtres: Partial<FiltresMachines>) => void;
  clearFiltres: () => void;

  // Tri
  sort: MachineSortField;
  order: 'asc' | 'desc';
  setSort: (field: MachineSortField, order?: 'asc' | 'desc') => void;

  // Recherche
  recherche: string;
  setRecherche: (terme: string) => void;

  // Actions
  fetchMachines: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  createMachine: (data: CreateMachineDto) => Promise<Machine | null>;
  updateMachine: (id: number, data: UpdateMachineDto) => Promise<Machine | null>;
  deleteMachine: (id: number) => Promise<boolean>;
  updateStatut: (id: number, statut: string) => Promise<boolean>;
}

/**
 * Hook useMachines
 * Gère toute la logique de chargement et manipulation des machines
 */
export const useMachines = (
  options: UseMachinesOptions = {}
): UseMachinesReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'code',
    initialOrder = 'asc',
  } = options;

  // États de données
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineDetail, setMachineDetail] = useState<MachineDetail | null>(null);

  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  // Filtres
  const [filtres, setFiltresState] = useState<FiltresMachines>({});

  // Tri
  const [sort, setSort] = useState<MachineSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Recherche
  const [recherche, setRecherche] = useState('');

  /**
   * Charger la liste des machines
   */
  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await maintenanceApi.getMachines(
        { ...filtres, recherche: recherche || undefined },
        page,
        limit
      );

      setMachines(response.data || []);
      setTotal(response.total || 0);
      console.log(`✅ ${(response.data || []).length} machines chargées`);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement machines:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filtres, recherche]);

  /**
   * Charger les détails d'une machine
   */
  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await maintenanceApi.getMachineById(id);
      setMachineDetail(response);
      console.log(`✅ Détails machine ${id} chargés`);
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
   * Créer une nouvelle machine
   */
  const createMachine = useCallback(async (data: CreateMachineDto) => {
    const toastId = showToast.loading('Création de la machine...');

    try {
      const response = await maintenanceApi.createMachine(data);
      showToast.update(toastId, `Machine créée: ${response.code}`, 'success');
      console.log('✅ Machine créée:', response.code);
      setPage(1);
      await fetchMachines();
      return { id: response.id } as Machine;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur création:', err);
    }
    return null;
  }, [fetchMachines]);

  /**
   * Mettre à jour une machine
   */
  const updateMachine = useCallback(async (id: number, data: UpdateMachineDto) => {
    const toastId = showToast.loading('Mise à jour...');

    try {
      const response = await maintenanceApi.updateMachine(id, data);
      showToast.update(toastId, 'Machine mise à jour', 'success');
      console.log('✅ Machine mise à jour');
      await fetchMachines();
      return { id: response.id } as Machine;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur mise à jour:', err);
    }
    return null;
  }, [fetchMachines]);

  /**
   * Supprimer une machine
   */
  const deleteMachine = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      await maintenanceApi.deleteMachine(id);
      showToast.update(toastId, 'Machine supprimée', 'success');
      console.log('✅ Machine supprimée');
      await fetchMachines();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur suppression:', err);
    }
    return false;
  }, [fetchMachines]);

  /**
   * Mettre à jour le statut d'une machine
   */
  const updateMachineStatut = useCallback(async (id: number, statut: string) => {
    try {
      await maintenanceApi.updateMachine(id, { statut: statut as any });
      showToast.success('Statut mis à jour');
      console.log('✅ Statut mise à jour');
      await fetchMachines();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.error(errorMsg);
      console.error('❌ Erreur mise à jour statut:', err);
    }
    return false;
  }, [fetchMachines]);

  /**
   * Mettre à jour les filtres
   */
  const setFiltres = useCallback((newFiltres: Partial<FiltresMachines>) => {
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
  const handleSetSort = useCallback((field: MachineSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  /**
   * Charger les machines quand les paramètres changent
   */
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  return {
    machines,
    machineDetail,
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
    fetchMachines,
    fetchDetail,
    createMachine,
    updateMachine,
    deleteMachine,
    updateStatut: updateMachineStatut,
  };
};

export default useMachines;



