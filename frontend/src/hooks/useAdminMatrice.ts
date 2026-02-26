import { useState, useEffect, useCallback } from 'preact/hooks';
import { adminApi } from '../api/admin';
import type { AdminUser, AdminPermission } from '../types/admin.types';
import { showToast } from '../utils/toast';

interface MatriceValue {
  userId: number;
  permissionId: number;
  valeur: number;
}

interface UseAdminMatriceReturn {
  users: AdminUser[];
  permissions: AdminPermission[];
  values: Map<string, number>; // clé: `${userId}-${permissionId}`
  loading: boolean;
  error: string | null;
  togglePermission: (userId: number, permissionId: number, newValue: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAdminMatrice = (): UseAdminMatriceReturn => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [values, setValues] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminApi.getMatrice();
      if (res.data?.data) {
        const { users: usersData, permissions: permsData, values: valuesData } = res.data.data;

        setUsers(usersData || []);
        setPermissions(permsData || []);

        // Créer la map des valeurs
        const valueMap = new Map<string, number>();
        if (Array.isArray(valuesData)) {
          valuesData.forEach((v: MatriceValue) => {
            valueMap.set(`${v.userId}-${v.permissionId}`, v.valeur);
          });
        }
        setValues(valueMap);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la matrice');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePermission = useCallback(async (userId: number, permissionId: number, newValue: number) => {
    const key = `${userId}-${permissionId}`;
    const oldValue = values.get(key) || 0;

    // Optimistic update
    const newMap = new Map(values);
    newMap.set(key, newValue);
    setValues(newMap);

    try {
      await adminApi.updateMatrice({
        userId,
        permissionId,
        valeur: newValue
      } as any);
    } catch (err: any) {
      // Revert on error
      const revertMap = new Map(values);
      if (oldValue === 0) {
        revertMap.delete(key);
      } else {
        revertMap.set(key, oldValue);
      }
      setValues(revertMap);
      showToast.error(err.message || 'Erreur mise à jour');
      throw err;
    }
  }, [values]);

  return {
    users,
    permissions,
    values,
    loading,
    error,
    togglePermission,
    refresh: loadData
  };
};
