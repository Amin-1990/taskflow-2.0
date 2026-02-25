import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Download, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-preact';
import { affectationsApi } from '../../api/affectations';
import { commandesApi } from '../../api/commandes';
import { personnelAPI } from '../../api/personnel';
import { filtresApi } from '../../api/filtres';
import { postesApi } from '../../api/postes';
import ActionButton from '../../components/common/ActionButton';
import FilterPanel from '../../components/common/FilterPanel';
import PageHeader from '../../components/common/PageHeader';
import type { Affectation, AffectationFilters, CreateAffectationPayload, UpdateAffectationPayload } from '../../types/affectations.types';
import { showToast } from '../../utils/toast';
import { usePermissions } from '../../hooks/usePermissions';

interface AffectationsGestionProps { path?: string }
interface EditableAffectation extends Affectation { _isNew?: boolean; _dirty?: boolean }
interface FiltersState extends AffectationFilters { recherche: string }
interface Option { id: number; label: string }
interface WeekOption extends Option { code?: string }
interface ArticleOpt { id: number; code: string }
interface WeekCmd { commandeId: number; articleId: number; code: string }

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const toInputDateTime = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : '');
const fromInputDateTime = (v: string) => (v ? new Date(v).toISOString() : null);
const toNumOrNull = (v: string) => (!v.trim() ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const csvEscape = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
};

const defaultRange = () => {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { dateDebut: toDateInput(start), dateFin: toDateInput(end) };
};

const newRow = (commandeId?: number): EditableAffectation => ({
  ID: -Date.now(),
  ID_Commande: commandeId || 0,
  ID_Operateur: 0,
  ID_Poste: 0,
  ID_Article: null,
  ID_Semaine: null,
  Date_debut: new Date().toISOString(),
  Date_fin: null,
  Duree: null,
  Heure_supp: null,
  Quantite_produite: null,
  Date_creation: new Date().toISOString(),
  Date_modification: null,
  Commentaire: '',
  Code_article: null,
  Lot: null,
  Operateur_nom: null,
  Poste_nom: null,
  _isNew: true,
  _dirty: true,
});

export const AffectationsGestion: FunctionComponent<AffectationsGestionProps> = () => {
  const { canWrite } = usePermissions();
  const dRange = useMemo(() => defaultRange(), []);
  const [rows, setRows] = useState<EditableAffectation[]>([]);
  const [filters, setFilters] = useState<FiltersState>({ ...dRange, recherche: '' });
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [operateurs, setOperateurs] = useState<Option[]>([]);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [postes, setPostes] = useState<Option[]>([]);
  const [weekCmds, setWeekCmds] = useState<Record<number, WeekCmd[]>>({});
  const [opQuery, setOpQuery] = useState<Record<number, string>>({});
  const [artQuery, setArtQuery] = useState<Record<number, string>>({});
  const [posteQuery, setPosteQuery] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const opById = useMemo(() => new Map(operateurs.map((o) => [o.id, o.label])), [operateurs]);
  const posteById = useMemo(() => new Map(postes.map((p) => [p.id, p.label])), [postes]);
  const weekById = useMemo(() => new Map(weeks.map((w) => [w.id, w.label])), [weeks]);

  const loadLookups = async () => {
    try {
      const y1 = new Date(`${filters.dateDebut}T00:00:00`).getFullYear();
      const y2 = new Date(`${filters.dateFin}T00:00:00`).getFullYear();
      const [pers, s1, s2, p] = await Promise.all([
        personnelAPI.getAll(),
        filtresApi.getSemaines(y1),
        y2 !== y1 ? filtresApi.getSemaines(y2) : Promise.resolve({ data: { data: [] } } as any),
        postesApi.getAll(),
      ]);
      setOperateurs((pers || []).map((x: any) => ({ id: Number(x.ID), label: String(x.Nom_prenom) })));
      const wk = [...(s1.data.data || []), ...(s2.data.data || [])] as any[];
      const uniq = new Map<number, WeekOption>();
      wk.forEach((w) => uniq.set(Number(w.ID), { id: Number(w.ID), label: `${String(w.Numero_semaine).padStart(2, '0')}-${w.Annee}`, code: String(w.Code_semaine || '') }));
      setWeeks(Array.from(uniq.values()));
      setPostes(((p.data.data || []) as any[]).map((x) => ({ id: Number(x.ID), label: String(x.Description) })));
    } catch {
      setOperateurs([]); setWeeks([]); setPostes([]);
    }
  };

  const loadData = async () => {
    if (!filters.dateDebut || !filters.dateFin) return;
    try {
      setLoading(true);
      const r = await affectationsApi.getList({
        dateDebut: filters.dateDebut, dateFin: filters.dateFin, operateurId: filters.operateurId, commandeId: filters.commandeId, posteId: filters.posteId, enCours: filters.enCours,
      });
      const data = (r.data.data || []) as Affectation[];
      setRows(data.map((x) => ({ ...x, Commentaire: x.Commentaire || '' })));
      setSelected(new Set()); setOpQuery({}); setArtQuery({}); setPosteQuery({}); setPage(1);
    } catch (e: any) {
      showToast.error(e?.error || e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void Promise.all([loadLookups(), loadData()]); }, []);

  const weekIds = useMemo(() => Array.from(new Set(rows.map((r) => r.ID_Semaine).filter((x): x is number => Number.isInteger(x) && Number(x) > 0))), [rows]);
  useEffect(() => {
    const missing = weekIds.filter((id) => !weekCmds[id]);
    if (missing.length === 0) return;
    void (async () => {
      try {
        const res = await Promise.all(missing.map((id) => commandesApi.getBySemaine(id)));
        setWeekCmds((prev) => {
          const next = { ...prev };
          res.forEach((r, idx) => {
            next[missing[idx]] = ((r.data.data || []) as any[])
              .map((x) => ({ commandeId: Number(x.ID), articleId: Number(x.ID_Article), code: String(x.Code_article || x.Article_code || '') }))
              .filter((x) => x.commandeId > 0 && x.articleId > 0 && x.code);
          });
          return next;
        });
      } catch { }
    })();
  }, [weekIds, weekCmds]);

  const articlesForRow = (row: EditableAffectation): ArticleOpt[] => {
    const w = row.ID_Semaine;
    if (!w || !weekCmds[w]) return [];
    let entries = weekCmds[w];
    if (row.ID_Commande) entries = entries.filter((x) => x.commandeId === row.ID_Commande);
    const uniq = new Map<number, ArticleOpt>();
    entries.forEach((e) => uniq.set(e.articleId, { id: e.articleId, code: e.code }));
    return Array.from(uniq.values()).sort((a, b) => a.code.localeCompare(b.code));
  };

  const visible = useMemo(() => {
    const q = filters.recherche.trim().toLowerCase();
    const list = rows.filter((r) => !q || [
      r.ID, opById.get(r.ID_Operateur), posteById.get(r.ID_Poste), weekById.get(r.ID_Semaine || 0), articlesForRow(r).find((a) => a.id === r.ID_Article)?.code || '',
    ].join(' ').toLowerCase().includes(q));
    return list;
  }, [rows, filters.recherche, opById, posteById, weekById, weekCmds]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => visible.slice((currentPage - 1) * pageSize, currentPage * pageSize), [visible, currentPage, pageSize]);
  const allPageSel = paged.length > 0 && paged.every((r) => selected.has(r.ID));

  const patchRow = (id: number, patch: Partial<EditableAffectation>) => setRows((prev) => prev.map((r) => (r.ID === id ? { ...r, ...patch, _dirty: true } : r)));
  const addRow = () => setRows((prev) => [newRow(filters.commandeId || rows[0]?.ID_Commande || 0), ...prev]);
  const toggleSel = (id: number) => setSelected((p) => (p.has(id) ? new Set([...p].filter((x) => x !== id)) : new Set([...p, id])));
  const toggleSelPage = () => setSelected((p) => {
    const n = new Set(p);
    if (allPageSel) paged.forEach((r) => n.delete(r.ID)); else paged.forEach((r) => n.add(r.ID));
    return n;
  });

  const saveRow = async (r: EditableAffectation) => {
    if (!r.ID_Commande || !r.ID_Operateur || !r.ID_Poste || !r.ID_Article) return false;
    try {
      if (r._isNew) {
        const p: CreateAffectationPayload = { ID_Commande: r.ID_Commande, ID_Operateur: r.ID_Operateur, ID_Poste: r.ID_Poste, ID_Article: r.ID_Article, ID_Semaine: r.ID_Semaine, Date_debut: r.Date_debut };
        await affectationsApi.create(p);
      } else {
        const p: UpdateAffectationPayload = { ID_Commande: r.ID_Commande, ID_Operateur: r.ID_Operateur, ID_Poste: r.ID_Poste, ID_Article: r.ID_Article, ID_Semaine: r.ID_Semaine, Date_debut: r.Date_debut, Date_fin: r.Date_fin, Duree: r.Duree, Heure_supp: r.Heure_supp };
        await affectationsApi.update(r.ID, p);
      }
      return true;
    } catch { return false; }
  };

  const saveAll = async () => {
    const dirty = rows.filter((r) => r._dirty);
    if (dirty.length === 0) return showToast.info('Aucune modification');
    try {
      setSavingAll(true);
      let ok = 0;
      for (const r of dirty) { if (await saveRow(r)) ok += 1; } // eslint-disable-line no-await-in-loop
      await loadData();
      showToast.success(`${ok} ligne(s) enregistree(s)`);
    } finally {
      setSavingAll(false);
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return showToast.info('Aucune ligne selectionnee');
    for (const id of ids) { // eslint-disable-line no-restricted-syntax
      const row = rows.find((r) => r.ID === id);
      if (!row) continue;
      if (row._isNew) setRows((p) => p.filter((x) => x.ID !== id)); else await affectationsApi.delete(id); // eslint-disable-line no-await-in-loop
    }
    await loadData();
    showToast.success('Suppression terminee');
  };

  const template = () => {
    void (async () => {
      try {
        const response = await affectationsApi.getTemplateImport();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_affectations.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e: any) {
        showToast.error(e?.error || e?.message || 'Erreur telechargement template');
      }
    })();
  };

  const exportCsv = () => {
    const headers = ['ID', 'ID_Commande', 'Operateur_nom', 'Code_article', 'Poste_description', 'Semaine', 'Date_debut', 'Date_fin', 'Duree', 'Heure_supp'];
    const lines = visible.map((r) => [
      r.ID, r.ID_Commande, opById.get(r.ID_Operateur) || '', articlesForRow(r).find((a) => a.id === r.ID_Article)?.code || '',
      posteById.get(r.ID_Poste) || '', weekById.get(r.ID_Semaine || 0) || '', r.Date_debut || '', r.Date_fin || '', r.Duree ?? '', r.Heure_supp ?? '',
    ]);
    const csv = [headers.join(','), ...lines.map((l) => l.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `affectations_export_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const importXlsx = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await affectationsApi.importFile(file);
      await loadData();
      showToast.success('Import XLSX termine');
    } catch (e: any) {
      showToast.error(e?.error || e?.message || 'Erreur import');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestion des affectations" subtitle="Import, export, edition et pagination" actions={
        <>
          {canWrite('AFFECTATIONS') && <ActionButton onClick={template} icon={Download}>Template</ActionButton>}
          {canWrite('AFFECTATIONS') && <ActionButton onClick={() => fileInputRef.current?.click()} icon={Upload}>Importer</ActionButton>}
          <ActionButton onClick={exportCsv} icon={Download}>Exporter</ActionButton>
          <ActionButton onClick={async () => { await loadLookups(); await loadData(); }} icon={RefreshCw}>Actualiser</ActionButton>
        </>
      } />

      <FilterPanel title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Date debut</label>
            <input type="date" value={filters.dateDebut} onChange={(e) => setFilters((p) => ({ ...p, dateDebut: (e.target as HTMLInputElement).value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Date fin</label>
            <input type="date" value={filters.dateFin} onChange={(e) => setFilters((p) => ({ ...p, dateFin: (e.target as HTMLInputElement).value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Recherche</label>
            <input value={filters.recherche} onChange={(e) => setFilters((p) => ({ ...p, recherche: (e.target as HTMLInputElement).value }))} className="min-w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <ActionButton onClick={async () => { await loadLookups(); await loadData(); }} icon={RefreshCw}>Filtrer</ActionButton>
        </div>
      </FilterPanel>

      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={importXlsx} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Table principale</h2>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite('AFFECTATIONS') && <ActionButton onClick={addRow} icon={Plus}>Ajouter</ActionButton>}
            {canWrite('AFFECTATIONS') && <ActionButton onClick={saveAll} icon={Save} loading={savingAll}>Enregistrer</ActionButton>}
            {canWrite('AFFECTATIONS') && <ActionButton onClick={deleteSelected} icon={Trash2}>Supprimer selection</ActionButton>}
          </div>
        </div>

        {loading ? <div className="p-8 text-center text-gray-600">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left"><input type="checkbox" checked={allPageSel} onChange={toggleSelPage} /></th>
                  <th className="px-2 py-2 text-left">Affectation</th>
                  <th className="px-2 py-2 text-left">Operateur</th>
                  <th className="px-2 py-2 text-left">Semaine</th>
                  <th className="px-2 py-2 text-left">Article</th>
                  <th className="px-2 py-2 text-left">Poste</th>
                  <th className="px-2 py-2 text-left">Date debut</th>
                  <th className="px-2 py-2 text-left">Date fin</th>
                  <th className="px-2 py-2 text-left">Duree</th>
                  <th className="px-2 py-2 text-left">H. supp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.length === 0 && <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-500">Aucun enregistrement</td></tr>}
                {paged.map((row) => {
                  const opInput = `op-${row.ID}`;
                  const artInput = `art-${row.ID}`;
                  const posteInput = `poste-${row.ID}`;
                  const opVal = opQuery[row.ID] ?? opById.get(row.ID_Operateur) ?? '';
                  const posteVal = posteQuery[row.ID] ?? posteById.get(row.ID_Poste) ?? '';
                  const rowArticles = articlesForRow(row);
                  const artVal = artQuery[row.ID] ?? (rowArticles.find((a) => a.id === row.ID_Article)?.code || '');
                  const fOps = operateurs.filter((o) => o.label.toLowerCase().includes(opVal.toLowerCase())).slice(0, 20);
                  const fPostes = postes.filter((p) => p.label.toLowerCase().includes(posteVal.toLowerCase())).slice(0, 20);
                  const fArticles = rowArticles.filter((a) => a.code.toLowerCase().includes(artVal.toLowerCase())).slice(0, 20);
                  return (
                    <tr key={row.ID}>
                      <td className="px-2 py-2"><input type="checkbox" checked={selected.has(row.ID)} onChange={() => toggleSel(row.ID)} /></td>
                      <td className="px-2 py-2">{row._isNew ? 'Nouveau' : `#${row.ID}`}</td>
                      <td className="px-2 py-2">
                        <input list={opInput} value={opVal} onChange={(e) => {
                          const v = (e.target as HTMLInputElement).value;
                          setOpQuery((p) => ({ ...p, [row.ID]: v }));
                          const m = operateurs.find((o) => o.label.toLowerCase() === v.toLowerCase());
                          if (m) patchRow(row.ID, { ID_Operateur: m.id });
                        }} className="w-52 rounded border border-gray-300 px-2 py-1" />
                        <datalist id={opInput}>{fOps.map((o) => <option key={o.id} value={o.label} />)}</datalist>
                      </td>
                      <td className="px-2 py-2">
                        <select value={row.ID_Semaine || ''} onChange={(e) => {
                          const v = toNumOrNull((e.target as HTMLSelectElement).value);
                          patchRow(row.ID, { ID_Semaine: v, ID_Article: null });
                          setArtQuery((p) => ({ ...p, [row.ID]: '' }));
                        }} className="w-28 rounded border border-gray-300 px-2 py-1">
                          <option value="">Semaine</option>
                          {weeks.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input list={artInput} value={artVal} onChange={(e) => {
                          const v = (e.target as HTMLInputElement).value;
                          setArtQuery((p) => ({ ...p, [row.ID]: v }));
                          const m = rowArticles.find((a) => a.code.toLowerCase() === v.toLowerCase());
                          if (m) patchRow(row.ID, { ID_Article: m.id });
                        }} className="w-44 rounded border border-gray-300 px-2 py-1" placeholder={row.ID_Semaine ? 'Rechercher...' : 'Choisir semaine'} />
                        <datalist id={artInput}>{fArticles.map((a) => <option key={a.id} value={a.code} />)}</datalist>
                      </td>
                      <td className="px-2 py-2">
                        <input list={posteInput} value={posteVal} onChange={(e) => {
                          const v = (e.target as HTMLInputElement).value;
                          setPosteQuery((p) => ({ ...p, [row.ID]: v }));
                          const m = postes.find((p) => p.label.toLowerCase() === v.toLowerCase());
                          if (m) patchRow(row.ID, { ID_Poste: m.id });
                        }} className="w-44 rounded border border-gray-300 px-2 py-1" />
                        <datalist id={posteInput}>{fPostes.map((p) => <option key={p.id} value={p.label} />)}</datalist>
                      </td>
                      <td className="px-2 py-2"><input type="datetime-local" value={toInputDateTime(row.Date_debut)} onChange={(e) => patchRow(row.ID, { Date_debut: fromInputDateTime((e.target as HTMLInputElement).value) || row.Date_debut })} className="rounded border border-gray-300 px-2 py-1" /></td>
                      <td className="px-2 py-2"><input type="datetime-local" value={toInputDateTime(row.Date_fin)} onChange={(e) => patchRow(row.ID, { Date_fin: fromInputDateTime((e.target as HTMLInputElement).value) })} className="rounded border border-gray-300 px-2 py-1" /></td>
                      <td className="px-2 py-2"><input type="number" value={row.Duree ?? ''} onChange={(e) => patchRow(row.ID, { Duree: toNumOrNull((e.target as HTMLInputElement).value) })} className="w-20 rounded border border-gray-300 px-2 py-1" /></td>
                      <td className="px-2 py-2"><input type="number" step="0.5" value={row.Heure_supp ?? ''} onChange={(e) => patchRow(row.ID, { Heure_supp: toNumOrNull((e.target as HTMLInputElement).value) })} className="w-20 rounded border border-gray-300 px-2 py-1" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
          <div className="text-gray-600">{visible.length} enregistrement(s) | {selected.size} selectionne(s)</div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Par page</label>
            <select value={pageSize} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(1); }} className="rounded border border-gray-300 px-2 py-1">
              <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Prec</button>
            <span className="min-w-20 text-center text-gray-700">{currentPage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Suiv</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffectationsGestion;
