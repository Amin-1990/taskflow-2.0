import { useCallback, useEffect, useState } from 'preact/hooks';
import { showToast } from '../utils/toast';
import defautsTypeMachineApi, {
  type CreateDefautTypeMachineDto,
  type DefautTypeMachine,
  type UpdateDefautTypeMachineDto
} from '../api/defautsTypeMachine';
import typesMachineApi from '../api/typesMachine';
import type { TypeMachine } from '../types/maintenance.types';

interface UseDefautsTypeMachineReturn {
  defauts: DefautTypeMachine[];
  machineTypes: TypeMachine[];
  selectedTypeMachineId: number | null;
  setSelectedTypeMachineId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  recherche: string;
  setRecherche: (value: string) => void;
  fetchData: () => Promise<void>;
  createDefaut: (payload: CreateDefautTypeMachineDto) => Promise<boolean>;
  updateDefaut: (id: number, payload: UpdateDefautTypeMachineDto) => Promise<boolean>;
  deleteDefaut: (id: number) => Promise<boolean>;
}

export const useDefautsTypeMachine = (): UseDefautsTypeMachineReturn => {
  const [allDefauts, setAllDefauts] = useState<DefautTypeMachine[]>([]);
  const [defauts, setDefauts] = useState<DefautTypeMachine[]>([]);
  const [machineTypes, setMachineTypes] = useState<TypeMachine[]>([]);
  const [selectedTypeMachineId, setSelectedTypeMachineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [recherche, setRechercheState] = useState('');

  const refreshPaged = useCallback((rows: DefautTypeMachine[]) => {
    const filteredByType = selectedTypeMachineId
      ? rows.filter((item) => item.ID_Type_machine === selectedTypeMachineId)
      : rows;
    const filteredBySearch = filteredByType.filter((item) => {
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return item.Code_defaut.toLowerCase().includes(q)
        || item.Nom_defaut.toLowerCase().includes(q)
        || (item.Description_defaut || '').toLowerCase().includes(q);
    });

    const computedPages = Math.max(1, Math.ceil(filteredBySearch.length / limit));
    if (page > computedPages) {
      setPage(computedPages);
      return;
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    setTotal(filteredBySearch.length);
    setPages(computedPages);
    setDefauts(filteredBySearch.slice(start, end));
  }, [limit, page, recherche, selectedTypeMachineId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [defautsResponse, typesResponse] = await Promise.all([
        defautsTypeMachineApi.getList(),
        typesMachineApi.getList()
      ]);

      const nextDefauts = Array.isArray(defautsResponse.data.data) ? defautsResponse.data.data : [];
      const nextTypes = Array.isArray(typesResponse.data.data) ? typesResponse.data.data : [];

      setAllDefauts(nextDefauts);
      setMachineTypes(nextTypes);
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors du chargement des defauts type machine';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeMachineId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    refreshPaged(allDefauts);
  }, [allDefauts, limit, page, recherche, selectedTypeMachineId, refreshPaged]);

  const createDefaut = useCallback(async (payload: CreateDefautTypeMachineDto): Promise<boolean> => {
    try {
      const response = await defautsTypeMachineApi.create(payload);
      if (response.data.success) {
        showToast.success('Defaut cree avec succes');
        await fetchData();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la creation';
      showToast.error(message);
      return false;
    }
  }, [fetchData]);

  const updateDefaut = useCallback(async (id: number, payload: UpdateDefautTypeMachineDto): Promise<boolean> => {
    try {
      const response = await defautsTypeMachineApi.update(id, payload);
      if (response.data.success) {
        showToast.success('Defaut modifie avec succes');
        await fetchData();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la modification';
      showToast.error(message);
      return false;
    }
  }, [fetchData]);

  const deleteDefaut = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await defautsTypeMachineApi.delete(id);
      if (response.data.success) {
        showToast.success('Defaut supprime avec succes');
        await fetchData();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la suppression';
      showToast.error(message);
      return false;
    }
  }, [fetchData]);

  const setRecherche = useCallback((value: string) => {
    setRechercheState(value);
    setPage(1);
  }, []);

  return {
    defauts,
    machineTypes,
    selectedTypeMachineId,
    setSelectedTypeMachineId,
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
    fetchData,
    createDefaut,
    updateDefaut,
    deleteDefaut,
  };
};

export default useDefautsTypeMachine;
