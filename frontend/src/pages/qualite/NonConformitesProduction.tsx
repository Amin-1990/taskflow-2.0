import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Download, Upload, Plus, Edit2, Trash2, Search } from 'lucide-preact';
import qualiteApi, { type CreateDefautProcessDto } from '../../api/qualite';
import type { DefautProcess, GraviteDefaut } from '../../types/qualite.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';

interface NonConformitesProductionProps {
  path?: string;
}

const gravites: GraviteDefaut[] = ['Mineure', 'Majeure', 'Critique', 'Bloquante'];

const initialForm: CreateDefautProcessDto = {
  ID_Article: 0,
  Code_article: '',
  Code_defaut: '',
  Description_defaut: '',
  ID_Poste: null,
  Gravite: 'Mineure',
  Quantite_concernee: 1,
  Impact_production: null,
  Commentaire: ''
};

export const NonConformitesProduction: FunctionComponent<NonConformitesProductionProps> = () => {
  const [items, setItems] = useState<DefautProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [graviteFilter, setGraviteFilter] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateDefautProcessDto>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await qualiteApi.getDefautsProcess();
      setItems(response.data.data || []);
    } catch (error) {
      showToast.error('Erreur lors du chargement des non conformites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch = !q ||
        item.Code_article.toLowerCase().includes(q) ||
        item.Code_defaut.toLowerCase().includes(q) ||
        (item.Description_defaut || '').toLowerCase().includes(q);
      const matchGravite = !graviteFilter || item.Gravite === graviteFilter;
      return matchSearch && matchGravite;
    });
  }, [items, search, graviteFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (!form.ID_Article || !form.Code_article.trim() || !form.Code_defaut.trim() || !form.Description_defaut.trim()) {
      showToast.error('ID Article, code article, code defaut et description sont requis');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await qualiteApi.updateDefautProcess(editingId, form);
        showToast.success('Non conformite modifiee');
      } else {
        await qualiteApi.createDefautProcess(form);
        showToast.success('Non conformite creee');
      }
      resetForm();
      await loadData();
    } catch (error) {
      showToast.error('Erreur lors de lenregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (item: DefautProcess) => {
    setEditingId(item.ID);
    setForm({
      ID_Article: item.ID_Article,
      Code_article: item.Code_article,
      Code_defaut: item.Code_defaut,
      Description_defaut: item.Description_defaut,
      ID_Poste: item.ID_Poste,
      Gravite: item.Gravite,
      Quantite_concernee: item.Quantite_concernee,
      Impact_production: item.Impact_production,
      Commentaire: item.Commentaire || ''
    });
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette non conformite ?')) return;
    try {
      await qualiteApi.deleteDefautProcess(id);
      showToast.success('Non conformite supprimee');
      await loadData();
    } catch (error) {
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
      const response = await qualiteApi.exportDefautsProcessXlsx();
      downloadBlob(response.data, `defauts_process_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast.success('Export xlsx termine');
    } catch (error) {
      showToast.error('Erreur export xlsx');
    } finally {
      setIsExporting(false);
    }
  };

  const onTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await qualiteApi.getTemplateDefautsProcess();
      downloadBlob(response.data, 'template_defauts_process.xlsx');
      showToast.success('Template telecharge');
    } catch (error) {
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
      await qualiteApi.importDefautsProcess(file);
      showToast.success('Import termine');
      await loadData();
    } catch (error) {
      showToast.error('Erreur import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Non conformites de production"
        subtitle={`Total: ${items.length}`}
        actions={
          <>
            <ActionButton onClick={onTemplate} loading={isDownloadingTemplate} icon={Download}>
              {isDownloadingTemplate ? 'Template...' : 'Template'}
            </ActionButton>
            <ActionButton onClick={onImportClick} loading={isImporting} icon={Upload}>
              {isImporting ? 'Import...' : 'Importer'}
            </ActionButton>
            <ActionButton onClick={onExport} loading={isExporting} icon={Download}>
              {isExporting ? 'Export...' : 'Exporter'}
            </ActionButton>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onImportFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="number"
            value={form.ID_Article || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, ID_Article: Number((e.target as HTMLInputElement).value) }))}
            placeholder="ID Article *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Code_article}
            onChange={(e) => setForm((prev) => ({ ...prev, Code_article: (e.target as HTMLInputElement).value }))}
            placeholder="Code article *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Code_defaut}
            onChange={(e) => setForm((prev) => ({ ...prev, Code_defaut: (e.target as HTMLInputElement).value }))}
            placeholder="Code defaut *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Description_defaut}
            onChange={(e) => setForm((prev) => ({ ...prev, Description_defaut: (e.target as HTMLInputElement).value }))}
            placeholder="Description defaut *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={form.Gravite}
            onChange={(e) => setForm((prev) => ({ ...prev, Gravite: (e.target as HTMLSelectElement).value as GraviteDefaut }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {gravites.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <input
            type="number"
            value={form.ID_Poste ?? ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                ID_Poste: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
              }))
            }
            placeholder="ID Poste"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            value={form.Quantite_concernee ?? 1}
            onChange={(e) => setForm((prev) => ({ ...prev, Quantite_concernee: Number((e.target as HTMLInputElement).value) }))}
            placeholder="Quantite"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            value={form.Impact_production ?? ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                Impact_production: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
              }))
            }
            placeholder="Impact production"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Commentaire || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, Commentaire: (e.target as HTMLInputElement).value }))}
            placeholder="Commentaire"
            className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
          />

          <div className="md:col-span-5 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <FilterPanel title="Recherche et filtres">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder="Rechercher article, code defaut, description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={graviteFilter}
            onChange={(e) => setGraviteFilter((e.target as HTMLSelectElement).value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Toutes gravites</option>
            {gravites.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Article</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Defaut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Gravite</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Quantite</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {item.Date_defaut ? new Date(item.Date_defaut).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.Code_article}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium text-blue-600">{item.Code_defaut}</div>
                    <div className="text-xs text-gray-500">{item.Description_defaut}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.Gravite}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.Quantite_concernee}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(item)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item.ID)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FilterPanel>
    </div>
  );
};

export default NonConformitesProduction;
