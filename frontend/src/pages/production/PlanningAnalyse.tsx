import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { planningApi } from '../../api/planning';
import { filtresApi } from '../../api/filtres';
import { articlesApi } from '../../api/articles';
import { ROUTES } from '../../constants';
import { showToast } from '../../utils/toast';

interface PlanningAnalyseProps {
  path?: string;
}

interface WeekOption {
  id: number;
  numero: number;
  annee: number;
  dateDebut: string;
  dateFin: string;
  label: string;
}

type DayKey = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi';

const DAY_LABELS: Array<{ key: DayKey; label: string }> = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
];

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
};

export const PlanningAnalyse: FunctionComponent<PlanningAnalyseProps> = () => {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [semaine, setSemaine] = useState(getWeekNumber(now));
  const [annees, setAnnees] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [unite, setUnite] = useState('Toutes');
  const [unites, setUnites] = useState<string[]>(['Toutes']);
  const [capacityJour, setCapacityJour] = useState(920);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [tempsMap, setTempsMap] = useState<Record<number, number>>({});

  const selectedWeek = useMemo(() => weeks.find((w) => w.numero === semaine), [weeks, semaine]);

  const loadFilters = async () => {
    try {
      const [anneesRes, unitesRes] = await Promise.all([filtresApi.getAnnees(), filtresApi.getUnites()]);
      const listAnnees = (anneesRes.data.data || []) as number[];
      const listUnites = (unitesRes.data.data || []) as string[];
      setAnnees(listAnnees.length > 0 ? listAnnees : [annee]);
      setUnites(['Toutes', ...listUnites]);
      if (listAnnees.length > 0 && !listAnnees.includes(annee)) {
        setAnnee(listAnnees[0]);
      }
    } catch {
      setAnnees([annee]);
    }
  };

  const loadWeeks = async (year: number) => {
    try {
      const res = await filtresApi.getSemaines(year);
      const mapped = ((res.data.data || []) as any[]).map((w) => ({
        id: w.ID,
        numero: w.Numero_semaine,
        annee: w.Annee,
        dateDebut: w.Date_debut,
        dateFin: w.Date_fin,
        label: `S${String(w.Numero_semaine).padStart(2, '0')} - ${new Date(w.Date_debut).toLocaleDateString()} au ${new Date(w.Date_fin).toLocaleDateString()}`,
      }));
      setWeeks(mapped);
      if (mapped.length > 0 && !mapped.some((w) => w.numero === semaine)) {
        setSemaine(mapped[0].numero);
      }
    } catch {
      setWeeks([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await planningApi.getGrilleHebdo(semaine, annee, unite === 'Toutes' ? undefined : unite);
      const commandes = res.data?.data?.commandes || [];
      setRows(commandes);

      const articleIds = Array.from(
        new Set(
          commandes
            .map((r: any) => r.article_id)
            .filter((id: number | null | undefined) => Number.isInteger(id) && id > 0)
        )
      ) as number[];

      const missing = articleIds.filter((id) => tempsMap[id] === undefined);
      if (missing.length > 0) {
        const results = await Promise.allSettled(missing.map((id) => articlesApi.getById(id)));
        const next: Record<number, number> = {};
        results.forEach((r, idx) => {
          const id = missing[idx];
          if (r.status === 'fulfilled') {
            next[id] = Number(r.value.data?.data?.Temps_theorique || 0);
          } else {
            next[id] = 0;
          }
        });
        setTempsMap((prev) => ({ ...prev, ...next }));
      }
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur chargement analyse');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFilters();
  }, []);

  useEffect(() => {
    void loadWeeks(annee);
  }, [annee]);

  useEffect(() => {
    void loadData();
  }, [annee, semaine, unite]);

  const articleAgg = useMemo(() => {
    const map = new Map<string, { article: string; tempsTheorique: number; planifie: number; tempsTotal: number }>();
    rows.forEach((r) => {
      const key = String(r.article_code || 'N/A');
      const temps = r.article_id ? (tempsMap[r.article_id] || 0) : 0;
      const existing = map.get(key) || { article: key, tempsTheorique: temps, planifie: 0, tempsTotal: 0 };
      existing.tempsTheorique = temps;
      existing.planifie += Number(r.total_planifie_semaine || 0);
      existing.tempsTotal += Number(r.total_planifie_semaine || 0) * temps;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.tempsTotal - a.tempsTotal);
  }, [rows, tempsMap]);

  const dayLoads = useMemo(() => {
    const data: Record<DayKey, number> = {
      lundi: 0,
      mardi: 0,
      mercredi: 0,
      jeudi: 0,
      vendredi: 0,
      samedi: 0,
    };
    rows.forEach((r) => {
      const temps = r.article_id ? (tempsMap[r.article_id] || 0) : 0;
      (Object.keys(data) as DayKey[]).forEach((day) => {
        data[day] += Number(r.planification?.[day]?.planifie || 0) * temps;
      });
    });
    return data;
  }, [rows, tempsMap]);

  const synthese = useMemo(() => {
    const totals = Object.values(dayLoads);
    const total = totals.reduce((a, b) => a + b, 0);
    const capTotal = capacityJour * DAY_LABELS.length;
    const avgPercent = capTotal > 0 ? (total / capTotal) * 100 : 0;
    const peak = Math.max(...totals, 0);
    return { total, capTotal, avgPercent, peak };
  }, [dayLoads, capacityJour]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planning - Analyse Charge</h1>
          <p className="text-sm text-gray-500 mt-1">Lecture seule: temps, charge et capacite journaliere</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => route(ROUTES.PRODUCTION_PLANNING_MANUEL)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Planning
          </button>
          <button
            onClick={() => route(ROUTES.PRODUCTION_PLANNING_AUTO)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Planification auto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Annee</label>
          <select
            value={annee}
            onChange={(e) => setAnnee(parseInt((e.target as HTMLSelectElement).value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {annees.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Semaine</label>
          <select
            value={semaine}
            onChange={(e) => setSemaine(parseInt((e.target as HTMLSelectElement).value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-64"
          >
            {weeks.map((w) => <option key={w.id} value={w.numero}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Unite</label>
          <select
            value={unite}
            onChange={(e) => setUnite((e.target as HTMLSelectElement).value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-48"
          >
            {unites.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Capacite / jour (h)</label>
          <input
            type="number"
            min={1}
            value={capacityJour}
            onChange={(e) => setCapacityJour(Math.max(1, parseInt((e.target as HTMLInputElement).value || '920', 10)))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
          Temps par article - {selectedWeek?.label || `S${semaine}`}
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Article</th>
                  <th className="px-3 py-2 text-right">Temps th. (h/u)</th>
                  <th className="px-3 py-2 text-right">Planifie (u)</th>
                  <th className="px-3 py-2 text-right">Temps total (h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articleAgg.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Aucune donnee</td>
                  </tr>
                )}
                {articleAgg.map((a) => (
                  <tr key={a.article}>
                    <td className="px-3 py-2">{a.article}</td>
                    <td className="px-3 py-2 text-right">{a.tempsTheorique.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{a.planifie}</td>
                    <td className="px-3 py-2 text-right">{a.tempsTotal.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Capacite journaliere</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DAY_LABELS.map((d) => {
            const val = dayLoads[d.key] || 0;
            const percent = Math.min(100, capacityJour > 0 ? (val / capacityJour) * 100 : 0);
            const color = percent > 100 ? 'bg-red-500' : percent > 85 ? 'bg-orange-500' : 'bg-green-500';
            return (
              <div key={d.key} className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700">{d.label}</div>
                <div className="mt-1 text-sm text-gray-600">{val.toFixed(1)} / {capacityJour} h</div>
                <div className="mt-2 h-2 bg-gray-200 rounded">
                  <div className={`h-2 rounded ${color}`} style={{ width: `${Math.max(0, percent)}%` }} />
                </div>
                <div className="mt-1 text-xs text-gray-500">{percent.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
        <div className="text-sm text-gray-700">
          Charge moyenne: <b>{synthese.avgPercent.toFixed(1)}%</b>
          {' | '}Pic: <b>{synthese.peak.toFixed(1)} h</b>
          {' | '}Temps total: <b>{synthese.total.toFixed(1)} h</b>
          {' | '}Capacite totale: <b>{synthese.capTotal} h</b>
        </div>
      </div>
    </div>
  );
};

export default PlanningAnalyse;
