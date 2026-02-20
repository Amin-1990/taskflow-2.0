export type JourSemaine =
  | 'Lundi'
  | 'Mardi'
  | 'Mercredi'
  | 'Jeudi'
  | 'Vendredi'
  | 'Samedi'
  | 'Dimanche';

export type TypeChome = 'chomé_payé' | 'chomé_non_payé' | 'non_chomé';

export interface Horaire {
  ID: number;
  Date: string;
  Jour_semaine: JourSemaine;
  Heure_debut: string;
  Heure_fin: string;
  Pause_debut: string | null;
  Pause_fin: string | null;
  Heure_supp_debut: string | null;
  Heure_supp_fin: string | null;
  Est_ouvert: number;
  Est_jour_ferie: number;
  Type_chome: TypeChome;
  Description: string | null;
  Commentaire: string | null;
  Date_creation: string | null;
  Date_modification: string | null;
}

export interface CreateHoraireDto {
  Date: string;
  Jour_semaine?: JourSemaine;
  Heure_debut: string;
  Heure_fin: string;
  Pause_debut?: string | null;
  Pause_fin?: string | null;
  Heure_supp_debut?: string | null;
  Heure_supp_fin?: string | null;
  Est_ouvert?: number;
  Est_jour_ferie?: number;
  Type_chome?: TypeChome;
  Description?: string | null;
  Commentaire?: string | null;
}
