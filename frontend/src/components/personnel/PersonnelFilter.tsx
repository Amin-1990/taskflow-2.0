import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import type { PersonnelFilters } from '../../types/personnel.types';
import { POSTE_OPTIONS, STATUT_OPTIONS, TYPE_CONTRAT_OPTIONS } from '../../types/personnel.types';

interface PersonnelFilterProps {
  filters: PersonnelFilters;
  onFilterChange: (key: keyof PersonnelFilters, value: any) => void;
  hasActive: boolean;
  onClear: () => void;
}

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const PersonnelFilter: FunctionalComponent<PersonnelFilterProps> = ({
  filters,
  onFilterChange,
  hasActive,
  onClear,
}) => {
  return h('div', null,
    h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' },
      h('div', null,
        h('label', { htmlFor: 'filter-statut', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Statut'),
        h('select', {
          id: 'filter-statut',
          value: filters.statut || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            onFilterChange('statut', target.value || undefined);
          },
          class: inputClass
        },
          h('option', { value: '' }, 'Tous'),
          STATUT_OPTIONS.map(statut =>
            h('option', { key: statut, value: statut }, statut === 'actif' ? 'Actif' : 'Inactif')
          )
        )
      ),

      h('div', null,
        h('label', { htmlFor: 'filter-poste', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Poste'),
        h('select', {
          id: 'filter-poste',
          value: filters.poste || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            onFilterChange('poste', target.value || undefined);
          },
          class: inputClass
        },
          h('option', { value: '' }, 'Tous'),
          POSTE_OPTIONS.map(poste => h('option', { key: poste, value: poste }, poste))
        )
      ),

      h('div', null,
        h('label', { htmlFor: 'filter-site', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Site d affectation'),
        h('input', {
          id: 'filter-site',
          type: 'text',
          placeholder: 'Tous les sites',
          value: filters.site || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement;
            onFilterChange('site', target.value || undefined);
          },
          class: inputClass
        })
      ),

      h('div', null,
        h('label', { htmlFor: 'filter-contrat', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Type de contrat'),
        h('select', {
          id: 'filter-contrat',
          value: filters.type_contrat || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            onFilterChange('type_contrat', target.value || undefined);
          },
          class: inputClass
        },
          h('option', { value: '' }, 'Tous'),
          TYPE_CONTRAT_OPTIONS.map(type => h('option', { key: type, value: type }, type))
        )
      ),

      h('div', null,
        h('label', { htmlFor: 'filter-date-min', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Date embauche min'),
        h('input', {
          id: 'filter-date-min',
          type: 'date',
          value: filters.dateEmbaucheMin || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement;
            onFilterChange('dateEmbaucheMin', target.value || undefined);
          },
          class: inputClass
        })
      ),

      h('div', null,
        h('label', { htmlFor: 'filter-date-max', class: 'mb-1 block text-sm font-medium text-gray-700' }, 'Date embauche max'),
        h('input', {
          id: 'filter-date-max',
          type: 'date',
          value: filters.dateEmbaucheMax || '',
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement;
            onFilterChange('dateEmbaucheMax', target.value || undefined);
          },
          class: inputClass
        })
      )
    ),

    hasActive && h('div', { class: 'mt-4 flex justify-end' },
      h('button', {
        type: 'button',
        onClick: onClear,
        class: 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
      }, 'Reinitialiser filtres')
    )
  );
};

export default PersonnelFilter;
