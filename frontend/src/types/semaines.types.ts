/**
 * Types pour le module Semaines
 * Gestion des semaines de production 2026
 */

/**
 * Entité Semaine - Représente une semaine de l'année
 * Correspond à la table 'semaines'
 */
export interface Semaine {
  ID: number;                    // ID unique de la semaine
  Code_semaine: string;          // Code unique (S01-S52)
  Numero_semaine: number;        // Numéro (1-52)
  Annee: number;                 // Année (2026)
  Mois: number;                  // Mois (1-12)
  Date_debut: string;            // Date de début (YYYY-MM-DD)
  Date_fin: string;              // Date de fin (YYYY-MM-DD)
  created_at?: string;           // Timestamp création
  updated_at?: string;           // Timestamp dernière modification
}

/**
 * DTO pour créer/importer une semaine
 */
export interface CreateSemaineDto {
  Code_semaine: string;
  Numero_semaine: number;
  Annee: number;
  Mois: number;
  Date_debut: string;
  Date_fin: string;
}

/**
 * Réponse après import de semaines
 */
export interface SemainesImportResponse {
  success: boolean;
  message: string;
  count: number;
  data?: Semaine[];
}

/**
 * Réponse paginée pour la liste des semaines
 */
export interface SemainesListResponse {
  data: Semaine[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Paramètres de filtrage pour les semaines
 */
export interface FiltresSemaines {
  annee?: number;                // Filtrer par année
  mois?: number;                 // Filtrer par mois
  recherche?: string;            // Recherche par code semaine
}

/**
 * Options de tri pour les semaines
 */
export type SemaineSortField = 
  | 'Numero_semaine'
  | 'Date_debut'
  | 'Mois'
  | 'Code_semaine';
