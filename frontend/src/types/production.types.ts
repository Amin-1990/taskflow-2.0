/**
 * Types pour le module Production - Gestion des commandes
 * Basés sur la structure de la table 'commandes' du backend
 */

/**
 * États possibles d'une commande
 */
export type CommandeStatut = 
  | 'creee'           // Créée, pas encore en cours
  | 'en_cours'        // Actuellement en production
  | 'en_attente'      // En attente de ressources/matériel
  | 'suspendue'       // Suspendue temporairement
  | 'completee'       // Terminée avec succès
  | 'annulee'         // Annulée
  | 'en_controle'     // En contrôle qualité
  | 'emballe';        // Emballée et prête

/**
 * Niveaux de priorité d'une commande
 */
export type CommandePriorite = 'basse' | 'normale' | 'haute' | 'urgente';

/**
 * Entité Commande - Représente une commande de production
 * Correspond à la table 'commandes'
 */
export interface Commande {
  // Identifiants
  id: number;                      // ID unique de la commande
  numero: string;                  // Numéro unique de commande (ex: CMD-2024-001)
  
  // Informations de base
  article_id: number;              // ID de l'article commandé
  article_nom: string;             // Nom de l'article (dénormalisation)
  lot: string;                     // Numéro de lot
  quantite: number;                // Quantité totale commandée
  quantite_produite: number;       // Quantité actuellement produite
  quantite_emballe: number;        // Quantité emballée
  
  // Dates
  date_creation: string;           // Date de création (YYYY-MM-DD)
  date_debut: string | null;       // Date de début de production
  date_fin_prevue: string | null;  // Date de fin prévue
  date_fin_reelle: string | null;  // Date de fin réelle
  
  // Statut et progression
  statut: CommandeStatut;          // Statut actuel
  priorite: CommandePriorite;      // Niveau de priorité
  pourcentage_avancement: number;  // Avancement en %
  
  // Affectations
  affectation_id: number | null;   // ID de l'affectation actuelle
  operateur_id: number | null;     // ID de l'opérateur assigné
  operateur_nom: string | null;    // Nom de l'opérateur (dénormalisation)
  
  // Qualité et contrôle
  total_defauts: number;           // Nombre de défauts détectés
  taux_conformite: number;         // Taux de conformité en %
  
  // Métadonnées
  notes: string | null;            // Notes additionnelles
  created_at: string;              // Timestamp création
  updated_at: string;              // Timestamp dernière modification
  created_by: number;              // ID utilisateur créateur
  updated_by: number | null;       // ID utilisateur dernière modification
}

/**
 * DTO pour créer une nouvelle commande
 * Champs requis pour POST /api/commandes
 */
export interface CreateCommandeDto {
  ID_Article: number;              // ✨ ID de l'article (renommé)
  Code_article: string;            // ✨ Code de l'article (nouveau)
  Lot: string;                     // ✨ Numéro de lot (renommé)
  Quantite: number;                // ✨ Quantité (renommé)
  Date_debut: string;              // ✨ Date de début (renommé depuis date_fin_prevue)
  priorite?: CommandePriorite;     // Priorité (défaut: 'normale')
  notes?: string;                  // Notes optionnelles
  ID_Semaine?: number;             // Semaine (optionnel)
  Origine?: string;                // Origine (optionnel)
  Unite_production?: string;       // Unité de production (optionnel)
}

/**
 * DTO pour mettre à jour une commande
 * Champs optionnels pour PUT /api/commandes/:id
 */
export interface UpdateCommandeDto {
  statut?: CommandeStatut;         // Nouveau statut
  priorite?: CommandePriorite;     // Nouvelle priorité
  date_fin_prevue?: string;        // Nouvelle date de fin
  quantite?: number;               // Nouvelle quantité
  notes?: string;                  // Notes mises à jour
}

/**
 * Réponse de création/modification de commande
 */
export interface CommandeResponse {
  id: number;
  numero: string;
  message?: string;
}

/**
 * Historique d'une affectation pour une commande
 * Utilisé pour afficher le suivi de production
 */
export interface AffectationHistorique {
  id: number;
  commande_id: number;
  operateur_id: number;
  operateur_nom: string;
  date_debut: string;              // Quand l'opérateur a commencé
  date_fin: string | null;         // Quand l'opérateur a terminé
  quantite_produite: number;       // Quantité produite par ce opérateur
  duree_minutes: number | null;    // Durée totale en minutes
  status: 'en_cours' | 'termine';  // Statut de cette affectation
}

/**
 * Vue détaillée d'une commande avec son historique
 */
export interface CommandeDetail extends Commande {
  historique_affectations: AffectationHistorique[];
  defauts: DefautDetail[];
}

/**
 * Défaut détecté sur une commande
 */
export interface DefautDetail {
  id: number;
  commande_id: number;
  type: 'critique' | 'majeur' | 'mineur';
  description: string;
  nombre_pieces: number;
  date_detection: string;
  resolu: boolean;
}

/**
 * Paramètres de filtrage pour les commandes
 */
export interface FiltresCommandes {
  statut?: CommandeStatut;
  priorite?: CommandePriorite;
  date_debut?: string;             // Date de d?but (YYYY-MM-DD)
  date_fin?: string;               // Date de fin (YYYY-MM-DD)
  article_id?: number;
  operateur_id?: number;
  code_article?: string;
  lot?: string;
  unite_production?: string;
  semaine?: string;
  recherche?: string;              // Recherche par num?ro ou lot
}

/**
 * Options de tri pour les commandes
 */
export type CommandeSortField = 
  | 'date_creation'
  | 'date_fin_prevue'
  | 'priorite'
  | 'pourcentage_avancement'
  | 'quantite';

/**
 * Réponse paginée pour la liste des commandes
 */
export interface CommandesListResponse {
  data: Commande[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Article disponible pour création de commande
 */
export interface Article {
  id: number;
  nom: string;
  code: string;
  description?: string;
  unite: string;                   // Unité (pièce, kg, etc)
}
