import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-preact';
import { ROUTES } from '../../../constants';
import { showToast } from '../../../utils/toast';
import planningManuelService from '../../../services/planning/planningManuel.service';
import type { DayKey, ManualPlanningRow, PlanningWeekOption } from '../../../services/planning/types';

interface PlanningManuelProps {
  path?: string;
}

const DAYS: Array<{ key: DayKey; label: string }> = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
];

const formatDayDate = (startDate: string | null | undefined, dayIndex: number) => {
   if (!startDate) return '--/--';
   const d = new Date(startDate);
   d.setDate(d.getDate() + dayIndex);
   return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
 };

 const formatDuration = (minutes: number): string => {
   const hours = Math.floor(minutes / 60);
   const mins = minutes % 60;
   return `${hours}h${mins}min`;
 };

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
};

export const PlanningManuel: FunctionComponent<PlanningManuelProps> = () => {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [semaineCommande, setSemaineCommande] = useState(getWeekNumber(now));
  const [semainePlanification, setSemainePlanification] = useState(getWeekNumber(now));
  const [annees, setAnnees] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<PlanningWeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<PlanningWeekOption | null>(null);
  const [unite, setUnite] = useState('Toutes');
  const [unites, setUnites] = useState<string[]>(['Toutes']);
  const [priorite, setPriorite] = useState<'toutes' | 'basse' | 'normale' | 'haute' | 'urgente'>('toutes');
  const [articleSearch, setArticleSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ManualPlanningRow[]>([]);
  const [initial, setInitial] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadBase = async () => {
    const [years, units] = await Promise.all([
      planningManuelService.loadAnnees(),
      planningManuelService.loadUnites(),
    ]);
    setAnnees(years.length > 0 ? years : [annee]);
    setUnites(units);
    if (years.length > 0 && !years.includes(annee)) setAnnee(years[0]);
  };

  const loadWeeks = async (year: number) => {
    const list = await planningManuelService.loadWeeks(year);
    setWeeks(list);
    if (list.length > 0 && !list.some((w) => w.numero === semaineCommande)) {
      setSemaineCommande(list[0].numero);
    }
    if (list.length > 0 && !list.some((w) => w.numero === semainePlanification)) {
      setSemainePlanification(list[0].numero);
    }
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const result = await planningManuelService.loadRows(
        semaineCommande,
        semainePlanification,
        annee,
        unite
      );
      setRows(result.rows);
      setSelectedWeek(result.weekOption);
      setInitial(JSON.stringify(result.rows));
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur chargement planning');
      setRows([]);
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
    void loadRows();
  }, [annee, semaineCommande, semainePlanification, unite]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (priorite !== 'toutes' && r.priorite !== priorite) return false;
      if (articleSearch.trim() && !r.articleCode.toLowerCase().includes(articleSearch.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, priorite, articleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const updateCell = (rowIdx: number, day: DayKey, field: 'planifie' | 'emballe', value: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? {
              ...r,
              planification: {
                ...r.planification,
                [day]: {
                  ...r.planification[day],
                  [field]: Math.max(0, value),
                },
              },
            }
          : r
      )
    );
  };

  const updatePlanifie = (rowIdx: number, day: DayKey, value: number) => {
    updateCell(rowIdx, day, 'planifie', value);
  };

  const updateObjectif = (rowIdx: number, value: number) => {
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, objectifSemaine: Math.max(0, value) } : r)));
  };

  const goWeek = (offset: -1 | 1) => {
    const idx = weeks.findIndex((w) => w.numero === semainePlanification);
    if (idx < 0) return;
    const next = weeks[idx + offset];
    if (next) setSemainePlanification(next.numero);
  };

  const saveAll = async () => {
    if (!selectedWeek) return;
    const current = JSON.stringify(rows);
    if (current === initial) {
      showToast.info('Aucun changement');
      return;
    }
    try {
      setSaving(true);
      for (const row of rows) {
        // eslint-disable-next-line no-await-in-loop
        await planningManuelService.saveRow(row, selectedWeek);
      }
      showToast.success('Planning sauvegarde');
      await loadRows();
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
        <div className="flex gap-2">
          <button onClick={() => void loadRows()} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button onClick={() => route(ROUTES.PLANNING_REALISATION)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Suivi realisation
          </button>
          <button onClick={() => route(ROUTES.PLANNING_ANALYSE)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Analyse charge
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => goWeek(-1)} className="p-2 border border-gray-300 rounded hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <select value={semainePlanification} onChange={(e) => setSemainePlanification(parseInt((e.target as HTMLSelectElement).value, 10))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-60">
            {weeks.map((w) => <option key={w.id} value={w.numero}>{w.label}</option>)}
          </select>
          <button onClick={() => goWeek(1)} className="p-2 border border-gray-300 rounded hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Semaine commande</label>
          <select
            value={semaineCommande}
            onChange={(e) => setSemaineCommande(parseInt((e.target as HTMLSelectElement).value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-60"
          >
            {weeks.map((w) => <option key={`cmd-${w.id}`} value={w.numero}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Semaine a planifier</label>
          <select
            value={semainePlanification}
            onChange={(e) => setSemainePlanification(parseInt((e.target as HTMLSelectElement).value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-60"
          >
            {weeks.map((w) => <option key={`pln-${w.id}`} value={w.numero}>{w.label}</option>)}
          </select>
        </div>
        <select value={annee} onChange={(e) => setAnnee(parseInt((e.target as HTMLSelectElement).value, 10))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {annees.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={unite} onChange={(e) => setUnite((e.target as HTMLSelectElement).value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {unites.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input value={articleSearch} onInput={(e) => setArticleSearch((e.target as HTMLInputElement).value)} placeholder="Filtre article" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <select value={priorite} onChange={(e) => setPriorite((e.target as HTMLSelectElement).value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="toutes">Toutes priorites</option>
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
         <div className="flex justify-between items-center">
           <div className="space-y-2">
             <div className="text-sm">
               <span className="text-gray-600">Temps théorique demandé :</span>
               <span className="font-bold text-blue-600 ml-2">{formatDuration(filteredRows.reduce((sum, r) => sum + (r.objectifSemaine * r.tempsTheorique), 0))}</span>
             </div>
             <div className="text-sm">
               <span className="text-gray-600">Temps théorique planifié :</span>
               <span className="font-bold text-green-600 ml-2">{formatDuration(filteredRows.reduce((sum, r) => sum + (r.totalPlanifie * r.tempsTheorique), 0))}</span>
             </div>
           </div>
           <button
             disabled={saving}
             onClick={() => void saveAll()}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
           >
             {saving ? 'Sauvegarde...' : 'Sauvegarder'}
           </button>
         </div>
       </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                     <th className="px-2 py-2 text-left whitespace-nowrap w-56">Commande</th>
                     <th className="px-2 py-2 text-center whitespace-nowrap flex-1">Qte a facturer</th>
                     <th className="px-2 py-2 text-center whitespace-nowrap w-16">Stock</th>
                     {DAYS.map((d, idx) => (
                       <th key={d.key} className="px-3 py-2 text-center">
                         <div>{d.label}</div>
                         <div className="text-xs text-gray-500">{formatDayDate(selectedWeek?.dateDebut, idx)}</div>
                       </th>
                     ))}
                     <th className="px-2 py-2 text-center whitespace-nowrap w-16">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.length === 0 && (
                    <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-500">Aucune commande</td></tr>
                  )}
                  {pagedRows.map((r) => {
                  const rowIdx = rows.findIndex((x) => x.commandeId === r.commandeId);
                  return (
                    <tr key={r.commandeId}>
                      <td className="px-2 py-2">
                         <div className="font-medium text-xs">{r.articleCode}</div>
                         <div className="text-xs text-gray-500">Lot {r.lot || '-'} • {r.priorite || '-'}</div>
                         <div className="flex gap-3 mt-1">
                           <div className="font-bold text-xs text-blue-600">Qte : {r.objectifSemaine}</div>
                           <div className="text-xs text-amber-600">T/pz : {r.tempsTheorique} min</div>
                         </div>
                       </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={r.objectifSemaine}
                          onInput={(e) => updateObjectif(rowIdx, parseInt((e.target as HTMLInputElement).value || '0', 10))}
                          className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                        <div className="text-gray-600">{r.stockEmballePrecedent}</div>
                      </td>
                      {DAYS.map((d) => (
                        <td key={d.key} className="px-2 py-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min={0}
                              value={r.planification[d.key].planifie}
                              onInput={(e) => updatePlanifie(rowIdx, d.key, parseInt((e.target as HTMLInputElement).value || '0', 10))}
                              className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-xs"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center text-xs">
                        <div className={Math.max(0, r.objectifSemaine - r.totalPlanifie) === 0 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                          {Math.max(0, r.objectifSemaine - r.totalPlanifie)}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
              <div className="text-gray-600">{filteredRows.length} enregistrement(s)</div>
              <div className="flex items-center gap-2">
                <label className="text-gray-600">Par page</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number((e.target as HTMLSelectElement).value));
                    setPage(1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                >
                  Prec
                </button>
                <span className="min-w-20 text-center text-gray-700">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                >
                  Suiv
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningManuel;
