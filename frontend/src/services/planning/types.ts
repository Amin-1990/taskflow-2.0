export type DayKey = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi';

export interface PlanningWeekOption {
  id: number;
  numero: number;
  annee: number;
  code: string;
  dateDebut: string;
  dateFin: string;
  label: string;
}

export interface ManualDayCell {
  planifie: number;
  emballe: number;
}

export interface ManualPlanningRow {
   id: number | null;
   commandeId: number;
   articleId: number | null;
   articleCode: string;
   articleNom: string;
   lot: string;
   unite: string;
   priorite: 'basse' | 'normale' | 'haute' | 'urgente' | null;
   objectifSemaine: number;
   tempsTheorique: number;
   planification: Record<DayKey, ManualDayCell>;
   totalPlanifie: number;
   totalEmballe: number;
   identifiantLot: string;
   dateDebutPlanification: string | null;
   stockEmballePrecedent: number;
   semainePrecedenteCode: string | null;
 }

export interface AutoWeekCell {
  planningId: number | null;
  objectif: number;
  planifie: number;
  emballe: number;
}

export interface AutoPlanningRow {
  commandeId: number;
  articleCode: string;
  lot: string;
  unite: string;
  priorite: 'basse' | 'normale' | 'haute' | 'urgente' | null;
  dateDebutPlanification: string | null;
  weekCells: Record<number, AutoWeekCell>;
}

export type AutoDistributionMode =
  | 'objectifs'
  | 'egalitaire'
  | 'proportionnelle'
  | 'premieres_semaines'
  | 'personnalisee';
