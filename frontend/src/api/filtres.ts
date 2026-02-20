import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';

export interface FiltreSemaine {
  ID: number;
  Annee: number;
  Numero_semaine: number;
  Code_semaine: string;
  Date_debut: string;
  Date_fin: string;
}

export const filtresApi = {
  getUnites: () => api.get<ApiResponse<string[]>>('/filtres/unites'),
  getAnnees: () => api.get<ApiResponse<number[]>>('/filtres/annees'),
  getSemaines: (annee?: number) =>
    api.get<ApiResponse<FiltreSemaine[]>>('/filtres/semaines', {
      params: { annee }
    }),
  getArticles: (search?: string) =>
    api.get<ApiResponse<Array<{ ID: number; Code_article: string; Client: string }>>>('/filtres/articles', {
      params: { search }
    })
};

export default filtresApi;

