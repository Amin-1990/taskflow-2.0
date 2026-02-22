/**
 * Hook personnalise pour gerer les interventions
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import * as maintenanceApi from '../api/maintenance';
import { showToast } from '../utils/toast';
import type {
  Intervention,
  Machine,
  TypeMachine,
  FiltresInterventions,
  InterventionSortField,
  CreateInterventionDto,
  UpdateInterventionDto,
} from '../types/maintenance.types';

export interface UseInterventionsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: InterventionSortField;
  initialOrder?: 'asc' | 'desc';
}

interface UseInterventionsReturn {
  interventions: Intervention[];
  interventionDetail: Intervention | null;
  machines: Machine[];
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

  filtres: FiltresInterventions;
  setFiltres: (filtres: Partial<FiltresInterventions>) => void;
  clearFiltres: () => void;

  sort: InterventionSortField;
  order: 'asc' | 'desc';
  setSort: (field: InterventionSortField, order?: 'asc' | 'desc') => void;

  recherche: string;
  setRecherche: (terme: string) => void;

  fetchInterventions: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  createIntervention: (data: CreateInterventionDto) => Promise<Intervention | null>;
  updateIntervention: (id: number, data: UpdateInterventionDto) => Promise<Intervention | null>;
  deleteIntervention: (id: number) => Promise<boolean>;
  updateStatut: (id: number, statut: string) => Promise<boolean>;
}

const mapPriorite = (raw: any): string => {
  const value = String(raw || '').trim().toUpperCase();
  if (value === 'URGENTE') return 'urgente';
  if (value === 'HAUTE') return 'haute';
  if (value === 'BASSE') return 'basse';
  return 'normale';
};

const mapStatut = (raw: any): string => {
  const value = String(raw || '').trim().toUpperCase();
  if (value === 'AFFECTEE') return 'affectee';
  if (value === 'EN_COURS') return 'en_cours';
  if (value === 'TERMINEE') return 'terminee';
  if (value === 'ANNULEE') return 'annulee';
  return 'ouverte';
};

const toIntervention = (raw: any): Intervention => {
  const id = Number(raw?.ID ?? raw?.id ?? 0);
  const description = String(raw?.Description_panne ?? raw?.description ?? '').trim();
  const machineCode = String(raw?.Code_interne ?? raw?.machine_code ?? '').trim();
  const machineNom = String(raw?.Nom_machine ?? raw?.machine_nom ?? '').trim();

  return {
    ...raw,
    ID: id,
    id,
    ID_Type_machine: Number(raw?.ID_Type_machine ?? 0),
    Type_machine: raw?.Type_machine || undefined,
    ID_Machine: Number(raw?.ID_Machine ?? 0),
    machine_id: Number(raw?.ID_Machine ?? 0),
    machine_code: machineCode,
    machine_nom: machineNom,
    Nom_machine: machineNom,
    Code_interne: machineCode,
    Description_panne: description,
    description,
    Priorite: String(raw?.Priorite || 'NORMALE'),
    priorite: mapPriorite(raw?.Priorite),
    Statut: String(raw?.Statut || 'EN_ATTENTE'),
    statut: mapStatut(raw?.Statut),
    Demandeur: Number(raw?.Demandeur ?? 0),
    Demandeur_nom: raw?.Demandeur_nom || undefined,
    technicien_nom: raw?.Technicien_nom || undefined,
    Technicien_nom: raw?.Technicien_nom || undefined,
    numero: `INT-${id}`,
    titre: description.slice(0, 80) || 'Intervention',
    date_creation: raw?.Date_creation || raw?.Date_heure_demande || new Date().toISOString(),
  } as Intervention;
};

export const useInterventions = (
  options: UseInterventionsOptions = {}
): UseInterventionsReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'date_creation',
    initialOrder = 'desc',
  } = options;

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [interventionDetail, setInterventionDetail] = useState<Intervention | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineTypes, setMachineTypes] = useState<TypeMachine[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const [filtres, setFiltresState] = useState<FiltresInterventions>({});

  const [sort, setSort] = useState<InterventionSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  const [recherche, setRecherche] = useState('');

  const fetchInterventions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await maintenanceApi.getInterventions(
        { ...filtres, recherche: recherche || undefined },
        page,
        limit
      );

      const rows = Array.isArray(response.data) ? response.data.map((row: any) => toIntervention(row)) : [];

      const filtered = rows.filter((item) => {
        const q = recherche.trim().toLowerCase();
        if (!q) return true;
        return (
          String(item.numero || '').toLowerCase().includes(q)
          || String(item.machine_code || '').toLowerCase().includes(q)
          || String(item.machine_nom || '').toLowerCase().includes(q)
          || String(item.Description_panne || '').toLowerCase().includes(q)
          || String(item.Type_machine || '').toLowerCase().includes(q)
        );
      });

      const computedPages = Math.max(1, Math.ceil(filtered.length / limit));
      if (page > computedPages) {
        setPage(computedPages);
        setLoading(false);
        return;
      }

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      setInterventions(paged);
      setTotal(filtered.length);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filtres, recherche]);

  const fetchLists = useCallback(async () => {
    try {
      const [machinesResponse, typesResponse] = await Promise.all([
        maintenanceApi.getMachines({}, 1, 1000),
        maintenanceApi.getMachineTypes(),
      ]);
      setMachines(Array.isArray(machinesResponse.data) ? machinesResponse.data : []);
      setMachineTypes(Array.isArray(typesResponse) ? typesResponse : []);
    } catch (err) {
      console.error('Erreur chargement listes interventions:', err);
    }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await maintenanceApi.getInterventionById(id);
      const raw = (response as any)?.data || response;
      setInterventionDetail(toIntervention(raw));
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const createIntervention = useCallback(async (data: CreateInterventionDto) => {
    const toastId = showToast.loading('Creation de intervention...');

    try {
      const response: any = await maintenanceApi.createIntervention(data);
      showToast.update(toastId, 'Intervention creee', 'success');
      setPage(1);
      await fetchInterventions();
      return toIntervention(response?.data || response || {});
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
    }
    return null;
  }, [fetchInterventions]);

  const updateIntervention = useCallback(async (id: number, data: UpdateInterventionDto) => {
    const toastId = showToast.loading('Mise a jour...');

    try {
      const response: any = await maintenanceApi.updateIntervention(id, data);
      showToast.update(toastId, 'Intervention mise a jour', 'success');
      await fetchInterventions();
      return toIntervention(response?.data || response || {});
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
    }
    return null;
  }, [fetchInterventions]);

  const deleteIntervention = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      await maintenanceApi.deleteIntervention(id);
      showToast.update(toastId, 'Intervention supprimee', 'success');
      await fetchInterventions();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
    }
    return false;
  }, [fetchInterventions]);

  const updateInterventionStatut = useCallback(async (id: number, statut: string) => {
    try {
      await maintenanceApi.changeInterventionStatut(id, statut);
      showToast.success('Statut mis a jour');
      await fetchInterventions();
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      showToast.error(errorMsg);
    }
    return false;
  }, [fetchInterventions]);

  const setFiltres = useCallback((newFiltres: Partial<FiltresInterventions>) => {
    setFiltresState((prev) => ({ ...prev, ...newFiltres }));
    setPage(1);
  }, []);

  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setPage(1);
  }, []);

  const handleSetSort = useCallback((field: InterventionSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return {
    interventions,
    interventionDetail,
    machines,
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
    fetchInterventions,
    fetchDetail,
    createIntervention,
    updateIntervention,
    deleteIntervention,
    updateStatut: updateInterventionStatut,
  };
};

export default useInterventions;
