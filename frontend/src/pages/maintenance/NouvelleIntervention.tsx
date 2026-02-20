/**
 * Page Création d'une Intervention
 * Formulaire de création
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { ChevronLeft, AlertCircle } from 'lucide-preact';
import { useInterventions } from '../../hooks/useInterventions';
import * as maintenanceApi from '../../api/maintenance';
import type { CreateInterventionDto, Machine } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';

interface NouvelleInterventionProps {
    path?: string;
    machine_id?: string;
}

export const NouvelleIntervention: FunctionComponent<NouvelleInterventionProps> = ({ machine_id }) => {
    const { createIntervention } = useInterventions();
    const [isLoading, setIsLoading] = useState(false);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateInterventionDto>({
        machine_id: machine_id ? parseInt(machine_id) : 0,
        titre: '',
        type: 'curative',
        priorite: 'normale',
        description: undefined,
        cause: undefined,
        solution: undefined,
        pieces_utilisees: undefined,
        technicien_id: undefined,
        date_fin_prevue: undefined,
        duree_prevue_heures: undefined,
        notes: undefined,
    });

    useEffect(() => {
        console.log('🔧 Création nouvelle intervention');
        loadMachines();
    }, []);

    const loadMachines = async () => {
        try {
            const response = await maintenanceApi.getMachines({}, 1, 100);
            setMachines(response.data || []);
        } catch (err) {
            console.error('Erreur chargement machines:', err);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (formData.machine_id === 0) newErrors.machine_id = 'La machine est requise';
        if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';

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
            const success = await createIntervention(formData);
            if (success) {
                console.log('✅ Intervention créée avec succès');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const { name, value } = target;

        let finalValue: any = value;
        if (name === 'machine_id' || name === 'technicien_id' || name === 'duree_prevue_heures') {
            finalValue = value ? parseInt(value) : (name === 'machine_id' ? 0 : undefined);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => route('/maintenance/interventions')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Nouvelle intervention</h1>
                    <p className="text-sm text-gray-500 mt-1">Créer une intervention de maintenance</p>
                </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 max-w-3xl">
                {/* Machine */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Machine <span className="text-red-600">*</span>
                    </label>
                    <select
                        name="machine_id"
                        value={formData.machine_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.machine_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Sélectionner une machine</option>
                        {machines.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.code} - {m.nom}
                            </option>
                        ))}
                    </select>
                    {errors.machine_id && <p className="text-red-600 text-sm mt-1">{errors.machine_id}</p>}
                </div>

                {/* Titre */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="text"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        placeholder="Ex: Remplacement courroie"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.titre ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.titre && <p className="text-red-600 text-sm mt-1">{errors.titre}</p>}
                </div>

                {/* Type, Priorité, Durée */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type d'intervention
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="curative">Curative (réparation)</option>
                            <option value="preventive">Préventive (maintenance)</option>
                            <option value="ameliorative">Améliorative (amélioration)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priorité
                        </label>
                        <select
                            name="priorite"
                            value={formData.priorite}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="basse">Basse</option>
                            <option value="normale">Normale</option>
                            <option value="haute">Haute</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Durée prévue (heures)
                        </label>
                        <input
                            type="number"
                            name="duree_prevue_heures"
                            value={formData.duree_prevue_heures || ''}
                            onChange={handleChange}
                            placeholder="Ex: 2"
                            min="0.5"
                            step="0.5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Technicien et Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technicien
                        </label>
                        <input
                            type="text"
                            placeholder="Optionnel - À assigner plus tard"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">À assigner après création</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin prévue
                        </label>
                        <input
                            type="date"
                            name="date_fin_prevue"
                            value={formData.date_fin_prevue || ''}
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
                        placeholder="Décrivez l'intervention..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Cause et Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cause (si connue)
                        </label>
                        <textarea
                            name="cause"
                            value={formData.cause || ''}
                            onChange={handleChange}
                            placeholder="Cause du problème..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Solution (si connue)
                        </label>
                        <textarea
                            name="solution"
                            value={formData.solution || ''}
                            onChange={handleChange}
                            placeholder="Solution proposée..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Pièces et Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pièces utilisées
                        </label>
                        <textarea
                            name="pieces_utilisees"
                            value={formData.pieces_utilisees || ''}
                            onChange={handleChange}
                            placeholder="Liste des pièces..."
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            placeholder="Notes additionnelles..."
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
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
                            <span>Créer l'intervention</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => route('/maintenance/interventions')}
                        className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NouvelleIntervention;



