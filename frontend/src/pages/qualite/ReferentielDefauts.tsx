import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Download, Upload, Plus, Edit2, Trash2, Search } from 'lucide-preact';
import qualiteApi, { type CreateDefautProduitDto } from '../../api/qualite';
import type { DefautProduit } from '../../types/qualite.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';

interface ReferentielDefautsProps {
  path?: string;
}

const initialForm: CreateDefautProduitDto = {
  Code_defaut: '',
  Description: '',
  Cout_min: null,
  Commentaire: ''
};

export const ReferentielDefauts: FunctionComponent<ReferentielDefautsProps> = () => {
  const [items, setItems] = useState<DefautProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateDefautProduitDto>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await qualiteApi.getDefautsProduit();
      setItems(response.data.data || []);
    } catch (error) {
      showToast.error('Erreur lors du chargement du referentiel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.Code_defaut.toLowerCase().includes(q) ||
      (item.Description || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (!form.Code_defaut?.trim() || !form.Description?.trim()) {
      showToast.error('Code defaut et description requis');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await qualiteApi.updateDefautProduit(editingId, form);
        showToast.success('Defaut modifie');
      } else {
        await qualiteApi.createDefautProduit(form);
        showToast.success('Defaut cree');
      }
      resetForm();
      await loadData();
    } catch (error) {
      showToast.error('Erreur lors de lenregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (item: DefautProduit) => {
    setEditingId(item.ID);
    setForm({
      Code_defaut: item.Code_defaut,
      Description: item.Description,
      Cout_min: item.Cout_min,
      Commentaire: item.Commentaire || ''
    });
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce defaut ?')) return;
    try {
      await qualiteApi.deleteDefautProduit(id);
      showToast.success('Defaut supprime');
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
      const response = await qualiteApi.exportDefautsProduitXlsx();
      downloadBlob(response.data, `defauts_produit_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      const response = await qualiteApi.getTemplateDefautsProduit();
      downloadBlob(response.data, 'template_defauts_produit.xlsx');
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
      await qualiteApi.importDefautsProduit(file);
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
        title="Referentiel des defauts"
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
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={form.Code_defaut}
            onChange={(e) => setForm((prev) => ({ ...prev, Code_defaut: (e.target as HTMLInputElement).value }))}
            placeholder="Code defaut *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Description}
            onChange={(e) => setForm((prev) => ({ ...prev, Description: (e.target as HTMLInputElement).value }))}
            placeholder="Description *"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            value={form.Cout_min ?? ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                Cout_min: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
              }))
            }
            placeholder="Cout minimum"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            value={form.Commentaire || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, Commentaire: (e.target as HTMLInputElement).value }))}
            placeholder="Commentaire"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />

          <div className="md:col-span-4 flex items-center gap-2">
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

      <FilterPanel title="Recherche">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Rechercher code/description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Cout min</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Commentaire</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.Code_defaut}</td>
                  <td className="px-4 py-3 text-gray-700">{item.Description}</td>
                  <td className="px-4 py-3 text-gray-700 text-right">{item.Cout_min ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{item.Commentaire || '-'}</td>
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

export default ReferentielDefauts;
