import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ROUTES } from '../../../constants';
import analyseChargeService from '../../../services/planning/analyseCharge.service';
import { planningApi } from '../../../api/planning';
import SelectSearch, { type SelectSearchOption } from '../../../components/common/SelectSearch';
import PageHeader from '../../../components/common/PageHeader';
import type { DayKey, PlanningWeekOption } from '../../../services/planning/types';
import { showToast } from '../../../utils/toast';

interface AnalyseChargeProps {
  path?: string;
}

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

export const AnalyseCharge: FunctionComponent<AnalyseChargeProps> = () => {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [semaine, setSemaine] = useState(getWeekNumber(now));
  const [annees, setAnnees] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<PlanningWeekOption[]>([]);
  const [unite, setUnite] = useState('Toutes');
  const [unites, setUnites] = useState<string[]>(['Toutes']);
  const [capacity, setCapacity] = useState(920);
  const [loading, setLoading] = useState(false);
  const [byArticle, setByArticle] = useState<Array<{ article: string; tempsTheorique: number; planifie: number; tempsTotal: number }>>([]);
  const [dayLoads, setDayLoads] = useState<Record<DayKey, number>>({
    lundi: 0,
    mardi: 0,
    mercredi: 0,
    jeudi: 0,
    vendredi: 0,
    samedi: 0,
  });

  const selectedWeek = useMemo(() => weeks.find((w) => w.numero === semaine), [weeks, semaine]);

  const loadBase = async () => {
    const [years, units] = await Promise.all([analyseChargeService.loadAnnees(), analyseChargeService.loadUnites()]);
    setAnnees(years.length > 0 ? years : [annee]);
    setUnites(units);
    if (years.length > 0 && !years.includes(annee)) setAnnee(years[0]);
  };

  const loadWeeks = async (year: number) => {
    const list = await analyseChargeService.loadWeeks(year);
    setWeeks(list);
    if (list.length > 0 && !list.some((w) => w.numero === semaine)) {
      setSemaine(list[0].numero);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await analyseChargeService.loadAnalyseData(semaine, annee, unite);
      setByArticle(data.byArticle);
      setDayLoads(data.dayLoads);
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur chargement analyse');
      setByArticle([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    void loadWeeks(annee);
  }, [annee]);

  useEffect(() => {
    void loadData();
  }, [annee, semaine, unite]);

  const summary = useMemo(() => {
    const total = Object.values(dayLoads).reduce((a, b) => a + b, 0);
    const capTotal = capacity * DAY_LABELS.length;
    const avg = capTotal > 0 ? (total / capTotal) * 100 : 0;
    const peak = Math.max(...Object.values(dayLoads), 0);
    return { total, capTotal, avg, peak };
  }, [dayLoads, capacity]);

  const exportExcel = async () => {
    if (!selectedWeek?.id) return;
    try {
      const response = await planningApi.exportSemaineExcel(selectedWeek.id);
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse_charge_${selectedWeek.code}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur export');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyse Charge"
        subtitle="Analyse de la charge de production et des capacités journalières"
        showExport={true}
        onExport={() => void exportExcel()}
        actions={
          <>
            <button onClick={() => route(ROUTES.PLANNING_MANUEL)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Planning</button>
            <button onClick={() => route(ROUTES.PLANNING_REALISATION)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Suivi realisation</button>
          </>
        }
      />

      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48">
          <SelectSearch
            options={annees.map((y) => ({
              id: y,
              label: String(y),
            }))}
            selectedId={annee}
            onSelect={(opt) => setAnnee(opt.id as number)}
            placeholder="Sélectionner année..."
            maxResults={10}
          />
        </div>
        <div className="min-w-60">
          <SelectSearch
            options={weeks.map((w) => ({
              id: w.numero,
              label: w.label,
            }))}
            selectedId={semaine}
            onSelect={(opt) => setSemaine(opt.id as number)}
            placeholder="Rechercher semaine..."
            maxResults={20}
          />
        </div>
        <div className="min-w-48">
          <SelectSearch
            options={unites.map((u) => ({
              id: u,
              label: u,
            }))}
            selectedId={unite}
            onSelect={(opt) => setUnite(opt.label)}
            placeholder="Sélectionner unité..."
            maxResults={20}
          />
        </div>
        <label className="text-sm text-gray-700">
          Capacite / jour
          <input type="number" min={1} value={capacity} onInput={(e) => setCapacity(Math.max(1, parseInt((e.target as HTMLInputElement).value || '920', 10)))} className="ml-2 w-24 px-2 py-1 border border-gray-300 rounded" />
        </label>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Article</th>
                  <th className="px-3 py-2 text-right">Temps th. (h/u)</th>
                  <th className="px-3 py-2 text-right">Planifie</th>
                  <th className="px-3 py-2 text-right">Temps total (h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byArticle.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500">Aucune donnee</td></tr>
                )}
                {byArticle.map((a) => (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DAY_LABELS.map((d) => {
          const value = dayLoads[d.key] || 0;
          const percent = capacity > 0 ? Math.min(140, (value / capacity) * 100) : 0;
          const color = percent > 100 ? 'bg-red-500' : percent > 85 ? 'bg-orange-500' : 'bg-green-500';
          return (
            <div key={d.key} className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm font-medium text-gray-700">{d.label}</div>
              <div className="text-sm text-gray-600 mt-1">{value.toFixed(1)} / {capacity} h</div>
              <div className="mt-2 h-2 rounded bg-gray-200">
                <div className={`h-2 rounded ${color}`} style={{ width: `${Math.min(100, percent)}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{percent.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 text-sm text-gray-700">
        Charge moyenne: <b>{summary.avg.toFixed(1)}%</b>
        {' | '}Pic: <b>{summary.peak.toFixed(1)} h</b>
        {' | '}Temps total: <b>{summary.total.toFixed(1)} h</b>
        {' | '}Capacite totale: <b>{summary.capTotal} h</b>
      </div>
    </div>
  );
};

export default AnalyseCharge;
