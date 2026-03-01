import type { FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X
} from 'lucide-preact';
import PersonnelActionButton from '../../components/personnel/PersonnelActionButton';
import PageHeader from '../../components/common/PageHeader';
import PersonnelFilterPanel from '../../components/personnel/PersonnelFilterPanel';
import horairesApi from '../../api/horaires';
import type { CreateHoraireDto, Horaire, JourSemaine, TypeChome } from '../../types/horaires.types';
import { showToast } from '../../utils/toast';
import { usePermissions } from '../../hooks/usePermissions';

interface HorairesPageProps {
  path?: string;
}

type ViewMode = 'week' | 'month';
type QuickFilter = 'all' | 'open' | 'holiday' | 'chome';

const jours: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const typesChome: TypeChome[] = ['non_chomé', 'chomé_payé', 'chomé_non_payé'];

const initialForm: CreateHoraireDto = {
  Date: '',
  Jour_semaine: 'Lundi',
  Heure_debut: '08:00',
  Heure_fin: '17:00',
  Pause_debut: '12:00',
  Pause_fin: '13:00',
  Heure_supp_debut: '',
  Heure_supp_fin: '',
  Est_ouvert: 1,
  Est_jour_ferie: 0,
  Type_chome: 'non_chomé',
  Description: '',
  Commentaire: ''
};

const toApiTime = (value?: string | null) => (value ? `${value}:00` : null);

const pad = (n: number) => n.toString().padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const normalizeApiDate = (raw: string) => {
  const asString = String(raw || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return asString.slice(0, 10);
  return toISODate(parsed);
};
const fromISODate = (iso: string) => new Date(`${iso}T00:00:00`);
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
};
const getWeekDates = (start: Date) => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  return d;
});
const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};
const getMonthGrid = (date: Date) => {
  const { start, end } = getMonthRange(date);
  const startDay = start.getDay() || 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - (startDay - 1));
  const totalDays = Math.ceil((end.getTime() - gridStart.getTime()) / 86400000) + 1;
  const weeks = Math.ceil(totalDays / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
};

export const Horaires: FunctionComponent<HorairesPageProps> = () => {
  const { canWrite } = usePermissions();
  const [items, setItems] = useState<Horaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [dayFilters, setDayFilters] = useState<Record<JourSemaine, boolean>>({
    Lundi: true,
    Mardi: true,
    Mercredi: true,
    Jeudi: true,
    Vendredi: true,
    Samedi: false,
    Dimanche: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateHoraireDto>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weekStart = useMemo(() => getWeekStart(cursorDate), [cursorDate]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const monthGrid = useMemo(() => getMonthGrid(cursorDate), [cursorDate]);
  const monthRange = useMemo(() => getMonthRange(cursorDate), [cursorDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const range = viewMode === 'week'
        ? { start: weekStart, end: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6) }
        : monthRange;
      const response = await horairesApi.getByPeriode(toISODate(range.start), toISODate(range.end));
      const normalized = (response.data.data || []).map((item: Horaire) => ({
        ...item,
        Date: normalizeApiDate(item.Date),
      }));
      setItems(normalized);
    } catch {
      showToast.error('Erreur lors du chargement des horaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewMode, weekStart.getTime(), monthRange.start.getTime(), monthRange.end.getTime()]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!dayFilters[item.Jour_semaine]) return false;
      if (quickFilter === 'open' && !item.Est_ouvert) return false;
      if (quickFilter === 'holiday' && !item.Est_jour_ferie) return false;
      if (quickFilter === 'chome' && item.Type_chome === 'non_chomé') return false;
      return true;
    });
  }, [items, dayFilters, quickFilter]);

  const byDate = useMemo(() => {
    const map: Record<string, Horaire> = {};
    filtered.forEach((h) => { map[h.Date] = h; });
    return map;
  }, [filtered]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const openCreate = (date?: Date) => {
    resetForm();
    if (date) {
      const iso = toISODate(date);
      const day = jours[date.getDay() === 0 ? 6 : date.getDay() - 1];
      setForm((prev) => ({ ...prev, Date: iso, Jour_semaine: day }));
    }
    setIsModalOpen(true);
  };

  const openEdit = (item: Horaire) => {
    setEditingId(item.ID);
    setForm({
      Date: item.Date,
      Jour_semaine: item.Jour_semaine,
      Heure_debut: item.Heure_debut?.slice(0, 5),
      Heure_fin: item.Heure_fin?.slice(0, 5),
      Pause_debut: item.Pause_debut ? item.Pause_debut.slice(0, 5) : '',
      Pause_fin: item.Pause_fin ? item.Pause_fin.slice(0, 5) : '',
      Heure_supp_debut: item.Heure_supp_debut ? item.Heure_supp_debut.slice(0, 5) : '',
      Heure_supp_fin: item.Heure_supp_fin ? item.Heure_supp_fin.slice(0, 5) : '',
      Est_ouvert: item.Est_ouvert,
      Est_jour_ferie: item.Est_jour_ferie,
      Type_chome: item.Type_chome,
      Description: item.Description || '',
      Commentaire: item.Commentaire || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (!form.Date || !form.Heure_debut || !form.Heure_fin) {
      showToast.error('Date, heure debut et heure fin sont requis');
      return;
    }

    const payload: CreateHoraireDto = {
      ...form,
      Heure_debut: toApiTime(form.Heure_debut) || '08:00:00',
      Heure_fin: toApiTime(form.Heure_fin) || '17:00:00',
      Pause_debut: toApiTime(form.Pause_debut || null),
      Pause_fin: toApiTime(form.Pause_fin || null),
      Heure_supp_debut: toApiTime(form.Heure_supp_debut || null),
      Heure_supp_fin: toApiTime(form.Heure_supp_fin || null)
    };

    try {
       setIsSaving(true);
       if (editingId) {
         await horairesApi.update(editingId, payload);
         showToast.success('Horaire modifie');
       } else {
         await horairesApi.create(payload);
         showToast.success('Horaire cree');
       }
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch {
      showToast.error('Erreur lors de lenregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Supprimer cet horaire ?')) return;
    try {
      await horairesApi.delete(id);
      showToast.success('Horaire supprime');
      await loadData();
    } catch {
      showToast.error('Erreur lors de la suppression');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onExport = async () => {
    try {
      setIsExporting(true);
      const response = await horairesApi.exportXlsx();
      downloadBlob(response.data, `horaires_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast.success('Export xlsx termine');
    } catch {
      showToast.error('Erreur export xlsx');
    } finally {
      setIsExporting(false);
    }
  };

  const onTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await horairesApi.getTemplateImport();
      downloadBlob(response.data, 'template_horaires.xlsx');
      showToast.success('Template telecharge');
    } catch {
      showToast.error('Erreur telechargement template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await horairesApi.importFile(file);
      showToast.success('Import termine');
      await loadData();
    } catch (err: any) {
      const msg = err?.error || err?.response?.data?.error || 'Erreur import';
      const details = err?.details || err?.response?.data?.details;
      showToast.error(msg);
      if (Array.isArray(details) && details.length > 0) {
        showToast.error(details.slice(0, 3).join(' | '));
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const monthLabel = cursorDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekNumber = getWeekNumber(cursorDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horaires"
        subtitle="Gestion des horaires de travail"
        showTemplate={canWrite('HORAIRES')}
        showImport={canWrite('HORAIRES')}
        showExport={true}
        showRefresh={true}
        onTemplate={onTemplate}
        onImport={onImportClick}
        onExport={onExport}
        onRefresh={loadData}
        isDownloadingTemplate={isDownloadingTemplate}
        isImporting={isImporting}
        isExporting={isExporting}
        isRefreshing={false}
        actions={
          canWrite('HORAIRES') ? (
            <PersonnelActionButton onClick={() => openCreate()} icon={Plus} variant="accent">
              Ajouter
            </PersonnelActionButton>
          ) : null
        }
      />

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onImportFileChange} className="hidden" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, cursorDate.getDate()))} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">{monthLabel}</div>
            <button onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, cursorDate.getDate()))} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-sm text-gray-500 ml-3">Semaine {weekNumber}</div>
            <button onClick={() => setCursorDate(new Date())} className="ml-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Aujourd hui
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button onClick={() => setViewMode('week')} className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                Semaine
              </button>
              <button onClick={() => setViewMode('month')} className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                Mois
              </button>
            </div>
          </div>
        </div>

      </div>

      <PersonnelFilterPanel title="Filtres">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Filtrer:</span>
            {(['all', 'open', 'holiday', 'chome'] as QuickFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setQuickFilter(f)}
                className={`px-3 py-1.5 rounded-lg border ${quickFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {f === 'all' && 'Tous'}
                {f === 'open' && 'Ouverts'}
                {f === 'holiday' && 'Feries'}
                {f === 'chome' && 'Chomes'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            {jours.map((j) => (
              <label key={j} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dayFilters[j]}
                  onChange={(e) => setDayFilters((prev) => ({ ...prev, [j]: (e.target as HTMLInputElement).checked }))}
                />
                <span>{j}</span>
              </label>
            ))}
          </div>
        </div>
      </PersonnelFilterPanel>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">Chargement...</div>
      ) : viewMode === 'week' ? (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {weekDates.map((d) => {
              const iso = toISODate(d);
              const item = byDate[iso];
              const dayName = jours[d.getDay() === 0 ? 6 : d.getDay() - 1];
              return (
                <div key={iso} className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500">{dayName.toUpperCase()} {pad(d.getDate())}</div>
                  {item ? (
                    <>
                      <div className="mt-2 text-sm text-gray-800">
                        {item.Heure_debut?.slice(0, 5)} - {item.Heure_fin?.slice(0, 5)}
                      </div>
                      {item.Pause_debut && item.Pause_fin && (
                        <div className="text-xs text-gray-500">Pause {item.Pause_debut.slice(0, 5)} - {item.Pause_fin.slice(0, 5)}</div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {canWrite('HORAIRES') && (
                          <button onClick={() => openEdit(item)} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Modifier</button>
                        )}
                        {item.Est_jour_ferie ? (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Ferie</span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="mt-3">
                      {canWrite('HORAIRES') && (
                        <PersonnelActionButton onClick={() => openCreate(d)}>
                          Ajouter
                        </PersonnelActionButton>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((d) => {
              const iso = toISODate(d);
              const item = byDate[iso];
              const inMonth = d.getMonth() === cursorDate.getMonth();
              const totalHours = item ? `${item.Heure_debut?.slice(0, 5)}-${item.Heure_fin?.slice(0, 5)}` : '';
              return (
                <div
                  key={iso}
                  className={`min-h-[72px] border rounded-lg p-2 ${inMonth ? 'border-gray-200' : 'border-gray-100 text-gray-400'} hover:bg-gray-50`}
                  onClick={() => (item ? openEdit(item) : openCreate(d))}
                >
                  <div className="text-xs">{d.getDate()}</div>
                  {totalHours && <div className="text-[11px] text-gray-600 mt-1">{totalHours}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier horaire' : 'Nouvel horaire'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  Date
                  <input type="date" value={form.Date} onChange={(e) => setForm((prev) => ({ ...prev, Date: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </label>
                <label className="text-sm text-gray-700">
                  Jour
                  <select value={form.Jour_semaine} onChange={(e) => setForm((prev) => ({ ...prev, Jour_semaine: (e.target as HTMLSelectElement).value as JourSemaine }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {jours.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-800 mb-2">Horaires normales</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">
                    Heure debut
                    <input type="time" value={form.Heure_debut} onChange={(e) => setForm((prev) => ({ ...prev, Heure_debut: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                  <label className="text-sm text-gray-700">
                    Heure fin
                    <input type="time" value={form.Heure_fin} onChange={(e) => setForm((prev) => ({ ...prev, Heure_fin: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                  <label className="text-sm text-gray-700">
                    Pause debut
                    <input type="time" value={form.Pause_debut || ''} onChange={(e) => setForm((prev) => ({ ...prev, Pause_debut: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                  <label className="text-sm text-gray-700">
                    Pause fin
                    <input type="time" value={form.Pause_fin || ''} onChange={(e) => setForm((prev) => ({ ...prev, Pause_fin: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-800 mb-2">Heures supplementaires</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">
                    Debut
                    <input type="time" value={form.Heure_supp_debut || ''} onChange={(e) => setForm((prev) => ({ ...prev, Heure_supp_debut: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                  <label className="text-sm text-gray-700">
                    Fin
                    <input type="time" value={form.Heure_supp_fin || ''} onChange={(e) => setForm((prev) => ({ ...prev, Heure_supp_fin: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-800 mb-2">Parametres</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={Boolean(form.Est_ouvert)} onChange={(e) => setForm((prev) => ({ ...prev, Est_ouvert: (e.target as HTMLInputElement).checked ? 1 : 0 }))} />
                    Ouvert
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={Boolean(form.Est_jour_ferie)} onChange={(e) => setForm((prev) => ({ ...prev, Est_jour_ferie: (e.target as HTMLInputElement).checked ? 1 : 0 }))} />
                    Jour ferie
                  </label>
                  <label className="text-sm text-gray-700">
                    Type
                    <select value={form.Type_chome} onChange={(e) => setForm((prev) => ({ ...prev, Type_chome: (e.target as HTMLSelectElement).value as TypeChome }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {typesChome.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-gray-700">
                    Description
                    <input value={form.Description || ''} onChange={(e) => setForm((prev) => ({ ...prev, Description: (e.target as HTMLInputElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </label>
                  <label className="text-sm text-gray-700 md:col-span-2">
                    Commentaire
                    <textarea value={form.Commentaire || ''} onChange={(e) => setForm((prev) => ({ ...prev, Commentaire: (e.target as HTMLTextAreaElement).value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'Sauvegarde...' : 'Sauver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Horaires;
