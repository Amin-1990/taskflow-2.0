import type { FunctionComponent } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import { AlertTriangle, Search, Filter, ChevronDown, ChevronUp, CheckSquare, XSquare } from 'lucide-preact';
import { useAdminMatrice } from '../../hooks/useAdminMatrice';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { showToast } from '../../utils/toast';
import SelectSearchMulti from '../../components/common/SelectSearchMulti';
import PageHeader from '../../components/common/PageHeader';
import type { AdminUser, AdminPermission } from '../../types/admin.types';

const MODULE_COLORS = {
    PRODUCTION: 'bg-blue-100 text-blue-800',
    RH: 'bg-green-100 text-green-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    QUALITE: 'bg-purple-100 text-purple-800',
    CATALOGUE: 'bg-cyan-100 text-cyan-800',
    SYSTEME: 'bg-gray-100 text-gray-800',
    ADMIN: 'bg-red-100 text-red-800'
};

export const AdminMatrice: FunctionComponent = () => {
    const { users, permissions, values, loading, error, togglePermission, refresh } = useAdminMatrice();
    const { user } = useAuth();
    const { canRead, canWrite } = usePermissions();
    const [searchUser, setSearchUser] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [filterOpen, setFilterOpen] = useState(true);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'permissions'>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedPermTypes, setSelectedPermTypes] = useState<string[]>(['READ', 'WRITE', 'DELETE']);

    // Vérifier la permission d'accès
    useEffect(() => {
        if (user && !user.permissions?.includes('ADMIN_READ')) {
            showToast.error('Accès refusé au module administration');
            route('/');
        }
    }, [user]);

    // Extraire les modules uniques
    const modules = useMemo(() => {
        const mods = new Set(permissions.map(p => p.Nom_module || 'SYSTEME').filter(Boolean));
        return Array.from(mods).sort();
    }, [permissions]);

    // Initialiser la sélection de modules
    useEffect(() => {
        if (modules.length > 0 && selectedModules.length === 0) {
            setSelectedModules(modules);
        }
    }, [modules]);

    // Filtrer les utilisateurs
    const filteredUsers = useMemo(() => {
        if (!searchUser.trim()) return users;
        const term = searchUser.toLowerCase();
        return users.filter(u =>
            u.Username.toLowerCase().includes(term) ||
            u.Email.toLowerCase().includes(term) ||
            (u.Nom_prenom && u.Nom_prenom.toLowerCase().includes(term))
        );
    }, [users, searchUser]);

    // Filtrer les permissions
    const filteredPermissions = useMemo(() => {
        return permissions.filter(p => {
            const inModule = selectedModules.includes(p.Nom_module || 'SYSTEME');
            const permType = p.Code_permission?.split('_').pop() || '';
            const inType = selectedPermTypes.includes(permType);
            return inModule && inType;
        });
    }, [permissions, selectedModules, selectedPermTypes]);

    // Grouper les permissions par module
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, AdminPermission[]> = {};
        filteredPermissions.forEach(p => {
            const mod = p.Nom_module || 'SYSTEME';
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(p);
        });
        return groups;
    }, [filteredPermissions]);

    const handleToggle = async (userId: number, permissionId: number) => {
        const key = `${userId}-${permissionId}`;
        setToggling(prev => new Set(prev).add(key));

        try {
            const currentValue = values.get(key) || 0;
            const newValue = currentValue === 1 ? 0 : 1;
            await togglePermission(userId, permissionId, newValue);
            showToast.success('Permission mise à jour');
        } catch (err) {
            // Error handling is in the hook
        } finally {
            setToggling(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const toggleModule = (module: string) => {
        setSelectedModules(prev =>
            prev.includes(module)
                ? prev.filter(m => m !== module)
                : [...prev, module]
        );
    };

    const togglePermType = (type: string) => {
        setSelectedPermTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const resetFilters = () => {
        setSearchUser('');
        setSelectedModules(modules);
        setSelectedPermTypes(['READ', 'WRITE', 'DELETE']);
        setPage(1);
    };

    // Tri des utilisateurs
    const sortedUsers = useMemo(() => {
        const sorted = [...filteredUsers];
        sorted.sort((a, b) => {
            let aVal: any = '';
            let bVal: any = '';

            if (sortBy === 'name') {
                aVal = a.Username.toLowerCase();
                bVal = b.Username.toLowerCase();
            } else if (sortBy === 'email') {
                aVal = a.Email.toLowerCase();
                bVal = b.Email.toLowerCase();
            } else if (sortBy === 'permissions') {
                const countA = Object.entries(groupedPermissions).reduce((sum, [_, perms]) => {
                    return sum + perms.filter(p => (values.get(`${a.ID}-${p.ID}`) || 0) === 1).length;
                }, 0);
                const countB = Object.entries(groupedPermissions).reduce((sum, [_, perms]) => {
                    return sum + perms.filter(p => (values.get(`${b.ID}-${p.ID}`) || 0) === 1).length;
                }, 0);
                aVal = countA;
                bVal = countB;
            }

            return sortAsc
                ? aVal > bVal ? 1 : aVal < bVal ? -1 : 0
                : aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        });

        return sorted;
    }, [filteredUsers, sortBy, sortAsc, groupedPermissions, values]);

    // Pagination
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return sortedUsers.slice(start, start + itemsPerPage);
    }, [sortedUsers, page]);

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    const countActiveFilters = useMemo(() => {
        let count = 0;
        if (searchUser) count++;
        if (selectedModules.length < modules.length) count++;
        if (selectedPermTypes.length < 3) count++;
        return count;
    }, [searchUser, selectedModules, selectedPermTypes, modules.length]);

    // Export Excel
    const handleExport = () => {
        try {
            const headers = ['Utilisateur', 'Email'];
            Object.entries(groupedPermissions).forEach(([module, perms]) => {
                perms.forEach(p => {
                    headers.push(`${module}_${p.Code_permission.replace(`${module}_`, '')}`);
                });
            });

            const rows = paginatedUsers.map(u => {
                const row = [u.Username, u.Email];
                Object.entries(groupedPermissions).forEach(([_, perms]) => {
                    perms.forEach(p => {
                        const hasPermission = (values.get(`${u.ID}-${p.ID}`) || 0) === 1;
                        row.push(hasPermission ? '✓' : '✗');
                    });
                });
                return row;
            });

            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `matrice-permissions-${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            showToast.success('Export réussi');
        } catch (err) {
            showToast.error('Erreur lors de export');
        }
    };

    // Actions globales
    const grantAllPermissions = async (userId: number) => {
        const permsToGrant = Object.entries(groupedPermissions).reduce((acc, [_, perms]) => {
            return acc.concat(perms);
        }, [] as AdminPermission[]);

        for (const perm of permsToGrant) {
            if ((values.get(`${userId}-${perm.ID}`) || 0) !== 1) {
                await handleToggle(userId, perm.ID);
            }
        }
        showToast.success('Toutes les permissions accordées');
    };

    const revokeAllPermissions = async (userId: number) => {
        const permsToRevoke = Object.entries(groupedPermissions).reduce((acc, [_, perms]) => {
            return acc.concat(perms);
        }, [] as AdminPermission[]);

        for (const perm of permsToRevoke) {
            if ((values.get(`${userId}-${perm.ID}`) || 0) === 1) {
                await handleToggle(userId, perm.ID);
            }
        }
        showToast.success('Toutes les permissions refusées');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement de la matrice...</p>
                </div>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center bg-red-50 p-8 rounded-lg">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={refresh}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Matrice des Permissions"
                subtitle="Attribution des permissions par utilisateur et par module"
                showExport={true}
                showRefresh={true}
                onExport={handleExport}
                onRefresh={refresh}
                isExporting={false}
                isRefreshing={loading}
            />

            {/* Filtres Collapsible */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Filtres</span>
                        {countActiveFilters > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                                {countActiveFilters}
                            </span>
                        )}
                    </div>
                    {filterOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {filterOpen && (
                    <div className="p-4 space-y-4">
                        {/* Recherche utilisateur */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rechercher un utilisateur
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Username, email ou nom complet..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.currentTarget.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Sélection des modules - Multi-Select */}
                        <SelectSearchMulti
                            options={modules.map(m => ({ id: m, label: m }))}
                            selectedIds={selectedModules}
                            onSelect={(ids) => setSelectedModules(ids.filter((id): id is string => typeof id === 'string'))}
                            placeholder="Rechercher un module..."
                            label="Modules"
                        />

                        {/* Sélection des types de permissions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Types de permissions
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['READ', 'WRITE', 'DELETE'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => togglePermType(type)}
                                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${selectedPermTypes.includes(type)
                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bouton réinitialiser */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contrôles de table */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between border-b border-gray-200">
                <div className="text-sm text-gray-600">
                    {sortedUsers.length} utilisateur(s) | Page {page} / {totalPages}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Trier par:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.currentTarget.value as any);
                                setPage(1);
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Nom</option>
                            <option value="email">Email</option>
                            <option value="permissions">Permissions</option>
                        </select>
                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            className="p-1 rounded hover:bg-gray-100"
                            title={sortAsc ? 'Décroissant' : 'Croissant'}
                        >
                            {sortAsc ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Matrice scrollable */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        {/* En-tête */}
                        <thead>
                            <tr className="bg-gray-50">
                                {/* Colonne utilisateurs (figée) */}
                                <th className="sticky left-0 z-20 bg-gray-100 border-b-2 border-gray-300 border-r-2 border-gray-300 p-4 text-left font-bold text-gray-700 min-w-[240px]">
                                    <div className="flex items-center gap-2">
                                        Utilisateur
                                        {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                                    </div>
                                </th>

                                {/* Colonnes par module */}
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <th
                                        key={module}
                                        colSpan={perms.length}
                                        className={`border-b-2 border-gray-300 p-3 font-bold text-center text-sm ${MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        {module}
                                    </th>
                                ))}
                            </tr>

                            {/* Sous-en-têtes permissions */}
                            <tr className="bg-gray-50 border-b border-gray-300">
                                <th className="sticky left-0 z-20 bg-gray-100 border-r-2 border-gray-300"></th>
                                {Object.entries(groupedPermissions).map(([module, perms]) =>
                                    perms.map(perm => (
                                        <th
                                            key={perm.ID}
                                            className="border-b border-gray-200 border-r border-gray-200 p-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 min-w-[50px]"
                                            title={perm.Nom_permission}
                                        >
                                            <div className="writing-vertical text-rotate-90 whitespace-nowrap inline-block">
                                                {perm.Code_permission.replace(`${module}_`, '')}
                                            </div>
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>

                        {/* Données */}
                        <tbody>
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user, idx) => {
                                    const totalPerms = Object.entries(groupedPermissions).reduce((sum, [_, perms]) => {
                                        return sum + perms.filter(p => (values.get(`${user.ID}-${p.ID}`) || 0) === 1).length;
                                    }, 0);

                                    return (
                                        <tr key={user.ID} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                            {/* Utilisateur */}
                                            <td className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 p-4 font-semibold text-gray-800">
                                                <div className="text-sm font-bold text-gray-800">{user.Username}</div>
                                                <div className="text-xs text-gray-500">{user.Email}</div>
                                                <div className="text-xs font-medium text-blue-600 mt-1">{totalPerms} permission(s)</div>
                                                {canWrite('ADMIN_PERMISSIONS') && (
                                                    <div className="flex gap-1 mt-2">
                                                        <button
                                                            onClick={() => grantAllPermissions(user.ID)}
                                                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                                            title="Accorder toutes"
                                                        >
                                                            <CheckSquare className="w-3 h-3 inline" />
                                                        </button>
                                                        <button
                                                            onClick={() => revokeAllPermissions(user.ID)}
                                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                                            title="Révoquer toutes"
                                                        >
                                                            <XSquare className="w-3 h-3 inline" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Permissions */}
                                            {Object.entries(groupedPermissions).map(([module, perms]) =>
                                                perms.map(perm => {
                                                    const key = `${user.ID}-${perm.ID}`;
                                                    const hasPermission = (values.get(key) || 0) === 1;
                                                    const isToggling = toggling.has(key);

                                                    return (
                                                        <td
                                                            key={perm.ID}
                                                            className="p-3 text-center border-r border-gray-200 border-b border-gray-100"
                                                        >
                                                            {canWrite('ADMIN_PERMISSIONS') ? (
                                                                <button
                                                                    onClick={() => handleToggle(user.ID, perm.ID)}
                                                                    disabled={isToggling}
                                                                    className={`
                                    w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold
                                    transition-all disabled:opacity-50 transform hover:scale-110
                                    ${hasPermission
                                                                            ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                                                                            : 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                                                                        }
                                  `}
                                                                    title={hasPermission ? 'Accordé - Cliquer pour révoquer' : 'Refusé - Cliquer pour accorder'}
                                                                >
                                                                    {hasPermission ? '✓' : '✗'}
                                                                </button>
                                                            ) : (
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md font-bold text-sm ${hasPermission ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {hasPermission ? '✓' : '✗'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={1 + (Object.values(groupedPermissions).flat()).length} className="p-8 text-center text-gray-500">
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        Préc
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1 rounded transition ${page === p
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        Suiv
                    </button>
                </div>
            )}

            {/* Légende */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <p className="font-bold text-gray-800 mb-3">Légende & Aide</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-gray-700 mb-2">Permissions :</p>
                        <ul className="space-y-1 text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded text-xs font-bold">✓</span>
                                <span>Permission accordée</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-500 rounded text-xs font-bold">✗</span>
                                <span>Permission refusée</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 mb-2">Actions :</p>
                        <ul className="space-y-1 text-gray-600">
                            {canWrite('ADMIN_PERMISSIONS') && (
                                <>
                                    <li>• Cliquez sur une cellule pour basculer la permission</li>
                                    <li>• Utilisez les boutons verts/rouges pour accorder/révoquer toutes les permissions</li>
                                </>
                            )}
                            <li>• Triez les utilisateurs par nom, email ou nombre de permissions</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMatrice;
