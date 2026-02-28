/**
 * Page Gestion des Semaines
 * Affichage, filtres, recherche et import/export de semaines
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  Calendar,
} from 'lucide-preact';
import { useSemaines } from '../../hooks/useSemaines';
import { showToast } from '../../utils/toast';
import { semainesApi } from '../../api/semaines';
import SelectSearch, { type SelectSearchOption } from '../../components/common/SelectSearch';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import { usePermissions } from '../../hooks/usePermissions';

interface SemainesProps {
  path?: string;
}

export const Semaines: FunctionComponent<SemainesProps> = () => {
  const { canWrite } = usePermissions();
  const {
    semaines,
    loading,
    loadingImport,
    error,
    page,
    limit,
    total,
    pages,
    setPage,
    setLimit,
    recherche,
    setRecherche,
    filtres,
    setFiltres,
    clearFiltres,
    importSemaines,
    loadDefaultSemaines,
    exportSemaines,
    deleteSemaine,
  } = useSemaines();

  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isAddingSemaine, setIsAddingSemaine] = useState(false);
  const [formData, setFormData] = useState({
    Code_semaine: '',
    Numero_semaine: 1,
    Annee: 2026,
    Mois: 1,
    Date_debut: '',
    Date_fin: ''
  });

  useEffect(() => {
    console.log('ðŸ“… Module Production - Semaines');
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await semainesApi.getTemplate();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_semaines.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Template tÃ©lÃ©chargÃ©');
    } catch (error) {
      showToast.error('Erreur lors du tÃ©lÃ©chargement du template');
      console.error('Template download error:', error);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteSemaine(id);
    if (success) {
      setDeleteId(null);
    }
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleImportFile = async () => {
    if (!uploadedFile) {
      showToast.warning('Veuillez sÃ©lectionner un fichier');
      return;
    }

    const success = await importSemaines(uploadedFile);
    if (success) {
      setShowImportModal(false);
      setUploadedFile(null);
    }
  };

  const handleLoadDefault = async () => {
    if (semaines.length > 0) {
      const confirmed = confirm(
        'Les semaines existantes seront remplacÃ©es. ÃŠtes-vous sÃ»r ?'
      );
      if (!confirmed) return;
    }

    await loadDefaultSemaines();
  };

  const handleExport = async () => {
    await exportSemaines();
  };

  const handleAddSemaine = async () => {
    if (!formData.Code_semaine.trim() || !formData.Numero_semaine || !formData.Date_debut || !formData.Date_fin) {
      showToast.error('Tous les champs sont requis');
      return;
    }

    try {
      setIsAddingSemaine(true);
      const response = await semainesApi.create(formData);
      if (response.data.success) {
        showToast.success('Semaine ajoutée avec succès');
        setShowAddModal(false);
        setFormData({
          Code_semaine: '',
          Numero_semaine: 1,
          Annee: 2026,
          Mois: 1,
          Date_debut: '',
          Date_fin: ''
        });
        // Recharger les données
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error: any) {
      showToast.error(error?.response?.data?.error || 'Erreur lors de l\'ajout de la semaine');
    } finally {
      setIsAddingSemaine(false);
    }
  };

  if (loading && (!semaines || semaines.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des semaines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des semaines"
        subtitle={`Total: ${total} semaine${total > 1 ? 's' : ''}`}
        actions={
          <>
            {canWrite('SEMAINES') && (
              <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
                {isDownloadingTemplate ? 'Template...' : 'Template'}
              </ActionButton>
            )}
            {canWrite('SEMAINES') && (
              <ActionButton onClick={() => setShowImportModal(true)} loading={loadingImport} icon={Upload}>
                {loadingImport ? 'Import...' : 'Importer'}
              </ActionButton>
            )}
            <ActionButton onClick={handleExport} disabled={loading || semaines.length === 0} icon={Download}>
              Exporter
            </ActionButton>
            {canWrite('SEMAINES') && (
              <ActionButton onClick={() => setShowAddModal(true)} icon={Plus} variant="accent">
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

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Recherche */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code semaine (S01-S52)..."
              value={recherche}
              onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
          </button>
        </div>

        {/* Filtres (masquÃ©s par dÃ©faut) */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Filtre Année */}
            <div>
              <SelectSearch
                options={[
                  { id: 2026, label: '2026' },
                ]}
                selectedId={filtres.annee || null}
                onSelect={(opt) => setFiltres({ annee: opt.id as number })}
                placeholder="Sélectionner année..."
                maxResults={10}
              />
            </div>

            {/* Filtre Mois */}
            <div>
              <SelectSearch
                options={Array.from({ length: 12 }).map((_, i) => ({
                  id: i + 1,
                  label: new Date(2026, i, 1).toLocaleDateString('fr-FR', {
                    month: 'long',
                  }),
                }))}
                selectedId={filtres.mois || null}
                onSelect={(opt) => setFiltres({ mois: opt.id as number })}
                placeholder="Sélectionner mois..."
                maxResults={12}
              />
            </div>

            {/* Bouton Réinitialiser */}
            <div className="flex items-end">
              <button
                onClick={clearFiltres}
                className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!semaines || semaines.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune semaine trouvÃ©e</p>
            <p className="text-sm mt-2">Cliquez sur "Importer" pour charger les semaines</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Mois
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Début
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Fin
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {semaines.map((semaine) => {
                  const moisName = new Date(
                    semaine.Annee,
                    semaine.Mois - 1,
                    1
                  ).toLocaleDateString('fr-FR', {
                    month: 'long',
                  });

                  return (
                    <tr key={semaine.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        {semaine.Code_semaine}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {semaine.Numero_semaine}
                      </td>
                      <td className="px-6 py-4 text-gray-700 capitalize">
                        {moisName}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(semaine.Date_debut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(semaine.Date_fin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canWrite('SEMAINES') && (
                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteClick(semaine.ID)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} sur {pages} â€¢ {total} rÃ©sultat{total > 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Importer les semaines
            </h3>

            <div className="space-y-4">
              {/* Option 1: Upload fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier Excel/CSV
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={loadingImport}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format attendu: Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin
                </p>
              </div>

              {/* Bouton Import fichier */}
              <button
                onClick={handleImportFile}
                disabled={!uploadedFile || loadingImport}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingImport ? 'Import en cours...' : 'Importer le fichier'}
              </button>

              {/* SÃ©parateur */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OU</span>
                </div>
              </div>

              {/* Option 2: Charger par dÃ©faut */}
              <button
                onClick={handleLoadDefault}
                disabled={loadingImport}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loadingImport ? 'Chargement...' : 'Charger 52 semaines (2026)'}
              </button>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setUploadedFile(null);
                  }}
                  disabled={loadingImport}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Semaine */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ajouter une semaine
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code semaine
                </label>
                <input
                  type="text"
                  placeholder="Ex: S01"
                  value={formData.Code_semaine}
                  onChange={(e) => setFormData({ ...formData, Code_semaine: (e.target as HTMLInputElement).value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro semaine
                </label>
                <input
                  type="number"
                  placeholder="Ex: 1"
                  min={1}
                  max={52}
                  value={formData.Numero_semaine}
                  onChange={(e) => setFormData({ ...formData, Numero_semaine: (e.target as HTMLInputElement).value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={formData.Annee}
                    onChange={(e) => setFormData({ ...formData, Annee: parseInt((e.target as HTMLInputElement).value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.Mois}
                    onChange={(e) => setFormData({ ...formData, Mois: parseInt((e.target as HTMLInputElement).value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={formData.Date_debut}
                  onChange={(e) => setFormData({ ...formData, Date_debut: (e.target as HTMLInputElement).value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={formData.Date_fin}
                  onChange={(e) => setFormData({ ...formData, Date_fin: (e.target as HTMLInputElement).value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAddingSemaine}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSemaine}
                disabled={isAddingSemaine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isAddingSemaine ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette semaine ? Cette action est irréversible.
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

export default Semaines;







