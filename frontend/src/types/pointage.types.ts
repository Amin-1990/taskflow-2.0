export interface PointageRow {
  ID: number;
  ID_Personnel: number;
  Matricule: string;
  Nom: string;
  Nom_prenom?: string;
  Date: string;
  Debut?: string | null;
  Fin?: string | null;
  Entree?: string | null;
  Sortie?: string | null;
  Retard?: string | null;
  Depart_anticipe?: string | null;
  Presence_reelle?: string | null;
  H_sup?: number | null;
  Absent?: number | null;
  Commentaire?: string | null;
  Est_valide?: number | null;
  Date_creation?: string | null;
  Date_modification?: string | null;
}

export interface PointagePeriodeResponse {
  success: boolean;
  count: number;
  data: PointageRow[];
}

export interface PointagePayloadBase {
  ID_Personnel?: number;
  Matricule?: string;
  Date?: string;
}

export interface PointageArriveePayload extends PointagePayloadBase {
  Nom?: string;
  Commentaire?: string;
}

export interface PointageDepartPayload extends PointagePayloadBase {
  Commentaire?: string;
}

export interface PointageAbsencePayload extends PointagePayloadBase {
  Commentaire?: string;
}

export interface PointageAjustementPayload extends PointagePayloadBase {
  Nom?: string;
  Statut: 'present' | 'absent';
  Entree?: string | null;
  Sortie?: string | null;
  H_sup?: number | null;
  Commentaire?: string;
}
