/**
 * Types pour le module Planning - Gestion du planning hebdomadaire
 * Basés sur la structure de la table 'planning_hebdo' du backend
 */

/**
 * Jours de la semaine
 */
export type JourSemaine = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

/**
 * États possibles d'une affectation de planning
 */
export type StatutPlanning = 'prevu' | 'en_cours' | 'termine' | 'reporte' | 'annule';

/**
 * Entité JourPlanning - Représente une journée dans le planning
 * Correspond à une ligne de la table 'planning_hebdo'
 */
export interface JourPlanning {
  id: number;                    // ID unique
  planning_id: number;           // ID du planning parent
  jour: JourSemaine;             // Jour de la semaine
  date: string;                  // Date au format YYYY-MM-DD
  numero_jour: number;           // 1-7 (lundi-dimanche)
  
  // Commandes affectées
  commandes: PlanningCommande[]; // Commandes du jour
  
  // Capacité
  heures_disponibles: number;    // Heures travaillables du jour
  heures_utilisees: number;      // Heures déjà planifiées
  pourcentage_utilisation: number; // Taux d'utilisation en %
  
  // Métadonnées
  notes: string | null;          // Notes du jour
  est_ferie: boolean;            // Jour férié?
  est_chome: boolean;            // Jour chômé?
  
  created_at: string;
  updated_at: string;
}

/**
 * Commande affectée au planning
 */
export interface PlanningCommande {
  id: number;                    // ID d'affectation
  jour_planning_id: number;      // Référence au jour
  commande_id: number;           // ID de la commande
  commande_numero: string;       // Numéro de commande (CMD-...)
  article_nom: string;           // Nom de l'article
  
  // Timing
  heure_debut: string;           // HH:mm (ex: 08:30)
  heure_fin: string;             // HH:mm (ex: 12:00)
  duree_heures: number;          // Durée en heures
  
  // Ressources
  operateurs_requis: number;     // Nombre d'opérateurs nécessaires
  operateurs_affectes: number;   // Nombre d'opérateurs assignés
  machine_id: number | null;     // Machine utilisée
  
  // Status
  statut: StatutPlanning;        // État de l'affectation
  quantite_a_produire: number;   // Quantité prévue
  quantite_produite: number;     // Quantité réelle
  
  // Ordre
  position: number;              // Ordre dans la journée
  
  created_at: string;
  updated_at: string;
}

/**
 * Entité Planning - Représente un planning hebdomadaire
 */
export interface Planning {
  id: number;                    // ID unique
  numero_semaine: number;        // Semaine (1-53)
  annee: number;                 // Année
  date_debut: string;            // Lundi de la semaine (YYYY-MM-DD)
  date_fin: string;              // Dimanche de la semaine (YYYY-MM-DD)
  
  // Contenu
  jours: JourPlanning[];         // Les 7 jours de la semaine
  
  // Statut
  statut: 'brouillon' | 'confirme' | 'en_cours' | 'termine';
  
  // Validation
  est_valide: boolean;           // Planning valide?
  erreurs: string[];             // Messages d'erreur
  
  // Chargement global
  charge_totale: number;         // Charge globale en %
  commandes_planifiees: number;  // Nombre de commandes
  
  // Métadonnées
  notes: string | null;          // Notes du planning
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
}

/**
 * DTO pour créer un planning
 */
export interface CreatePlanningDto {
  numero_semaine: number;        // Semaine (1-53)
  annee: number;                 // Année
  date_debut: string;            // YYYY-MM-DD
  date_fin: string;              // YYYY-MM-DD
  notes?: string;
}

/**
 * DTO pour mettre à jour un planning
 */
export interface UpdatePlanningDto {
  statut?: 'brouillon' | 'confirme' | 'en_cours' | 'termine';
  notes?: string;
}

/**
 * DTO pour ajouter une commande au planning
 */
export interface AjouterPlanningCommandeDto {
  planning_id: number;
  jour: JourSemaine;
  commande_id: number;
  heure_debut: string;           // HH:mm
  heure_fin: string;             // HH:mm
  operateurs_requis: number;
  machine_id?: number;
}

/**
 * DTO pour mettre à jour une commande planifiée
 */
export interface UpdatePlanningCommandeDto {
  jour?: JourSemaine;
  heure_debut?: string;
  heure_fin?: string;
  operateurs_requis?: number;
  machine_id?: number;
  statut?: StatutPlanning;
  position?: number;
}

/**
 * DTO pour déplacer une commande (drag & drop)
 */
export interface DeplacerPlanningCommandeDto {
  jour_source?: JourSemaine;
  jour_destination: JourSemaine;
  heure_debut: string;
  heure_fin: string;
  position?: number;
}

/**
 * Réponse de mise à jour du planning
 */
export interface PlanningResponse {
  id: number;
  message?: string;
}

/**
 * Vue simplifiée du planning (pour affichage rapide)
 */
export interface PlanningResume {
  id: number;
  numero_semaine: number;
  annee: number;
  date_debut: string;
  date_fin: string;
  statut: 'brouillon' | 'confirme' | 'en_cours' | 'termine';
  charge_totale: number;
  commandes_planifiees: number;
  est_valide: boolean;
}

/**
 * Planning par semaine pour navigation
 */
export interface PlanningSemaineInfo {
  numero: number;              // Numéro de semaine
  annee: number;
  date_debut: string;
  date_fin: string;
  planning_existe: boolean;
  planning_id?: number;
  statut?: string;
  charge?: number;
}

/**
 * Données pour l'export PDF
 */
export interface PlanningExportData {
  planning: Planning;
  titre: string;
  date_generation: string;
  generateur: string;
}

/**
 * Validation du planning
 */
export interface ValidationPlanning {
  est_valide: boolean;
  erreurs: string[];
  avertissements: string[];
}

/**
 * Paramètres pour filtrer les plannings
 */
export interface FiltresPlanning {
  annee?: number;
  numero_semaine?: number;
  statut?: 'brouillon' | 'confirme' | 'en_cours' | 'termine';
  date_debut?: string;
  date_fin?: string;
}

/**
 * Vue grille hebdomadaire consolidee (planning + facturation)
 */
export interface PlanningGrilleJour {
  planifie: number;
  emballe: number;
}

export interface PlanningGrilleCommande {
  id: number;
  commande_id: number;
  article_id: number | null;
  article_code: string | null;
  article_nom: string | null;
  lot: string | null;
  identifiant_lot?: string | null;
  unite_production: string | null;
  priorite?: 'basse' | 'normale' | 'haute' | 'urgente' | null;
  quantite_totale: number;
  quantite_facturee_semaine?: number;
  quantite_facturee: number;
  quantite_emballee_commande: number;
  reste_a_facturer: number;
  date_debut_planification?: string | null;
  stock_actuel: number;
  stock_embale_precedent: number;
  stock_non_emballe: number;
  semaine_precedente: string | null;
  planification: {
    lundi: PlanningGrilleJour;
    mardi: PlanningGrilleJour;
    mercredi: PlanningGrilleJour;
    jeudi: PlanningGrilleJour;
    vendredi: PlanningGrilleJour;
    samedi: PlanningGrilleJour;
  };
  total_planifie_semaine: number;
  total_emballe_semaine: number;
  ecart_planification: number;
  commentaire: string | null;
}

export interface PlanningGrilleRecap {
  total_quantite: number;
  total_facturee: number;
  total_reste_a_facturer: number;
  total_planifie_semaine: number;
  total_emballe_semaine: number;
  total_stock_non_emballe: number;
  ecart_global_planification: number;
}

export interface PlanningGrilleHebdo {
  semaine: {
    id: number;
    numero_semaine: number;
    annee: number;
    code_semaine: string;
    date_debut: string;
    date_fin: string;
  };
  unite_production: string | null;
  count: number;
  commandes: PlanningGrilleCommande[];
  recapitulatif: PlanningGrilleRecap;
}

/**
 * Constantes pour les jours
 */
export const JOURS_SEMAINE: { nom: JourSemaine; label: string; numero: number }[] = [
  { nom: 'lundi', label: 'Lundi', numero: 1 },
  { nom: 'mardi', label: 'Mardi', numero: 2 },
  { nom: 'mercredi', label: 'Mercredi', numero: 3 },
  { nom: 'jeudi', label: 'Jeudi', numero: 4 },
  { nom: 'vendredi', label: 'Vendredi', numero: 5 },
  { nom: 'samedi', label: 'Samedi', numero: 6 },
  { nom: 'dimanche', label: 'Dimanche', numero: 7 },
];

/**
 * Constantes pour les heures
 */
export const HEURES_TRAVAIL = {
  DEBUT_JOUR: 8,           // 08:00
  FIN_JOUR: 17,            // 17:00
  PAUSE_MIDI_DEBUT: 12,    // 12:00
  PAUSE_MIDI_FIN: 13,      // 13:00
  HEURES_PAR_JOUR: 8,      // 8 heures (sans pause)
} as const;
