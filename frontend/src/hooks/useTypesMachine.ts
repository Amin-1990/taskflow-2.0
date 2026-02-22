import { useCallback, useEffect, useState } from 'preact/hooks';
import type { TypeMachine } from '../types/maintenance.types';
import { showToast } from '../utils/toast';
import typesMachineApi, { type CreateTypeMachineDto, type UpdateTypeMachineDto } from '../api/typesMachine';

interface UseTypesMachineReturn {
  typesMachine: TypeMachine[];
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
  fetchTypesMachine: () => Promise<void>;
  createTypeMachine: (payload: CreateTypeMachineDto) => Promise<boolean>;
  updateTypeMachine: (id: number, payload: UpdateTypeMachineDto) => Promise<boolean>;
  deleteTypeMachine: (id: number) => Promise<boolean>;
}

export const useTypesMachine = (): UseTypesMachineReturn => {
  const [typesMachine, setTypesMachine] = useState<TypeMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [recherche, setRechercheState] = useState('');

  const fetchTypesMachine = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await typesMachineApi.getList();
      const raw = Array.isArray(response.data.data) ? response.data.data : [];
      const filtered = raw.filter((item) =>
        !recherche.trim()
        || item.Type_machine.toLowerCase().includes(recherche.trim().toLowerCase())
      );

      const computedPages = Math.max(1, Math.ceil(filtered.length / limit));
      if (page > computedPages) {
        setPage(computedPages);
        return;
      }

      const start = (page - 1) * limit;
      const end = start + limit;

      setTypesMachine(filtered.slice(start, end));
      setTotal(filtered.length);
      setPages(computedPages);
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors du chargement des types machine';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, [limit, page, recherche]);

  useEffect(() => {
    fetchTypesMachine();
  }, [fetchTypesMachine]);

  const createTypeMachine = useCallback(async (payload: CreateTypeMachineDto): Promise<boolean> => {
    try {
      const response = await typesMachineApi.create(payload);
      if (response.data.success) {
        showToast.success('Type machine cree avec succes');
        setPage(1);
        await fetchTypesMachine();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la creation';
      showToast.error(message);
      return false;
    }
  }, [fetchTypesMachine]);

  const updateTypeMachine = useCallback(async (id: number, payload: UpdateTypeMachineDto): Promise<boolean> => {
    try {
      const response = await typesMachineApi.update(id, payload);
      if (response.data.success) {
        showToast.success('Type machine modifie avec succes');
        await fetchTypesMachine();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la modification';
      showToast.error(message);
      return false;
    }
  }, [fetchTypesMachine]);

  const deleteTypeMachine = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await typesMachineApi.delete(id);
      if (response.data.success) {
        showToast.success('Type machine supprime avec succes');
        await fetchTypesMachine();
        return true;
      }
      return false;
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de la suppression';
      showToast.error(message);
      return false;
    }
  }, [fetchTypesMachine]);

  const setRecherche = useCallback((value: string) => {
    setRechercheState(value);
    setPage(1);
  }, []);

  return {
    typesMachine,
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
    fetchTypesMachine,
    createTypeMachine,
    updateTypeMachine,
    deleteTypeMachine,
  };
};

export default useTypesMachine;
