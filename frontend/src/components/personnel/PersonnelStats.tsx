import { h } from 'preact';
import type { FunctionalComponent } from 'preact';

interface PersonnelStatsProps {
  stats: {
    total: number;
    actifs: number;
    inactifs: number;
  };
}

const PersonnelStats: FunctionalComponent<PersonnelStatsProps> = ({ stats }) => {
  const activePercentage = stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0;
  const inactivePercentage = stats.total > 0 ? Math.round((stats.inactifs / stats.total) * 100) : 0;

  const cardBase = 'rounded-lg bg-white p-4 shadow-sm';

  return h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4' },
    h('div', { class: `${cardBase} border-l-4 border-blue-500` },
      h('div', { class: 'text-sm text-gray-500' }, 'Total Employes'),
      h('div', { class: 'mt-2 text-3xl font-bold text-gray-800' }, stats.total)
    ),

    h('div', { class: `${cardBase} border-l-4 border-green-500` },
      h('div', { class: 'text-sm text-gray-500' }, `Actifs (${activePercentage}%)`),
      h('div', { class: 'mt-2 text-3xl font-bold text-green-700' }, stats.actifs)
    ),

    h('div', { class: `${cardBase} border-l-4 border-red-500` },
      h('div', { class: 'text-sm text-gray-500' }, `Inactifs (${inactivePercentage}%)`),
      h('div', { class: 'mt-2 text-3xl font-bold text-red-700' }, stats.inactifs)
    ),

    h('div', { class: `${cardBase} border-l-4 border-amber-500` },
      h('div', { class: 'text-sm text-gray-500' }, 'Taux d activite'),
      h('div', { class: 'mt-3 flex items-center gap-3' },
        h('div', { class: 'h-2 flex-1 overflow-hidden rounded bg-gray-200' },
          h('div', {
            class: 'h-full bg-green-500',
            style: { width: `${activePercentage}%` }
          })
        ),
        h('span', { class: 'text-sm font-semibold text-green-700' }, `${activePercentage}%`)
      )
    )
  );
};

export default PersonnelStats;
