import { type FunctionComponent } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { Plus, Search, Edit2, Trash2, AlertCircle, Download, Upload } from 'lucide-preact';
import { useInterventions } from '../../hooks/useInterventions';
import * as maintenanceApi from '../../api/maintenance';
import type { Intervention } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';

interface InterventionsListProps {
  path?: string;
}

const prioriteOptions = [
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'NORMALE', label: 'Normale' },
  { value: 'BASSE', label: 'Basse' },
];

const impactOptions = ['Aucun', 'Mineur', 'Partiel', 'Total'];
const statutOptions = ['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

const toUpperStatut = (value: string) => {
  if (value === 'affectee') return 'AFFECTEE';
  if (value === 'en_cours') return 'EN_COURS';
  if (value === 'terminee') return 'TERMINEE';
  if (value === 'annulee') return 'ANNULEE';
  return 'EN_ATTENTE';
};

const toUpperPriorite = (value: string) => {
  if (value === 'urgente') return 'URGENTE';
  if (value === 'haute') return 'HAUTE';
  if (value === 'basse') return 'BASSE';
  return 'NORMALE';
};

export const Interventions: FunctionComponent<InterventionsListProps> = () => {
  const {
    interventions,
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
    fetchInterventions,
    createIntervention,
    updateIntervention,
    deleteIntervention,
  } = useInterventions();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Intervention | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [formData, setFormData] = useState({
    idTypeMachine: '',
    idMachine: '',
    demandeurId: '',
    descriptionPanne: '',
    priorite: 'NORMALE',
    impactProduction: 'Partiel',
    statut: 'EN_ATTENTE',
    commentaire: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, pages || 0);
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const filteredMachines = useMemo(() => {
    if (!formData.idTypeMachine) return machines;
    const typeId = Number(formData.idTypeMachine);
    return machines.filter((m: any) => Number(m?.Type_machine_id) === typeId);
  }, [machines, formData.idTypeMachine]);

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingItem(null);
    setFormData({
      idTypeMachine: machineTypes[0] ? String(machineTypes[0].ID) : '',
      idMachine: '',
      demandeurId: '',
      descriptionPanne: '',
      priorite: 'NORMALE',
      impactProduction: 'Partiel',
      statut: 'EN_ATTENTE',
      commentaire: '',
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      idTypeMachine: machineTypes[0] ? String(machineTypes[0].ID) : '',
      idMachine: '',
      demandeurId: '',
      descriptionPanne: '',
      priorite: 'NORMALE',
      impactProduction: 'Partiel',
      statut: 'EN_ATTENTE',
      commentaire: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (item: Intervention) => {
    setEditingItem(item);
    setFormData({
      idTypeMachine: item.ID_Type_machine ? String(item.ID_Type_machine) : '',
      idMachine: item.ID_Machine ? String(item.ID_Machine) : '',
      demandeurId: item.Demandeur ? String(item.Demandeur) : '',
      descriptionPanne: item.Description_panne || '',
      priorite: toUpperPriorite(String(item.priorite || item.Priorite || 'NORMALE')),
      impactProduction: String(item.Impact_production || 'Partiel'),
      statut: toUpperStatut(String(item.statut || item.Statut || 'EN_ATTENTE')),
      commentaire: String(item.Commentaire || ''),
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!formData.idTypeMachine || !formData.idMachine || !formData.demandeurId || !formData.descriptionPanne.trim()) {
      showToast.error('Type machine, machine, demandeur et description panne sont requis');
      return;
    }

    setIsSaving(true);
    try {
      const basePayload: any = {
        ID_Type_machine: Number(formData.idTypeMachine),
        ID_Machine: Number(formData.idMachine),
        Demandeur: Number(formData.demandeurId),
        Description_panne: formData.descriptionPanne.trim(),
        Description_probleme: formData.descriptionPanne.trim(),
        Priorite: formData.priorite,
        Impact_production: formData.impactProduction,
        Statut: formData.statut,
        Commentaire: formData.commentaire.trim() || undefined,
      };

      const success = editingItem
        ? await updateIntervention(editingItem.id || editingItem.ID, basePayload)
        : await createIntervention({
            ...basePayload,
            Date_heure_demande: new Date().toISOString(),
          });

      if (success) {
        closeFormModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteIntervention(id);
    if (success) {
      setDeleteId(null);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const blob = await maintenanceApi.exportInterventionsXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interventions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Interventions exportees avec succes');
    } catch (err) {
      showToast.error('Erreur lors de export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await maintenanceApi.getInterventionsTemplateImport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_interventions.xlsx';
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
      await maintenanceApi.importInterventions(file);
      showToast.success('Interventions importees avec succes');
      await fetchInterventions();
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

  if (loading && (!interventions || interventions.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des interventions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interventions"
        subtitle={`Total: ${total} intervention${total > 1 ? 's' : ''}`}
        actions={
          <>
            <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
              {isDownloadingTemplate ? 'Template...' : 'Template'}
            </ActionButton>
            <ActionButton onClick={handleImportClick} loading={isImporting} icon={Upload}>
              {isImporting ? 'Import...' : 'Importer'}
            </ActionButton>
            <ActionButton onClick={handleExportXlsx} loading={isExporting} icon={Download}>
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
              placeholder="Rechercher une intervention..."
              value={recherche}
              onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!interventions || interventions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune intervention trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Numero</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Type machine</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Machine</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Priorite</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {interventions.map((item) => (
                  <tr key={item.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{item.numero}</td>
                    <td className="px-6 py-4 text-gray-700">{item.Type_machine || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{item.machine_code} {item.machine_nom ? `- ${item.machine_nom}` : ''}</td>
                    <td className="px-6 py-4 text-gray-700">{String(item.Priorite || item.priorite || '-')}</td>
                    <td className="px-6 py-4 text-gray-700">{String(item.Statut || item.statut || '-')}</td>
                    <td className="px-6 py-4 text-gray-700">{item.Description_panne || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          title="Modifier"
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => setDeleteId(item.ID)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier intervention' : 'Ajouter intervention'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type machine</label>
                <select
                  value={formData.idTypeMachine}
                  onChange={(e) => setFormData((prev) => ({ ...prev, idTypeMachine: (e.target as HTMLSelectElement).value, idMachine: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectionner</option>
                  {machineTypes.map((type) => (
                    <option key={type.ID} value={type.ID}>{type.Type_machine}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Machine</label>
                <select
                  value={formData.idMachine}
                  onChange={(e) => setFormData((prev) => ({ ...prev, idMachine: (e.target as HTMLSelectElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectionner</option>
                  {filteredMachines.map((machine: any) => (
                    <option key={machine.ID || machine.id} value={machine.ID || machine.id}>
                      {machine.Code_interne || machine.code} - {machine.Nom_machine || machine.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Demandeur ID</label>
                <input
                  type="number"
                  value={formData.demandeurId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, demandeurId: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorite</label>
                <select
                  value={formData.priorite}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priorite: (e.target as HTMLSelectElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {prioriteOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impact production</label>
                <select
                  value={formData.impactProduction}
                  onChange={(e) => setFormData((prev) => ({ ...prev, impactProduction: (e.target as HTMLSelectElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {impactOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData((prev) => ({ ...prev, statut: (e.target as HTMLSelectElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statutOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description panne</label>
                <textarea
                  rows={3}
                  value={formData.descriptionPanne}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descriptionPanne: (e.target as HTMLTextAreaElement).value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                <textarea
                  rows={2}
                  value={formData.commentaire}
                  onChange={(e) => setFormData((prev) => ({ ...prev, commentaire: (e.target as HTMLTextAreaElement).value }))}
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
              Etes-vous sur de vouloir supprimer cette intervention ? Cette action est irreversible.
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

export default Interventions;
