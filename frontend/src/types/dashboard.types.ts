/**
 * Types pour le dashboard et les indicateurs
 * Basés sur la documentation des endpoints /api/indicateurs/*
 */

/**
 * Période d'analyse pour les indicateurs
 * Utilisée dans les requêtes GET /api/indicateurs?periode=...
 */
export type Periode = 'jour' | 'semaine' | 'mois' | 'annee';

/**
 * Indicateurs de production
 * Correspond à GET /api/indicateurs/production
 */
export interface IndicateursProduction {
  commandes: {
    total_commandes: number;
    commandes_en_cours: number;
    commandes_terminees: number;
    quantite_totale: number;
    quantite_produite: number;
    quantite_emballe: number;
  };
  affectations: {
    total_affectations: number;
    affectations_en_cours: number;
    duree_moyenne: number | null;
  };
  rendement: number | string;     // Pourcentage de rendement
  taux_avancement: number | string; // Taux d'avancement des commandes
}

/**
 * Indicateurs de maintenance
 * Correspond à GET /api/indicateurs/maintenance
 */
export interface IndicateursMaintenance {
  interventions: {
    total_interventions: number;
    interventions_en_cours: number;
    interventions_attente: number;
    duree_moyenne: number | null;
    temps_attente_moyen: number | null;
  };
  machines: {
    total_machines: number;
    machines_operationnelles: number;
    machines_panne: number;
    machines_maintenance: number;
  };
  maintenance: {
    total_maintenances: number;
    duree_maintenance_moyenne: number | null;
  };
  disponibilite: number | string;  // Pourcentage de disponibilité
}

/**
 * Indicateurs qualité
 * Correspond à GET /api/indicateurs/qualite
 */
export interface IndicateursQualite {
  defauts: {
    total_defauts: number;
    defauts_critiques: number;
    defauts_bloquants: number;
    pieces_impactees: number;
    arret_moyen: number | null;
  };
  taux_conformite: number | string;  // Pourcentage de conformité
  qualite: {
    total_controles: number;
    controles_acceptes: number;
  };
}

/**
 * Indicateurs Ressources Humaines
 * Correspond à GET /api/indicateurs/rh
 */
export interface IndicateursRH {
  personnel: {
    total_personnel: number;
    personnel_actif: number;
  };
  pointage: {
    presents: number;
    absents: number;
    retards: number;
    heures_sup_moyennes: number | null;
  };
  affectations: {
    operateurs_actifs: number;
    heures_sup_moyennes_affectations: number | null;
  };
  taux_presence: number | string;  // Pourcentage de présence
}

/**
 * Structure complète des indicateurs du dashboard
 * Correspond à GET /api/indicateurs
 */
export interface Indicateurs {
  production: IndicateursProduction;
  maintenance: IndicateursMaintenance;
  qualite: IndicateursQualite;
  rh: IndicateursRH;
}

/**
 * Réponse du dashboard avec timestamp
 * Pour suivre quand les données ont été mises à jour
 */
export interface DashboardResponse {
  indicateurs: Indicateurs;
  timestamp: string;               // Date de mise à jour
  periode: Periode;                 // Période demandée
}

/**
 * Statistiques journalières pour les graphiques
 * Utilisé pour les séries temporelles
 */
export interface StatsJournalieres {
  date: string;                     // Date au format YYYY-MM-DD
  production: number;               // Production du jour
  objectif: number;                 // Objectif du jour
  taux_conformite: number;          // Taux qualité du jour
  arrets: number;                   // Minutes d'arrêt
}

/**
 * Synthèse hebdomadaire
 * Utilisé pour les rapports
 */
export interface SyntheseHebdo {
  semaine: number;                   // Numéro de semaine
  annee: number;                     // Année
  production_totale: number;         // Total semaine
  taux_conformite_moyen: number;     // Moyenne qualité
  arrets_totaux: number;             // Total arrêts
  interventions_realisees: number;   // Total interventions
  taux_presence_moyen: number;       // Moyenne présence
}