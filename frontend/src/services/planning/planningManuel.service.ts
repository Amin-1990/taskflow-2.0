import { api } from '../../services/api';
import { planningApi } from '../../api/planning';
import { filtresApi } from '../../api/filtres';
import type { DayKey, ManualPlanningRow, PlanningWeekOption } from './types';

const DAY_API: Record<DayKey, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
};

const ZERO_PLAN = {
  lundi: { planifie: 0, emballe: 0 },
  mardi: { planifie: 0, emballe: 0 },
  mercredi: { planifie: 0, emballe: 0 },
  jeudi: { planifie: 0, emballe: 0 },
  vendredi: { planifie: 0, emballe: 0 },
  samedi: { planifie: 0, emballe: 0 },
} as const;

const toWeekOptions = (raw: any[]): PlanningWeekOption[] =>
  raw.map((w) => ({
    id: w.ID,
    numero: w.Numero_semaine,
    annee: w.Annee,
    code: w.Code_semaine,
    dateDebut: w.Date_debut,
    dateFin: w.Date_fin,
    label: `S${String(w.Numero_semaine).padStart(2, '0')} - ${new Date(w.Date_debut).toLocaleDateString()} au ${new Date(w.Date_fin).toLocaleDateString()}`,
  }));

export const planningManuelService = {
  async loadWeeks(annee: number): Promise<PlanningWeekOption[]> {
    const res = await filtresApi.getSemaines(annee);
    return toWeekOptions((res.data.data || []) as any[]);
  },

  async loadAnnees(): Promise<number[]> {
    const res = await filtresApi.getAnnees();
    return (res.data.data || []) as number[];
  },

  async loadUnites(): Promise<string[]> {
    const res = await filtresApi.getUnites();
    return ['Toutes', ...((res.data.data || []) as string[])];
  },

  async loadRows(
    semaineCommande: number,
    semainePlanification: number,
    annee: number,
    unite: string
  ) {
    const [gridRes, weeksRes] = await Promise.all([
      planningApi.getGrilleHebdo(semainePlanification, annee, unite === 'Toutes' ? undefined : unite),
      filtresApi.getSemaines(annee),
    ]);
    const weeks = toWeekOptions((weeksRes.data.data || []) as any[]);
    const weekPlanification = weeks.find((w) => w.numero === semainePlanification);
    const weekCommande = weeks.find((w) => w.numero === semaineCommande);

    if (!weekPlanification) {
      return { rows: [] as ManualPlanningRow[], weekOption: null };
    }

    const commandesRes = await api.get(`/commandes/semaine/${(weekCommande || weekPlanification).id}`);
    const commandes = (commandesRes.data?.data || []) as any[];
    const gridRows = (gridRes.data?.data?.commandes || []) as any[];
    const existingByCommande = new Map<number, any>(gridRows.map((r) => [r.commande_id, r]));

    const rows: ManualPlanningRow[] = commandes
      .filter((c) => (unite === 'Toutes' ? true : (c.Unite_production || '') === unite))
      .map((cmd) => {
        const existing = existingByCommande.get(cmd.ID);
        const lot = String(cmd.Lot || '');
        return {
          id: existing?.id || null,
          commandeId: cmd.ID,
          articleId: existing?.article_id || cmd.ID_Article || null,
          articleCode: String(cmd.Code_article || existing?.article_code || '-'),
          articleNom: String(existing?.article_nom || ''),
          lot,
          unite: String(cmd.Unite_production || existing?.unite_production || ''),
          priorite: (cmd.priorite || existing?.priorite || null) as any,
          objectifSemaine: Number(existing?.quantite_facturee_semaine || 0),
          planification: {
            lundi: { ...ZERO_PLAN.lundi, ...(existing?.planification?.lundi || {}) },
            mardi: { ...ZERO_PLAN.mardi, ...(existing?.planification?.mardi || {}) },
            mercredi: { ...ZERO_PLAN.mercredi, ...(existing?.planification?.mercredi || {}) },
            jeudi: { ...ZERO_PLAN.jeudi, ...(existing?.planification?.jeudi || {}) },
            vendredi: { ...ZERO_PLAN.vendredi, ...(existing?.planification?.vendredi || {}) },
            samedi: { ...ZERO_PLAN.samedi, ...(existing?.planification?.samedi || {}) },
          },
          totalPlanifie: Number(existing?.total_planifie_semaine || 0),
          totalEmballe: Number(existing?.total_emballe_semaine || 0),
          identifiantLot: String(existing?.identifiant_lot || `${lot || cmd.ID}-${annee}`),
          dateDebutPlanification: existing?.date_debut_planification || weekPlanification.dateDebut,
          stockEmballePrecedent: Number(existing?.stock_embale_precedent || 0),
          semainePrecedenteCode: existing?.semaine_precedente || null,
        };
      });

    return { rows, weekOption: weekPlanification };
  },

  async saveRow(row: ManualPlanningRow, weekOption: PlanningWeekOption) {
    const payloadBase = {
      Date_debut_planification: row.dateDebutPlanification || weekOption.dateDebut,
      Identifiant_lot: row.identifiantLot || `${row.lot || row.commandeId}-${weekOption.annee}`,
      Quantite_facturee_semaine: Math.max(0, Number(row.objectifSemaine || 0)),
      Stock_actuel: 0,
      Lundi_planifie: Number(row.planification.lundi.planifie || 0),
      Lundi_emballe: Number(row.planification.lundi.emballe || 0),
      Mardi_planifie: Number(row.planification.mardi.planifie || 0),
      Mardi_emballe: Number(row.planification.mardi.emballe || 0),
      Mercredi_planifie: Number(row.planification.mercredi.planifie || 0),
      Mercredi_emballe: Number(row.planification.mercredi.emballe || 0),
      Jeudi_planifie: Number(row.planification.jeudi.planifie || 0),
      Jeudi_emballe: Number(row.planification.jeudi.emballe || 0),
      Vendredi_planifie: Number(row.planification.vendredi.planifie || 0),
      Vendredi_emballe: Number(row.planification.vendredi.emballe || 0),
      Samedi_planifie: Number(row.planification.samedi.planifie || 0),
      Samedi_emballe: Number(row.planification.samedi.emballe || 0),
      Commentaire: 'Planning manuel',
    };

    if (row.id) {
      await planningApi.update(row.id, payloadBase as any);
      return;
    }

    await planningApi.create({
      ID_Semaine_planifiee: weekOption.id,
      ID_Commande: row.commandeId,
      ...payloadBase,
    } as any);
  },

  async saveOneDay(row: ManualPlanningRow, day: DayKey, weekOption: PlanningWeekOption) {
    if (row.id) {
      const cell = row.planification[day];
      await planningApi.updateJourCell(row.id, DAY_API[day], cell.planifie, cell.emballe);
      return;
    }
    await this.saveRow(row, weekOption);
  },
};

export default planningManuelService;
