/**
 * Hook personnalise pour gerer les machines
 * Chargement, filtrage, pagination et recherche
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import * as maintenanceApi from '../api/maintenance';
import { showToast } from '../utils/toast';
import type {
  Machine,
  MachineDetail,
  TypeMachine,
  FiltresMachines,
  MachineSortField,
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
 * Valeur retournee par le hook
 */
interface UseMachinesReturn {
  machines: Machine[];
  machineDetail: MachineDetail | null;
  machineTypes: TypeMachine[];

  loading: boolean;
  loadingDetail: boolean;
  error: string | null;

  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  filtres: FiltresMachines;
  setFiltres: (filtres: Partial<FiltresMachines>) => void;
  clearFiltres: () => void;

  sort: MachineSortField;
  order: 'asc' | 'desc';
  setSort: (field: MachineSortField, order?: 'asc' | 'desc') => void;

  recherche: string;
  setRecherche: (terme: string) => void;

  fetchMachines: () => Promise<void>;
  fetchMachineTypes: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  createMachine: (data: CreateMachineDto) => Promise<Machine | null>;
  updateMachine: (id: number, data: UpdateMachineDto) => Promise<Machine | null>;
  deleteMachine: (id: number) => Promise<boolean>;
  updateStatut: (id: number, statut: string) => Promise<boolean>;
}

export const useMachines = (
  options: UseMachinesOptions = {}
): UseMachinesReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'code',
    initialOrder = 'asc',
  } = options;

  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineDetail, setMachineDetail] = useState<MachineDetail | null>(null);
  const [machineTypes, setMachineTypes] = useState<TypeMachine[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const [filtres, setFiltresState] = useState<FiltresMachines>({});

  const [sort, setSort] = useState<MachineSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  const [recherche, setRecherche] = useState('');

  const normalizeMachine = useCallback((raw: any): Machine => {
    const id = Number(raw?.ID ?? raw?.id ?? 0);
    const typeMachineId = Number(raw?.Type_machine_id ?? raw?.type_machine_id ?? 0);
    const typeMachine = String(raw?.Type_machine ?? raw?.type ?? '').trim();
    const code = String(raw?.Code_interne ?? raw?.code ?? '').trim();
    const nom = String(raw?.Nom_machine ?? raw?.nom ?? '').trim();
    const localisation = String(raw?.Site_affectation ?? raw?.localisation ?? '').trim();
    const statutRaw = String(raw?.Statut_operationnel ?? raw?.statut ?? '').trim();
    const statut = (statutRaw === 'operationnel' ? 'operationnelle' : statutRaw) as any;

    return {
      ...raw,
      ID: id,
      id,
      Type_machine_id: typeMachineId,
      Type_machine: typeMachine,
      code,
      nom,
      type: typeMachine,
      localisation,
      statut,
      date_installation: raw?.Date_installation ?? raw?.date_installation ?? null,
      date_derniere_maintenance: raw?.Date_derniere_maintenance ?? raw?.date_derniere_maintenance ?? null,
      date_prochaine_maintenance: raw?.Date_prochaine_maintenance ?? raw?.date_prochaine_maintenance ?? null,
      description: raw?.Description ?? raw?.description ?? null,
      numero_serie: raw?.Numero_serie ?? raw?.numero_serie ?? null,
      notes: raw?.Commentaire ?? raw?.notes ?? null,
    } as Machine;
  }, []);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await maintenanceApi.getMachines(
        { ...filtres, recherche: recherche || undefined },
        page,
        limit
      );

      const payload = Array.isArray(response.data) ? response.data : [];
      const normalized = payload.map((row: any) => normalizeMachine(row));

      const filtered = normalized.filter((machine) => {
        const q = recherche.trim().toLowerCase();
        const matchSearch = !q
          || machine.code?.toLowerCase().includes(q)
          || machine.nom?.toLowerCase().includes(q)
          || machine.Type_machine?.toLowerCase().includes(q);

        const matchStatut = !filtres.statut || machine.statut === filtres.statut;
        const matchType = !filtres.Type_machine_id || machine.Type_machine_id === filtres.Type_machine_id;
        const matchLocalisation = !filtres.localisation
          || machine.localisation?.toLowerCase().includes(String(filtres.localisation).toLowerCase());

        return matchSearch && matchStatut && matchType && matchLocalisation;
      });

      const computedPages = Math.max(1, Math.ceil(filtered.length / limit));
      if (page > computedPages) {
        setPage(computedPages);
        setLoading(false);
        return;
      }

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      setMachines(paged);
      setTotal(filtered.length);
      console.log(`Loaded ${paged.length} machines`);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('Erreur chargement machines:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filtres, limit, normalizeMachine, page, recherche]);

  const fetchMachineTypes = useCallback(async () => {
    try {
      const types = await maintenanceApi.getMachineTypes();
      setMachineTypes(Array.isArray(types) ? types : []);
    } catch (err: any) {
      console.error('Erreur chargement types machine:', err);
    }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await maintenanceApi.getMachineById(id);
      const raw = (response as any)?.data || response;
      setMachineDetail(normalizeMachine(raw) as any);
      console.log(`Details machine ${id} charges`);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('Erreur chargement details:', err);
      showToast.error(errorMsg);
    } finally {
      setLoadingDetail(false);
    }
  }, [normalizeMachine]);

  const createMachine = useCallback(async (data: CreateMachineDto) => {
    const toastId = showToast.loading('Creation de la machine...');

    try {
      const response: any = await maintenanceApi.createMachine(data);
      const machine = response?.data || response;
      const code = machine?.Code_interne || machine?.code || '';
      showToast.update(toastId, `Machine creee${code ? `: ${code}` : ''}`, 'success');
      setPage(1);
      await fetchMachines();
      return machine ? normalizeMachine(machine) : ({ id: 0 } as Machine);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('Erreur creation:', err);
    }
    return null;
  }, [fetchMachines, normalizeMachine]);

  const updateMachine = useCallback(async (id: number, data: UpdateMachineDto) => {
    const toastId = showToast.loading('Mise a jour...');

    try {
      const response: any = await maintenanceApi.updateMachine(id, data);
      showToast.update(toastId, 'Machine mise a jour', 'success');
      await fetchMachines();
      return normalizeMachine(response?.data || response);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('Erreur mise a jour:', err);
    }
    return null;
  }, [fetchMachines, normalizeMachine]);

  const deleteMachine = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      await maintenanceApi.deleteMachine(id);
      showToast.update(toastId, 'Machine supprimee', 'success');
      await fetchMachines();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('Erreur suppression:', err);
    }
    return false;
  }, [fetchMachines]);

  const updateMachineStatut = useCallback(async (id: number, statut: string) => {
    try {
      await maintenanceApi.updateMachine(id, { Statut_operationnel: statut as any });
      showToast.success('Statut mis a jour');
      await fetchMachines();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.error(errorMsg);
      console.error('Erreur mise a jour statut:', err);
    }
    return false;
  }, [fetchMachines]);

  const setFiltres = useCallback((newFiltres: Partial<FiltresMachines>) => {
    setFiltresState((prev) => ({ ...prev, ...newFiltres }));
    setPage(1);
  }, []);

  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setPage(1);
  }, []);

  const handleSetSort = useCallback((field: MachineSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  useEffect(() => {
    fetchMachineTypes();
  }, [fetchMachineTypes]);

  return {
    machines,
    machineDetail,
    machineTypes,
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
    fetchMachineTypes,
    fetchDetail,
    createMachine,
    updateMachine,
    deleteMachine,
    updateStatut: updateMachineStatut,
  };
};

export default useMachines;

