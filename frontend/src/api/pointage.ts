import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type {
  PointageAbsencePayload,
  PointageAjustementPayload,
  PointageArriveePayload,
  PointageDepartPayload,
  PointagePeriodeResponse,
  PointageRow,
} from '../types/pointage.types';

export const pointageApi = {
  getByPeriode: (debut: string, fin: string, personnelId?: number) =>
    api.get<PointagePeriodeResponse>('/pointage/periode', {
      params: {
        debut,
        fin,
        ...(personnelId ? { personnelId } : {}),
      },
    }),

  pointerArrivee: (payload: PointageArriveePayload) =>
    api.post<ApiResponse<PointageRow>>('/pointage/arrivee', payload),

  pointerDepart: (payload: PointageDepartPayload) =>
    api.post<ApiResponse<PointageRow>>('/pointage/depart', payload),

  signalerAbsent: (payload: PointageAbsencePayload) =>
    api.post<ApiResponse<PointageRow>>('/pointage/absent', payload),

  ajusterPointage: (payload: PointageAjustementPayload) =>
    api.post<ApiResponse<PointageRow>>('/pointage/ajuster', payload),

  validerPointage: (id: number) =>
    api.patch<ApiResponse<PointageRow>>(`/pointage/${id}/valider`),

  exportPointage: (debut: string, fin: string) =>
    api.get<Blob>('/export/pointage', {
      params: { debut, fin },
      responseType: 'blob',
    }),

  getTemplateImport: () =>
    api.get<Blob>('/import/template/pointage', { responseType: 'blob' }),

  importFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/pointage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default pointageApi;
