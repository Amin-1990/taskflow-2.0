import { type FunctionComponent } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-preact';
import { useDefautsTypeMachine } from '../../hooks/useDefautsTypeMachine';
import { showToast } from '../../utils/toast';
import defautsTypeMachineApi, { type DefautTypeMachine } from '../../api/defautsTypeMachine';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';
import { usePermissions } from '../../hooks/usePermissions';

interface DefautsTypeMachineProps {
  path?: string;
}

export const DefautsTypeMachine: FunctionComponent<DefautsTypeMachineProps> = () => {
  const { canWrite } = usePermissions();
  const {
    defauts,
    machineTypes,
    selectedTypeMachineId,
    setSelectedTypeMachineId,
    loading,
    error,
    page,
    limit,
    total,
    pages,
    setPage,
    setLimit,
    recherche,
    setRecherche,
    fetchData,
    createDefaut,
    updateDefaut,
    deleteDefaut,
  } = useDefautsTypeMachine();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<DefautTypeMachine | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTypeLabel = useMemo(
    () => machineTypes.find((type) => type.ID === selectedTypeMachineId)?.Type_machine || 'Aucun',
    [machineTypes, selectedTypeMachineId]
  );

  const totalPages = Math.max(1, pages || 0);
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingItem(null);
    setFormCode('');
    setFormNom('');
    setFormDescription('');
  };

  const openCreateModal = () => {
    if (!selectedTypeMachineId) {
      showToast.error('Veuillez d abord selectionner un type de machine');
      return;
    }
    setEditingItem(null);
    setFormCode('');
    setFormNom('');
    setFormDescription('');
    setShowFormModal(true);
  };

  const openEditModal = (item: DefautTypeMachine) => {
    setEditingItem(item);
    setFormCode(item.Code_defaut);
    setFormNom(item.Nom_defaut);
    setFormDescription(item.Description_defaut || '');
    setShowFormModal(true);
  };

  const handleSave = async () => {
    const code = formCode.trim();
    const nom = formNom.trim();
    const description = formDescription.trim();

    if (!code || !nom) {
      showToast.error('Code defaut et nom defaut sont requis');
      return;
    }

    if (!editingItem && !selectedTypeMachineId) {
      showToast.error('Type machine requis');
      return;
    }

    setIsSaving(true);
    try {
      const success = editingItem
        ? await updateDefaut(editingItem.ID, {
          Code_defaut: code,
          Nom_defaut: nom,
          Description_defaut: description || null
        })
        : await createDefaut({
          ID_Type_machine: selectedTypeMachineId as number,
          Code_defaut: code,
          Nom_defaut: nom,
          Description_defaut: description || null
        });

      if (success) {
        closeFormModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteDefaut(id);
    if (success) {
      setDeleteId(null);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const response = await defautsTypeMachineApi.exportXlsx();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `defauts_type_machine_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Defauts type machine exportes avec succes');
    } catch (err) {
      showToast.error('Erreur lors de export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await defautsTypeMachineApi.getTemplateImport();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_defauts_type_machine.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Template telecharge');
    } catch (err) {
      showToast.error('Erreur lors du telechargement du template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await defautsTypeMachineApi.importDefautsTypeMachine(file);
      showToast.success('Defauts type machine importes avec succes');
      await fetchData();
    } catch (err: any) {
      const message = err?.error || err?.response?.data?.error || 'Erreur lors de import';
      const details = err?.details || err?.response?.data?.details;
      showToast.error(message);
      if (Array.isArray(details) && details.length > 0) {
        showToast.error(details.slice(0, 3).join(' | '));
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && (!defauts || defauts.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des defauts type machine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Défauts par type de machine"
        subtitle="Référentiel des défauts pour chaque type de machine"
        showTemplate={canWrite('DEFAUTS_TYPE_MACHINE')}
        showImport={canWrite('DEFAUTS_TYPE_MACHINE')}
        showExport={true}
        onTemplate={handleDownloadTemplate}
        onImport={handleImportClick}
        onExport={handleExportXlsx}
        isDownloadingTemplate={isDownloadingTemplate}
        isImporting={isImporting}
        isExporting={isExporting}
        actions={
          canWrite('DEFAUTS_TYPE_MACHINE') && (
            <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
              Ajouter
            </ActionButton>
          )
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
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

      <FilterPanel title="Recherche et filtres">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de machine</label>
            <select
              value={selectedTypeMachineId || ''}
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                setSelectedTypeMachineId(value ? Number(value) : null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              {machineTypes.length === 0 && <option value="">Aucun type disponible</option>}
              {machineTypes.map((type) => (
                <option key={type.ID} value={type.ID}>
                  {type.Type_machine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par code, nom ou description..."
                value={recherche}
                onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!defauts || defauts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun defaut trouve pour le type selectionne</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Type machine</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Code_defaut</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Nom_defaut</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Description_defaut</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {defauts.map((item) => (
                  <tr key={item.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{item.Type_machine || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{item.Code_defaut}</td>
                    <td className="px-6 py-4 text-gray-700">{item.Nom_defaut}</td>
                    <td className="px-6 py-4 text-gray-700">{item.Description_defaut || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canWrite('DEFAUTS_TYPE_MACHINE') && (
                          <button
                            title="Modifier"
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canWrite('DEFAUTS_TYPE_MACHINE') && (
                          <button
                            title="Supprimer"
                            onClick={() => setDeleteId(item.ID)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier defaut' : 'Ajouter defaut'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de machine
                </label>
                <input
                  type="text"
                  value={editingItem?.Type_machine || selectedTypeLabel}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code defaut
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode((e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: DF-TM-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom defaut
                </label>
                <input
                  type="text"
                  value={formNom}
                  onChange={(e) => setFormNom((e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Surchauffe moteur"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description defaut
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription((e.target as HTMLTextAreaElement).value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Description detaillee (optionnel)"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeFormModal}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmer la suppression
            </h3>
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
                onClick={() => handleConfirmDelete(deleteId)}
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

export default DefautsTypeMachine;
