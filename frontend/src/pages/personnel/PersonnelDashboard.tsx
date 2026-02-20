import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Download, Upload, Plus } from 'lucide-preact';
import { usePersonnel, usePersonnelFilters } from '../../hooks';
import PersonnelSearch from '../../components/personnel/PersonnelSearch';
import PersonnelFilter from '../../components/personnel/PersonnelFilter';
import PersonnelTable from '../../components/personnel/PersonnelTable';
import PersonnelStats from '../../components/personnel/PersonnelStats';
import PersonnelImport from '../../components/personnel/PersonnelImport';
import PersonnelExport from '../../components/personnel/PersonnelExport';
import PersonnelActionButton from '../../components/personnel/PersonnelActionButton';
import PersonnelPageHeader from '../../components/personnel/PersonnelPageHeader';
import PersonnelFilterPanel from '../../components/personnel/PersonnelFilterPanel';
import { personnelAPI } from '../../api/personnel';
import { showToast } from '../../utils/toast';

const PersonnelDashboard: FunctionalComponent = () => {
  const { personnels, loading, error, delete: deletePersonnel, changeStatut, getAll } = usePersonnel();
  const { filters, updateFilter, filtered, clearFilters, hasActiveFilters } = usePersonnelFilters(personnels);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleCreate = () => route('/personnel/new');
  const handleEdit = (id: number) => route(`/personnel/${id}/edit`);
  const handleDelete = async (id: number) => {
    const success = await deletePersonnel(id);
    if (success) alert('Employe supprime avec succes');
  };
  const handleStatusChange = async (id: number, status: 'actif' | 'inactif') => {
    await changeStatut(id, status);
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

  const stats = {
    total: personnels.length,
    actifs: personnels.filter(p => p.Statut === 'actif').length,
    inactifs: personnels.filter(p => p.Statut === 'inactif').length,
  };

  return (
    <div className="space-y-6">
      <PersonnelPageHeader
        title="Personnel"
        subtitle={`Total: ${personnels.length} employe${personnels.length > 1 ? 's' : ''}`}
        actions={
          <>
            <PersonnelActionButton
              onClick={handleDownloadTemplate}
              loading={isDownloadingTemplate}
              title="Telecharger le template d'import"
              icon={Download}
            >
              {isDownloadingTemplate ? 'Template...' : 'Template'}
            </PersonnelActionButton>
            <PersonnelActionButton
              onClick={() => setShowImport(true)}
              title="Importer des employes"
              icon={Upload}
            >
              Importer
            </PersonnelActionButton>
            <PersonnelActionButton
              onClick={() => setShowExport(true)}
              title="Exporter les employes"
              icon={Download}
            >
              Exporter
            </PersonnelActionButton>
            <PersonnelActionButton
              onClick={handleCreate}
              title="Ajouter un nouvel employe"
              icon={Plus}
              variant="accent"
            >
              Nouveau
            </PersonnelActionButton>
          </>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <PersonnelStats stats={stats} />

      <PersonnelFilterPanel title="Recherche et filtres">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <PersonnelSearch value={filters.search || ''} onChange={(value) => updateFilter('search', value)} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative rounded-lg border px-4 py-2 text-sm font-medium ${
              showFilters
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
            {hasActiveFilters && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4">
            <PersonnelFilter
              filters={filters}
              onFilterChange={updateFilter}
              hasActive={hasActiveFilters}
              onClear={clearFilters}
            />
          </div>
        )}
      </PersonnelFilterPanel>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Affichage <strong>{filtered.length}</strong> sur <strong>{personnels.length}</strong> employe(s)
          {hasActiveFilters ? ' (filtres)' : ''}
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            title="Vue tableau"
          >
            Tableau
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            title="Vue cartes"
          >
            Cartes
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-3 text-sm text-gray-600">Chargement des donnees...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Aucun employe trouve</h3>
          <p className="mt-2 text-sm text-gray-500">Essayez de modifier vos criteres de recherche ou de filtrage</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Reinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <PersonnelTable
              personnels={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(p => (
                <div key={p.ID} className="rounded-lg bg-white p-4 shadow-sm">
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
                    <p><span className="font-medium text-gray-500">Site:</span> {p.Site_affectation || '—'}</p>
                    <p>
                      <span className="font-medium text-gray-500">Email:</span>{' '}
                      {p.Email ? <a href={`mailto:${p.Email}`} className="text-blue-600 hover:underline">{p.Email}</a> : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-500">Tel:</span>{' '}
                      {p.Telephone ? <a href={`tel:${p.Telephone}`} className="text-blue-600 hover:underline">{p.Telephone}</a> : '—'}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => handleEdit(p.ID)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer ${p.Nom_prenom} ?`)) {
                          handleDelete(p.ID);
                        }
                      }}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showImport && h(PersonnelImport, {
        onClose: () => setShowImport(false),
        onSuccess: () => {
          getAll();
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
