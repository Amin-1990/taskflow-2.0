/**
 * API du planning hebdomadaire
 * Gestion complète du planning de production
 */

import { api } from '../services/api';
import type { ApiResponse, PaginationParams } from '../types/api.types';
import type {
  Planning,
  PlanningResume,
  CreatePlanningDto,
  UpdatePlanningDto,
  AjouterPlanningCommandeDto,
  UpdatePlanningCommandeDto,
  DeplacerPlanningCommandeDto,
  PlanningResponse,
  PlanningSemaineInfo,
  ValidationPlanning,
  FiltresPlanning,
  PlanningGrilleHebdo,
} from '../types/planning.types';

/**
 * Service API du planning
 * Regroupe toutes les opérations sur le planning
 */
export const planningApi = {
  /**
   * Récupérer le planning d'une semaine
   * @param numeroSemaine - Numéro de semaine (1-53)
   * @param annee - Année (défaut: année actuelle)
   * @returns Planning complet avec tous les jours et commandes
   * 
   * @example
   * const response = await planningApi.getParSemaine(5, 2024);
   * const planning = response.data.data;
   */
  getParSemaine: (numeroSemaine: number, annee?: number) =>
    api.get<ApiResponse<Planning>>('/planning/semaine', {
      params: { numero_semaine: numeroSemaine, annee }
    }),

  /**
   * Récupérer la grille hebdomadaire consolidée (planning + facturation)
   * @param numeroSemaine - Numéro de semaine
   * @param annee - Année
   * @param unite_production - Filtre unité de production (optionnel)
   */
  getGrilleHebdo: (numeroSemaine: number, annee: number, unite_production?: string) =>
    api.get<ApiResponse<PlanningGrilleHebdo>>('/planning/grille/semaine', {
      params: { numero_semaine: numeroSemaine, annee, unite_production }
    }),

  /**
   * Export planning d'une semaine (Excel)
   * @param semaineId - ID de la semaine
   */
  exportSemaineExcel: (semaineId: number) =>
    api.get<Blob>(`/export/planning/${semaineId}`, {
      responseType: 'blob'
    }),

  /**
   * Obtenir le template d'import planning
   */
  getTemplateImportPlanning: () =>
    api.get<Blob>('/import/template/planning', {
      responseType: 'blob'
    }),

  /**
   * Importer un fichier de planning
   */
  importPlanning: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/planning', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Récupérer un planning par ID
   * @param id - ID du planning
   * @returns Planning complet
   */
  getById: (id: number) =>
    api.get<ApiResponse<Planning>>(`/planning/${id}`),

  /**
   * Recuperer l'historique planning d'un lot
   */
  getByLot: (identifiant: string) =>
    api.get<ApiResponse<any[]>>(`/planning/lot/${encodeURIComponent(identifiant)}`),

  /**
   * Créer un nouveau planning
   * @param data - Données du planning
   * @returns Planning créé avec son ID
   * 
   * @example
   * const response = await planningApi.create({
   *   numero_semaine: 5,
   *   annee: 2024,
   *   date_debut: '2024-01-29',
   *   date_fin: '2024-02-04'
   * });
   */
  create: (data: CreatePlanningDto) =>
    api.post<ApiResponse<PlanningResponse>>('/planning', data),

  /**
   * Mettre à jour un planning
   * @param id - ID du planning
   * @param data - Données à mettre à jour
   * @returns Confirmation de mise à jour
   */
  update: (id: number, data: UpdatePlanningDto) =>
    api.put<ApiResponse<PlanningResponse>>(`/planning/${id}`, data),

  /**
   * Mettre à jour une cellule jour (planifié/emballé) d'une ligne planning_hebdo
   * @param id - ID de la ligne planning_hebdo
   * @param jour - Jour (Lundi..Samedi)
   * @param planifie - Quantité planifiée
   * @param emballe - Quantité emballée
   */
  updateJourCell: (id: number, jour: string, planifie: number, emballe: number) =>
    api.patch<ApiResponse<PlanningResponse>>(`/planning/${id}/jour/${jour}`, {
      planifie,
      emballe,
    }),

  /**
   * Ajouter une commande au planning
   * @param data - Commande à ajouter
   * @returns Confirmation avec ID de l'affectation
   * 
   * @example
   * const response = await planningApi.ajouterCommande({
   *   planning_id: 123,
   *   jour: 'lundi',
   *   commande_id: 456,
   *   heure_debut: '08:00',
   *   heure_fin: '12:00',
   *   operateurs_requis: 2
   * });
   */
  ajouterCommande: (data: AjouterPlanningCommandeDto) =>
    api.post<ApiResponse<PlanningResponse>>('/planning/commande', data),

  /**
   * Mettre à jour une commande planifiée
   * @param id - ID de l'affectation
   * @param data - Données à mettre à jour
   * @returns Confirmation
   */
  updateCommande: (id: number, data: UpdatePlanningCommandeDto) =>
    api.put<ApiResponse<PlanningResponse>>(`/planning/commande/${id}`, data),

  /**
   * Retirer une commande du planning
   * @param id - ID de l'affectation
   * @returns Confirmation
   */
  supprimerCommande: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/planning/commande/${id}`),

  /**
   * Déplacer une commande (drag & drop)
   * @param id - ID de l'affectation
   * @param data - Nouvelle position
   * @returns Confirmation
   */
  deplacerCommande: (id: number, data: DeplacerPlanningCommandeDto) =>
    api.patch<ApiResponse<PlanningResponse>>(
      `/planning/commande/${id}/deplacer`,
      data
    ),

  /**
   * Valider le planning
   * @param id - ID du planning
   * @returns Résultat de la validation
   */
  valider: (id: number) =>
    api.post<ApiResponse<ValidationPlanning>>(
      `/planning/${id}/valider`,
      {}
    ),

  /**
   * Confirmer le planning (déverrouiller pour utilisation)
   * @param id - ID du planning
   * @returns Confirmation
   */
  confirmer: (id: number) =>
    api.patch<ApiResponse<PlanningResponse>>(
      `/planning/${id}/confirmer`,
      {}
    ),

  /**
   * Récupérer les infos de plannings pour une année
   * @param annee - Année
   * @returns Tableau avec infos pour chaque semaine
   */
  getInfosSemaines: (annee: number) =>
    api.get<ApiResponse<PlanningSemaineInfo[]>>('/planning/semaines-annee', {
      params: { annee }
    }),

  /**
   * Récupérer les plannings avec filtres
   * @param params - Paramètres de filtrage
   * @returns Liste paginée des plannings résumés
   */
  getListe: (params?: PaginationParams & FiltresPlanning) =>
    api.get<ApiResponse<{ data: PlanningResume[]; total: number }>>(
      '/planning',
      { params }
    ),

  /**
   * Dupliquer un planning
   * @param id - ID du planning à dupliquer
   * @param targetSemaine - Semaine cible
   * @returns Nouveau planning créé
   */
  dupliquer: (id: number, targetSemaine: number, targetAnnee: number) =>
    api.post<ApiResponse<PlanningResponse>>(
      `/planning/${id}/dupliquer`,
      { numero_semaine: targetSemaine, annee: targetAnnee }
    ),

  /**
   * Exporter le planning en PDF
   * @param id - ID du planning
   * @returns Fichier PDF en blob
   */
  exporterPDF: (id: number) =>
    api.get<Blob>(`/planning/${id}/export/pdf`, {
      responseType: 'blob'
    }),

  /**
   * Exporter le planning en Excel
   * @param id - ID du planning
   * @returns Fichier Excel en blob
   */
  exporterExcel: (id: number) =>
    api.get<Blob>(`/planning/${id}/export/excel`, {
      responseType: 'blob'
    }),

  /**
   * Imprimer le planning
   * @param id - ID du planning
   * @returns HTML imprimable
   */
  obtenirPourImpression: (id: number) =>
    api.get<ApiResponse<{ html: string }>>(
      `/planning/${id}/impression`
    ),

  /**
   * Obtenir les conflits du planning
   * @param id - ID du planning
   * @returns Liste des conflits détectés
   */
  obtenirConflits: (id: number) =>
    api.get<ApiResponse<any[]>>(`/planning/${id}/conflits`),

  /**
   * Obtenir les suggestions d'optimisation
   * @param id - ID du planning
   * @returns Suggestions pour améliorer le planning
   */
  obtenirSuggestions: (id: number) =>
    api.get<ApiResponse<any[]>>(`/planning/${id}/suggestions`),

  /**
   * Récupérer les commandes disponibles pour affectation
   * @param planning_id - ID du planning
   * @param jour - Jour de la semaine
   * @returns Commandes non planifiées
   */
  getCommandesDisponibles: (planning_id: number, jour: string) =>
    api.get<ApiResponse<any[]>>('/planning/commandes-disponibles', {
      params: { planning_id, jour }
    }),
};

// Export nommé pour utilisation directe
export const {
  getParSemaine,
  getGrilleHebdo,
  exportSemaineExcel,
  getTemplateImportPlanning,
  importPlanning,
  getById,
  create,
  update,
  updateJourCell,
  ajouterCommande,
  updateCommande,
  supprimerCommande,
  deplacerCommande,
  valider,
  confirmer,
  getInfosSemaines,
  getListe,
  dupliquer,
  exporterPDF,
  exporterExcel,
  obtenirPourImpression,
  obtenirConflits,
  obtenirSuggestions,
  getCommandesDisponibles,
} = planningApi;

export default planningApi;
