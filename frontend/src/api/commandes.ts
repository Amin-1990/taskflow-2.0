/**
 * API des commandes de production
 * CRUD complet et utilitaires pour la gestion des commandes
 */

import { api } from '../services/api';
import type { ApiResponse, PaginationParams } from '../types/api.types';
import type {
  Commande,
  CommandeDetail,
  CreateCommandeDto,
  UpdateCommandeDto,
  CommandesListResponse,
  Article,
  FiltresCommandes,
  CommandeResponse,
} from '../types/production.types';

/**
 * Service API des commandes
 * Regroupe toutes les opérations sur les commandes
 */
export const commandesApi = {
  /**
   * Récupérer la liste des commandes avec pagination et filtres
   * @param params - Paramètres de pagination et filtres
   * @returns Liste paginée des commandes
   * 
   * @example
   * const response = await commandesApi.getList({
   *   page: 1,
   *   limit: 20,
   *   statut: 'en_cours',
   *   sort: 'date_creation',
   *   order: 'desc'
   * });
   */
  getList: (params?: PaginationParams & FiltresCommandes) =>
    api.get<ApiResponse<CommandesListResponse>>('/commandes', { params }),

  /**
   * Récupérer les détails d'une commande avec historique
   * @param id - ID de la commande
   * @returns Détails complets de la commande
   * 
   * @example
   * const response = await commandesApi.getById(123);
   * const { historique_affectations, defauts } = response.data.data;
   */
  getById: (id: number) =>
    api.get<ApiResponse<CommandeDetail>>(`/commandes/${id}`),

  /**
   * Créer une nouvelle commande
   * @param data - Données de la nouvelle commande
   * @returns Commande créée avec son ID
   * 
   * @example
   * const response = await commandesApi.create({
   *   article_id: 5,
   *   lot: 'LOT-2024-001',
   *   quantite: 100,
   *   date_fin_prevue: '2024-02-28',
   *   priorite: 'haute'
   * });
   * console.log(response.data.data.numero); // CMD-2024-001
   */
  create: (data: CreateCommandeDto) =>
    api.post<ApiResponse<CommandeResponse>>('/commandes', data),

  /**
   * Mettre à jour une commande existante
   * @param id - ID de la commande
   * @param data - Données à mettre à jour
   * @returns Commande mise à jour
   * 
   * @example
   * const response = await commandesApi.update(123, {
   *   statut: 'completee',
   *   notes: 'Commande terminez avec succès'
   * });
   */
  update: (id: number, data: UpdateCommandeDto) =>
    api.put<ApiResponse<CommandeResponse>>(`/commandes/${id}`, data),

  /**
   * Supprimer une commande
   * Note: Seules les commandes 'creee' ou 'annulee' peuvent être supprimées
   * @param id - ID de la commande
   * @returns Confirmation de suppression
   * 
   * @example
   * const response = await commandesApi.delete(123);
   * console.log(response.data.message); // Commande supprimée
   */
  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/commandes/${id}`),

  /**
   * Mettre à jour le statut d'une commande
   * Raccourci pour une mise à jour simple du statut
   * @param id - ID de la commande
   * @param statut - Nouveau statut
   * @returns Confirmation de mise à jour
   * 
   * @example
   * await commandesApi.updateStatut(123, 'en_cours');
   * await commandesApi.updateStatut(123, 'completee');
   */
  updateStatut: (id: number, statut: string) =>
    api.patch<ApiResponse<CommandeResponse>>(
      `/commandes/${id}/statut`,
      { statut }
    ),

  /**
   * Mettre à jour les quantités produites
   * @param id - ID de la commande
   * @param quantite_produite - Quantité produite
   * @param quantite_emballe - Quantité emballée
   * @returns Confirmation de mise à jour
   * 
   * @example
   * await commandesApi.updateQuantites(123, 75, 50);
   */
  updateQuantites: (
    id: number,
    quantite_produite: number,
    quantite_emballe: number
  ) =>
    api.patch<ApiResponse<CommandeResponse>>(
      `/commandes/${id}/quantites`,
      { quantite_produite, quantite_emballe }
    ),

  /**
   * Récupérer la liste des articles disponibles
   * Utilisé pour le formulaire de création de commande
   * @returns Liste des articles
   * 
   * @example
   * const response = await commandesApi.getArticles();
   * const articles = response.data.data;
   */
  getArticles: () =>
    api.get<ApiResponse<Article[]>>('/articles'),

  /**
   * Rechercher des commandes
   * Recherche par numéro, lot ou article
   * @param terme - Terme de recherche
   * @returns Commandes correspondantes
   * 
   * @example
   * const response = await commandesApi.search('LOT-2024');
   */
  search: (terme: string) =>
    api.get<ApiResponse<Commande[]>>('/commandes/search', {
      params: { q: terme }
    }),

  /**
   * Récupérer les commandes par statut
   * @param statut - Statut à filtrer
   * @param limit - Nombre maximal de résultats
   * @returns Commandes du statut spécifié
   * 
   * @example
   * const enCours = await commandesApi.getByStatut('en_cours', 10);
   */
  getByStatut: (statut: string, limit?: number) =>
    api.get<ApiResponse<Commande[]>>('/commandes/statut', {
      params: { statut, limit }
    }),

  getBySemaine: (semaineId: number) =>
    api.get<ApiResponse<any[]>>(`/commandes/semaine/${semaineId}`),

  /**
   * Recuperer la liste distincte des unites de production
   */
  getUnitesProduction: () =>
    api.get<ApiResponse<string[]>>('/commandes/unites'),

  /**
   * Exporter les commandes en XLSX
   * @param params - Paramètres de filtrage (optionnel)
   * @returns Fichier XLSX en blob
   * 
   * @example
   * const blob = await commandesApi.exportXlsx({ statut: 'completee' });
   * const url = URL.createObjectURL(blob);
   * window.open(url);
   */
  exportXlsx: (params?: FiltresCommandes) =>
    api.get<Blob>('/commandes/export/xlsx', {
      params,
      responseType: 'blob'
    } as any),

  /**
   * Obtenir les statistiques des commandes
   * @param periode - Période à analyser
   * @returns Statistiques globales
   * 
   * @example
   * const stats = await commandesApi.getStatistiques('semaine');
   */
  getStatistiques: (periode?: string) =>
    api.get<ApiResponse<any>>('/commandes/statistiques', {
      params: { periode }
    }),

  /**
   * Obtenir le template d'import pour les commandes
   * @returns Fichier Excel template
   * 
   * @example
   * const blob = await commandesApi.getTemplateImport();
   */
  getTemplateImport: () =>
    api.get<Blob>('/import/template/commandes', {
      responseType: 'blob'
    } as any),

  /**
   * Importer des commandes depuis un fichier Excel
   * @param file - Fichier Excel à importer
   * @returns Résultat de l'import
   * 
   * @example
   * const response = await commandesApi.importCommandes(file);
   */
  importCommandes: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/commandes', formData, {
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
  delete: deleteCommande,
  updateStatut,
  updateQuantites,
  getArticles,
  search,
  getByStatut,
  getBySemaine,
  getUnitesProduction,
  exportXlsx,
  getStatistiques,
  getTemplateImport,
  importCommandes,
} = commandesApi;

export default commandesApi;
