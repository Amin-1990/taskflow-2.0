import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import PersonnelForm from '../../components/personnel/PersonnelForm';
import PersonnelPageHeader from '../../components/personnel/PersonnelPageHeader';

const PersonnelEdit: FunctionalComponent = () => {
  const matches = window.location.pathname.match(/\/personnel\/(\d+)\/edit/);
  const id = matches ? parseInt(matches[1]) : null;

  if (!id) {
    return h('div', null, 'ID employé manquant');
  }

  return h('div', { class: 'space-y-6' },
    h(PersonnelPageHeader, {
      title: 'Modifier personnel',
      subtitle: `Edition de l'employe #${id}`,
    }),
    h(PersonnelForm, { id, hideInternalHeader: true })
  );
};

export default PersonnelEdit;
