import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { DefautProduit, DefautProcess } from '../types/qualite.types';

export interface DefautsListResponse<T> {
  data: T[];
  count: number;
}

export interface CreateDefautProduitDto {
  Code_defaut: string;
  Description: string;
  Cout_min?: number | null;
  Commentaire?: string | null;
}

export interface CreateDefautProcessDto {
  ID_Article: number;
  Code_article: string;
  Code_defaut: string;
  Description_defaut: string;
  ID_Poste?: number | null;
  Gravite?: 'Mineure' | 'Majeure' | 'Critique' | 'Bloquante';
  Quantite_concernee?: number;
  Impact_production?: number | null;
  Commentaire?: string | null;
}

export const qualiteApi = {
  getDefautsProduit: () =>
    api.get<ApiResponse<DefautProduit[]>>('/defauts-produit'),

  createDefautProduit: (payload: CreateDefautProduitDto) =>
    api.post<ApiResponse<DefautProduit>>('/defauts-produit', payload),

  updateDefautProduit: (id: number, payload: CreateDefautProduitDto) =>
    api.put<ApiResponse<DefautProduit>>(`/defauts-produit/${id}`, payload),

  deleteDefautProduit: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/defauts-produit/${id}`),

  exportDefautsProduitXlsx: () =>
    api.get<Blob>('/defauts-produit/export/xlsx', { responseType: 'blob' }),

  getTemplateDefautsProduit: () =>
    api.get<Blob>('/import/template/defauts-produit', { responseType: 'blob' }),

  importDefautsProduit: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/defauts-produit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getDefautsProcess: () =>
    api.get<ApiResponse<DefautProcess[]>>('/defauts-process'),

  createDefautProcess: (payload: CreateDefautProcessDto) =>
    api.post<ApiResponse<DefautProcess>>('/defauts-process', payload),

  updateDefautProcess: (id: number, payload: Partial<CreateDefautProcessDto>) =>
    api.put<ApiResponse<DefautProcess>>(`/defauts-process/${id}`, payload),

  deleteDefautProcess: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/defauts-process/${id}`),

  exportDefautsProcessXlsx: () =>
    api.get<Blob>('/defauts-process/export/xlsx', { responseType: 'blob' }),

  getTemplateDefautsProcess: () =>
    api.get<Blob>('/import/template/defauts-process', { responseType: 'blob' }),

  importDefautsProcess: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/defauts-process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default qualiteApi;
