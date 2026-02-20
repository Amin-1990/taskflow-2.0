/**
 * Constantes pour le module Maintenance
 */

import type { MachineStatut, InterventionStatut, InterventionPriorite, InterventionType } from '../types/maintenance.types';

/**
 * Couleurs des statuts de machines
 */
export const MACHINE_STATUT_COLORS: Record<MachineStatut, string> = {
  operationnelle: 'bg-green-100 text-green-800',
  en_panne: 'bg-red-100 text-red-800',
  en_maintenance: 'bg-blue-100 text-blue-800',
  en_attente: 'bg-yellow-100 text-yellow-800',
  hors_service: 'bg-gray-100 text-gray-800',
};

/**
 * Labels des statuts de machines
 */
export const MACHINE_STATUT_LABELS: Record<MachineStatut, string> = {
  operationnelle: 'Opérationnelle',
  en_panne: 'En panne',
  en_maintenance: 'En maintenance',
  en_attente: 'En attente',
  hors_service: 'Hors service',
};

/**
 * Couleurs des statuts d'interventions
 */
export const INTERVENTION_STATUT_COLORS: Record<InterventionStatut, string> = {
  ouverte: 'bg-gray-100 text-gray-800',
  affectee: 'bg-blue-100 text-blue-800',
  en_cours: 'bg-purple-100 text-purple-800',
  terminee: 'bg-green-100 text-green-800',
  annulee: 'bg-red-100 text-red-800',
};

/**
 * Labels des statuts d'interventions
 */
export const INTERVENTION_STATUT_LABELS: Record<InterventionStatut, string> = {
  ouverte: 'Ouverte',
  affectee: 'Affectée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

/**
 * Couleurs des priorités d'interventions
 */
export const INTERVENTION_PRIORITE_COLORS: Record<InterventionPriorite, string> = {
  basse: 'text-gray-600',
  normale: 'text-blue-600',
  haute: 'text-orange-600',
  urgente: 'text-red-600',
};

/**
 * Labels des priorités d'interventions
 */
export const INTERVENTION_PRIORITE_LABELS: Record<InterventionPriorite, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

/**
 * Labels des types d'interventions
 */
export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  preventive: 'Préventive',
  curative: 'Curative',
  ameliorative: 'Améliorative',
};

/**
 * Descriptions des types d'interventions
 */
export const INTERVENTION_TYPE_DESCRIPTIONS: Record<InterventionType, string> = {
  preventive: 'Maintenance planifiée pour éviter les pannes',
  curative: 'Réparation d\'une machine en panne',
  ameliorative: 'Amélioration ou optimisation de la machine',
};

/**
 * Workflow de transition des statuts d'intervention
 * Définit les statuts possibles après chaque statut
 */
export const INTERVENTION_STATUT_WORKFLOW: Record<InterventionStatut, InterventionStatut[]> = {
  ouverte: ['affectee', 'annulee'],
  affectee: ['en_cours', 'ouverte', 'annulee'],
  en_cours: ['terminee', 'annulee'],
  terminee: [],
  annulee: [],
};

/**
 * Sévérité des alertes
 */
export const ALERTE_SEVERITE_COLORS: Record<string, string> = {
  basse: 'bg-blue-50 border-l-4 border-blue-500',
  moyenne: 'bg-yellow-50 border-l-4 border-yellow-500',
  haute: 'bg-orange-50 border-l-4 border-orange-500',
  critique: 'bg-red-50 border-l-4 border-red-500',
};

export const ALERTE_SEVERITE_TEXT_COLORS: Record<string, string> = {
  basse: 'text-blue-800',
  moyenne: 'text-yellow-800',
  haute: 'text-orange-800',
  critique: 'text-red-800',
};

/**
 * Niveaux de pagination
 */
export const PAGINATION_LIMITS = [10, 20, 50, 100];

/**
 * Délai d'actualisation automatique du dashboard (en ms)
 */
export const DASHBOARD_AUTO_REFRESH_INTERVAL = 300000; // 5 minutes

/**
 * Nombre de jours à afficher dans les graphiques du dashboard
 */
export const DASHBOARD_DAYS_GRAPH = 7;

/**
 * Temps limite pour considérer une maintenance comme en retard (en jours)
 */
export const MAINTENANCE_RETARD_THRESHOLD_DAYS = 7;

/**
 * Types de machines possibles (à adapter selon votre activité)
 */
export const MACHINE_TYPES = [
  'Presse',
  'Découpe',
  'Emboutissage',
  'Soudage',
  'Assemblage',
  'Conditionnement',
  'Contrôle',
  'Manutention',
  'Compresseur',
  'Pompe',
  'Moteur',
  'Autre',
];

/**
 * Localisations possibles (à adapter selon votre usine)
 */
export const MACHINE_LOCALISATIONS = [
  'Atelier A',
  'Atelier B',
  'Atelier C',
  'Zone de réception',
  'Zone d\'expédition',
  'Stockage',
  'Zone de test',
  'Bureau',
];

/**
 * Durées types pour les interventions (en heures)
 */
export const INTERVENTION_DURATIONS = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 24];



