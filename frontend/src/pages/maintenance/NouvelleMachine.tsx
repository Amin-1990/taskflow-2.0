/**
 * Page Création d'une Machine
 * Formulaire de création
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ChevronLeft, AlertCircle } from 'lucide-preact';
import { useMachines } from '../../hooks/useMachines';
import type { CreateMachineDto } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';

interface NouvelleMachineProps {
  path?: string;
}

export const NouvelleMachine: FunctionComponent<NouvelleMachineProps> = () => {
  const { createMachine } = useMachines();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateMachineDto>({
    code: '',
    nom: '',
    type: '',
    localisation: '',
    description: undefined,
    numero_serie: undefined,
    date_acquisition: undefined,
    notes: undefined,
  });

  useEffect(() => {
    console.log('🔧 Création nouvelle machine');
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.type.trim()) newErrors.type = 'Le type est requis';
    if (!formData.localisation.trim()) newErrors.localisation = 'La localisation est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error('Veuillez corriger les erreurs');
      return;
    }

    setIsLoading(true);

    try {
      const success = await createMachine(formData);
      if (success) {
        // Redirection
        console.log('✅ Machine créée avec succès');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {/* Naviguer vers /maintenance/machines */}}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nouvelle machine</h1>
          <p className="text-sm text-gray-500 mt-1">Ajouter une machine au système</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        {/* Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Ex: MCH-001"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
        </div>

        {/* Nom */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Ex: Presse hydraulique A"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
        </div>

        {/* Type et Localisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="Ex: Presse, Découpe..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              placeholder="Ex: Atelier A, Poste 1"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.localisation ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.localisation && <p className="text-red-600 text-sm mt-1">{errors.localisation}</p>}
          </div>
        </div>

        {/* Numéro de série et Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de série
            </label>
            <input
              type="text"
              name="numero_serie"
              value={formData.numero_serie || ''}
              onChange={handleChange}
              placeholder="Optionnel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'acquisition
            </label>
            <input
              type="date"
              name="date_acquisition"
              value={formData.date_acquisition || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Description détaillée de la machine..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            placeholder="Notes additionnelles..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Boutons */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Création en cours...</span>
              </>
            ) : (
              <span>Créer la machine</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {/* Naviguer vers /maintenance/machines */}}
            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default NouvelleMachine;



