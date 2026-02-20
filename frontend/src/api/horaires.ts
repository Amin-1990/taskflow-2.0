import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { Horaire, CreateHoraireDto } from '../types/horaires.types';

export const horairesApi = {
  getAll: () => api.get<ApiResponse<Horaire[]>>('/horaires'),
  getByPeriode: (debut: string, fin: string) =>
    api.get<ApiResponse<Horaire[]>>(`/horaires/periode/${debut}/${fin}`),

  create: (payload: CreateHoraireDto) =>
    api.post<ApiResponse<Horaire>>('/horaires', payload),

  update: (id: number, payload: Partial<CreateHoraireDto>) =>
    api.put<ApiResponse<Horaire>>(`/horaires/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/horaires/${id}`),

  exportXlsx: () =>
    api.get<Blob>('/horaires/export/xlsx', { responseType: 'blob' }),

  getTemplateImport: () =>
    api.get<Blob>('/import/template/horaires', { responseType: 'blob' }),

  importFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/horaires', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default horairesApi;
