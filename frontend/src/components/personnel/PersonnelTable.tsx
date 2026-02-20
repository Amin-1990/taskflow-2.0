import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import type { Personnel } from '../../types/personnel.types';
import { getAnciennete } from '../../types/personnel.types';

interface PersonnelTableProps {
  personnels: Personnel[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: 'actif' | 'inactif') => void;
  loading?: boolean;
}

const PersonnelTable: FunctionalComponent<PersonnelTableProps> = ({
  personnels,
  onEdit,
  onDelete,
  onStatusChange,
  loading = false,
}) => {
  const [sortBy, setSortBy] = useState<keyof Personnel>('Nom_prenom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  if (loading) {
    return h('div', { class: 'rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm' }, 'Chargement du tableau...');
  }

  if (personnels.length === 0) {
    return h('div', { class: 'rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm' }, 'Aucun employe trouve');
  }

  const sorted = [...personnels].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const compare = aVal > bVal ? 1 : -1;
    return sortOrder === 'asc' ? compare : -compare;
  });

  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = (column: keyof Personnel) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: keyof Personnel) => {
    if (sortBy !== column) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const thClass = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700';
  const tdClass = 'px-4 py-3 text-sm text-gray-700';

  return h('div', { class: 'rounded-lg bg-white shadow-sm overflow-hidden' },
    h('div', { class: 'overflow-x-auto' },
      h('table', { class: 'w-full min-w-[920px] text-sm' },
        h('thead', { class: 'border-b border-gray-200 bg-gray-50' },
          h('tr', null,
            h('th', {
              onClick: () => handleSort('Matricule'),
              class: `${thClass} cursor-pointer hover:bg-gray-100`
            }, `Matricule${getSortIcon('Matricule')}`),
            h('th', {
              onClick: () => handleSort('Nom_prenom'),
              class: `${thClass} cursor-pointer hover:bg-gray-100`
            }, `Nom/Prenom${getSortIcon('Nom_prenom')}`),
            h('th', { class: thClass }, 'Poste'),
            h('th', { class: thClass }, 'Statut'),
            h('th', { class: thClass }, 'Site'),
            h('th', { class: thClass }, 'Email'),
            h('th', { class: thClass }, 'Telephone'),
            h('th', { class: thClass }, 'Anciennete'),
            h('th', { class: `${thClass} text-right` }, 'Actions')
          )
        ),
        h('tbody', { class: 'divide-y divide-gray-200' },
          paginated.map(p =>
            h('tr', { key: p.ID, class: 'hover:bg-gray-50' },
              h('td', { class: `${tdClass} font-semibold text-blue-700` }, p.Matricule),
              h('td', { class: `${tdClass} font-medium` }, p.Nom_prenom),
              h('td', { class: tdClass },
                h('span', { class: 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700' }, p.Poste)
              ),
              h('td', { class: tdClass },
                h('button', {
                  type: 'button',
                  onClick: () => onStatusChange(p.ID, p.Statut === 'actif' ? 'inactif' : 'actif'),
                  class: p.Statut === 'actif'
                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                    : 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700',
                  title: `Cliquer pour marquer ${p.Statut === 'actif' ? 'inactif' : 'actif'}`
                }, p.Statut === 'actif' ? 'Actif' : 'Inactif')
              ),
              h('td', { class: tdClass }, p.Site_affectation || '—'),
              h('td', { class: tdClass },
                p.Email
                  ? h('a', { href: `mailto:${p.Email}`, class: 'text-blue-600 hover:underline' }, p.Email)
                  : h('span', { class: 'text-gray-400' }, '—')
              ),
              h('td', { class: tdClass },
                p.Telephone
                  ? h('a', { href: `tel:${p.Telephone}`, class: 'text-blue-600 hover:underline' }, p.Telephone)
                  : h('span', { class: 'text-gray-400' }, '—')
              ),
              h('td', { class: tdClass }, getAnciennete(p.Date_embauche)),
              h('td', { class: `${tdClass} text-right` },
                h('div', { class: 'inline-flex items-center gap-2' },
                  h('button', {
                    type: 'button',
                    onClick: () => onEdit(p.ID),
                    class: 'rounded-lg p-2 text-blue-600 hover:bg-blue-50',
                    title: 'Modifier'
                  }, '✏'),
                  h('button', {
                    type: 'button',
                    onClick: () => {
                      if (window.confirm(`Etes-vous sur de vouloir supprimer ${p.Nom_prenom} ?`)) {
                        onDelete(p.ID);
                      }
                    },
                    class: 'rounded-lg p-2 text-red-600 hover:bg-red-50',
                    title: 'Supprimer'
                  }, '🗑')
                )
              )
            )
          )
        )
      )
    ),

    totalPages > 1 && h('div', { class: 'flex items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3' },
      h('button', {
        type: 'button',
        onClick: () => setCurrentPage(1),
        disabled: currentPage === 1,
        class: 'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50'
      }, 'Premiere'),
      h('button', {
        type: 'button',
        onClick: () => setCurrentPage(p => Math.max(1, p - 1)),
        disabled: currentPage === 1,
        class: 'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50'
      }, 'Precedente'),
      h('span', { class: 'px-2 text-sm font-medium text-gray-700' }, `Page ${currentPage} sur ${totalPages}`),
      h('button', {
        type: 'button',
        onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)),
        disabled: currentPage === totalPages,
        class: 'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50'
      }, 'Suivante'),
      h('button', {
        type: 'button',
        onClick: () => setCurrentPage(totalPages),
        disabled: currentPage === totalPages,
        class: 'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50'
      }, 'Derniere')
    ),

    h('div', { class: 'border-t border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600' },
      `Affichage ${paginated.length} sur ${sorted.length} employe(s)`
    )
  );
};

export default PersonnelTable;
