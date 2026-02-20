import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import PersonnelForm from '../../components/personnel/PersonnelForm';
import PersonnelPageHeader from '../../components/personnel/PersonnelPageHeader';

const PersonnelCreate: FunctionalComponent = () => {
  return h('div', { class: 'space-y-6' },
    h(PersonnelPageHeader, {
      title: 'Nouveau personnel',
      subtitle: 'Creer un nouvel employe',
    }),
    h(PersonnelForm, { hideInternalHeader: true })
  );
};

export default PersonnelCreate;
