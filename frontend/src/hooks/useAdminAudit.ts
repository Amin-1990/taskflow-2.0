import { useState, useEffect, useCallback } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminAuditLog, AdminListQuery } from '../types/admin.types';

interface UseAdminAuditReturn {
  logs: AdminAuditLog[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  filters: {
    period: 'today' | 'week' | 'month';
    userId: number | null;
    module: string;
    actionType: 'all' | 'accorded' | 'revoked';
  };
  setPage: (page: number) => void;
  setFilters: (filters: Partial<UseAdminAuditReturn['filters']>) => void;
  refresh: () => Promise<void>;
}

export const useAdminAudit = (): UseAdminAuditReturn => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterDebounceTimer, setFilterDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFiltersState] = useState({
    period: 'week' as const,
    userId: null as number | null,
    module: '',
    actionType: 'all' as const
  });

  const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from: string;

    switch (period) {
      case 'today':
        from = to;
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        from = monthAgo.toISOString().split('T')[0];
        break;
      default:
        from = to;
    }

    return { from, to };
  };

  const loadLogs = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);

      const { from, to } = getDateRange(filters.period);
      const params: AdminListQuery = {
        page: currentPage,
        limit,
        from,
        to,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.module && { table: filters.module })
      };

      const res = await adminApi.listAudit(params);
      if (res.data?.data) {
        let logsData = Array.isArray(res.data.data) ? res.data.data : [];

        // Filtrer par type d'action
        if (filters.actionType !== 'all') {
          logsData = logsData.filter((log) => {
            const actionType: string = filters.actionType;
            if (actionType === 'accorded') {
              return log.Nouvelle_valeur?.includes('1') || log.Action?.toLowerCase().includes('accordée');
            } else if (actionType === 'revoked') {
              return log.Nouvelle_valeur?.includes('0') || log.Action?.toLowerCase().includes('révoquée');
            }
            return true;
          });
        }

        setLogs(logsData);
        setTotal(res.data.pagination?.total || logsData.length);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du journal');
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  // Charge initialement
  useEffect(() => {
    loadLogs(page);
  }, []);

  // Changement de page
  useEffect(() => {
    loadLogs(page);
  }, [page]);

  // Changement de filtres
  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setPage(1);

    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
    }

    const timer = setTimeout(() => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      loadLogs(1);
    }, 200);

    setFilterDebounceTimer(timer);
  }, [filterDebounceTimer, loadLogs]);

  return {
    logs,
    loading,
    error,
    page,
    limit,
    total,
    filters,
    setPage,
    setFilters,
    refresh: () => loadLogs(page)
  };
};
