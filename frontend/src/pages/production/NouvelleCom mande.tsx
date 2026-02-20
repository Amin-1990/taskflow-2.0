/**
 * Page de création d'une nouvelle commande
 */

import { type FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import { ArrowLeft } from 'lucide-preact';
import { useCommandes } from '../../hooks/useCommandes';
import { CommandeForm } from '../../components/production/CommandeForm';

interface NouvelleCommandeProps {
  path?: string;
}

export const NouvelleCommande: FunctionComponent<NouvelleCommandeProps> = () => {
  const { articles, createCommande, fetchArticles } = useCommandes();

  // Charger les articles au montage
  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreate = async (data: any) => {
    const result = await createCommande(data);
    if (result) {
      // Naviguer vers la liste après création
      window.location.href = '/production/commandes';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Retour"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nouvelle commande</h1>
          <p className="text-sm text-gray-500 mt-1">
            Créer une nouvelle commande de production
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <CommandeForm
        mode="create"
        articles={articles}
        onSubmit={handleCreate}
        onCancel={() => window.history.back()}
      />
    </div>
  );
};

export default NouvelleCommande;
