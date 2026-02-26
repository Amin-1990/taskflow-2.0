import { useState, useEffect } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminUserDetail } from '../types/admin.types';

interface UseAdminUserDetailReturn {
  data: AdminUserDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAdminUserDetail = (userId: number): UseAdminUserDetailReturn => {
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminApi.getUserDetail(userId);
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du détail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  return {
    data,
    loading,
    error,
    refresh: loadData
  };
};
