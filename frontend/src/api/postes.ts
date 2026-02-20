import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';

export interface Poste {
  ID: number;
  Description: string;
}

export const postesApi = {
  getAll: () => api.get<ApiResponse<Poste[]>>('/postes'),
};

export default postesApi;
