/**
 * Page Liste des Machines
 * Affichage avec tableau, filtres et recherche
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import {
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Eye,
    AlertCircle,
    AlertTriangle,
    Download,
    Upload,
} from 'lucide-preact';
import { useMachines } from '../../hooks/useMachines';
import type { MachineStatut } from '../../types/maintenance.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';

interface MachinesListProps {
    path?: string;
}

const STATUT_COLORS: Record<MachineStatut, string> = {
    operationnelle: 'bg-green-100 text-green-800',
    en_panne: 'bg-red-100 text-red-800',
    en_maintenance: 'bg-blue-100 text-blue-800',
    en_attente: 'bg-yellow-100 text-yellow-800',
    hors_service: 'bg-gray-100 text-gray-800',
};

const STATUT_LABELS: Record<MachineStatut, string> = {
    operationnelle: 'OpÃ©rationnelle',
    en_panne: 'En panne',
    en_maintenance: 'En maintenance',
    en_attente: 'En attente',
    hors_service: 'Hors service',
};

const STATUT_ICONS: Record<MachineStatut, any> = {
    operationnelle: null,
    en_panne: AlertTriangle,
    en_maintenance: null,
    en_attente: null,
    hors_service: null,
};

export const Machines: FunctionComponent<MachinesListProps> = () => {
    const {
        machines,
        loading,
        error,
        page,
        limit,
        total,
        pages,
        setPage,
        setLimit,
        recherche,
        setRecherche,
        filtres,
        setFiltres,
        clearFiltres,
        deleteMachine,
        updateStatut,
    } = useMachines();

    const [showFilters, setShowFilters] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('ðŸ”§ Module Maintenance - Machines');
    }, []);

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async (id: number) => {
        const success = await deleteMachine(id);
        if (success) {
            setDeleteId(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            // Simulation du tÃ©lÃ©chargement du template
            const csvContent = 'Code,Nom,Type Machine,Statut,Site Affectation,Date Installation,Dernier Maintenance\nEX001,Exemple Machine,Type1,operationnelle,UnitÃ© 1,2024-01-01,2025-02-01';
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template_machines.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast.success('Template tÃ©lÃ©chargÃ©');
        } catch (error) {
            showToast.error('Erreur lors du tÃ©lÃ©chargement du template');
            console.error('Template download error:', error);
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleFileSelect = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleImportFile = async () => {
        if (!uploadedFile) {
            showToast.warning('Veuillez sÃ©lectionner un fichier');
            return;
        }

        try {
            // Simulation de l'import
            showToast.success('Machines importÃ©es avec succÃ¨s');
            setShowImportModal(false);
            setUploadedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            showToast.error('Erreur lors de l\'import des machines');
            console.error('Import error:', error);
        }
    };

    const handleExport = async () => {
        try {
            // Simulation de l'export
            let csvContent = 'Code,Nom,Type Machine,Statut,Site Affectation,Date Installation,Dernier Maintenance\n';
            machines.forEach(m => {
                csvContent += `${m.code},${m.nom},,${m.statut},,${m.date_installation || ''},${m.derniere_maintenance || ''}\n`;
            });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `machines_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast.success('Machines exportÃ©es');
        } catch (error) {
            showToast.error('Erreur lors de l\'export');
            console.error('Export error:', error);
        }
    };

    if (loading && (!machines || machines.length === 0)) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des machines...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tÃªte */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Machines</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Total: {total} machine{total > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ActionButton onClick={handleDownloadTemplate} loading={isDownloadingTemplate} icon={Download}>
                        {isDownloadingTemplate ? 'Template...' : 'Template'}
                    </ActionButton>
                    <ActionButton onClick={() => setShowImportModal(true)} icon={Upload}>
                        Importer
                    </ActionButton>
                    <ActionButton onClick={handleExport} disabled={loading || machines.length === 0} icon={Download}>
                        Exporter
                    </ActionButton>
                    <ActionButton onClick={() => route('/maintenance/machines/nouveau')} icon={Plus} variant="accent">
                        Nouvelle machine
                    </ActionButton>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                {/* Recherche */}
                <div className="flex space-x-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par code ou nom..."
                            value={recherche}
                            onChange={(e) => setRecherche((e.target as HTMLInputElement).value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${showFilters
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>Filtres</span>
                    </button>
                </div>

                {/* Filtres (masquÃ©s par dÃ©faut) */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        {/* Filtre Statut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={filtres.statut || ''}
                                onChange={(e) => {
                                    const val = (e.target as HTMLSelectElement).value;
                                    if (val) setFiltres({ statut: val as MachineStatut });
                                    else setFiltres({ statut: undefined });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="operationnelle">OpÃ©rationnelle</option>
                                <option value="en_panne">En panne</option>
                                <option value="en_maintenance">En maintenance</option>
                                <option value="en_attente">En attente</option>
                                <option value="hors_service">Hors service</option>
                            </select>
                        </div>

                        {/* Filtre Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Presse, DÃ©coupe..."
                                value={filtres.type || ''}
                                onChange={(e) => setFiltres({ type: (e.target as HTMLInputElement).value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filtre Localisation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Localisation
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Atelier A..."
                                value={filtres.localisation || ''}
                                onChange={(e) => setFiltres({ localisation: (e.target as HTMLInputElement).value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Bouton RÃ©initialiser */}
                        <div className="flex items-end">
                            <button
                                onClick={clearFiltres}
                                className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                            >
                                RÃ©initialiser
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!machines || machines.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>Aucune machine trouvÃ©e</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Nom</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Localisation</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">DerniÃ¨re maintenance</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {machines.map((machine) => (
                                    <tr key={machine.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-blue-600">
                                            {machine.code}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{machine.nom}</td>
                                        <td className="px-6 py-4 text-gray-700">{machine.type}</td>
                                        <td className="px-6 py-4 text-gray-700">{machine.localisation}</td>
                                        <td className="px-6 py-4">
                                             <div className="flex items-center space-x-2">
                                                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[machine.statut]}`}>
                                                     {STATUT_LABELS[machine.statut]}
                                                 </span>
                                                 {(() => {
                                                     const IconComponent = STATUT_ICONS[machine.statut];
                                                     return IconComponent ? <IconComponent className="w-4 h-4 text-red-600" /> : null;
                                                 })()}
                                             </div>
                                         </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {machine.date_derniere_maintenance
                                                ? new Date(machine.date_derniere_maintenance).toLocaleDateString('fr-FR')
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    title="Voir les dÃ©tails"
                                                    onClick={() => {/* Naviguer vers /maintenance/machines/:id */ }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Modifier"
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                     title="Supprimer"
                                                     onClick={() => handleDeleteClick(machine.id)}
                                                     className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                 >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Page {page} sur {pages} â€¢ {total} rÃ©sultat{total > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setPage(i + 1)}
                                className={`px-3 py-1 rounded-lg ${page === i + 1
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(Math.min(pages, page + 1))}
                            disabled={page === pages}
                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Dialog d'import */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Importer des machines
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            SÃ©lectionnez un fichier CSV pour importer des machines
                        </p>
                        <div className="mb-6">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            {uploadedFile && (
                                <p className="text-sm text-gray-500 mt-2">âœ“ {uploadedFile.name}</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setUploadedFile(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleImportFile}
                                disabled={!uploadedFile}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialog de confirmation de suppression */}
            {deleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirmer la suppression
                        </h3>
                        <p className="text-gray-600 mb-6">
                            ÃŠtes-vous sÃ»r de vouloir supprimer cette machine ? Cette action est irrÃ©versible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleConfirmDelete(deleteId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Machines;








