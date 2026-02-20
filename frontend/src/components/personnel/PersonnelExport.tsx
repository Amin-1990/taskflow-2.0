import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import type { Personnel } from '../../types/personnel.types';

interface PersonnelExportProps {
  allPersonnels: Personnel[];
  filteredPersonnels: Personnel[];
  onClose: () => void;
}

const PersonnelExport: FunctionalComponent<PersonnelExportProps> = ({ allPersonnels, filteredPersonnels, onClose }) => {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [dataType, setDataType] = useState<'all' | 'filtered'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataToExport = dataType === 'all' ? allPersonnels : filteredPersonnels;

      if (format === 'csv') {
        exportAsCSV(dataToExport);
      } else {
        exportAsCSV(dataToExport);
      }

      alert('Donnees exportees avec succes');
      onClose();
    } catch (error) {
      alert('Erreur lors de l export');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = (data: Personnel[]) => {
    const headers = [
      'ID', 'Matricule', 'Nom/Prenom', 'Email', 'Telephone',
      'Poste', 'Statut', 'Date Embauche', 'Site', 'Type Contrat'
    ];

    const rows = data.map(p => [
      p.ID, p.Matricule, p.Nom_prenom, p.Email || '', p.Telephone || '',
      p.Poste, p.Statut, p.Date_embauche, p.Site_affectation || '', p.Type_contrat
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personnel-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const sectionTitle = 'mb-2 block text-sm font-medium text-gray-700';
  const radioLine = 'flex items-center gap-2 rounded border border-gray-200 p-2 text-sm text-gray-700';

  return h('div', { class: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4', onClick: onClose },
    h('div', { class: 'w-full max-w-lg rounded-lg bg-white shadow-xl', onClick: (e: Event) => e.stopPropagation() },
      h('div', { class: 'flex items-center justify-between border-b border-gray-200 px-5 py-4' },
        h('h2', { class: 'text-lg font-semibold text-gray-800' }, 'Exporter les donnees'),
        h('button', { type: 'button', onClick: onClose, class: 'text-gray-500 hover:text-gray-700' }, '✕')
      ),

      h('div', { class: 'space-y-5 px-5 py-4' },
        h('div', null,
          h('label', { class: sectionTitle }, 'Format d export'),
          h('div', { class: 'space-y-2' },
            h('label', { class: radioLine },
              h('input', {
                type: 'radio',
                value: 'csv',
                checked: format === 'csv',
                onChange: (e: Event) => setFormat((e.target as HTMLInputElement).value as 'csv' | 'excel')
              }),
              'CSV'
            ),
            h('label', { class: radioLine },
              h('input', {
                type: 'radio',
                value: 'excel',
                checked: format === 'excel',
                onChange: (e: Event) => setFormat((e.target as HTMLInputElement).value as 'csv' | 'excel')
              }),
              'Excel (fallback CSV)'
            )
          )
        ),

        h('div', null,
          h('label', { class: sectionTitle }, 'Donnees a exporter'),
          h('div', { class: 'space-y-2' },
            h('label', { class: radioLine },
              h('input', {
                type: 'radio',
                value: 'all',
                checked: dataType === 'all',
                onChange: (e: Event) => setDataType((e.target as HTMLInputElement).value as 'all' | 'filtered')
              }),
              `Tous les employes (${allPersonnels.length})`
            ),
            h('label', { class: radioLine },
              h('input', {
                type: 'radio',
                value: 'filtered',
                checked: dataType === 'filtered',
                onChange: (e: Event) => setDataType((e.target as HTMLInputElement).value as 'all' | 'filtered')
              }),
              `Donnees filtrees actuelles (${filteredPersonnels.length})`
            )
          )
        ),

        h('div', { class: 'rounded-lg bg-gray-50 p-3 text-sm text-gray-700' },
          h('p', { class: 'font-semibold text-gray-800' }, 'Apercu'),
          h('ul', { class: 'mt-1 space-y-1' },
            h('li', null, `Format: ${format === 'csv' ? 'CSV' : 'Excel'}`),
            h('li', null, `Enregistrements: ${dataType === 'all' ? allPersonnels.length : filteredPersonnels.length}`),
            h('li', null, 'Colonnes: 10')
          )
        )
      ),

      h('div', { class: 'flex justify-end gap-3 border-t border-gray-200 px-5 py-4' },
        h('button', {
          type: 'button',
          onClick: onClose,
          class: 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
        }, 'Annuler'),
        h('button', {
          type: 'button',
          onClick: handleExport,
          disabled: isExporting,
          class: 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
        }, isExporting ? 'Export...' : 'Telecharger')
      )
    )
  );
};

export default PersonnelExport;
