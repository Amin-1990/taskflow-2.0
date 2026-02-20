/**
 * Service API pour le module Maintenance
 * Gestion des appels HTTP vers les endpoints de maintenance
 */

import api from '../services/api';
import type {
  Intervention,
  CreateMachineDto,
  UpdateMachineDto,
  CreateInterventionDto,
  UpdateInterventionDto,
  FiltresMachines,
  FiltresInterventions,
  MachinesListResponse,
  InterventionsListResponse,
  MachineDetail,
  MaintenanceDashboardData,
  MaintenanceResponse,
} from '../types/maintenance.types';

/**
 * ========== MACHINES ==========
 */

/**
 * Récupère la liste des machines avec filtres
 */
export async function getMachines(
  filters?: FiltresMachines,
  page: number = 1,
  limit: number = 20
): Promise<MachinesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (filters?.Statut_operationnel) params.append('Statut_operationnel', filters.Statut_operationnel);
  if (filters?.Type_machine_id) params.append('Type_machine_id', filters.Type_machine_id.toString());
  if (filters?.Site_affectation) params.append('Site_affectation', filters.Site_affectation);
  if (filters?.recherche) params.append('recherche', filters.recherche);

  const response = await api.get<MachinesListResponse>(`/machines?${params}`);
  return response.data;
}

/**
 * Récupère les détails d'une machine spécifique
 */
export async function getMachineById(id: number): Promise<MachineDetail> {
  const response = await api.get<MachineDetail>(`/machines/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle machine
 */
export async function createMachine(data: CreateMachineDto): Promise<MaintenanceResponse> {
  const response = await api.post<MaintenanceResponse>('/machines', data);
  return response.data;
}

/**
 * Met à jour une machine existante
 */
export async function updateMachine(
  id: number,
  data: UpdateMachineDto
): Promise<MaintenanceResponse> {
  const response = await api.put<MaintenanceResponse>(`/machines/${id}`, data);
  return response.data;
}

/**
 * Supprime une machine
 */
export async function deleteMachine(id: number): Promise<void> {
  await api.delete(`/machines/${id}`);
}

/**
 * Récupère les types de machines disponibles
 */
export async function getMachineTypes(): Promise<any[]> {
  const response = await api.get<any[]>('/types-machine');
  return response.data;
}

/**
 * Récupère les sites d'affectation disponibles
 */
export async function getSites(): Promise<string[]> {
  // Les sites sont définis statiquement dans le type
  return Promise.resolve([
    'Unité 1', 'Unité 2', 'Unité 3', 'Unité 4', 'Unité 5',
    'Qualité centrale', 'Préparation', 'Coupe', 'Magasin',
    'Administration', 'Maintenance', 'Bureau indus', 'Bureau Logistique'
  ]);
}

/**
 * ========== INTERVENTIONS ==========
 */

/**
 * Récupère la liste des interventions avec filtres
 */
export async function getInterventions(
  filters?: FiltresInterventions,
  page: number = 1,
  limit: number = 20
): Promise<InterventionsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (filters?.Statut) params.append('Statut', filters.Statut);
  if (filters?.Priorite) params.append('Priorite', filters.Priorite);
  if (filters?.ID_Machine) params.append('ID_Machine', filters.ID_Machine.toString());
  if (filters?.ID_Technicien) params.append('ID_Technicien', filters.ID_Technicien.toString());
  if (filters?.recherche) params.append('recherche', filters.recherche);

  const response = await api.get<InterventionsListResponse>(`/interventions?${params}`);
  return response.data;
}

/**
 * Récupère les détails d'une intervention spécifique
 */
export async function getInterventionById(id: number): Promise<Intervention> {
  const response = await api.get<Intervention>(`/interventions/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle intervention
 */
export async function createIntervention(
  data: CreateInterventionDto
): Promise<MaintenanceResponse> {
  const response = await api.post<MaintenanceResponse>('/interventions', data);
  return response.data;
}

/**
 * Met à jour une intervention existante
 */
export async function updateIntervention(
  id: number,
  data: UpdateInterventionDto
): Promise<MaintenanceResponse> {
  const response = await api.put<MaintenanceResponse>(`/interventions/${id}`, data);
  return response.data;
}

/**
 * Supprime une intervention
 */
export async function deleteIntervention(id: number): Promise<void> {
  await api.delete(`/interventions/${id}`);
}

/**
 * Change le statut d'une intervention
 */
export async function changeInterventionStatut(
  id: number,
  statut: string
): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/interventions/${id}`, { Statut: statut });
  return response.data;
}

/**
 * Affecte une intervention à un technicien
 */
export async function assignIntervention(
  id: number,
  technicien_id: number
): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/interventions/${id}/affecter`, {
    ID_Technicien: technicien_id,
  });
  return response.data;
}

/**
 * ========== DASHBOARD ==========
 */

/**
 * Récupère les données du dashboard maintenance
 */
export async function getMaintenanceDashboard(): Promise<MaintenanceDashboardData> {
  const response = await api.get<MaintenanceDashboardData>('/interventions/statistiques/dashboard');
  return response.data;
}

/**
 * Récupère les KPIs de maintenance
 */
export async function getMaintenanceKPIs() {
  const response = await api.get('/machine/dashboard/stats');
  return response.data;
}

/**
 * Récupère les alertes de maintenance
 */
export async function getMaintenanceAlertes() {
  const response = await api.get('/maintenance/alertes');
  return response.data;
}

/**
 * Marque une alerte comme lue
 */
export async function markAlerteAsRead(alerteId: string): Promise<void> {
  await api.patch(`/maintenance/alertes/${alerteId}/lue`);
}

/**
 * Démarre une intervention
 */
export async function startIntervention(id: number): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/interventions/${id}/demarrer`);
  return response.data;
}

/**
 * Termine une intervention
 */
export async function completeIntervention(
  id: number,
  data: { Cause_racine?: string; Action_realisee?: string; Pieces_remplacees?: string; Duree_intervention_minutes?: number }
): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/interventions/${id}/terminer`, data);
  return response.data;
}

/**
 * Annule une intervention
 */
export async function cancelIntervention(id: number): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/interventions/${id}/annuler`);
  return response.data;
}
