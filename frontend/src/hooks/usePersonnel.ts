/**
 * Hook principal pour la gestion du personnel
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { Personnel, PersonnelStats } from '../types/personnel.types';
import { personnelAPI } from '../api/personnel';

interface UsePersonnelReturn {
  personnels: Personnel[];
  loading: boolean;
  error: string | null;
  getAll: () => Promise<void>;
  getById: (id: number) => Promise<Personnel | null>;
  create: (data: Partial<Personnel>) => Promise<Personnel | null>;
  update: (id: number, data: Partial<Personnel>) => Promise<Personnel | null>;
  delete: (id: number) => Promise<boolean>;
  changeStatut: (id: number, statut: 'actif' | 'inactif') => Promise<Personnel | null>;
  getStats: () => PersonnelStats;
  clearError: () => void;
}

export const usePersonnel = (): UsePersonnelReturn => {
  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await personnelAPI.getAll();
      setPersonnels(data);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors du chargement du personnel';
      setError(message);
      console.error('Erreur getAll:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number): Promise<Personnel | null> => {
    try {
      const data = await personnelAPI.getById(id);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la récupération');
      console.error('Erreur getById:', err);
      return null;
    }
  }, []);

  const create = useCallback(async (data: Partial<Personnel>): Promise<Personnel | null> => {
    try {
      setError(null);
      const result = await personnelAPI.create(data);
      setPersonnels(prev => [...prev, result]);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la création';
      setError(message);
      console.error('Erreur create:', err);
      return null;
    }
  }, []);

  const update = useCallback(async (id: number, data: Partial<Personnel>): Promise<Personnel | null> => {
    try {
      setError(null);
      const result = await personnelAPI.update(id, data);
      setPersonnels(prev =>
        prev.map(p => p.ID === id ? result : p)
      );
      return result;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la modification';
      setError(message);
      console.error('Erreur update:', err);
      return null;
    }
  }, []);

  const delete_ = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await personnelAPI.delete(id);
      setPersonnels(prev => prev.filter(p => p.ID !== id));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la suppression';
      setError(message);
      console.error('Erreur delete:', err);
      return false;
    }
  }, []);

  const changeStatut = useCallback(async (
    id: number,
    statut: 'actif' | 'inactif'
  ): Promise<Personnel | null> => {
    try {
      setError(null);
      const result = await personnelAPI.changeStatut(id, statut);
      setPersonnels(prev =>
        prev.map(p => p.ID === id ? result : p)
      );
      return result;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de statut');
      console.error('Erreur changeStatut:', err);
      return null;
    }
  }, []);

  const getStats = useCallback((): PersonnelStats => {
    const stats: PersonnelStats = {
      totalEmployes: personnels.length,
      actifs: personnels.filter(p => p.Statut === 'actif').length,
      inactifs: personnels.filter(p => p.Statut === 'inactif').length,
      parPoste: {},
      parSite: {},
      parContrat: {},
      averageAnciennete: 0,
    };

    // Par poste
    personnels.forEach(p => {
      stats.parPoste[p.Poste] = (stats.parPoste[p.Poste] || 0) + 1;
      stats.parSite[p.Site_affectation || 'Non assigné'] = 
        (stats.parSite[p.Site_affectation || 'Non assigné'] || 0) + 1;
      stats.parContrat[p.Type_contrat] = (stats.parContrat[p.Type_contrat] || 0) + 1;
    });

    // Ancienneté moyenne en mois
    if (personnels.length > 0) {
      const totalMonths = personnels.reduce((sum, p) => {
        const date = new Date(p.Date_embauche);
        const months = (new Date().getFullYear() - date.getFullYear()) * 12 +
                      (new Date().getMonth() - date.getMonth());
        return sum + months;
      }, 0);
      stats.averageAnciennete = Math.round(totalMonths / personnels.length);
    }

    return stats;
  }, [personnels]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger tous les personnels au montage
  useEffect(() => {
    getAll();
  }, [getAll]);

  return {
    personnels,
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    delete: delete_,
    changeStatut,
    getStats,
    clearError,
  };
};
