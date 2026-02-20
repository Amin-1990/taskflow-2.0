/**
 * Page Liste des Commandes
 * Affichage avec tableau, filtres et recherche
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
} from 'lucide-preact';
import { useCommandes } from '../../hooks/useCommandes';
import type { CommandeStatut } from '../../types/production.types';
import { showToast } from '../../utils/toast';
import { commandesApi } from '../../api/commandes';
import ActionButton from '../../components/common/ActionButton';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';

interface CommandesListProps {
  path?: string;
}

const STATUT_COLORS: Record<CommandeStatut, string> = {
  creee: 'bg-gray-100 text-gray-800',
  en_cours: 'bg-blue-100 text-blue-800',
  en_attente: 'bg-yellow-100 text-yellow-800',
  suspendue: 'bg-orange-100 text-orange-800',
  completee: 'bg-green-100 text-green-800',
  annulee: 'bg-red-100 text-red-800',
  en_controle: 'bg-purple-100 text-purple-800',
  emballe: 'bg-indigo-100 text-indigo-800',
};

const STATUT_LABELS: Record<CommandeStatut, string> = {
  creee: 'Créée',
  en_cours: 'En cours',
  en_attente: 'En attente',
  suspendue: 'Suspendue',
  completee: 'Complétée',
  annulee: 'Annulée',
  en_controle: 'Contrôle',
  emballe: 'Emballée',
};

export const Commandes: FunctionComponent<CommandesListProps> = () => {
  const {
    commandes,
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
    filtres,
    setFiltres,
    clearFiltres,
    deleteCommande,
    updateStatut,
  } = useCommandes();

  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [unitesProduction, setUnitesProduction] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les articles au montage
  useEffect(() => {
    console.log('📦 Module Production - Commandes');
  }, []);

  useEffect(() => {
    const loadUnites = async () => {
      try {
        const response = await commandesApi.getUnitesProduction();
        if (response.data.success && Array.isArray(response.data.data)) {
          setUnitesProduction(response.data.data);
        }
      } catch (err) {
        console.error('Erreur chargement unites production:', err);
      }
    };

    loadUnites();
  }, []);

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const response = await commandesApi.exportXlsx();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Commandes exportées avec succès');
    } catch (error) {
      showToast.error('Erreur lors de l\'export');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await commandesApi.getTemplateImport();
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_commandes.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Template téléchargé');
    } catch (error) {
      showToast.error('Erreur lors du téléchargement du template');
      console.error('Template download error:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await commandesApi.importCommandes(file);
      showToast.success('Commandes importées avec succès');
      // Recharger les commandes
      setRecherche('');
      setFiltres({});
      setPage(1);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      const errorMsg = error?.error || error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'import';
      const details = error?.details || error.response?.data?.details;
      showToast.error(errorMsg);
      if (Array.isArray(details) && details.length > 0) {
        showToast.error(details.slice(0, 3).join(' | '));
      }
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    const success = await deleteCommande(id);
    if (success) {
      setDeleteId(null);
    }
  };

  const handleRapidStatutChange = async (id: number, newStatut: CommandeStatut) => {
    await updateStatut(id, newStatut);
  };

  if (loading && (!commandes || commandes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes de production"
        subtitle={`Total: ${total} commande${total > 1 ? 's' : ''}`}
        actions={
          <>
            <ActionButton onClick={handleDownloadTemplate} icon={Download} title="Telecharger le template d'import">
              Template
            </ActionButton>
            <ActionButton onClick={handleImportClick} loading={isImporting} icon={Upload} title="Importer des commandes">
              {isImporting ? 'Import...' : 'Importer'}
            </ActionButton>
            <ActionButton onClick={handleExportXlsx} loading={isExporting} icon={Download} title="Exporter les commandes en XLSX">
              {isExporting ? 'Export...' : 'Exporter'}
            </ActionButton>
            <ActionButton onClick={() => route('/production/commandes/nouveau')} icon={Plus} variant="accent">
              Nouvelle commande
            </ActionButton>
          </>
        }
      />

      {/* Hidden file input for imports */}
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
        {/* Recherche */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, lot ou article..."
              value={recherche}
              onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
          </button>
        </div>

        {/* Filtres (masqués par défaut) */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorite
              </label>
              <select
                value={filtres.priorite || ''}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val) setFiltres({ priorite: val as any });
                  else setFiltres({ priorite: undefined });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot
              </label>
              <input
                type="text"
                value={filtres.lot || ''}
                onChange={(e) => setFiltres({ lot: (e.target as HTMLInputElement).value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: ORD-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unite production
              </label>
              <select
                value={filtres.unite_production || ''}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val) setFiltres({ unite_production: val });
                  else setFiltres({ unite_production: undefined });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les unites</option>
                {unitesProduction.map((unite) => (
                  <option key={unite} value={unite}>
                    {unite}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                A partir du
              </label>
              <input
                type="date"
                value={filtres.date_debut || ''}
                onChange={(e) => setFiltres({ date_debut: (e.target as HTMLInputElement).value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jusqu'au
              </label>
              <input
                type="date"
                value={filtres.date_fin || ''}
                onChange={(e) => setFiltres({ date_fin: (e.target as HTMLInputElement).value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-5 flex justify-end">
              <button
                onClick={clearFiltres}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Reinitialiser
              </button>
            </div>
          </div>
        )}
      </FilterPanel>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {!commandes || commandes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Numéro</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Article</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Lot</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Quantité</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Avancement</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Priorité</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commandes.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {cmd.numero}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{cmd.article_nom}</td>
                    <td className="px-6 py-4 text-gray-700">{cmd.lot}</td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {cmd.quantite_produite}/{cmd.quantite}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${cmd.pourcentage_avancement}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium w-8">
                          {cmd.pourcentage_avancement}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[cmd.statut]}`}>
                        {STATUT_LABELS[cmd.statut]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${
                        cmd.priorite === 'urgente' ? 'text-red-600' :
                        cmd.priorite === 'haute' ? 'text-orange-600' :
                        cmd.priorite === 'normale' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {cmd.priorite.charAt(0).toUpperCase() + cmd.priorite.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                           title="Voir les détails"
                           onClick={() => route(`/production/commandes/${cmd.id}`)}
                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                        <button
                          title="Modifier"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => handleDeleteClick(cmd.id)}
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} sur {pages} • {total} résultat{total > 1 ? 's' : ''}
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
                className={`px-3 py-1 rounded-lg ${
                  page === i + 1
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

      {/* Dialog de confirmation de suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
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

export default Commandes;




