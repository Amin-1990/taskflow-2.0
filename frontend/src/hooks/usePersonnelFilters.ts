/**
 * Hook pour gérer les filtres de personnel
 */

import { useMemo, useState, useCallback } from 'react';
import type { Personnel, PersonnelFilters } from '../types/personnel.types';

interface UsePersonnelFiltersReturn {
  filters: PersonnelFilters;
  setFilters: (filters: PersonnelFilters) => void;
  updateFilter: (key: keyof PersonnelFilters, value: any) => void;
  filtered: Personnel[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export const usePersonnelFilters = (
  personnels: Personnel[]
): UsePersonnelFiltersReturn => {
  const [filters, setFilters] = useState<PersonnelFilters>({});

  const updateFilter = useCallback((key: keyof PersonnelFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filtered = useMemo(() => {
    return personnels.filter(p => {
      // Filtre par recherche textuelle
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchSearch = 
          p.Nom_prenom?.toLowerCase().includes(query) ||
          p.Matricule?.toLowerCase().includes(query) ||
          p.Email?.toLowerCase().includes(query) ||
          p.Telephone?.includes(filters.search);
        
        if (!matchSearch) return false;
      }

      // Filtre par statut
      if (filters.statut && p.Statut !== filters.statut) return false;

      // Filtre par poste
      if (filters.poste && p.Poste !== filters.poste) return false;

      // Filtre par site
      if (filters.site && p.Site_affectation !== filters.site) return false;

      // Filtre par type de contrat
      if (filters.type_contrat && p.Type_contrat !== filters.type_contrat) return false;

      // Filtre par date d'embauche (min)
      if (filters.dateEmbaucheMin) {
        if (new Date(p.Date_embauche) < new Date(filters.dateEmbaucheMin)) {
          return false;
        }
      }

      // Filtre par date d'embauche (max)
      if (filters.dateEmbaucheMax) {
        if (new Date(p.Date_embauche) > new Date(filters.dateEmbaucheMax)) {
          return false;
        }
      }

      return true;
    });
  }, [personnels, filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== undefined && v !== null && v !== '');
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    filtered,
    clearFilters,
    hasActiveFilters,
  };
};
