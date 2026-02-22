import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Download, Upload, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-preact';
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DefautProduit | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateDefautProduitDto>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await qualiteApi.getDefautsProduit();
      setItems(response.data.data || []);
    } catch {
      setError('Erreur lors du chargement du referentiel');
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

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * limit, currentPage * limit),
    [filtered, currentPage, limit]
  );

  const resetForm = () => {
    setEditingItem(null);
    setForm(initialForm);
    setShowFormModal(false);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(initialForm);
    setShowFormModal(true);
  };

  const openEditModal = (item: DefautProduit) => {
    setEditingItem(item);
    setForm({
      Code_defaut: item.Code_defaut,
      Description: item.Description,
      Cout_min: item.Cout_min,
      Commentaire: item.Commentaire || ''
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!form.Code_defaut?.trim() || !form.Description?.trim()) {
      showToast.error('Code defaut et description requis');
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateDefautProduitDto = {
        Code_defaut: form.Code_defaut.trim(),
        Description: form.Description.trim(),
        Cout_min: form.Cout_min ?? null,
        Commentaire: form.Commentaire?.trim() || ''
      };

      if (editingItem) {
        await qualiteApi.updateDefautProduit(editingItem.ID, payload);
        showToast.success('Defaut modifie');
      } else {
        await qualiteApi.createDefautProduit(payload);
        showToast.success('Defaut cree');
      }

      resetForm();
      await loadData();
    } catch {
      showToast.error('Erreur lors de lenregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await qualiteApi.deleteDefautProduit(deleteId);
      showToast.success('Defaut supprime');
      setDeleteId(null);
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
      const response = await qualiteApi.exportDefautsProduitXlsx();
      downloadBlob(response.data, `defauts_produit_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      const response = await qualiteApi.getTemplateDefautsProduit();
      downloadBlob(response.data, 'template_defauts_produit.xlsx');
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
      await qualiteApi.importDefautsProduit(file);
      showToast.success('Import termine');
      await loadData();
    } catch {
      showToast.error('Erreur import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du referentiel...</p>
        </div>
      </div>
    );
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
            <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
              Ajouter
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <FilterPanel title="Recherche">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch((e.target as HTMLInputElement).value);
                setPage(1);
              }}
              placeholder="Rechercher code/description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {total === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun defaut trouve</p>
          </div>
        ) : (
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
                {paginated.map((item) => (
                  <tr key={item.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{item.Code_defaut}</td>
                    <td className="px-4 py-3 text-gray-700">{item.Description}</td>
                    <td className="px-4 py-3 text-gray-700 text-right">{item.Cout_min ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.Commentaire || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(item)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(item.ID)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-gray-600">{total} enregistrement(s)</div>
        <div className="flex items-center gap-2">
          <label className="text-gray-600">Par page</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number((e.target as HTMLSelectElement).value));
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

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier defaut' : 'Ajouter defaut'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code defaut *</label>
                <input
                  value={form.Code_defaut}
                  onChange={(e) => setForm((prev) => ({ ...prev, Code_defaut: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  value={form.Description}
                  onChange={(e) => setForm((prev) => ({ ...prev, Description: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cout minimum</label>
                <input
                  type="number"
                  value={form.Cout_min ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      Cout_min: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                <input
                  value={form.Commentaire || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, Commentaire: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : editingItem ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Etes-vous sur de vouloir supprimer ce defaut ? Cette action est irreversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferentielDefauts;
