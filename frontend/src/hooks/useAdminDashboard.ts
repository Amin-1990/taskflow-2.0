import { useState, useEffect } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminDashboard, AdminAuditLog } from '../types/admin.types';

interface UseAdminDashboardReturn {
  data: AdminDashboard | null;
  logs: AdminAuditLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAdminDashboard = (): UseAdminDashboardReturn => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le dashboard
      const dashboardRes = await adminApi.getDashboard();
      if (dashboardRes.data?.data) {
        setData(dashboardRes.data.data);
      }

      // Charger les logs d'audit (derniers 10)
      const auditRes = await adminApi.listAudit({ limit: 10 });
      if (auditRes.data?.data) {
        setLogs(auditRes.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    logs,
    loading,
    error,
    refresh: loadData
  };
};
