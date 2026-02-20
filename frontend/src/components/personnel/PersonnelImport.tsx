import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { personnelAPI } from '../../api/personnel';

interface PersonnelImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    matricule: string;
    error: string;
  }>;
}

const PersonnelImport: FunctionalComponent<PersonnelImportProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const selectedFile = target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(csv|xlsx?)$/i)) {
      setError('Format invalide. Accepte: CSV, XLS, XLSX');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5MB)');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez selectionner un fichier');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await personnelAPI.import(file);
      const importedIds = Array.isArray(response?.data) ? response.data : [];
      const normalizedResult: ImportResult = {
        success: importedIds.length,
        failed: 0,
        errors: [],
      };
      setResult(normalizedResult);

      if (normalizedResult.success > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l import');
    } finally {
      setIsImporting(false);
    }
  };

  const cardClass = 'rounded-lg border border-gray-200 bg-gray-50 p-4';

  return h('div', { class: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4', onClick: onClose },
    h('div', { class: 'w-full max-w-3xl rounded-lg bg-white shadow-xl', onClick: (e: Event) => e.stopPropagation() },
      h('div', { class: 'flex items-center justify-between border-b border-gray-200 px-5 py-4' },
        h('h2', { class: 'text-lg font-semibold text-gray-800' }, 'Importer des employes'),
        h('button', { type: 'button', onClick: onClose, class: 'text-gray-500 hover:text-gray-700' }, '✕')
      ),

      h('div', { class: 'space-y-4 px-5 py-4' },
        !result ? h('div', { class: 'space-y-4' },
          error && h('div', { class: 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700' }, error),

          h('div', { class: cardClass },
            h('h3', { class: 'mb-2 text-sm font-semibold text-gray-800' }, '1. Selectionner un fichier'),
            h('input', {
              type: 'file',
              id: 'file-input',
              onChange: handleFileChange,
              accept: '.csv,.xlsx,.xls',
              disabled: isImporting,
              class: 'hidden'
            }),
            h('label', {
              htmlFor: 'file-input',
              class: 'flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-700 hover:bg-gray-50'
            }, file ? `Fichier: ${file.name} (${(file.size / 1024).toFixed(2)} KB)` : 'Cliquez pour choisir un fichier CSV/Excel')
          ),

          h('div', { class: cardClass },
            h('h3', { class: 'mb-2 text-sm font-semibold text-gray-800' }, '2. Format attendu'),
            h('ul', { class: 'list-disc space-y-1 pl-5 text-sm text-gray-700' },
              h('li', null, 'Champs requis: Nom_prenom, Matricule, Date_embauche (YYYY-MM-DD)'),
              h('li', null, 'Colonnes optionnelles: Qr_code, Email, Date_naissance, Adresse, Ville, Code_postal, Telephone'),
              h('li', null, 'Colonnes optionnelles: Poste, Statut (actif/inactif), Type_contrat, Date_fin_contrat, Site_affectation, Numero_CNSS, Commentaire'),
              h('li', null, 'Import intelligent: si Matricule existe deja, la ligne est mise a jour')
            )
          ),

          h('div', { class: cardClass },
            h('h3', { class: 'mb-2 text-sm font-semibold text-gray-800' }, '3. Apercu'),
            file
              ? h('div', { class: 'space-y-1 text-sm text-gray-700' },
                  h('p', null, `Nom: ${file.name}`),
                  h('p', null, `Taille: ${(file.size / 1024).toFixed(2)} KB`),
                  h('p', null, `Type: ${file.type || 'inconnu'}`)
                )
              : h('p', { class: 'text-sm text-gray-500' }, 'Aucun fichier selectionne')
          )
        ) : h('div', { class: 'space-y-4' },
          h('div', {
            class: result.failed === 0
              ? 'rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'
              : 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700'
          }, result.failed === 0 ? 'Import reussi' : `Import partiel (${result.failed} erreur(s))`),

          h('div', { class: 'grid grid-cols-1 gap-3 md:grid-cols-2' },
            h('div', { class: 'rounded-lg bg-green-50 p-3 text-sm' },
              h('p', { class: 'text-gray-600' }, 'Importes'),
              h('p', { class: 'text-2xl font-bold text-green-700' }, result.success)
            ),
            h('div', { class: 'rounded-lg bg-red-50 p-3 text-sm' },
              h('p', { class: 'text-gray-600' }, 'Erreurs'),
              h('p', { class: 'text-2xl font-bold text-red-700' }, result.failed)
            )
          ),

          result.errors.length > 0 && h('div', { class: 'rounded-lg border border-red-200 bg-red-50 p-3' },
            h('h4', { class: 'mb-2 text-sm font-semibold text-red-800' }, 'Erreurs detectees'),
            h('div', { class: 'max-h-48 space-y-1 overflow-auto text-sm text-red-700' },
              result.errors.map((err, idx) =>
                h('div', { key: idx }, `Ligne ${err.row} (${err.matricule}): ${err.error}`)
              )
            )
          )
        )
      ),

      h('div', { class: 'flex justify-end gap-3 border-t border-gray-200 px-5 py-4' },
        h('button', {
          type: 'button',
          onClick: onClose,
          class: 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
        }, result ? 'Fermer' : 'Annuler'),
        !result && h('button', {
          type: 'button',
          onClick: handleImport,
          disabled: !file || isImporting,
          class: 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
        }, isImporting ? 'Import...' : 'Importer')
      )
    )
  );
};

export default PersonnelImport;
