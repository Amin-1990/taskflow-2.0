import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-preact';
import PageHeader from '../../components/common/PageHeader';
import FilterPanel from '../../components/common/FilterPanel';
import ActionButton from '../../components/common/ActionButton';
import { postesApi } from '../../api/postes';
import { showToast } from '../../utils/toast';

interface PosteRow {
  ID: number;
  Description: string;
}

interface PostesGestionProps {
  path?: string;
}

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.error || fallback;

const PostesGestion: FunctionComponent<PostesGestionProps> = () => {
  const [postes, setPostes] = useState<PosteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PosteRow | null>(null);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadPostes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postesApi.getAll();
      setPostes((response.data.data || []) as PosteRow[]);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erreur lors du chargement des postes');
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return postes;
    return postes.filter((p) => `${p.ID} ${p.Description}`.toLowerCase().includes(q));
  }, [postes, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * limit, currentPage * limit),
    [filtered, currentPage, limit]
  );

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingItem(null);
    setDescriptionValue('');
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setDescriptionValue('');
    setShowFormModal(true);
  };

  const openEditModal = (item: PosteRow) => {
    setEditingItem(item);
    setDescriptionValue(item.Description);
    setShowFormModal(true);
  };

  const handleSave = async () => {
    const Description = descriptionValue.trim();
    if (!Description) {
      showToast.error('La description est requise');
      return;
    }

    try {
      setIsSaving(true);
      if (editingItem) {
        await postesApi.update(editingItem.ID, { Description });
        showToast.success('Poste modifie avec succes');
      } else {
        await postesApi.create({ Description });
        showToast.success('Poste ajoute avec succes');
      }
      closeFormModal();
      await loadPostes();
    } catch (err) {
      showToast.error(
        getApiErrorMessage(err, editingItem ? 'Erreur lors de la modification du poste' : 'Erreur lors de la creation du poste')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsSaving(true);
      await postesApi.remove(deleteId);
      showToast.success('Poste supprime avec succes');
      setDeleteId(null);
      await loadPostes();
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Erreur lors de la suppression du poste'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && postes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des postes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des postes"
        subtitle={`Total: ${postes.length} poste${postes.length > 1 ? 's' : ''}`}
        actions={(
          <ActionButton onClick={openCreateModal} icon={Plus} variant="accent">
            Ajouter
          </ActionButton>
        )}
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
              placeholder="Rechercher un poste..."
              value={search}
              onChange={(e) => {
                setSearch((e.target as HTMLInputElement).value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {total === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun poste trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((poste) => (
                  <tr key={poste.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{poste.ID}</td>
                    <td className="px-6 py-4 text-gray-700">{poste.Description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          title="Modifier"
                          onClick={() => openEditModal(poste)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => setDeleteId(poste.ID)}
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Modifier poste' : 'Ajouter poste'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue((e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Operateur montage"
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Etes-vous sur de vouloir supprimer ce poste ? Cette action est irreversible.
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
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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

export default PostesGestion;
