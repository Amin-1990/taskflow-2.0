import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Download, Upload, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-preact';
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
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [graviteFilter, setGraviteFilter] = useState<string>('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DefautProcess | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateDefautProcessDto>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await qualiteApi.getDefautsProcess();
      setItems(response.data.data || []);
    } catch {
      setError('Erreur lors du chargement des non conformites');
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

  const openEditModal = (item: DefautProcess) => {
    setEditingItem(item);
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
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!form.ID_Article || !form.Code_article.trim() || !form.Code_defaut.trim() || !form.Description_defaut.trim()) {
      showToast.error('ID Article, code article, code defaut et description sont requis');
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateDefautProcessDto = {
        ID_Article: Number(form.ID_Article),
        Code_article: form.Code_article.trim(),
        Code_defaut: form.Code_defaut.trim(),
        Description_defaut: form.Description_defaut.trim(),
        ID_Poste: form.ID_Poste ?? null,
        Gravite: form.Gravite || 'Mineure',
        Quantite_concernee: Number(form.Quantite_concernee || 1),
        Impact_production: form.Impact_production ?? null,
        Commentaire: form.Commentaire?.trim() || ''
      };

      if (editingItem) {
        await qualiteApi.updateDefautProcess(editingItem.ID, payload);
        showToast.success('Non conformite modifiee');
      } else {
        await qualiteApi.createDefautProcess(payload);
        showToast.success('Non conformite creee');
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
      await qualiteApi.deleteDefautProcess(deleteId);
      showToast.success('Non conformite supprimee');
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
      const response = await qualiteApi.exportDefautsProcessXlsx();
      downloadBlob(response.data, `defauts_process_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      const response = await qualiteApi.getTemplateDefautsProcess();
      downloadBlob(response.data, 'template_defauts_process.xlsx');
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
      await qualiteApi.importDefautsProcess(file);
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
          <p className="mt-4 text-gray-600">Chargement des non conformites...</p>
        </div>
      </div>
    );
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch((e.target as HTMLInputElement).value);
                setPage(1);
              }}
              placeholder="Rechercher article, code defaut, description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={graviteFilter}
            onChange={(e) => {
              setGraviteFilter((e.target as HTMLSelectElement).value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Toutes gravites</option>
            {gravites.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {total === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune non conformite trouvee</p>
          </div>
        ) : (
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
                {paginated.map((item) => (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier non conformite' : 'Ajouter non conformite'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Article *</label>
                <input
                  type="number"
                  value={form.ID_Article || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, ID_Article: Number((e.target as HTMLInputElement).value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code article *</label>
                <input
                  value={form.Code_article}
                  onChange={(e) => setForm((prev) => ({ ...prev, Code_article: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code defaut *</label>
                <input
                  value={form.Code_defaut}
                  onChange={(e) => setForm((prev) => ({ ...prev, Code_defaut: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description defaut *</label>
                <input
                  value={form.Description_defaut}
                  onChange={(e) => setForm((prev) => ({ ...prev, Description_defaut: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gravite</label>
                <select
                  value={form.Gravite}
                  onChange={(e) => setForm((prev) => ({ ...prev, Gravite: (e.target as HTMLSelectElement).value as GraviteDefaut }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {gravites.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Poste</label>
                <input
                  type="number"
                  value={form.ID_Poste ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ID_Poste: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantite concernee</label>
                <input
                  type="number"
                  value={form.Quantite_concernee ?? 1}
                  onChange={(e) => setForm((prev) => ({ ...prev, Quantite_concernee: Number((e.target as HTMLInputElement).value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impact production</label>
                <input
                  type="number"
                  value={form.Impact_production ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      Impact_production: (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
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
              Etes-vous sur de vouloir supprimer cette non conformite ? Cette action est irreversible.
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

export default NonConformitesProduction;
