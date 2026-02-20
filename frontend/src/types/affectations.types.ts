/**
 * Types pour le module Affectations - Suivi du temps
 */

export interface Affectation {
  ID: number;
  ID_Commande: number;
  ID_Operateur: number;
  ID_Poste: number;
  ID_Article: number | null;
  ID_Semaine: number | null;
  Date_debut: string;
  Date_fin: string | null;
  Duree: number | null; // secondes
  Heure_supp: number | null; // heures
  Quantite_produite: number | null;
  Date_creation: string;
  Date_modification: string | null;
  Commentaire: string | null;
  Code_article?: string | null;
  Lot?: string | null;
  Operateur_nom?: string | null;
  Poste_nom?: string | null;
}

export interface AffectationFilters {
  dateDebut: string;
  dateFin: string;
  operateurId?: number;
  commandeId?: number;
  posteId?: number;
  enCours?: boolean;
}

export interface CreateAffectationPayload {
  ID_Commande: number;
  ID_Operateur: number;
  ID_Poste: number;
  ID_Article: number;
  ID_Semaine?: number | null;
  Date_debut?: string;
  Commentaire?: string | null;
  Quantite_produite?: number | null;
}

export interface UpdateAffectationPayload {
  ID_Commande?: number;
  ID_Operateur?: number;
  ID_Poste?: number;
  ID_Article?: number;
  ID_Semaine?: number | null;
  Date_debut?: string;
  Date_fin?: string | null;
  Duree?: number | null;
  Heure_supp?: number | null;
  Quantite_produite?: number | null;
  Commentaire?: string | null;
}

export interface AffectationOperateurResume {
  operateurId: number;
  operateurNom: string;
  totalAffectations: number;
  dureeSecondes: number;
  heuresSupp: number;
  quantiteProduite: number;
  enCours: number;
}

export type AffectationsView = 'operateurs' | 'chrono' | 'hebdo';
