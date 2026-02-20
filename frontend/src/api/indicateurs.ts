/**
 * API des indicateurs pour le dashboard
 * Basé sur la documentation des endpoints /api/indicateurs/*
 */

import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { 
  Indicateurs, 
  Periode, 
  IndicateursProduction,
  IndicateursMaintenance,
  IndicateursQualite,
  IndicateursRH
} from '../types/dashboard.types';

/**
 * Service des indicateurs
 * Regroupe toutes les fonctions pour récupérer les données du dashboard
 */
export const indicateursApi = {
  /**
   * Récupérer tous les indicateurs
   * @param periode - Période d'analyse (jour/semaine/mois/annee)
   * @returns Tous les indicateurs dashboard
   * 
   * @example
   * const response = await indicateursApi.getAll('jour');
   * const { production, maintenance, qualite, rh } = response.data.data;
   */
  getAll: (periode: Periode = 'jour') =>
    api.get<ApiResponse<Indicateurs>>('/indicateurs', { 
      params: { periode } 
    }),

  /**
   * Récupérer uniquement les indicateurs de production
   * @param periode - Période d'analyse
   */
  getProduction: (periode: Periode = 'jour') =>
    api.get<ApiResponse<IndicateursProduction>>('/indicateurs/production', { 
      params: { periode } 
    }),

  /**
   * Récupérer uniquement les indicateurs de qualité
   * @param periode - Période d'analyse
   */
  getQualite: (periode: Periode = 'jour') =>
    api.get<ApiResponse<IndicateursQualite>>('/indicateurs/qualite', { 
      params: { periode } 
    }),

  /**
   * Récupérer uniquement les indicateurs de maintenance
   * @param periode - Période d'analyse
   */
  getMaintenance: (periode: Periode = 'jour') =>
    api.get<ApiResponse<IndicateursMaintenance>>('/indicateurs/maintenance', { 
      params: { periode } 
    }),

  /**
   * Récupérer uniquement les indicateurs RH
   * @param periode - Période d'analyse
   */
  getRH: (periode: Periode = 'jour') =>
    api.get<ApiResponse<IndicateursRH>>('/indicateurs/rh', { 
      params: { periode } 
    }),

  /**
   * Récupérer les indicateurs pour une date spécifique
   * @param date - Date au format YYYY-MM-DD
   */
  getByDate: (date: string) =>
    api.get<ApiResponse<Indicateurs>>('/indicateurs', { 
      params: { date } 
    }),
};

// Export nommé pour utilisation directe
export const { 
  getAll, 
  getProduction, 
  getQualite, 
  getMaintenance, 
  getRH,
  getByDate
} = indicateursApi;

export default indicateursApi;