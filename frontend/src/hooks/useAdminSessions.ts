import { useState, useEffect, useCallback } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminSession } from '../types/admin.types';

interface UseAdminSessionsReturn {
  sessions: AdminSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  revokeSession: (id: number) => Promise<void>;
}

export const useAdminSessions = (): UseAdminSessionsReturn => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminApi.listSessions({ active: 1 } as any);
      if (res.data?.data) {
        setSessions(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    loadSessions();

    const interval = setInterval(() => {
      loadSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadSessions]);

  const revokeSession = useCallback(async (id: number) => {
    try {
      await adminApi.revokeSession(id);
      // Retirer la session de la liste
      setSessions((prev) => prev.filter((s) => s.ID !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de la révocation');
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    refresh: loadSessions,
    revokeSession
  };
};
