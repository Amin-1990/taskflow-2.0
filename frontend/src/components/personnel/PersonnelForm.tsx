import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { usePersonnel } from '../../hooks';
import type { Personnel } from '../../types/personnel.types';
import { getDefaultPersonnelData, POSTE_OPTIONS, STATUT_OPTIONS, TYPE_CONTRAT_OPTIONS } from '../../types/personnel.types';

interface PersonnelFormProps {
  id?: number;
  hideInternalHeader?: boolean;
}

const baseInputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const errorInputClass = `${baseInputClass} border-red-400 focus:border-red-500 focus:ring-red-500/20`;

const PersonnelForm: FunctionalComponent<PersonnelFormProps> = ({ id, hideInternalHeader = false }) => {
  const { getById, create, update } = usePersonnel();
  const [formData, setFormData] = useState<Partial<Personnel>>(getDefaultPersonnelData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      getById(id).then(data => {
        if (data) setFormData(data);
        setLoading(false);
      });
    }
  }, [id, getById]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Nom_prenom?.trim()) newErrors.Nom_prenom = 'Le nom/prenom est requis';
    if (!formData.Matricule?.trim()) newErrors.Matricule = 'Le matricule est requis';
    if (!formData.Date_embauche) newErrors.Date_embauche = 'La date d embauche est requise';
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) newErrors.Email = 'Email invalide';
    if (formData.Telephone && !/^[0-9\s\-\+\(\)]+$/.test(formData.Telephone)) newErrors.Telephone = 'Telephone invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (id) {
        const result = await update(id, formData);
        if (result) {
          setSuccessMessage('Employe modifie avec succes');
          setTimeout(() => route('/personnel'), 1200);
        }
      } else {
        const result = await create(formData);
        if (result) {
          setSuccessMessage('Employe cree avec succes');
          setTimeout(() => route('/personnel'), 1200);
        }
      }
    } catch {
      setErrors({ submit: 'Erreur lors de l enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value } = target;

    setFormData(prev => ({ ...prev, [name]: value || undefined }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (loading) {
    return h('div', { class: 'rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm' }, 'Chargement du formulaire...');
  }

  const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700';
  const fieldErrorClass = 'mt-1 block text-xs text-red-600';

  const section = (title: string, children: any) =>
    h('fieldset', { class: 'rounded-lg border border-gray-200 bg-gray-50 p-4' },
      h('legend', { class: 'px-1 text-sm font-semibold text-gray-800' }, title),
      h('div', { class: 'mt-2 space-y-4' }, children)
    );

  return h('div', { class: 'mx-auto max-w-5xl rounded-lg bg-white p-6 shadow-sm' },
    !hideInternalHeader && h('div', { class: 'mb-6 flex items-start justify-between gap-3' },
      h('h1', { class: 'text-2xl font-bold text-gray-800' }, id ? 'Modifier un employe' : 'Creer un nouvel employe'),
      h('button', {
        type: 'button',
        onClick: () => route('/personnel'),
        class: 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'
      }, 'Fermer')
    ),

    successMessage && h('div', { class: 'mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700' }, successMessage),
    errors.submit && h('div', { class: 'mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700' }, errors.submit),

    h('form', { onSubmit: handleSubmit, class: 'space-y-5' },
      section('Informations de base', [
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Nom_prenom', class: fieldLabelClass }, 'Nom/Prenom *'),
            h('input', {
              id: 'Nom_prenom',
              name: 'Nom_prenom',
              type: 'text',
              value: formData.Nom_prenom || '',
              onChange: handleChange,
              class: errors.Nom_prenom ? errorInputClass : baseInputClass,
              placeholder: 'Ex: Amine Mnasser'
            }),
            errors.Nom_prenom && h('span', { class: fieldErrorClass }, errors.Nom_prenom)
          ),
          h('div', null,
            h('label', { htmlFor: 'Matricule', class: fieldLabelClass }, 'Matricule *'),
            h('input', {
              id: 'Matricule',
              name: 'Matricule',
              type: 'text',
              value: formData.Matricule || '',
              onChange: handleChange,
              class: errors.Matricule ? errorInputClass : baseInputClass,
              placeholder: 'Ex: MAT001',
              disabled: !!id
            }),
            errors.Matricule && h('span', { class: fieldErrorClass }, errors.Matricule)
          )
        ),
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Date_embauche', class: fieldLabelClass }, 'Date d embauche *'),
            h('input', {
              id: 'Date_embauche',
              name: 'Date_embauche',
              type: 'date',
              value: formData.Date_embauche || '',
              onChange: handleChange,
              class: errors.Date_embauche ? errorInputClass : baseInputClass
            }),
            errors.Date_embauche && h('span', { class: fieldErrorClass }, errors.Date_embauche)
          ),
          h('div', null,
            h('label', { htmlFor: 'Poste', class: fieldLabelClass }, 'Poste'),
            h('select', {
              id: 'Poste',
              name: 'Poste',
              value: formData.Poste || 'Operateur',
              onChange: handleChange,
              class: baseInputClass
            }, POSTE_OPTIONS.map(poste => h('option', { key: poste, value: poste }, poste)))
          )
        ),
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Statut', class: fieldLabelClass }, 'Statut'),
            h('select', {
              id: 'Statut',
              name: 'Statut',
              value: formData.Statut || 'actif',
              onChange: handleChange,
              class: baseInputClass
            }, STATUT_OPTIONS.map(statut => h('option', { key: statut, value: statut }, statut))),
          ),
          h('div', null,
            h('label', { htmlFor: 'Date_naissance', class: fieldLabelClass }, 'Date de naissance'),
            h('input', {
              id: 'Date_naissance',
              name: 'Date_naissance',
              type: 'date',
              value: formData.Date_naissance || '',
              onChange: handleChange,
              class: baseInputClass
            })
          )
        )
      ]),

      section('Coordonnees', [
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Email', class: fieldLabelClass }, 'Email'),
            h('input', {
              id: 'Email',
              name: 'Email',
              type: 'email',
              value: formData.Email || '',
              onChange: handleChange,
              class: errors.Email ? errorInputClass : baseInputClass,
              placeholder: 'nom@company.com'
            }),
            errors.Email && h('span', { class: fieldErrorClass }, errors.Email)
          ),
          h('div', null,
            h('label', { htmlFor: 'Telephone', class: fieldLabelClass }, 'Telephone'),
            h('input', {
              id: 'Telephone',
              name: 'Telephone',
              type: 'tel',
              value: formData.Telephone || '',
              onChange: handleChange,
              class: errors.Telephone ? errorInputClass : baseInputClass,
              placeholder: '+216 26 XXX XXX'
            }),
            errors.Telephone && h('span', { class: fieldErrorClass }, errors.Telephone)
          )
        ),
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Adresse', class: fieldLabelClass }, 'Adresse'),
            h('input', {
              id: 'Adresse',
              name: 'Adresse',
              type: 'text',
              value: formData.Adresse || '',
              onChange: handleChange,
              class: baseInputClass
            })
          ),
          h('div', null,
            h('label', { htmlFor: 'Ville', class: fieldLabelClass }, 'Ville'),
            h('input', {
              id: 'Ville',
              name: 'Ville',
              type: 'text',
              value: formData.Ville || '',
              onChange: handleChange,
              class: baseInputClass
            })
          )
        ),
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Code_postal', class: fieldLabelClass }, 'Code postal'),
            h('input', {
              id: 'Code_postal',
              name: 'Code_postal',
              type: 'text',
              value: formData.Code_postal || '',
              onChange: handleChange,
              class: baseInputClass
            })
          ),
          h('div', null,
            h('label', { htmlFor: 'Qr_code', class: fieldLabelClass }, 'QR code'),
            h('input', {
              id: 'Qr_code',
              name: 'Qr_code',
              type: 'text',
              value: formData.Qr_code || '',
              onChange: handleChange,
              class: baseInputClass
            })
          )
        )
      ]),

      section('Contrat', [
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Type_contrat', class: fieldLabelClass }, 'Type de contrat'),
            h('select', {
              id: 'Type_contrat',
              name: 'Type_contrat',
              value: formData.Type_contrat || 'CDI',
              onChange: handleChange,
              class: baseInputClass
            }, TYPE_CONTRAT_OPTIONS.map(type => h('option', { key: type, value: type }, type)))
          ),
          h('div', null,
            h('label', { htmlFor: 'Date_fin_contrat', class: fieldLabelClass }, 'Date fin contrat'),
            h('input', {
              id: 'Date_fin_contrat',
              name: 'Date_fin_contrat',
              type: 'date',
              value: formData.Date_fin_contrat || '',
              onChange: handleChange,
              class: baseInputClass
            })
          )
        ),
        h('div', { class: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          h('div', null,
            h('label', { htmlFor: 'Site_affectation', class: fieldLabelClass }, 'Site d affectation'),
            h('input', {
              id: 'Site_affectation',
              name: 'Site_affectation',
              type: 'text',
              value: formData.Site_affectation || '',
              onChange: handleChange,
              class: baseInputClass,
              placeholder: 'Ex: Unite 1'
            })
          ),
          h('div', null,
            h('label', { htmlFor: 'Numero_CNSS', class: fieldLabelClass }, 'Numero CNSS'),
            h('input', {
              id: 'Numero_CNSS',
              name: 'Numero_CNSS',
              type: 'text',
              value: formData.Numero_CNSS || '',
              onChange: handleChange,
              class: baseInputClass
            })
          )
        )
      ]),

      section('Commentaires', [
        h('div', null,
          h('label', { htmlFor: 'Commentaire', class: fieldLabelClass }, 'Commentaires supplementaires'),
          h('textarea', {
            id: 'Commentaire',
            name: 'Commentaire',
            value: formData.Commentaire || '',
            onChange: handleChange,
            rows: 4,
            class: baseInputClass
          })
        )
      ]),

      h('div', { class: 'flex justify-end gap-3' },
        h('button', {
          type: 'button',
          onClick: () => route('/personnel'),
          class: 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
        }, 'Annuler'),
        h('button', {
          type: 'submit',
          disabled: submitting,
          class: 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
        }, submitting ? 'Enregistrement...' : id ? 'Modifier' : 'Creer')
      )
    )
  );
};

export default PersonnelForm;
