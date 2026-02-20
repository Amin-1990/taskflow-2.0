import { planningApi } from '../../api/planning';
import { filtresApi } from '../../api/filtres';
import { articlesApi } from '../../api/articles';
import type { DayKey, PlanningWeekOption } from './types';

const DAYS: DayKey[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

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

export const analyseChargeService = {
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

  async loadAnalyseData(semaine: number, annee: number, unite: string) {
    const grid = await planningApi.getGrilleHebdo(semaine, annee, unite === 'Toutes' ? undefined : unite);
    const rows = (grid.data?.data?.commandes || []) as any[];

    const ids = Array.from(
      new Set(rows.map((r) => r.article_id).filter((id) => Number.isInteger(id) && id > 0))
    ) as number[];
    const tempsMap: Record<number, number> = {};
    const results = await Promise.allSettled(ids.map((id) => articlesApi.getById(id)));
    results.forEach((r, idx) => {
      tempsMap[ids[idx]] = r.status === 'fulfilled' ? Number(r.value.data?.data?.Temps_theorique || 0) : 0;
    });

    const byArticleMap = new Map<string, { article: string; tempsTheorique: number; planifie: number; tempsTotal: number }>();
    rows.forEach((r) => {
      const key = String(r.article_code || 'N/A');
      const temps = r.article_id ? (tempsMap[r.article_id] || 0) : 0;
      const prev = byArticleMap.get(key) || { article: key, tempsTheorique: temps, planifie: 0, tempsTotal: 0 };
      prev.tempsTheorique = temps;
      prev.planifie += Number(r.total_planifie_semaine || 0);
      prev.tempsTotal += Number(r.total_planifie_semaine || 0) * temps;
      byArticleMap.set(key, prev);
    });

    const byArticle = Array.from(byArticleMap.values()).sort((a, b) => b.tempsTotal - a.tempsTotal);
    const dayLoads: Record<DayKey, number> = {
      lundi: 0,
      mardi: 0,
      mercredi: 0,
      jeudi: 0,
      vendredi: 0,
      samedi: 0,
    };
    rows.forEach((r) => {
      const temps = r.article_id ? (tempsMap[r.article_id] || 0) : 0;
      DAYS.forEach((day) => {
        dayLoads[day] += Number(r.planification?.[day]?.planifie || 0) * temps;
      });
    });

    return { rows, byArticle, dayLoads };
  },
};

export default analyseChargeService;

