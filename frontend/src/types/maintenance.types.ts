/**
 * Types pour le module Maintenance - Gestion des machines et interventions
 * Bases sur la structure reelle des tables 'machines' et 'demande_intervention' du backend
 */

/**
 * Etats possibles d'une machine (Statut_operationnel)
 */
export type MachineStatut = string;

/**
 * Etats possibles d'une intervention (Statut)
 */
export type InterventionStatut = string;

/**
 * Niveaux de priorite d'une intervention
 */
export type InterventionPriorite = string;

/**
 * Types d'interventions
 */
export type InterventionType = 'preventive' | 'curative' | 'ameliorative';

/**
 * Impact production
 */
export type ImpactProduction = 'Aucun' | 'Mineur' | 'Partiel' | 'Total';

/**
 * Sites d'affectation
 */
export type SiteAffectation =
  | 'Unite 1'
  | 'Unite 2'
  | 'Unite 3'
  | 'Unite 4'
  | 'Unite 5'
  | 'Qualite centrale'
  | 'Preparation'
  | 'Coupe'
  | 'Magasin'
  | 'Administration'
  | 'Maintenance'
  | 'Bureau indus'
  | 'Bureau Logistique';

/**
 * Type de machine
 */
export interface TypeMachine {
  ID: number;
  Type_machine: string;
}

/**
 * Entite Machine - Correspond a la table 'machines'
 */
export interface Machine {
  ID: number;
  id?: number;
  Type_machine_id: number;
  Type_machine?: string;
  Numero_serie?: string;
  numero_serie?: string;
  Code_interne: string;
  code?: string;
  Nom_machine: string;
  nom?: string;
  Description?: string;
  description?: string;
  Marque?: string;
  Modele?: string;
  Annee_fabrication?: number;
  Date_installation?: string;
  date_installation?: string;
  Fournisseur?: string;
  Constructeur?: string;
  Site_affectation?: SiteAffectation;
  localisation?: string;
  Emplacement_detail?: string;
  Puissance_kw?: number;
  Consommation_air_m3h?: number;
  Poids_kg?: number;
  Dimensions_lxhxp?: string;
  Vitesse_moteur_trmin?: number;
  Capacite_production?: string;
  Frequence_maintenance_preventive?: string;
  Duree_maintenance_moyenne_min?: number;
  Statut_operationnel: MachineStatut;
  statut?: MachineStatut;
  Date_derniere_maintenance?: string;
  date_derniere_maintenance?: string;
  derniere_maintenance?: string;
  Date_prochaine_maintenance?: string;
  date_prochaine_maintenance?: string;
  date_acquisition?: string;
  heures_fonctionnement?: number;
  heures_intervention?: number;
  notes?: string;
  Lien_manuel_pdf?: string;
  Lien_fiche_technique?: string;
  Lien_photo?: string;
  Lien_plan?: string;
  Date_achat?: string;
  Prix_achat?: number;
  Duree_garantie_mois?: number;
  Date_fin_garantie?: string;
  Amortissement_ans?: number;
  Valeur_residuelle?: number;
  Qr_code?: string;
  Code_barre?: string;
  Date_creation: string;
  Date_modification: string;
  Commentaire?: string;
  Statut: 'actif' | 'inactif' | 'en_attente';
  type?: string;
}

/**
 * Defaut par type de machine
 */
export interface DefautParTypeMachine {
  ID: number;
  ID_Type_machine: number;
  Code_defaut: string;
  Nom_defaut: string;
  Description_defaut?: string;
}

/**
 * Entite Intervention - Correspond a la table 'demande_intervention'
 */
export interface Intervention {
  ID: number;
  id?: number;
  ID_Type_machine: number;
  Type_machine?: string;
  ID_Machine: number;
  machine_id?: number;
  Nom_machine?: string;
  machine_nom?: string;
  Code_interne?: string;
  machine_code?: string;
  ID_Defaut?: number;
  Code_defaut_ref?: string;
  Nom_defaut?: string;
  Date_heure_demande: string;
  Demandeur: number;
  Demandeur_nom?: string;
  Description_panne?: string;
  description?: string;
  Priorite: InterventionPriorite;
  priorite?: InterventionPriorite;
  Impact_production?: ImpactProduction;
  ID_Technicien?: number;
  technicien_id?: number;
  Technicien_nom?: string;
  technicien_nom?: string;
  Technicien_tel?: string;
  ID_Equipe?: number;
  Date_heure_debut?: string;
  date_debut?: string;
  Date_heure_fin?: string;
  date_fin?: string;
  Statut: InterventionStatut;
  statut?: InterventionStatut;
  Cause_racine?: string;
  cause?: string;
  Action_realisee?: string;
  solution?: string;
  Pieces_remplacees?: string;
  pieces_utilisees?: string;
  Commentaire?: string;
  notes?: string;
  Duree_intervention_minutes?: number;
  duree_reelle_heures?: number;
  Temps_attente_minutes?: number;
  Date_cloture?: string;
  Cloture_par?: string;
  Date_creation: string;
  date_creation?: string;
  Date_modification: string;
  titre?: string;
  numero?: string;
  type?: 'preventive' | 'curative' | 'ameliorative';
  date_fin_prevue?: string;
  duree_prevue_heures?: number;
}

/**
 * DTO pour creer une nouvelle machine
 */
export interface CreateMachineDto {
  Type_machine_id?: number;
  Code_interne?: string;
  Nom_machine?: string;
  Description?: string;
  Numero_serie?: string;
  Marque?: string;
  Modele?: string;
  Annee_fabrication?: number;
  Date_installation?: string;
  Fournisseur?: string;
  Constructeur?: string;
  Site_affectation?: SiteAffectation;
  Emplacement_detail?: string;
  Puissance_kw?: number;
  Consommation_air_m3h?: number;
  Poids_kg?: number;
  Dimensions_lxhxp?: string;
  Vitesse_moteur_trmin?: number;
  Capacite_production?: string;
  Frequence_maintenance_preventive?: string;
  Duree_maintenance_moyenne_min?: number;
  Date_achat?: string;
  Prix_achat?: number;
  Duree_garantie_mois?: number;
  Amortissement_ans?: number;
  Commentaire?: string;
  code?: string;
  nom?: string;
  type?: string;
  localisation?: string;
  numero_serie?: string;
  date_acquisition?: string;
  description?: string;
  notes?: string;
}

/**
 * DTO pour mettre a jour une machine
 */
export interface UpdateMachineDto {
  Nom_machine?: string;
  Type_machine_id?: number;
  Code_interne?: string;
  Statut_operationnel?: MachineStatut;
  Description?: string;
  Site_affectation?: SiteAffectation;
  Emplacement_detail?: string;
  Date_prochaine_maintenance?: string;
  Commentaire?: string;
  Date_derniere_maintenance?: string;
  statut?: MachineStatut;
}

export type MachineSortField = string;
export type InterventionSortField = string;

/**
 * DTO pour creer une nouvelle intervention
 */
export interface CreateInterventionDto {
  ID_Machine?: number;
  machine_id?: number;
  ID_Type_machine?: number;
  Description_panne?: string;
  description?: string;
  titre?: string;
  type?: 'preventive' | 'curative' | 'ameliorative';
  Priorite?: InterventionPriorite;
  priorite?: InterventionPriorite;
  Impact_production?: ImpactProduction;
  ID_Defaut?: number;
  ID_Technicien?: number;
  technicien_id?: number;
  Demandeur?: number;
  Date_heure_demande?: string;
  cause?: string;
  solution?: string;
  pieces_utilisees?: string;
  date_fin_prevue?: string;
  duree_prevue_heures?: number;
  notes?: string;
}

/**
 * DTO pour mettre a jour une intervention
 */
export interface UpdateInterventionDto {
  Description_panne?: string;
  Priorite?: InterventionPriorite;
  Impact_production?: ImpactProduction;
  Statut?: InterventionStatut;
  ID_Technicien?: number;
  Cause_racine?: string;
  Action_realisee?: string;
  Pieces_remplacees?: string;
  Duree_intervention_minutes?: number;
  Temps_attente_minutes?: number;
  Commentaire?: string;
}

/**
 * Vue detaillee d'une machine avec son historique
 */
export interface MachineDetail extends Machine {
  interventions_recentes?: Intervention[];
}

/**
 * Parametres de filtrage pour les machines
 */
export interface FiltresMachines {
  Statut_operationnel?: MachineStatut;
  statut?: MachineStatut;
  Type_machine_id?: number;
  type?: string;
  Site_affectation?: SiteAffectation;
  localisation?: string;
  recherche?: string;
}

/**
 * Parametres de filtrage pour les interventions
 */
export interface FiltresInterventions {
  Statut?: InterventionStatut;
  statut?: InterventionStatut;
  Priorite?: InterventionPriorite;
  priorite?: InterventionPriorite;
  type?: 'preventive' | 'curative' | 'ameliorative';
  ID_Machine?: number;
  machine_id?: number;
  ID_Technicien?: number;
  recherche?: string;
}

/**
 * Reponse paginee pour la liste des machines
 */
export interface MachinesListResponse {
  success?: boolean;
  data: Machine[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  count?: number;
}

/**
 * Reponse paginee pour la liste des interventions
 */
export interface InterventionsListResponse {
  success?: boolean;
  data: Intervention[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  count?: number;
}

/**
 * Data du dashboard avec structure alternative
 */
export interface MaintenanceDashboardDataAlt {
  global?: {
    total_demandes?: number;
    en_attente?: number;
    affectees?: number;
    en_cours?: number;
    terminees?: number;
    temps_attente_moyen?: number;
    duree_moyenne?: number;
  };
  top_pannes?: Array<{
    Nom_defaut?: string;
    nb_occurrences?: number;
  }>;
  performance_techniciens?: Array<{
    Nom_prenom?: string;
    interventions?: number;
    duree_moyenne?: number;
  }>;
}

/**
 * Reponse de creation/modification
 */
export interface MaintenanceResponse {
  success?: boolean;
  ID?: number;
  id?: number;
  code?: string;
  numero?: string;
  message?: string;
  error?: string;
}

/**
 * KPIs du tableau de bord maintenance
 */
export interface MaintenanceKPIs {
  total_machines: number;
  machines_en_production: number;
  machines_en_panne: number;
  machines_en_maintenance: number;
  disponibilite_moyen: number;
  interventions_urgentes: number;
  interventions_en_attente: number;
  mttr: number;
  maintenances_retard: number;
}

/**
 * Donnees pour les graphiques du dashboard
 */
export interface MachinesStatutDistribution {
  Statut_operationnel: MachineStatut;
  nombre: number;
  pourcentage: number;
}

export interface InterventionsParJour {
  date: string;
  nombre: number;
  urgentes: number;
  hautes: number;
  normales: number;
  basses: number;
}

/**
 * Reponse du dashboard maintenance
 */
export interface MaintenanceDashboardData extends MaintenanceDashboardDataAlt {
  kpis?: MaintenanceKPIs;
  statut_machines?: MachinesStatutDistribution[];
  interventions_par_jour?: InterventionsParJour[];
  alertes?: MaintenanceAlerte[];
}

/**
 * Alerte du systeme de maintenance
 */
export interface MaintenanceAlerte {
  id: string;
  type: 'maintenance_retard' | 'machine_panne' | 'intervention_urgente';
  titre: string;
  description: string;
  ID_Machine?: number;
  Code_interne?: string;
  ID: number;
  severite: 'basse' | 'moyenne' | 'haute' | 'critique';
  Date_creation: string;
  lue: boolean;
}
