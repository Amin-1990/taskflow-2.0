import { type FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Plus, Search, Edit2, Trash2, AlertCircle, Download, Upload } from 'lucide-preact';
import { useMachines } from '../../hooks/useMachines';
import * as maintenanceApi from '../../api/maintenance';
import type { Machine } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';
import { usePermissions } from '../../hooks/usePermissions';

interface MachinesListProps {
  path?: string;
}

const statusOptions = [
  { value: 'operationnel', label: 'Operationnelle' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'hors_service', label: 'Hors service' },
];

export const Machines: FunctionComponent<MachinesListProps> = () => {
  const { canWrite } = usePermissions();
  const {
    machines,
    machineTypes,
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
    deleteMachine,
    createMachine,
    updateMachine,
    fetchMachines,
  } = useMachines();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    typeMachineId: '',
    localisation: '',
    statut: 'operationnel',
    numeroSerie: '',
    dateInstallation: '',
    description: '',
    notes: '',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, pages || 0);
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const resetForm = () => {
    setFormData({
      code: '',
      nom: '',
      typeMachineId: '',
      localisation: '',
      statut: 'operationnel',
      numeroSerie: '',
      dateInstallation: '',
      description: '',
      notes: '',
    });
    setEditingMachine(null);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  const openCreateModal = () => {
    if (machineTypes.length === 0) {
      showToast.error('Aucun type de machine disponible');
      return;
    }
    resetForm();
    setFormData((prev) => ({ ...prev, typeMachineId: String(machineTypes[0].ID) }));
    setShowFormModal(true);
  };

  const openEditModal = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      code: machine.code || '',
      nom: machine.nom || '',
      typeMachineId: machine.Type_machine_id ? String(machine.Type_machine_id) : '',
      localisation: machine.localisation || '',
      statut: machine.statut === 'operationnelle' ? 'operationnel' : String(machine.statut || 'operationnel'),
      numeroSerie: machine.numero_serie || '',
      dateInstallation: machine.date_installation ? String(machine.date_installation).slice(0, 10) : '',
      description: machine.description || '',
      notes: machine.notes || '',
    });
    setShowFormModal(true);
  };

  const handleSaveMachine = async () => {
    if (!formData.code.trim() || !formData.nom.trim() || !formData.localisation.trim()) {
      showToast.error('Code, nom et localisation sont requis');
      return;
    }
    if (!formData.typeMachineId) {
      showToast.error('Type de machine requis');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        Type_machine_id: Number(formData.typeMachineId),
        Code_interne: formData.code.trim(),
        Nom_machine: formData.nom.trim(),
        Site_affectation: formData.localisation.trim(),
        Statut_operationnel: formData.statut,
        Numero_serie: formData.numeroSerie.trim() || undefined,
        Date_installation: formData.dateInstallation || undefined,
        Description: formData.description.trim() || undefined,
        Commentaire: formData.notes.trim() || undefined,
      };

      const success = editingMachine
        ? await updateMachine(editingMachine.id || editingMachine.ID, payload as any)
        : await createMachine(payload as any);

      if (success) {
        closeFormModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteMachine(id);
    if (success) {
      setDeleteId(null);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const blob = await maintenanceApi.exportMachinesXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `machines_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Machines exportees avec succes');
    } catch (err) {
      showToast.error('Erreur lors de export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await maintenanceApi.getMachinesTemplateImport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_machines.xlsx';
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
      await maintenanceApi.importMachines(file);
      showToast.success('Machines importees avec succes');
      await fetchMachines();
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

  if (loading && (!machines || machines.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des machines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        subtitle={`Total: ${total} machine${total > 1 ? 's' : ''}`}
        actions={
          <>
            {canWrite('MACHINES') && (
              <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
                {isDownloadingTemplate ? 'Template...' : 'Template'}
              </ActionButton>
            )}
            {canWrite('MACHINES') && (
              <ActionButton onClick={handleImportClick} loading={isImporting} icon={Upload}>
                {isImporting ? 'Import...' : 'Importer'}
              </ActionButton>
            )}
            <ActionButton onClick={handleExportXlsx} loading={isExporting} icon={Download}>
              {isExporting ? 'Export...' : 'Exporter'}
            </ActionButton>
            {canWrite('MACHINES') && (
              <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
                Ajouter
              </ActionButton>
            )}
          </>
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

      <FilterPanel title="Recherche">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code, nom ou type..."
              value={recherche}
              onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!machines || machines.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune machine trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Nom</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Localisation</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Derniere maintenance</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {machines.map((machine) => (
                  <tr key={machine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{machine.code || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{machine.nom || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{machine.Type_machine || machine.type || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{machine.localisation || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{machine.statut || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {machine.date_derniere_maintenance
                        ? new Date(machine.date_derniere_maintenance).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canWrite('MACHINES') && (
                          <button
                            title="Modifier"
                            onClick={() => openEditModal(machine)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canWrite('MACHINES') && (
                          <button
                            title="Supprimer"
                            onClick={() => setDeleteId(machine.id || machine.ID)}
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
              {editingMachine ? 'Modifier machine' : 'Ajouter machine'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de machine <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.typeMachineId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, typeMachineId: (e.target as HTMLSelectElement).value }))}
                  disabled={machineTypes.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {machineTypes.length === 0 ? (
                    <option value="">Aucun type disponible</option>
                  ) : (
                    machineTypes.map((type) => (
                      <option key={type.ID} value={type.ID}>{type.Type_machine}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, localisation: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData((prev) => ({ ...prev, statut: (e.target as HTMLSelectElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero de serie</label>
                <input
                  type="text"
                  value={formData.numeroSerie}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numeroSerie: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date installation</label>
                <input
                  type="date"
                  value={formData.dateInstallation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dateInstallation: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: (e.target as HTMLTextAreaElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                onClick={handleSaveMachine}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : editingMachine ? 'Modifier' : 'Ajouter'}
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
              Etes-vous sur de vouloir supprimer cette machine ? Cette action est irreversible.
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

export default Machines;
