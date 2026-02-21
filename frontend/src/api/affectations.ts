/**
 * API des affectations - Suivi du temps
 */

import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type {
  Affectation,
  AffectationFilters,
  CreateAffectationPayload,
  UpdateAffectationPayload,
} from '../types/affectations.types';

type TerminerAffectationResponse = {
  affectation: Affectation;
  commandeTerminee?: unknown;
};

const cleanParams = (filters: Partial<AffectationFilters>) => {
  const params: Record<string, string | number | boolean> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number | boolean;
    }
  });

  return params;
};

export const affectationsApi = {
  getList: (params: AffectationFilters) =>
    api.get<ApiResponse<Affectation[]>>('/affectations', {
      params: cleanParams(params),
    }),

  create: (payload: CreateAffectationPayload) =>
    api.post<ApiResponse<Affectation>>('/affectations', payload),

  update: (id: number, payload: UpdateAffectationPayload) =>
    api.patch<ApiResponse<Affectation>>(`/affectations/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/affectations/${id}`),

  terminerAffectation: (id: number, quantite_produite: number) =>
    api.patch<ApiResponse<TerminerAffectationResponse>>(
      `/affectations/${id}/terminer`,
      { quantite_produite }
    ),

  ajouterHeuresSupp: (id: number, heures: number) =>
    api.patch<ApiResponse<Affectation>>(`/affectations/${id}/heures-supp`, {
      heures,
    }),

  getTemplateImport: () =>
    api.get<Blob>('/import/template/affectations', {
      responseType: 'blob',
    }),

  importFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/affectations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const { getList, create, update, delete: deleteAffectation, terminerAffectation, ajouterHeuresSupp } = affectationsApi;

export default affectationsApi;
