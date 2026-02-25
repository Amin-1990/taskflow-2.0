/**
 * API Service pour la gestion du Personnel
 */

import { api as client } from '../services/api';
import type { Personnel, PersonnelFilters } from '../types/personnel.types';

export const personnelAPI = {
  /**
   * Récupération des employés
   */
  getAll: async () => {
    const response = await client.get('/personnel');
    return response.data.data;
  },

  getById: async (id: number): Promise<Personnel> => {
    const response = await client.get(`/personnel/${id}`);
    return response.data.data;
  },

  getByMatricule: async (matricule: string): Promise<Personnel> => {
    const response = await client.get(`/personnel/matricule/${matricule}`);
    return response.data.data;
  },

  /**
   * Filtrage et recherche
   */
  getByStatut: async (statut: 'actif' | 'inactif'): Promise<Personnel[]> => {
    const response = await client.get(`/personnel/statut/${statut}`);
    return response.data.data;
  },

  getByPoste: async (poste: string): Promise<Personnel[]> => {
    const response = await client.get(`/personnel/poste/${poste}`);
    return response.data.data;
  },

  getBySite: async (site: string): Promise<Personnel[]> => {
    const response = await client.get(`/personnel/site/${site}`);
    return response.data.data;
  },

  /**
   * CRUD Operations
   */
  create: async (data: Partial<Personnel>): Promise<Personnel> => {
    const response = await client.post('/personnel', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Personnel>): Promise<Personnel> => {
    const response = await client.put(`/personnel/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/personnel/${id}`);
  },

  /**
   * Actions spéciales
   */
  changeStatut: async (id: number, statut: 'actif' | 'inactif'): Promise<Personnel> => {
    const response = await client.patch(`/personnel/${id}/statut`, { Statut: statut });
    return response.data.data;
  },

  /**
   * Import/Export
   */
  import: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/import/personnel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  export: async (filters?: PersonnelFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await client.get('/personnel/export', {
      params: { ...filters, format },
      responseType: 'blob',
    });
    return response.data;
  },

  getTemplateImport: async (): Promise<Blob> => {
    const response = await client.get('/import/template/personnel', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Utilitaires
   */
  downloadExport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

