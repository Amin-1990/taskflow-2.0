import { type FunctionalComponent } from 'preact';
import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { Plus, Search, Edit2, Trash2, AlertCircle, Download, Upload } from 'lucide-preact';
import { usePersonnel, usePersonnelFilters } from '../../hooks';
import type { Personnel } from '../../types/personnel.types';
import {
  getAnciennete,
  getDefaultPersonnelData,
  POSTE_OPTIONS,
  STATUT_OPTIONS,
  TYPE_CONTRAT_OPTIONS,
} from '../../types/personnel.types';
import SelectSearch, { type SelectSearchOption } from '../../components/common/SelectSearch';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';
import PersonnelImport from '../../components/personnel/PersonnelImport';
import PersonnelExport from '../../components/personnel/PersonnelExport';
import { personnelAPI } from '../../api/personnel';
import { showToast } from '../../utils/toast';
import { usePermissions } from '../../hooks/usePermissions';

const baseInputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const errorInputClass = `${baseInputClass} border-red-400 focus:border-red-500 focus:ring-red-500/20`;

const PersonnelDashboard: FunctionalComponent = () => {
  const { canWrite } = usePermissions();
  const { personnels, loading, error, delete: deletePersonnel, changeStatut, create, update, getAll } = usePersonnel();
  const { filters, updateFilter, filtered } = usePersonnelFilters(personnels);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Personnel | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Personnel>>(getDefaultPersonnelData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * limit, currentPage * limit),
    [filtered, currentPage, limit]
  );

  const resetFormState = () => {
    setFormErrors({});
    setEditingItem(null);
    setFormData(getDefaultPersonnelData());
    setShowFormModal(false);
  };

  const openCreateModal = () => {
    setFormErrors({});
    setEditingItem(null);
    setFormData(getDefaultPersonnelData());
    setShowFormModal(true);
  };

  const openEditModal = (item: Personnel) => {
    setFormErrors({});
    setEditingItem(item);
    setFormData({ ...item });
    setShowFormModal(true);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.Nom_prenom?.trim()) nextErrors.Nom_prenom = 'Le nom/prenom est requis';
    if (!formData.Matricule?.trim()) nextErrors.Matricule = 'Le matricule est requis';
    if (!formData.Date_embauche) nextErrors.Date_embauche = 'La date d embauche est requise';
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) nextErrors.Email = 'Email invalide';
    if (formData.Telephone && !/^[0-9\s\-\+\(\)]+$/.test(formData.Telephone)) nextErrors.Telephone = 'Telephone invalide';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Personnel> = {
        ...formData,
        Nom_prenom: formData.Nom_prenom?.trim(),
        Matricule: formData.Matricule?.trim(),
        Email: formData.Email?.trim() || undefined,
        Telephone: formData.Telephone?.trim() || undefined,
        Site_affectation: formData.Site_affectation?.trim() || undefined,
        Commentaire: formData.Commentaire?.trim() || undefined,
      };

      const result = editingItem
        ? await update(editingItem.ID, payload)
        : await create(payload);

      if (result) {
        showToast.success(editingItem ? 'Employe modifie avec succes' : 'Employe ajoute avec succes');
        resetFormState();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deletePersonnel(deleteId);
    if (success) {
      showToast.success('Employe supprime avec succes');
      setDeleteId(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await personnelAPI.getTemplateImport();
      personnelAPI.downloadExport(blob, 'template_personnel.xlsx');
    } catch {
      showToast.error('Erreur lors du telechargement du template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFormChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value || undefined }));

    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (loading && (!personnels || personnels.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du personnel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel"
        subtitle="Gestion des employés avec leurs informations et statut"
        actions={
          <>
            {canWrite('PERSONNEL') && (
              <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
                {isDownloadingTemplate ? 'Template...' : 'Template'}
              </ActionButton>
            )}
            {canWrite('PERSONNEL') && (
              <ActionButton onClick={() => setShowImport(true)} icon={Upload}>
                Importer
              </ActionButton>
            )}
            <ActionButton onClick={() => setShowExport(true)} icon={Download}>
              Exporter
            </ActionButton>
            {canWrite('PERSONNEL') && (
              <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
                Ajouter
              </ActionButton>
            )}
          </>
        }
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
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, email..."
              value={filters.search || ''}
              onChange={(e) => {
                updateFilter('search', (e.target as HTMLInputElement).value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Tableau
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Cartes
            </button>
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {total === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun employe trouve</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Matricule</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nom/Prenom</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Poste</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Site</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Telephone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Anciennete</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((p) => (
                  <tr key={p.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-blue-700">{p.Matricule}</td>
                    <td className="px-4 py-4 text-gray-700">{p.Nom_prenom}</td>
                    <td className="px-4 py-4 text-gray-700">{p.Poste}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => changeStatut(p.ID, p.Statut === 'actif' ? 'inactif' : 'actif')}
                        className={p.Statut === 'actif'
                          ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                          : 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'}
                      >
                        {p.Statut === 'actif' ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{p.Site_affectation || '-'}</td>
                    <td className="px-4 py-4 text-gray-700">{p.Email || '-'}</td>
                    <td className="px-4 py-4 text-gray-700">{p.Telephone || '-'}</td>
                    <td className="px-4 py-4 text-gray-700">{getAnciennete(p.Date_embauche)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canWrite('PERSONNEL') && (
                          <button
                            title="Modifier"
                            onClick={() => openEditModal(p)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canWrite('PERSONNEL') && (
                          <button
                            title="Supprimer"
                            onClick={() => setDeleteId(p.ID)}
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
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((p) => (
              <div key={p.ID} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{p.Nom_prenom}</h3>
                    <p className="text-sm text-gray-500">{p.Matricule}</p>
                  </div>
                  <span className={p.Statut === 'actif' ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700' : 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'}>
                    {p.Statut}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium text-gray-500">Poste:</span> {p.Poste}</p>
                  <p><span className="font-medium text-gray-500">Site:</span> {p.Site_affectation || '-'}</p>
                  <p><span className="font-medium text-gray-500">Email:</span> {p.Email || '-'}</p>
                  <p><span className="font-medium text-gray-500">Tel:</span> {p.Telephone || '-'}</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {canWrite('PERSONNEL') && (
                    <button
                      onClick={() => openEditModal(p)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Modifier
                    </button>
                  )}
                  {canWrite('PERSONNEL') && (
                    <button
                      onClick={() => setDeleteId(p.ID)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
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
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier personnel' : 'Ajouter personnel'}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom/Prenom *</label>
                <input
                  name="Nom_prenom"
                  type="text"
                  value={formData.Nom_prenom || ''}
                  onChange={handleFormChange}
                  className={formErrors.Nom_prenom ? errorInputClass : baseInputClass}
                />
                {formErrors.Nom_prenom && <p className="mt-1 text-xs text-red-600">{formErrors.Nom_prenom}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                <input
                  name="Matricule"
                  type="text"
                  value={formData.Matricule || ''}
                  onChange={handleFormChange}
                  disabled={!!editingItem}
                  className={formErrors.Matricule ? errorInputClass : baseInputClass}
                />
                {formErrors.Matricule && <p className="mt-1 text-xs text-red-600">{formErrors.Matricule}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d embauche *</label>
                <input
                  name="Date_embauche"
                  type="date"
                  value={formData.Date_embauche || ''}
                  onChange={handleFormChange}
                  className={formErrors.Date_embauche ? errorInputClass : baseInputClass}
                />
                {formErrors.Date_embauche && <p className="mt-1 text-xs text-red-600">{formErrors.Date_embauche}</p>}
              </div>
              <div>
                <SelectSearch
                  options={POSTE_OPTIONS.map((poste) => ({
                    id: poste,
                    label: poste,
                  }))}
                  selectedId={formData.Poste || 'Operateur'}
                  onSelect={(opt) => setFormData((prev) => ({ ...prev, Poste: opt.label }))}
                  label="Poste"
                  placeholder="Rechercher poste..."
                  maxResults={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="Statut"
                  value={formData.Statut || 'actif'}
                  onChange={handleFormChange}
                  className={baseInputClass}
                >
                  {STATUT_OPTIONS.map(statut => (
                    <option key={statut} value={statut}>{statut}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                <select
                  name="Type_contrat"
                  value={formData.Type_contrat || 'CDI'}
                  onChange={handleFormChange}
                  className={baseInputClass}
                >
                  {TYPE_CONTRAT_OPTIONS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <input
                  name="Site_affectation"
                  type="text"
                  value={formData.Site_affectation || ''}
                  onChange={handleFormChange}
                  className={baseInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="Email"
                  type="email"
                  value={formData.Email || ''}
                  onChange={handleFormChange}
                  className={formErrors.Email ? errorInputClass : baseInputClass}
                />
                {formErrors.Email && <p className="mt-1 text-xs text-red-600">{formErrors.Email}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input
                  name="Telephone"
                  type="text"
                  value={formData.Telephone || ''}
                  onChange={handleFormChange}
                  className={formErrors.Telephone ? errorInputClass : baseInputClass}
                />
                {formErrors.Telephone && <p className="mt-1 text-xs text-red-600">{formErrors.Telephone}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  name="Commentaire"
                  value={formData.Commentaire || ''}
                  onChange={handleFormChange}
                  rows={3}
                  className={baseInputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetFormState}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : editingItem ? 'Modifier' : 'Ajouter'}
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
              Etes-vous sur de vouloir supprimer cet employe ? Cette action est irreversible.
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

      {showImport && h(PersonnelImport, {
        onClose: () => setShowImport(false),
        onSuccess: async () => {
          await getAll();
          setShowImport(false);
        }
      })}

      {showExport && h(PersonnelExport, {
        allPersonnels: personnels,
        filteredPersonnels: filtered,
        onClose: () => setShowExport(false)
      })}
    </div>
  );
};

export default PersonnelDashboard;
