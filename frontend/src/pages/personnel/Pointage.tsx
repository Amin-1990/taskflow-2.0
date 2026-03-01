import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Search } from 'lucide-preact';
import { personnelAPI } from '../../api/personnel';
import pointageApi from '../../api/pointage';
import PersonnelActionButton from '../../components/personnel/PersonnelActionButton';
import PageHeader from '../../components/common/PageHeader';
import PersonnelFilterPanel from '../../components/personnel/PersonnelFilterPanel';
import SelectSearch, { type SelectSearchOption } from '../../components/common/SelectSearch';
import type { Personnel } from '../../types/personnel.types';
import type { PointageRow } from '../../types/pointage.types';
import { showToast } from '../../utils/toast';
import { usePermissions } from '../../hooks/usePermissions';

interface PointagePageProps {
    path?: string;
}

interface CellModalState {
    personnel: Personnel;
    date: string;
    pointage?: PointageRow;
}

const toIsoDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const shiftDate = (isoDate: string, days: number): string => {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
};

const formatShortDate = (isoDate: string): string => {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const formatDayLabel = (isoDate: string): string => {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
};

const formatTime = (time?: string | null): string => {
    if (!time) return '--:--';
    return time.slice(0, 5);
};

const timeToMinutes = (time?: string | null): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

const getCellKey = (personnelId: number, date: string) => `${personnelId}_${date}`;

const calculateTotalHours = (personnel: Personnel, pointageMap: Map<string, PointageRow>, visibleDates: string[]): number => {
    let totalMinutes = 0;
    visibleDates.forEach((date) => {
        const pointage = pointageMap.get(getCellKey(personnel.ID, date));
        if (pointage && pointage.Absent !== 1) {
            // Utiliser Presence_reelle si disponible
            if (pointage.Presence_reelle) {
                const presenceMinutes = timeToMinutes(pointage.Presence_reelle);
                totalMinutes += presenceMinutes;
            } else if (pointage.Entree && pointage.Sortie) {
                const entreeMinutes = timeToMinutes(pointage.Entree);
                const sortieMinutes = timeToMinutes(pointage.Sortie);
                if (entreeMinutes < sortieMinutes) {
                    totalMinutes += sortieMinutes - entreeMinutes;
                }
            }
        }
    });
    return totalMinutes / 60;
};

const Pointage: FunctionComponent<PointagePageProps> = () => {
    const { canWrite } = usePermissions();
    const today = toIsoDate(new Date());
    const [startDate, setStartDate] = useState<string>(shiftDate(today, -7));
    const [endDate, setEndDate] = useState<string>(today);
    const [windowStartDate, setWindowStartDate] = useState<string>(shiftDate(today, -2));
    const [visibleDayCount, setVisibleDayCount] = useState<number>(7);

    const [personnels, setPersonnels] = useState<Personnel[]>([]);
    const [pointages, setPointages] = useState<PointageRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState<string>('');
    const [posteFilter, setPosteFilter] = useState<string>('Tous');
    const [presenceFilter, setPresenceFilter] = useState<'Tous' | 'Presents' | 'Absents' | 'Retards'>('Tous');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [modal, setModal] = useState<CellModalState | null>(null);
    const [commentaire, setCommentaire] = useState('');
    const [modalStatut, setModalStatut] = useState<'present' | 'absent'>('present');
    const [modalEntree, setModalEntree] = useState('');
    const [modalSortie, setModalSortie] = useState('');
    const [modalHeuresSupp, setModalHeuresSupp] = useState<number | undefined>();
    const [savingAction, setSavingAction] = useState(false);

    useEffect(() => {
        const onResize = () => {
            setVisibleDayCount(window.innerWidth < 768 ? 3 : 7);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const allDaysInRange = useMemo(() => {
        const list: string[] = [];
        let current = startDate;
        while (current <= endDate) {
            list.push(current);
            current = shiftDate(current, 1);
        }
        return list;
    }, [startDate, endDate]);

    useEffect(() => {
        if (!allDaysInRange.includes(windowStartDate)) {
            setWindowStartDate(allDaysInRange[0] || startDate);
        }
    }, [allDaysInRange, startDate, windowStartDate]);

    const visibleDates = useMemo(() => {
        if (allDaysInRange.length === 0) return [];
        const startIdx = Math.max(0, allDaysInRange.indexOf(windowStartDate));
        return allDaysInRange.slice(startIdx, startIdx + visibleDayCount);
    }, [allDaysInRange, windowStartDate, visibleDayCount]);

    const canShiftLeft = useMemo(() => {
        if (visibleDates.length === 0) return false;
        return allDaysInRange[0] !== visibleDates[0];
    }, [allDaysInRange, visibleDates]);

    const canShiftRight = useMemo(() => {
        if (visibleDates.length === 0) return false;
        return allDaysInRange[allDaysInRange.length - 1] !== visibleDates[visibleDates.length - 1];
    }, [allDaysInRange, visibleDates]);

    const shiftColumnsLeft = () => {
        const idx = allDaysInRange.indexOf(windowStartDate);
        if (idx > 0) setWindowStartDate(allDaysInRange[idx - 1]);
    };

    const shiftColumnsRight = () => {
        const idx = allDaysInRange.indexOf(windowStartDate);
        if (idx >= 0 && idx < allDaysInRange.length - 1) {
            setWindowStartDate(allDaysInRange[idx + 1]);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [personnelRes, pointageRes] = await Promise.all([
                personnelAPI.getAll(),
                pointageApi.getByPeriode(startDate, endDate),
            ]);

            setPersonnels(personnelRes || []);
            setPointages(pointageRes.data.data || []);
        } catch (err: any) {
            const message = err?.error || err?.message || 'Erreur de chargement du pointage';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [startDate, endDate]);

    const pointageMap = useMemo(() => {
        const map = new Map<string, PointageRow>();
        pointages.forEach((item) => {
            map.set(getCellKey(item.ID_Personnel, item.Date), item);
        });
        return map;
    }, [pointages]);

    const posteOptions = useMemo(() => {
        const set = new Set<string>();
        personnels.forEach((p) => {
            if (p.Poste) set.add(p.Poste);
        });
        return ['Tous', ...Array.from(set)];
    }, [personnels]);

    const filteredPersonnels = useMemo(() => {
        const query = search.trim().toLowerCase();
        return personnels.filter((personnel) => {
            if (posteFilter !== 'Tous' && personnel.Poste !== posteFilter) return false;
            if (query) {
                const haystack = `${personnel.Nom_prenom} ${personnel.Matricule}`.toLowerCase();
                if (!haystack.includes(query)) return false;
            }

            if (presenceFilter !== 'Tous') {
                const hasMatch = visibleDates.some((date) => {
                    const cell = pointageMap.get(getCellKey(personnel.ID, date));
                    if (!cell) return false;
                    if (presenceFilter === 'Absents') return cell.Absent === 1;
                    if (presenceFilter === 'Retards') return !!cell.Retard;
                    if (presenceFilter === 'Presents') return cell.Absent !== 1 && !!cell.Entree;
                    return false;
                });
                if (!hasMatch) return false;
            }

            return true;
        });
    }, [personnels, posteFilter, search, presenceFilter, visibleDates, pointageMap]);

    const total = filteredPersonnels.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const paginatedPersonnels = useMemo(
        () => filteredPersonnels.slice((currentPage - 1) * limit, currentPage * limit),
        [filteredPersonnels, currentPage, limit]
    );

    const openCellModal = (personnel: Personnel, date: string) => {
        const pointage = pointageMap.get(getCellKey(personnel.ID, date));
        setCommentaire(pointage?.Commentaire || '');
        setModalStatut(pointage?.Absent === 1 ? 'absent' : 'present');
        setModalEntree(pointage?.Entree ? pointage.Entree.slice(0, 5) : '');
        setModalSortie(pointage?.Sortie ? pointage.Sortie.slice(0, 5) : '');
        setModalHeuresSupp(pointage?.H_sup ?? undefined);
        setModal({ personnel, date, pointage });
    };

    const closeModal = () => {
        setModal(null);
        setCommentaire('');
        setModalStatut('present');
        setModalEntree('');
        setModalSortie('');
        setModalHeuresSupp(undefined);
    };

    const handleAjusterPointage = async () => {
        if (!modal) return;
        try {
            setSavingAction(true);
            await pointageApi.ajusterPointage({
                ID_Personnel: modal.personnel.ID,
                Matricule: modal.personnel.Matricule,
                Nom: modal.personnel.Nom_prenom,
                Date: modal.date,
                Statut: modalStatut,
                Entree: modalStatut === 'present' ? (modalEntree || null) : null,
                Sortie: modalStatut === 'present' ? (modalSortie || null) : null,
                H_sup: modalStatut === 'present' ? (modalHeuresSupp ?? null) : null,
                Commentaire: commentaire || undefined,
            });
            showToast.success('Pointage mis a jour');
            await loadData();
            closeModal();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur mise a jour pointage');
        } finally {
            setSavingAction(false);
        }
    };

    const handlePointerArrivee = async () => {
        if (!modal) return;
        try {
            setSavingAction(true);
            await pointageApi.pointerArrivee({
                ID_Personnel: modal.personnel.ID,
                Matricule: modal.personnel.Matricule,
                Nom: modal.personnel.Nom_prenom,
                Date: modal.date,
            });
            showToast.success('Arrivee pointee');
            await loadData();
            closeModal();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur pointage arrivee');
        } finally {
            setSavingAction(false);
        }
    };

    const handlePointerDepart = async () => {
        if (!modal) return;
        try {
            setSavingAction(true);
            await pointageApi.pointerDepart({
                ID_Personnel: modal.personnel.ID,
                Matricule: modal.personnel.Matricule,
                Commentaire: commentaire || undefined,
                Date: modal.date,
            });
            showToast.success('Depart pointe');
            await loadData();
            closeModal();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur pointage depart');
        } finally {
            setSavingAction(false);
        }
    };

    const handleSignalerAbsence = async () => {
        if (!modal) return;
        try {
            setSavingAction(true);
            await pointageApi.signalerAbsent({
                ID_Personnel: modal.personnel.ID,
                Matricule: modal.personnel.Matricule,
                Commentaire: commentaire || undefined,
                Date: modal.date,
            });
            showToast.success('Absence signalee');
            await loadData();
            closeModal();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur signalement absence');
        } finally {
            setSavingAction(false);
        }
    };

    const handleValiderPointage = async () => {
        if (!modal?.pointage?.ID) return;
        try {
            setSavingAction(true);
            await pointageApi.validerPointage(modal.pointage.ID);
            showToast.success('Pointage valide');
            await loadData();
            closeModal();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur validation pointage');
        } finally {
            setSavingAction(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await pointageApi.exportPointage(startDate, endDate);
            downloadBlob(response.data, `pointage_${startDate}_${endDate}.xlsx`);
            showToast.success('Export pointage termine');
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur export pointage');
        } finally {
            setIsExporting(false);
        }
    };

    const handleTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            const response = await pointageApi.getTemplateImport();
            downloadBlob(response.data, 'template_pointage.xlsx');
            showToast.success('Template pointage telecharge');
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur telechargement template pointage');
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        try {
            setIsImporting(true);
            await pointageApi.importFile(file);
            showToast.success('Import pointage termine');
            await loadData();
        } catch (err: any) {
            showToast.error(err?.error || err?.message || 'Erreur import pointage');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pointage"
                subtitle="Suivi quotidien des présences et absences des employés"
                showTemplate={canWrite('POINTAGE')}
                showImport={canWrite('POINTAGE')}
                showExport={true}
                showRefresh={true}
                onTemplate={handleTemplate}
                onImport={handleImportClick}
                onExport={() => void handleExport()}
                onRefresh={() => void loadData()}
                isDownloadingTemplate={isDownloadingTemplate}
                isImporting={isImporting}
                isExporting={isExporting}
                isRefreshing={false}
            />

            <PersonnelFilterPanel title="Filtres">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Date debut</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Date fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Recherche</label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch((e.target as HTMLInputElement).value);
                                    setPage(1);
                                }}
                                placeholder="Nom ou matricule"
                                className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm min-w-48"
                            />
                        </div>
                    </div>
                    <div className="min-w-48">
                        <SelectSearch
                            options={posteOptions.map((p) => ({ id: p, label: p }))}
                            selectedId={posteFilter}
                            onSelect={(opt) => {
                                setPosteFilter(opt.label);
                                setPage(1);
                            }}
                            placeholder="Rechercher poste..."
                            maxResults={20}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Presence</label>
                        <select
                            value={presenceFilter}
                            onChange={(e) => {
                                setPresenceFilter((e.target as HTMLSelectElement).value as any);
                                setPage(1);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-40"
                        >
                            <option value="Tous">Tous</option>
                            <option value="Presents">Presents</option>
                            <option value="Absents">Absents</option>
                            <option value="Retards">Retards</option>
                        </select>
                    </div>
                </div>
            </PersonnelFilterPanel>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFileChange}
                className="hidden"
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">
                        Tableau principal
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={shiftColumnsLeft}
                            disabled={!canShiftLeft}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Dates precedentes"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={shiftColumnsRight}
                            disabled={!canShiftRight}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Dates suivantes"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-600">Chargement...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="px-2 py-2 text-left w-8 text-xs">N°</th>
                                    <th className="px-2 py-2 text-left min-w-[140px]">
                                        <div className="text-xs">Nom + matricule</div>
                                    </th>
                                    {visibleDates.map((date) => (
                                        <th key={date} className="px-1 py-2 text-center min-w-[80px]">
                                            <div className="text-xs font-semibold">{formatShortDate(date)}</div>
                                            <div className="text-[10px] text-gray-500 capitalize">{formatDayLabel(date)}</div>
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 text-center min-w-[70px] bg-blue-50 border-l-2 border-blue-200">
                                        <div className="text-xs font-semibold text-blue-700">Total</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedPersonnels.length === 0 && (
                                    <tr>
                                        <td colSpan={2 + visibleDates.length} className="px-3 py-8 text-center text-gray-500">
                                            Aucune ligne a afficher
                                        </td>
                                    </tr>
                                )}
                                {paginatedPersonnels.map((personnel, index) => (
                                    <tr key={personnel.ID} className="hover:bg-gray-50">
                                        <td className="px-1 py-1 text-gray-700 text-xs">{(currentPage - 1) * limit + index + 1}</td>
                                        <td className="px-2 py-1">
                                            <div className="font-medium text-gray-900 text-xs">{personnel.Nom_prenom}</div>
                                            <div className="text-[10px] text-gray-500">{personnel.Matricule}</div>
                                        </td>
                                        {visibleDates.map((date) => {
                                            const pointage = pointageMap.get(getCellKey(personnel.ID, date));
                                            const isAbsent = pointage?.Absent === 1;
                                            const hasRetard = !!pointage?.Retard;
                                            const topLine = isAbsent
                                                ? 'ABS'
                                                : pointage?.Presence_reelle
                                                    ? pointage.Presence_reelle.slice(0, 5) + 'h'
                                                    : pointage && pointage.Entree && pointage.Sortie
                                                        ? `${formatTime(pointage.Entree)} - ${formatTime(pointage.Sortie)}`
                                                        : '---';
                                            const retardMinutes = hasRetard ? timeToMinutes(pointage?.Retard) : 0;
                                            const heuresSupp = pointage?.H_sup && pointage.H_sup > 0 ? `+${pointage.H_sup.toFixed(1)}h` : '';

                                            return (
                                                <td key={date} className="px-1 py-1">
                                                    <button
                                                        onClick={() => openCellModal(personnel, date)}
                                                        className={`w-full min-h-[50px] rounded border px-1 py-1 text-center hover:shadow-sm transition text-[11px] ${isAbsent
                                                            ? 'border-red-200 bg-red-50'
                                                            : hasRetard
                                                                ? 'border-orange-200 bg-orange-50'
                                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className={`font-medium ${isAbsent ? 'text-red-700' : 'text-gray-800'}`}>
                                                            {topLine}
                                                        </div>
                                                        <div className="text-[9px] mt-0.5">
                                                            {isAbsent && <span className="text-red-600 font-semibold">ABS</span>}
                                                            {!isAbsent && hasRetard && (
                                                                <span className="text-orange-600 font-semibold">Retard: {retardMinutes} min</span>
                                                            )}
                                                            {!isAbsent && heuresSupp && (
                                                                <span className="text-green-600 font-semibold ml-1">{heuresSupp}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="px-1 py-1 text-center bg-blue-50 border-l-2 border-blue-200">
                                            <div className="font-semibold text-blue-700 text-xs">
                                                {calculateTotalHours(personnel, pointageMap, visibleDates).toFixed(1)}h
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-gray-600">{total} enregistrement(s)</div>
                <div className="flex items-center gap-2">
                    <label className="text-gray-600">Par page</label>
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number((e.target as HTMLSelectElement).value));
                            setPage(1);
                        }}
                        className="rounded border border-gray-300 px-2 py-1"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <button
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                    >
                        Prec
                    </button>
                    <span className="min-w-20 text-center text-gray-700">{currentPage} / {totalPages}</span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                    >
                        Suiv
                    </button>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4 md:p-6">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Gestion du pointage</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Edition manuelle et actions rapides</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            >
                                X
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                                    <div className="text-xs text-gray-500">Employe</div>
                                    <div className="font-medium text-gray-900">{modal.personnel.Nom_prenom}</div>
                                </div>
                                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                                    <div className="text-xs text-gray-500">Matricule</div>
                                    <div className="font-medium text-gray-900">{modal.personnel.Matricule}</div>
                                </div>
                                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                                    <div className="text-xs text-gray-500">Date</div>
                                    <div className="font-medium text-gray-900">{modal.date}</div>
                                </div>
                                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                                    <div className="text-xs text-gray-500">Etat actuel</div>
                                    <div className="font-medium">
                                        {modal.pointage ? (
                                            modal.pointage.Absent === 1 ? (
                                                <span className="text-red-700">Absent</span>
                                            ) : (
                                                <span className="text-emerald-700">Pointe</span>
                                            )
                                        ) : (
                                            <span className="text-gray-700">Aucun pointage</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-800">Mise a jour manuelle</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Statut</label>
                                        <select
                                            value={modalStatut}
                                            onChange={(e) => setModalStatut((e.target as HTMLSelectElement).value as 'present' | 'absent')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                        >
                                            <option value="present">Present</option>
                                            <option value="absent">Absent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Heure arrivee</label>
                                        <input
                                            type="time"
                                            value={modalEntree}
                                            onChange={(e) => setModalEntree((e.target as HTMLInputElement).value)}
                                            disabled={modalStatut === 'absent'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Heure depart</label>
                                        <input
                                            type="time"
                                            value={modalSortie}
                                            onChange={(e) => setModalSortie((e.target as HTMLInputElement).value)}
                                            disabled={modalStatut === 'absent'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Heures supplementaires</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={modalHeuresSupp ?? ''}
                                        onChange={(e) => setModalHeuresSupp((e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : undefined)}
                                        disabled={modalStatut === 'absent'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Commentaire (optionnel)</label>
                                    <textarea
                                        rows={3}
                                        value={commentaire}
                                        onChange={(e) => setCommentaire((e.target as HTMLTextAreaElement).value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Ajouter un commentaire..."
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-800">Actions rapides</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {canWrite('POINTAGE') && (
                                        <button
                                            disabled={savingAction}
                                            onClick={() => void handlePointerArrivee()}
                                            className="px-3 py-2.5 rounded-lg text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                                        >
                                            Pointer arrivee
                                        </button>
                                    )}
                                    {canWrite('POINTAGE') && (
                                        <button
                                            disabled={savingAction}
                                            onClick={() => void handlePointerDepart()}
                                            className="px-3 py-2.5 rounded-lg text-sm font-medium border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                        >
                                            Pointer depart
                                        </button>
                                    )}
                                    {canWrite('POINTAGE') && (
                                        <button
                                            disabled={savingAction}
                                            onClick={() => void handleSignalerAbsence()}
                                            className="px-3 py-2.5 rounded-lg text-sm font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                        >
                                            Signaler absent
                                        </button>
                                    )}
                                    {canWrite('POINTAGE') && (
                                        <button
                                            disabled={savingAction || !modal.pointage?.ID}
                                            onClick={() => void handleValiderPointage()}
                                            className="px-3 py-2.5 rounded-lg text-sm font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                        >
                                            Valider
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            {canWrite('POINTAGE') && (
                                <button
                                    disabled={savingAction}
                                    onClick={() => void handleAjusterPointage()}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-60"
                                >
                                    Enregistrer modifications
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pointage;
