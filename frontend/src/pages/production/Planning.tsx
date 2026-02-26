/**
 * Page Planning Hebdomadaire - Grille unique
 * Basee sur /api/planning/grille/semaine
 */

import { type FunctionComponent } from 'preact';
import { route } from 'preact-router';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Calendar, Download, Edit3, FileText, Plus, RefreshCw, Search, Upload } from 'lucide-preact';
import { planningApi } from '../../api/planning';
import { filtresApi } from '../../api/filtres';
import { articlesApi, type Article } from '../../api/articles';
import type { PlanningGrilleCommande, PlanningGrilleHebdo } from '../../types/planning.types';
import { ROUTES } from '../../constants';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import { usePermissions } from '../../hooks/usePermissions';

interface PlanningPageProps {
  path?: string;
}

interface WeekOption {
  id: number;
  numero: number;
  annee: number;
  label: string;
  dateDebut?: string;
  dateFin?: string;
}

type DayKey = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi';

const DAYS: Array<{ key: DayKey; api: string; label: string }> = [
  { key: 'lundi', api: 'Lundi', label: 'Lun' },
  { key: 'mardi', api: 'Mardi', label: 'Mar' },
  { key: 'mercredi', api: 'Mercredi', label: 'Mer' },
  { key: 'jeudi', api: 'Jeudi', label: 'Jeu' },
  { key: 'vendredi', api: 'Vendredi', label: 'Ven' },
  { key: 'samedi', api: 'Samedi', label: 'Sam' },
];

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
};

const getDefaultWeek = () => {
  const now = new Date();
  return { week: getWeekNumber(now), year: now.getFullYear() };
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

export const Planning: FunctionComponent<PlanningPageProps> = () => {
  const { canWrite } = usePermissions();
  const defaults = getDefaultWeek();
  const initialQuery = new URLSearchParams(window.location.search);
  const initialSemaine = parseInt(initialQuery.get('semaine') || String(defaults.week), 10);
  const initialAnnee = parseInt(initialQuery.get('annee') || String(defaults.year), 10);
  const initialUnite = initialQuery.get('unite') || 'Toutes';
  const initialArticle = initialQuery.get('article') || '';
  const initialPriorites = (initialQuery.get('priorite') || '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => ['basse', 'normale', 'haute', 'urgente'].includes(p)) as Array<'basse' | 'normale' | 'haute' | 'urgente'>;

  const [semaine, setSemaine] = useState(defaults.week);
  const [annee, setAnnee] = useState(defaults.year);
  const [unite, setUnite] = useState<string>(initialUnite);
  const [articleQuery, setArticleQuery] = useState<string>(initialArticle);
  const [priorites, setPriorites] = useState<Array<'basse' | 'normale' | 'haute' | 'urgente'>>(initialPriorites);
  const [annees, setAnnees] = useState<number[]>([]);
  const [unites, setUnites] = useState<string[]>(['Toutes']);
  const [articlesOptions, setArticlesOptions] = useState<Array<{ ID: number; Code_article: string; Client: string }>>([]);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [data, setData] = useState<PlanningGrilleHebdo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<{ row: PlanningGrilleCommande; day: DayKey } | null>(null);
  const [editPlanifie, setEditPlanifie] = useState(0);
  const [editEmballe, setEditEmballe] = useState(0);
  const [copyTarget, setCopyTarget] = useState<'none' | 'jeudi' | 'vendredi' | 'semaine'>('none');
  const [savingCell, setSavingCell] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [articleModal, setArticleModal] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    if (!Number.isNaN(initialSemaine)) setSemaine(initialSemaine);
    if (!Number.isNaN(initialAnnee)) setAnnee(initialAnnee);
  }, []);

  const updateUrl = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('annee', String(annee));
    params.set('semaine', String(semaine));
    if (unite && unite !== 'Toutes') params.set('unite', unite);
    else params.delete('unite');
    if (articleQuery.trim()) params.set('article', articleQuery.trim());
    else params.delete('article');
    if (priorites.length > 0) params.set('priorite', priorites.join(','));
    else params.delete('priorite');
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const loadWeeks = async (year: number) => {
    try {
      const response = await filtresApi.getSemaines(year);
      const raw = (response.data.data || []) as any[];
      const normalized = raw.map((w) => {
        const numero = w.Numero_semaine;
        const anneeValue = w.Annee ?? year;
        const dateDebut = w.Date_debut;
        const dateFin = w.Date_fin;
        return {
          id: w.ID,
          numero,
          annee: anneeValue,
          dateDebut,
          dateFin,
          label: `S${String(numero).padStart(2, '0')} - ${formatDate(dateDebut)} au ${formatDate(dateFin)}`,
        };
      });
      setWeeks(normalized);
    } catch {
      setWeeks([]);
    }
  };

  const loadAnnees = async () => {
    try {
      const response = await filtresApi.getAnnees();
      const list = (response.data.data || []) as number[];
      setAnnees(list.length > 0 ? list : [annee]);
      if (list.length > 0 && !list.includes(annee)) {
        setAnnee(list[0]);
      }
    } catch {
      setAnnees([annee]);
    }
  };

  const loadUnites = async () => {
    try {
      const response = await filtresApi.getUnites();
      const list = (response.data.data || []) as string[];
      setUnites(['Toutes', ...list]);
    } catch {
      setUnites(['Toutes']);
    }
  };

  const loadArticlesOptions = async (search?: string) => {
    try {
      const response = await filtresApi.getArticles(search || undefined);
      setArticlesOptions((response.data.data || []) as any[]);
    } catch {
      setArticlesOptions([]);
    }
  };

  const loadGrid = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await planningApi.getGrilleHebdo(
        semaine,
        annee,
        unite === 'Toutes' ? undefined : unite
      );
      setData(response.data.data || null);
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Erreur de chargement du planning';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnees();
    void loadUnites();
    void loadArticlesOptions(initialArticle || undefined);
  }, []);

  useEffect(() => {
    void loadWeeks(annee);
  }, [annee]);

  useEffect(() => {
    void loadGrid();
  }, [semaine, annee, unite]);

  const selectedWeek = useMemo(() => weeks.find((w) => w.numero === semaine), [weeks, semaine]);

  const selectedWeekLabel = useMemo(() => {
    return selectedWeek?.label || `S${String(semaine).padStart(2, '0')}`;
  }, [selectedWeek, semaine]);

  const filteredRows = useMemo(() => {
    return (data?.commandes || []).filter((row) => {
      const matchesArticle = articleQuery.trim() === ''
        || String(row.article_code || '').toLowerCase().includes(articleQuery.trim().toLowerCase());
      const matchesPriority = priorites.length === 0
        || (row.priorite ? priorites.includes(row.priorite) : false);
      return matchesArticle && matchesPriority;
    });
  }, [data, articleQuery, priorites]);

  const recapFiltered = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.total_planifie += row.total_planifie_semaine || 0;
        acc.total_emballe += row.total_emballe_semaine || 0;
        acc.total_reste += row.reste_a_facturer || 0;
        acc.total_stock_non_emballe += row.stock_non_emballe || 0;
        return acc;
      },
      { total_planifie: 0, total_emballe: 0, total_reste: 0, total_stock_non_emballe: 0 }
    );
  }, [filteredRows]);

  useEffect(() => {
    updateUrl();
  }, [annee, semaine, unite, articleQuery, priorites]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadArticlesOptions(articleQuery.trim() || undefined);
    }, 250);
    return () => clearTimeout(timeout);
  }, [articleQuery]);

  const openEditModal = (row: PlanningGrilleCommande, day: DayKey) => {
    setEditing({ row, day });
    setEditPlanifie(row.planification[day].planifie || 0);
    setEditEmballe(row.planification[day].emballe || 0);
    setCopyTarget('none');
  };

  const closeEditModal = () => {
    setEditing(null);
    setCopyTarget('none');
  };

  const saveCellEdit = async () => {
    if (!editing) return;

    const updates: Array<{ apiDay: string; planifie: number; emballe: number }> = [];
    const currentDay = DAYS.find((d) => d.key === editing.day);
    if (!currentDay) return;

    updates.push({ apiDay: currentDay.api, planifie: editPlanifie, emballe: editEmballe });

    if (copyTarget === 'jeudi') {
      updates.push({ apiDay: 'Jeudi', planifie: editPlanifie, emballe: editEmballe });
    }
    if (copyTarget === 'vendredi') {
      updates.push({ apiDay: 'Vendredi', planifie: editPlanifie, emballe: editEmballe });
    }
    if (copyTarget === 'semaine') {
      DAYS.forEach((d) => {
        if (d.api !== currentDay.api) {
          updates.push({ apiDay: d.api, planifie: editPlanifie, emballe: editEmballe });
        }
      });
    }

    const dedup = Array.from(new Map(updates.map((u) => [u.apiDay, u])).values());

    try {
      setSavingCell(true);
      for (const update of dedup) {
        await planningApi.updateJourCell(editing.row.id, update.apiDay, update.planifie, update.emballe);
      }
      showToast.success('Cellule mise a jour');
      closeEditModal();
      await loadGrid();
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur de mise a jour');
    } finally {
      setSavingCell(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await planningApi.getTemplateImportPlanning();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_planning.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Template planning telecharge');
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur telechargement template');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await planningApi.importPlanning(file);
      showToast.success('Planning importe avec succes');
      await loadGrid();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur import planning');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedWeek?.id) {
      showToast.error('Semaine invalide pour export');
      return;
    }

    try {
      setIsExporting(true);
      const response = await planningApi.exportSemaineExcel(selectedWeek.id);
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning_${selectedWeekLabel.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Planning exporte');
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur export planning');
    } finally {
      setIsExporting(false);
    }
  };

  const togglePriorite = (value: 'basse' | 'normale' | 'haute' | 'urgente') => {
    setPriorites((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  };

  const priorityClass = (value: 'basse' | 'normale' | 'haute' | 'urgente') => {
    const active = priorites.includes(value);
    if (value === 'urgente') return active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700';
    if (value === 'haute') return active ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700';
    if (value === 'normale') return active ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700';
    return active ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700';
  };

  const getDayDateString = (row: PlanningGrilleCommande, dayIndex: number) => {
    const weekStart = selectedWeek?.dateDebut || data?.semaine?.date_debut;
    if (!weekStart) return null;
    const base = new Date(weekStart);
    const dateStart = row.date_debut_planification ? new Date(row.date_debut_planification) : null;
    const currentDate = new Date(base);
    currentDate.setDate(base.getDate() + dayIndex);
    const iso = currentDate.toISOString().slice(0, 10);
    const isBeforeStart = dateStart ? currentDate < dateStart : false;
    return { iso, isBeforeStart };
  };

  const handleDateDebutChange = async (row: PlanningGrilleCommande, dateValue: string) => {
    try {
      await planningApi.update(row.id, { Date_debut_planification: dateValue || null } as any);
      showToast.success('Date debut mise a jour');
      await loadGrid();
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur mise a jour date debut');
    }
  };

  const openArticleModal = async (articleId: number | null) => {
    if (!articleId) return;
    try {
      setArticleLoading(true);
      const response = await articlesApi.getById(articleId);
      setArticleModal(response.data.data || null);
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur chargement article');
      setArticleModal(null);
    } finally {
      setArticleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning Hebdomadaire"
        subtitle="Planning - edition semaine par semaine"
        actions={
          <>
            {canWrite('PLANNING') && (
              <ActionButton onClick={handleDownloadTemplate} icon={Download}>
                Template
              </ActionButton>
            )}
            {canWrite('PLANNING') && (
              <ActionButton onClick={handleImportClick} loading={isImporting} icon={Upload}>
                {isImporting ? 'Import...' : 'Importer'}
              </ActionButton>
            )}
            <ActionButton onClick={() => void handleExport()} loading={isExporting} icon={Download}>
              {isExporting ? 'Export...' : 'Exporter'}
            </ActionButton>
            <ActionButton onClick={() => void loadGrid()} icon={RefreshCw}>
              Actualiser
            </ActionButton>
            {canWrite('PLANNING') && (
              <ActionButton onClick={() => route(ROUTES.PRODUCTION_PLANNING_AUTO)} icon={Plus} variant="accent">
                Planifier
              </ActionButton>
            )}
          </>
        }
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_MANUEL)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Manuel
        </button>
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_AUTO)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Auto
        </button>
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_ANALYSE)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Analyse
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Annee</label>
              <select
                value={annee}
                onChange={(e) => setAnnee(parseInt((e.target as HTMLSelectElement).value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {annees.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Semaine</label>
              <select
                value={semaine}
                onChange={(e) => setSemaine(parseInt((e.target as HTMLSelectElement).value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-64"
              >
                {weeks.length > 0 ? (
                  weeks.map((w) => (
                    <option key={`${w.annee}-${w.numero}`} value={w.numero}>
                      {w.label}
                    </option>
                  ))
                ) : (
                  Array.from({ length: 52 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      S{String(idx + 1).padStart(2, '0')}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Unite production</label>
              <select
                value={unite}
                onChange={(e) => setUnite((e.target as HTMLSelectElement).value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-44"
              >
                {unites.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Article</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  list="planning-articles-list"
                  value={articleQuery}
                  onChange={(e) => setArticleQuery((e.target as HTMLInputElement).value)}
                  placeholder="Code article"
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm min-w-48"
                />
                <datalist id="planning-articles-list">
                  {articlesOptions.map((a) => (
                    <option key={a.ID} value={a.Code_article}>
                      {a.Code_article} {a.Client ? `- ${a.Client}` : ''}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Priorite</label>
              <div className="flex items-center gap-1">
                {(['basse', 'normale', 'haute', 'urgente'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePriorite(p)}
                    className={`px-2 py-1 rounded text-xs capitalize ${priorityClass(p)}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Planning de production - {selectedWeekLabel}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left w-8">N°</th>
                  <th className="px-2 py-2 text-left flex-1 min-w-max">Article</th>
                  <th className="px-2 py-2 text-left w-16">Lot</th>
                  <th className="px-2 py-2 text-left w-16">Priorite</th>
                  <th className="px-2 py-2 text-left w-20">Date debut</th>
                  <th className="px-2 py-2 text-right w-16">Qte totale</th>
                  <th className="px-2 py-2 text-right w-20">Quantite a facturer</th>
                  <th className="px-2 py-2 text-right w-12">Reste</th>
                  <th className="px-2 py-2 text-right w-16">Stock emballe</th>
                  <th className="px-2 py-2 text-right w-16">Stock non emballe</th>
                  {DAYS.map((day) => (
                    <th key={day.key} className="px-1 py-2 text-center text-xs">{day.label} P/E</th>
                  ))}
                  <th className="px-1 py-2 text-center text-xs">Total P/E</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={17} className="px-3 py-8 text-center text-gray-500">
                      Aucune ligne de planning pour cette semaine
                    </td>
                  </tr>
                )}
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs">{index + 1}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => void openArticleModal(row.article_id)}
                        className="font-medium text-blue-700 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        {row.article_code || '-'}
                      </button>
                      <div className="text-xs text-gray-500">{row.article_nom || ''}</div>
                    </td>
                    <td className="px-2 py-2 text-xs">{row.lot || '-'}</td>
                    <td className="px-2 py-2">
                      <span className="px-1 py-0.5 rounded text-xs capitalize bg-gray-100 text-gray-700">
                        {row.priorite || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={row.date_debut_planification || ''}
                        min={selectedWeek?.dateDebut}
                        max={selectedWeek?.dateFin}
                        onChange={(e) => void handleDateDebutChange(row, (e.target as HTMLInputElement).value)}
                        className="px-1 py-1 border border-gray-300 rounded text-xs w-full"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-xs">{row.quantite_totale}</td>
                    <td className="px-2 py-2 text-right text-xs">{row.quantite_facturee_semaine ?? row.quantite_facturee}</td>
                    <td className="px-2 py-2 text-right text-xs">{row.reste_a_facturer}</td>
                    <td className="px-2 py-2 text-right text-xs">{row.quantite_emballee_commande}</td>
                    <td className="px-2 py-2 text-right text-xs">{row.stock_non_emballe}</td>
                    {DAYS.map((day, dayIndex) => {
                      const dayInfo = getDayDateString(row, dayIndex);
                      const disabled = dayInfo?.isBeforeStart || false;
                      return (
                        <td key={day.key} className={`px-1 py-2 text-center text-xs ${disabled ? 'bg-gray-100' : ''}`}>
                          <button
                            disabled={disabled}
                            onClick={() => openEditModal(row, day.key)}
                            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                            title="Editer la cellule"
                          >
                            {row.planification[day.key].planifie}/{row.planification[day.key].emballe}
                            <Edit3 className="w-2 h-2 text-gray-500" />
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-1 py-2 text-center text-xs font-medium">
                      {row.total_planifie_semaine}/{row.total_emballe_semaine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Recapitulatif</h3>
        <p className="text-sm text-gray-700">
          Total planifie semaine: <b>{recapFiltered.total_planifie}</b> pcs
          {' | '}Total emballe: <b>{recapFiltered.total_emballe}</b> pcs
          {' | '}Reste a facturer: <b>{recapFiltered.total_reste}</b> pcs
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Stock non emballe: <b>{recapFiltered.total_stock_non_emballe}</b>
          {' | '}Ecart global planification: <b>{recapFiltered.total_planifie - recapFiltered.total_reste}</b>
        </p>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Modifier cellule</h3>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">X</button>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                {editing.row.article_code || '-'} - Lot {editing.row.lot || '-'} - {editing.day}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Planifie</label>
                <input
                  type="number"
                  min={0}
                  value={editPlanifie}
                  onChange={(e) => setEditPlanifie(Math.max(0, parseInt((e.target as HTMLInputElement).value || '0', 10)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Emballe</label>
                <input
                  type="number"
                  min={0}
                  value={editEmballe}
                  onChange={(e) => setEditEmballe(Math.max(0, parseInt((e.target as HTMLInputElement).value || '0', 10)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Action rapide</label>
              <select
                value={copyTarget}
                onChange={(e) => setCopyTarget((e.target as HTMLSelectElement).value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">Ne pas copier</option>
                <option value="jeudi">Copier vers jeudi</option>
                <option value="vendredi">Copier vers vendredi</option>
                <option value="semaine">Copier vers toute la semaine</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeEditModal}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                disabled={savingCell}
                onClick={() => void saveCellEdit()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {savingCell ? 'Mise a jour...' : 'Mettre a jour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(articleModal || articleLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Documents Article</h3>
              <button onClick={() => setArticleModal(null)} className="text-gray-500 hover:text-gray-700">X</button>
            </div>
            {articleLoading ? (
              <div className="text-sm text-gray-600">Chargement...</div>
            ) : articleModal ? (
              <>
                <div className="text-sm text-gray-700">
                  <div><b>Code:</b> {articleModal.Code_article || '-'}</div>
                  <div><b>Client:</b> {articleModal.Client || '-'}</div>
                  <div><b>Revision:</b> {articleModal.Indice_revision || '-'}</div>
                  <div><b>Ctrl elect:</b> {articleModal.Ctrl_elect_disponible ? 'Disponible' : 'Non'}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a href={articleModal.Lien_dossier_client || '#'} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded border text-sm text-center ${articleModal.Lien_dossier_client ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400 pointer-events-none'}`}>
                    Dossier client
                  </a>
                  <a href={articleModal.Lien_photo || '#'} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded border text-sm text-center ${articleModal.Lien_photo ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400 pointer-events-none'}`}>
                    Photo
                  </a>
                  <a href={articleModal.Lien_dossier_technique || '#'} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded border text-sm text-center ${articleModal.Lien_dossier_technique ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400 pointer-events-none'}`}>
                    Dossier technique
                  </a>
                </div>
                <div className="text-sm text-gray-600">
                  <b>Commentaire:</b> {articleModal.Commentaire || 'Non renseigne'}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;




