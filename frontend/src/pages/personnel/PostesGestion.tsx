import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Plus, Save, Search, Trash2, X } from 'lucide-preact';
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
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  const loadPostes = async () => {
    try {
      setLoading(true);
      const response = await postesApi.getAll();
      setPostes((response.data.data || []) as PosteRow[]);
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Erreur lors du chargement des postes'));
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

  const handleCreate = async () => {
    const Description = newDescription.trim();
    if (!Description) {
      showToast.error('La description est requise');
      return;
    }

    try {
      setSaving(true);
      await postesApi.create({ Description });
      setNewDescription('');
      showToast.success('Poste cree avec succes');
      await loadPostes();
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Erreur lors de la creation du poste'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (poste: PosteRow) => {
    setEditingId(poste.ID);
    setEditingDescription(poste.Description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDescription('');
  };

  const handleUpdate = async (id: number) => {
    const Description = editingDescription.trim();
    if (!Description) {
      showToast.error('La description est requise');
      return;
    }

    try {
      setSaving(true);
      await postesApi.update(id, { Description });
      showToast.success('Poste modifie avec succes');
      cancelEdit();
      await loadPostes();
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Erreur lors de la modification du poste'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, description: string) => {
    if (!window.confirm(`Supprimer le poste "${description}" ?`)) return;

    try {
      setSaving(true);
      await postesApi.remove(id);
      showToast.success('Poste supprime avec succes');
      await loadPostes();
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Erreur lors de la suppression du poste'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des postes"
        subtitle={`Total: ${postes.length} poste${postes.length > 1 ? 's' : ''}`}
      />

      <FilterPanel title="Ajouter un poste">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription((e.target as HTMLInputElement).value)}
              placeholder="Ex: Operateur montage"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ActionButton onClick={handleCreate} icon={Plus} loading={saving} variant="accent">
            Ajouter
          </ActionButton>
        </div>
      </FilterPanel>

      <FilterPanel title="Liste des postes">
        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder="Rechercher par ID ou description..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
            Chargement des postes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
            Aucun poste trouve.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((poste) => (
                  <tr key={poste.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{poste.ID}</td>
                    <td className="px-4 py-3">
                      {editingId === poste.ID ? (
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription((e.target as HTMLInputElement).value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-800">{poste.Description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {editingId === poste.ID ? (
                          <>
                            <ActionButton
                              onClick={() => handleUpdate(poste.ID)}
                              loading={saving}
                              icon={Save}
                              variant="accent"
                            >
                              Enregistrer
                            </ActionButton>
                            <ActionButton onClick={cancelEdit} icon={X} disabled={saving}>
                              Annuler
                            </ActionButton>
                          </>
                        ) : (
                          <>
                            <ActionButton onClick={() => startEdit(poste)} disabled={saving}>
                              Modifier
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleDelete(poste.ID, poste.Description)}
                              icon={Trash2}
                              disabled={saving}
                              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              Supprimer
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FilterPanel>
    </div>
  );
};

export default PostesGestion;
