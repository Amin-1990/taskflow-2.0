import { useState, useEffect, useCallback } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminUser, AdminListQuery } from '../types/admin.types';

interface UseAdminUsersReturn {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  search: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  refresh: () => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number, est_actif: boolean, est_verrouille: boolean) => Promise<void>;
}

export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = useCallback(async (currentPage: number, searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const params: AdminListQuery = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm })
      };

      const res = await adminApi.listUsers(params);
      if (res.data?.data) {
        setUsers(Array.isArray(res.data.data) ? res.data.data : []);
        // Calculer le total (supposé être au moins page * limit, à adapter selon la réponse API)
        setTotal(res.data.data?.length === limit ? currentPage * limit + 1 : currentPage * limit);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Charge initialement
  useEffect(() => {
    loadUsers(page, search);
  }, []);

  // Gère le changement de page
  useEffect(() => {
    loadUsers(page, search);
  }, [page]);

  // Gère la recherche avec debounce
  const handleSetSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1);

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      loadUsers(1, searchTerm);
    }, 300);

    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer, loadUsers]);

  const deleteUser = useCallback(async (id: number) => {
    try {
      await adminApi.deleteUser(id);
      await loadUsers(page, search);
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de la suppression');
    }
  }, [page, search, loadUsers]);

  const toggleUserStatus = useCallback(async (id: number, est_actif: boolean, est_verrouille: boolean) => {
    try {
      await adminApi.updateUserStatus(id, { Est_actif: est_actif, Est_verrouille: est_verrouille });
      await loadUsers(page, search);
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de la mise à jour');
    }
  }, [page, search, loadUsers]);

  return {
    users,
    loading,
    error,
    page,
    limit,
    total,
    search,
    setPage,
    setSearch: handleSetSearch,
    refresh: () => loadUsers(page, search),
    deleteUser,
    toggleUserStatus
  };
};
