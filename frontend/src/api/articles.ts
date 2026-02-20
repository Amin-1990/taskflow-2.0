/**
 * API des articles
 * CRUD complet et utilitaires pour la gestion des articles
 */

import { api } from '../services/api';
import type { ApiResponse, PaginationParams } from '../types/api.types';

// Types articles
export type ArticleStatut = 'nouveau' | 'passage de révision' | 'normale' | 'obsolète';

export const ARTICLE_STATUT_OPTIONS: ArticleStatut[] = [
  'nouveau',
  'passage de révision',
  'normale',
  'obsolète',
];

export interface Article {
  ID: number;
  Code_article: string;
  Client: string | null;
  Temps_theorique: number | null;
  Temps_reel: number | null;
  Indice_revision: number | null;
  Date_revision: string | null;
  Nombre_postes: number | null;
  Lien_dossier_client: string | null;
  Lien_photo: string | null;
  Lien_dossier_technique: string | null;
  Ctrl_elect_disponible: number;
  Commentaire: string | null;
  valide: boolean;
  statut: ArticleStatut;
  Date_creation: string;
  Date_modification: string;
}

export interface CreateArticleDto {
  Code_article: string;
  Client?: string;
  Temps_theorique?: number;
  Temps_reel?: number;
  Indice_revision?: number;
  Date_revision?: string;
  Nombre_postes?: number;
  Lien_dossier_client?: string;
  Lien_photo?: string;
  Lien_dossier_technique?: string;
  Ctrl_elect_disponible?: number;
  Commentaire?: string;
  valide?: boolean;
  statut?: ArticleStatut;
}

export interface UpdateArticleDto extends CreateArticleDto {}

export interface ArticlesListResponse {
  data: Article[];
  total: number;
  page: number;
  pages: number;
}

export interface FiltresArticles {
  statut?: ArticleStatut;
  client?: string;
  valide?: boolean;
  search?: string;
}

/**
 * Service API des articles
 * Regroupe toutes les opérations sur les articles
 */
export const articlesApi = {
  ensureValidId: (id: number) => {
    if (!Number.isFinite(id) || id <= 0) {
      throw { success: false, error: 'ID article invalide' };
    }
  },
  /**
   * Récupérer la liste des articles avec pagination et filtres
   * @param params - Paramètres de pagination et filtres
   * @returns Liste paginée des articles
   */
  getList: (params?: PaginationParams & FiltresArticles) =>
    api.get<ApiResponse<ArticlesListResponse>>('/articles', { params }),

  /**
   * Récupérer les détails d'un article
   * @param id - ID de l'article
   * @returns Détails complets de l'article
   */
  getById: (id: number) =>
    (articlesApi.ensureValidId(id), api.get<ApiResponse<Article>>(`/articles/${id}`)),

  /**
   * Créer un nouvel article
   * @param data - Données du nouvel article
   * @returns Article créé avec son ID
   */
  create: (data: CreateArticleDto) =>
    api.post<ApiResponse<Article>>('/articles', data),

  /**
   * Mettre à jour un article existant
   * @param id - ID de l'article
   * @param data - Données à mettre à jour
   * @returns Article mise à jour
   */
  update: (id: number, data: UpdateArticleDto) =>
    (articlesApi.ensureValidId(id), api.put<ApiResponse<Article>>(`/articles/${id}`, data)),

  /**
   * Supprimer un article
   * @param id - ID de l'article
   * @returns Confirmation de suppression
   */
  delete: (id: number) =>
    (articlesApi.ensureValidId(id), api.delete<ApiResponse<{ message: string }>>(`/articles/${id}`)),

  /**
   * Récupérer les articles par statut
   * @param statut - Statut à filtrer
   * @returns Articles du statut spécifié
   */
  getByStatut: (statut: ArticleStatut) =>
    api.get<ApiResponse<Article[]>>(`/articles/statut/${encodeURIComponent(statut)}`),

  /**
   * Récupérer les articles par client
   * @param client - Client à filtrer
   * @returns Articles du client spécifié
   */
  getByClient: (client: string) =>
    api.get<ApiResponse<Article[]>>('/articles/client', {
      params: { client }
    }),

  /**
   * Valider/Invalider un article
   * @param id - ID de l'article
   * @param valide - Valeur de validation
   * @returns Article mis à jour
   */
  toggleValide: (id: number, valide: boolean) =>
    (articlesApi.ensureValidId(id), api.patch<ApiResponse<Article>>(`/articles/${id}/valider`, { valide })),

  /**
   * Exporter les articles en CSV
   * @param params - Paramètres de filtrage (optionnel)
   * @returns Fichier CSV en blob
   */
  exportCSV: (params?: FiltresArticles) =>
    api.get<Blob>('/articles/export/csv', {
      params,
      responseType: 'blob'
    } as any),

  /**
   * Obtenir le template d'import pour les articles
   * @returns Fichier Excel template
   */
  getTemplateImport: () =>
    api.get<Blob>('/import/template/articles', {
      responseType: 'blob'
    } as any),

  /**
   * Importer des articles depuis un fichier Excel
   * @param file - Fichier Excel à importer
   * @returns Résultat de l'import
   */
  importArticles: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/articles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Export nommé pour utilisation directe
export const {
  getList,
  getById,
  create,
  update,
  delete: deleteArticle,
  getByStatut,
  getByClient,
  toggleValide,
  exportCSV,
  getTemplateImport,
  importArticles,
} = articlesApi;

export default articlesApi;
