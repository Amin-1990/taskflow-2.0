import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';

export interface Poste {
  ID: number;
  Description: string;
}

export interface PostePayload {
  Description: string;
}

export const postesApi = {
  getAll: () => api.get<ApiResponse<Poste[]>>('/postes'),
  getById: (id: number) => api.get<ApiResponse<Poste>>(`/postes/${id}`),
  create: (payload: PostePayload) => api.post<ApiResponse<Poste>>('/postes', payload),
  update: (id: number, payload: PostePayload) => api.put<ApiResponse<Poste>>(`/postes/${id}`, payload),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/postes/${id}`),
};

export default postesApi;
