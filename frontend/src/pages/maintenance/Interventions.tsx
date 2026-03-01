import { type FunctionComponent } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { Plus, Eye, Trash2, RefreshCw } from 'lucide-preact';
import { useInterventions } from '../../hooks/useInterventions';
import * as maintenanceApi from '../../api/maintenance';
import SelectSearch from '../../components/common/SelectSearch';
import type { Intervention } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';
import Modal from '../../components/common/Modal';
import { usePermissions } from '../../hooks/usePermissions';

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
const statutOptions = ['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'TERMINEE', 'ANNULEA'];

const toUpperStatut = (value: string) => {
  if (value === 'affectee') return 'AFFECTEE';
  if (value === 'en_cours') return 'EN_COURS';
  if (value === 'terminee') return 'TERMINEE';
  if (value === 'annulea') return 'ANNULEA';
  return 'EN_ATTENTE';
};

const toUpperPriorite = (value: string) => {
  if (value === 'urgente') return 'URGENTE';
  if (value === 'haute') return 'HAUTE';
  if (value === 'basse') return 'BASSE';
  return 'NORMALE';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

export const Interventions: FunctionComponent<InterventionsListProps> = () => {
   const { canWrite, canDelete } = usePermissions();
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
  const [detailItem, setDetailItem] = useState<Intervention | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

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

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const totalPages = Math.max(1, pages || 0);
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const filteredMachines = useMemo(() => {
    if (!formData.idTypeMachine) return machines;
    const typeId = Number(formData.idTypeMachine);
    return machines.filter((m: any) => Number(m?.Type_machine_id) === typeId);
  }, [machines, formData.idTypeMachine]);

  const closeFormModal = () => {
    setIsModalOpen(false);
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
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

  const toggleSelected = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAllSelected = () => {
    if (selected.size === interventions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(interventions.map(item => item.ID)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const confirmed = confirm(`Supprimer ${selected.size} intervention(s) ?`);
    if (!confirmed) return;

    for (const id of selected) {
      await deleteIntervention(id);
    }
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestion des interventions" 
        subtitle="Suivi et planification des interventions de maintenance"
        showTemplate={canWrite('INTERVENTIONS')}
        showImport={canWrite('INTERVENTIONS')}
        showExport={true}
        showRefresh={true}
        onTemplate={handleDownloadTemplate}
        onImport={handleImportClick}
        onExport={handleExportXlsx}
        onRefresh={fetchInterventions}
        isDownloadingTemplate={isDownloadingTemplate}
        isImporting={isImporting}
        isExporting={isExporting}
        isRefreshing={false}
      />

      <FilterPanel title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Date debut</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut((e.target as HTMLInputElement).value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin((e.target as HTMLInputElement).value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Recherche</label>
            <input
              type="text"
              placeholder="Numero, machine..."
              value={recherche}
              onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
              className="min-w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <ActionButton onClick={async () => { await fetchInterventions(); }} icon={RefreshCw}>Filtrer</ActionButton>
        </div>
      </FilterPanel>

      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />

      <Modal
        isOpen={isModalOpen}
        title={editingItem ? 'Modifier intervention' : 'Nouvelle intervention'}
        onClose={closeFormModal}
        size="xl"
      >
        {isModalOpen && (
          <div className="space-y-4">
            <div>
              <SelectSearch
                options={machineTypes.map((type) => ({
                  id: type.ID,
                  label: type.Type_machine,
                }))}
                selectedId={formData.idTypeMachine ? Number(formData.idTypeMachine) : null}
                onSelect={(opt) => setFormData((prev) => ({ ...prev, idTypeMachine: String(opt.id), idMachine: '' }))}
                label="Type machine"
                placeholder="Rechercher type..."
                maxResults={20}
              />
            </div>

            <div>
              <SelectSearch
                options={filteredMachines.map((machine: any) => ({
                  id: machine.ID || machine.id,
                  label: `${machine.Code_interne || machine.code} - ${machine.Nom_machine || machine.nom}`,
                }))}
                selectedId={formData.idMachine ? Number(formData.idMachine) : null}
                onSelect={(opt) => setFormData((prev) => ({ ...prev, idMachine: String(opt.id) }))}
                label="Machine"
                placeholder="Rechercher machine..."
                maxResults={20}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Demandeur ID</label>
              <input
                type="number"
                value={formData.demandeurId}
                onChange={(e) => setFormData((prev) => ({ ...prev, demandeurId: (e.target as HTMLInputElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priorite</label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData((prev) => ({ ...prev, priorite: (e.target as HTMLSelectElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {prioriteOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Impact production</label>
              <select
                value={formData.impactProduction}
                onChange={(e) => setFormData((prev) => ({ ...prev, impactProduction: (e.target as HTMLSelectElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {impactOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData((prev) => ({ ...prev, statut: (e.target as HTMLSelectElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {statutOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description panne</label>
              <textarea
                rows={3}
                value={formData.descriptionPanne}
                onChange={(e) => setFormData((prev) => ({ ...prev, descriptionPanne: (e.target as HTMLTextAreaElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Commentaire</label>
              <textarea
                rows={2}
                value={formData.commentaire}
                onChange={(e) => setFormData((prev) => ({ ...prev, commentaire: (e.target as HTMLTextAreaElement).value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={closeFormModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Table principale</h2>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite('INTERVENTIONS') && <ActionButton onClick={openCreateModal} icon={Plus}>Ajouter</ActionButton>}
            {canDelete('INTERVENTIONS') && <ActionButton onClick={deleteSelected} icon={Trash2}>Supprimer selection</ActionButton>}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === interventions.length && interventions.length > 0}
                      onChange={toggleAllSelected}
                    />
                  </th>
                  <th className="px-2 py-2 text-left">Date demande</th>
                  <th className="px-2 py-2 text-left">Demandeur</th>
                  <th className="px-2 py-2 text-left">Type machine</th>
                  <th className="px-2 py-2 text-left">Statut</th>
                  <th className="px-2 py-2 text-left">Nom defaut</th>
                  <th className="px-2 py-2 text-left">Technicien</th>
                  <th className="px-2 py-2 text-left">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interventions.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500">Aucun enregistrement</td></tr>}
                {interventions.map((item) => (
                  <tr key={item.ID}>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(item.ID)}
                        onChange={() => toggleSelected(item.ID)}
                      />
                    </td>
                    <td className="px-2 py-2">{formatDate(item.Date_heure_demande)}</td>
                    <td className="px-2 py-2">{item.Demandeur_nom || item.Demandeur || '-'}</td>
                    <td className="px-2 py-2">{item.Type_machine || '-'}</td>
                    <td className="px-2 py-2">{String(item.Statut || item.statut || '-')}</td>
                    <td className="px-2 py-2">{item.Nom_defaut || '-'}</td>
                    <td className="px-2 py-2">{item.Technicien_nom || '-'}</td>
                    <td className="px-2 py-2">
                      <button
                        title="Details"
                        onClick={() => setDetailItem(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
          <div className="text-gray-600">{total} enregistrement(s) | {selected.size} selectionne(s)</div>
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
      </div>

      {/* Modal Details */}
      {detailItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Details de l'intervention</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-white hover:opacity-80 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <div className="space-y-6">
                {/* Infos principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">ID</p>
                    <p className="text-lg font-semibold text-gray-900">{detailItem.ID}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Numero</p>
                    <p className="text-lg font-semibold text-gray-900">{detailItem.numero || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Date demande</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(detailItem.Date_heure_demande)}</p>
                  </div>
                </div>

                {/* Infos machine et demande */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Demandeur</p>
                    <p className="text-base text-gray-900">{detailItem.Demandeur_nom || detailItem.Demandeur || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Type machine</p>
                    <p className="text-base text-gray-900">{detailItem.Type_machine || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Machine</p>
                    <p className="text-base text-gray-900">{detailItem.machine_code} {detailItem.machine_nom ? `- ${detailItem.machine_nom}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nom defaut</p>
                    <p className="text-base text-gray-900">{detailItem.Nom_defaut || '-'}</p>
                  </div>
                </div>

                {/* Statut et priorite */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Statut</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {String(detailItem.Statut || detailItem.statut || '-')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Priorite</p>
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {String(detailItem.Priorite || detailItem.priorite || '-')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Impact</p>
                    <p className="text-base text-gray-900">{detailItem.Impact_production || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Duree (min)</p>
                    <p className="text-base text-gray-900">{detailItem.Duree_intervention_minutes || '-'}</p>
                  </div>
                </div>

                {/* Technicien */}
                <div className="pb-6 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Technicien affecte</p>
                  <p className="text-base text-gray-900">{detailItem.Technicien_nom || '-'}</p>
                </div>

                {/* Descriptions */}
                <div className="space-y-6">
                  {detailItem.Description_panne && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Description panne</p>
                      <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{detailItem.Description_panne}</p>
                    </div>
                  )}
                  {detailItem.Cause_racine && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Cause racine</p>
                      <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{detailItem.Cause_racine}</p>
                    </div>
                  )}
                  {detailItem.Action_realisee && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Action realisee</p>
                      <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{detailItem.Action_realisee}</p>
                    </div>
                  )}
                  {detailItem.Pieces_remplacees && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Pieces remplacees</p>
                      <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{detailItem.Pieces_remplacees}</p>
                    </div>
                  )}
                  {detailItem.Commentaire && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Commentaire</p>
                      <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{detailItem.Commentaire}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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
