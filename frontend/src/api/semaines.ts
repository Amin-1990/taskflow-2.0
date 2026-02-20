/**
 * API des semaines
 * CRUD et utilitaires pour la gestion des semaines
 */

import { api } from '../services/api';
import type { ApiResponse, PaginationParams } from '../types/api.types';
import type {
  Semaine,
  CreateSemaineDto,
  SemainesListResponse,
  SemainesImportResponse,
  FiltresSemaines,
} from '../types/semaines.types';

/**
 * Service API des semaines
 * Regroupe toutes les opérations sur les semaines
 */
export const semainesApi = {
  /**
   * Récupérer la liste des semaines avec pagination et filtres
   * @param params - Paramètres de pagination et filtres
   * @returns Liste paginée des semaines
   * 
   * @example
   * const response = await semainesApi.getList({
   *   page: 1,
   *   limit: 52,
   *   annee: 2026
   * });
   */
  getList: (params?: PaginationParams & FiltresSemaines) =>
    api.get<ApiResponse<SemainesListResponse>>('/semaines', { params }),

  /**
   * Récupérer une semaine par ID
   * @param id - ID de la semaine
   * @returns Détails de la semaine
   */
  getById: (id: number) =>
    api.get<ApiResponse<Semaine>>(`/semaines/${id}`),

  /**
   * Créer une nouvelle semaine
   * @param data - Données de la nouvelle semaine
   * @returns Semaine créée
   */
  create: (data: CreateSemaineDto) =>
    api.post<ApiResponse<Semaine>>('/semaines', data),

  /**
   * Mettre à jour une semaine
   * @param id - ID de la semaine
   * @param data - Données à mettre à jour
   * @returns Semaine mise à jour
   */
  update: (id: number, data: Partial<CreateSemaineDto>) =>
    api.put<ApiResponse<Semaine>>(`/semaines/${id}`, data),

  /**
   * Supprimer une semaine
   * @param id - ID de la semaine
   * @returns Confirmation de suppression
   */
  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/semaines/${id}`),

  /**
   * Importer les semaines via fichier Excel/CSV
   * @param file - Fichier Excel ou CSV à importer
   * @returns Résultat de l'import
   * 
   * @example
   * const formData = new FormData();
   * formData.append('file', file);
   * const response = await semainesApi.import(file);
   */
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<SemainesImportResponse>>(
      '/import/semaines',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Charger les 52 semaines par défaut (2026)
   * @returns Résultat du chargement
   */
  loadDefault: () =>
    api.post<ApiResponse<SemainesImportResponse>>(
      '/import/semaines/default',
      {}
    ),

  /**
   * Obtenir un template d'import (Excel)
   * @returns Fichier Excel template en blob
   */
  getTemplate: () =>
    api.get<Blob>('/import/template/semaines', {
      responseType: 'blob',
    } as any),

  /**
   * Récupérer les semaines filtrées par année
   * @param annee - Année à filtrer
   * @returns Liste des semaines de l'année
   */
  getByYear: (annee: number) =>
    api.get<ApiResponse<Semaine[]>>('/semaines', {
      params: { annee },
    }),

  /**
   * Récupérer les semaines filtrées par mois
   * @param annee - Année
   * @param mois - Mois (1-12)
   * @returns Liste des semaines du mois
   */
  getByMonth: (annee: number, mois: number) =>
    api.get<ApiResponse<Semaine[]>>('/semaines', {
      params: { annee, mois },
    }),

  /**
   * Exporter les semaines en Excel
   * @param params - Paramètres de filtrage (optionnel)
   * @returns Fichier Excel en blob
   */
  exportExcel: (params?: FiltresSemaines) =>
    api.get<Blob>('/export/semaines', {
      params,
      responseType: 'blob',
    }),
};

// Export nommé pour utilisation directe
export const {
  getList,
  getById,
  create,
  update,
  delete: deleteSemaine,
  import: importSemaines,
  getByYear,
  getByMonth,
  exportExcel,
  getTemplate,
} = semainesApi;

export default semainesApi;
