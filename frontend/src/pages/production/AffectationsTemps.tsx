import { type FunctionComponent } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { Calendar, CheckCircle2, Clock3, Filter, RefreshCw, Users } from 'lucide-preact';
import { affectationsApi } from '../../api/affectations';
import type {
  Affectation,
  AffectationFilters,
  AffectationOperateurResume,
  AffectationsView,
} from '../../types/affectations.types';
import { showToast } from '../../utils/toast';
import ActionButton from '../../components/common/ActionButton';

interface AffectationsTempsProps {
  path?: string;
  defaultView?: AffectationsView;
}

const toDateInput = (date: Date): string => date.toISOString().slice(0, 10);

const getDefaultRange = () => {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    dateDebut: toDateInput(monday),
    dateFin: toDateInput(sunday),
  };
};

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const shiftDate = (date: string, days: number): string => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return toDateInput(value);
};

export const AffectationsTemps: FunctionComponent<AffectationsTempsProps> = ({
  defaultView = 'operateurs',
}) => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [view, setView] = useState<AffectationsView>(defaultView);
  const [filters, setFilters] = useState<AffectationFilters>({
    ...defaultRange,
  });
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperateurId, setSelectedOperateurId] = useState<number | null>(null);
  const [quantites, setQuantites] = useState<Record<number, string>>({});
  const [heuresSupp, setHeuresSupp] = useState<Record<number, string>>({});

  const loadAffectations = useCallback(async () => {
    if (!filters.dateDebut || !filters.dateFin) {
      setError('La période (date début/fin) est obligatoire');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await affectationsApi.getList(filters);
      setAffectations(response.data.data || []);
    } catch (err: any) {
      const message = err?.error || err?.message || 'Erreur de chargement des affectations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  useEffect(() => {
    void loadAffectations();
  }, [loadAffectations]);

  const resumesOperateurs = useMemo<AffectationOperateurResume[]>(() => {
    const map = new Map<number, AffectationOperateurResume>();

    affectations.forEach((item) => {
      const current = map.get(item.ID_Operateur) || {
        operateurId: item.ID_Operateur,
        operateurNom: item.Operateur_nom || `Opérateur #${item.ID_Operateur}`,
        totalAffectations: 0,
        dureeSecondes: 0,
        heuresSupp: 0,
        quantiteProduite: 0,
        enCours: 0,
      };

      current.totalAffectations += 1;
      current.dureeSecondes += item.Duree || 0;
      current.heuresSupp += item.Heure_supp || 0;
      current.quantiteProduite += item.Quantite_produite || 0;
      if (!item.Date_fin) current.enCours += 1;

      map.set(item.ID_Operateur, current);
    });

    return Array.from(map.values()).sort((a, b) => b.dureeSecondes - a.dureeSecondes);
  }, [affectations]);

  const affectationsOperateur = useMemo(() => {
    if (!selectedOperateurId) return [];
    return affectations
      .filter((item) => item.ID_Operateur === selectedOperateurId)
      .sort(
        (a, b) =>
          new Date(b.Date_debut).getTime() - new Date(a.Date_debut).getTime()
      );
  }, [affectations, selectedOperateurId]);

  const affectationsChrono = useMemo(
    () =>
      [...affectations].sort(
        (a, b) =>
          new Date(b.Date_debut).getTime() - new Date(a.Date_debut).getTime()
      ),
    [affectations]
  );

  const resumeHebdo = useMemo(() => {
    const map = new Map<
      string,
      { date: string; total: number; secondes: number; operateurs: Set<number> }
    >();

    affectations.forEach((item) => {
      const date = item.Date_debut.slice(0, 10);
      const current = map.get(date) || {
        date,
        total: 0,
        secondes: 0,
        operateurs: new Set<number>(),
      };
      current.total += 1;
      current.secondes += item.Duree || 0;
      current.operateurs.add(item.ID_Operateur);
      map.set(date, current);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [affectations]);

  const shiftPeriod = (direction: -1 | 1) => {
    const start = new Date(filters.dateDebut);
    const end = new Date(filters.dateFin);
    const diffDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1
    );
    const delta = diffDays * direction;
    setFilters((prev) => ({
      ...prev,
      dateDebut: shiftDate(prev.dateDebut, delta),
      dateFin: shiftDate(prev.dateFin, delta),
    }));
  };

  const applyCurrentWeek = () => {
    const range = getDefaultRange();
    setFilters((prev) => ({ ...prev, ...range }));
  };

  const handleTerminer = async (id: number) => {
    const qty = Number(quantites[id]);
    if (!qty || qty <= 0) {
      showToast.error('Quantité produite invalide');
      return;
    }
    try {
      await affectationsApi.terminerAffectation(id, qty);
      showToast.success('Affectation terminée');
      setQuantites((prev) => ({ ...prev, [id]: '' }));
      await loadAffectations();
    } catch {
      showToast.error('Erreur pendant la clôture');
    }
  };

  const handleHeuresSupp = async (id: number) => {
    const heures = Number(heuresSupp[id]);
    if (!heures || heures <= 0) {
      showToast.error('Heures supplémentaires invalides');
      return;
    }
    try {
      await affectationsApi.ajouterHeuresSupp(id, heures);
      showToast.success('Heures supplémentaires ajoutées');
      setHeuresSupp((prev) => ({ ...prev, [id]: '' }));
      await loadAffectations();
    } catch {
      showToast.error('Erreur pendant la mise à jour');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Affectations - Suivi du temps</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chargement par période pour préserver les performances
          </p>
        </div>
        <ActionButton onClick={() => void loadAffectations()} icon={RefreshCw}>
          Actualiser
        </ActionButton>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date début</label>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateDebut: (e.target as HTMLInputElement).value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date fin</label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFin: (e.target as HTMLInputElement).value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={() => shiftPeriod(-1)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Période -1
          </button>
          <button
            onClick={() => shiftPeriod(1)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Période +1
          </button>
          <button
            onClick={applyCurrentWeek}
            className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 text-sm hover:bg-blue-50"
          >
            Semaine courante
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Opérateur (ID)</label>
            <input
              type="number"
              value={filters.operateurId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  operateurId: (e.target as HTMLInputElement).value
                    ? Number((e.target as HTMLInputElement).value)
                    : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: 12"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Commande (ID)</label>
            <input
              type="number"
              value={filters.commandeId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  commandeId: (e.target as HTMLInputElement).value
                    ? Number((e.target as HTMLInputElement).value)
                    : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: 245"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Poste (ID)</label>
            <input
              type="number"
              value={filters.posteId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  posteId: (e.target as HTMLInputElement).value
                    ? Number((e.target as HTMLInputElement).value)
                    : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: 4"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="enCours"
              type="checkbox"
              checked={Boolean(filters.enCours)}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  enCours: (e.target as HTMLInputElement).checked || undefined,
                }))
              }
            />
            <label htmlFor="enCours" className="text-sm text-gray-700">
              Uniquement en cours
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setView('operateurs')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            view === 'operateurs'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Vue opérateurs
        </button>
        <button
          onClick={() => setView('chrono')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            view === 'chrono'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Clock3 className="w-4 h-4" />
          Vue chronologique
        </button>
        <button
          onClick={() => setView('hebdo')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            view === 'hebdo'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Vue hebdo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
          Chargement des affectations...
        </div>
      ) : (
        <>
          {view === 'operateurs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-800">Vue principale par opérateur</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">Opérateur</th>
                        <th className="px-4 py-3 text-center">Affectations</th>
                        <th className="px-4 py-3 text-center">Durée</th>
                        <th className="px-4 py-3 text-center">H. supp</th>
                        <th className="px-4 py-3 text-center">Qté</th>
                        <th className="px-4 py-3 text-center">En cours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumesOperateurs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                            Aucune donnée sur la période
                          </td>
                        </tr>
                      )}
                      {resumesOperateurs.map((row) => (
                        <tr
                          key={row.operateurId}
                          className={`border-t border-gray-100 cursor-pointer ${
                            selectedOperateurId === row.operateurId ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedOperateurId(row.operateurId)}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800">{row.operateurNom}</td>
                          <td className="px-4 py-3 text-center">{row.totalAffectations}</td>
                          <td className="px-4 py-3 text-center">{formatDuration(row.dureeSecondes)}</td>
                          <td className="px-4 py-3 text-center">{row.heuresSupp} h</td>
                          <td className="px-4 py-3 text-center">{row.quantiteProduite}</td>
                          <td className="px-4 py-3 text-center">{row.enCours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Détail opérateur</h3>
                {!selectedOperateurId && (
                  <p className="text-sm text-gray-500">Sélectionnez un opérateur dans le tableau.</p>
                )}
                {selectedOperateurId && affectationsOperateur.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune affectation pour cet opérateur.</p>
                )}
                <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                  {affectationsOperateur.map((item) => (
                    <div key={item.ID} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">
                          Cmd #{item.ID_Commande} - {item.Code_article || 'N/A'}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.Date_fin ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.Date_fin ? 'Terminée' : 'En cours'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Début: {new Date(item.Date_debut).toLocaleString()} | Durée:{' '}
                        {formatDuration(item.Duree || 0)}
                      </p>
                      {!item.Date_fin && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={quantites[item.ID] || ''}
                            onChange={(e) =>
                              setQuantites((prev) => ({
                                ...prev,
                                [item.ID]: (e.target as HTMLInputElement).value,
                              }))
                            }
                            placeholder="Qté produite"
                            className="w-28 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => void handleTerminer(item.ID)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Terminer
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={heuresSupp[item.ID] || ''}
                          onChange={(e) =>
                            setHeuresSupp((prev) => ({
                              ...prev,
                              [item.ID]: (e.target as HTMLInputElement).value,
                            }))
                          }
                          placeholder="Heures supp"
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                        />
                        <ActionButton onClick={() => void handleHeuresSupp(item.ID)}>
                          Ajouter
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'chrono' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Vue consolidée chronologique</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Date début</th>
                      <th className="px-4 py-3 text-left">Opérateur</th>
                      <th className="px-4 py-3 text-left">Commande</th>
                      <th className="px-4 py-3 text-left">Poste</th>
                      <th className="px-4 py-3 text-center">Durée</th>
                      <th className="px-4 py-3 text-center">Qté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affectationsChrono.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          Aucune affectation sur la période
                        </td>
                      </tr>
                    )}
                    {affectationsChrono.map((item) => (
                      <tr key={item.ID} className="border-t border-gray-100">
                        <td className="px-4 py-3">{new Date(item.Date_debut).toLocaleString()}</td>
                        <td className="px-4 py-3">{item.Operateur_nom || `#${item.ID_Operateur}`}</td>
                        <td className="px-4 py-3">#{item.ID_Commande}</td>
                        <td className="px-4 py-3">{item.Poste_nom || `#${item.ID_Poste}`}</td>
                        <td className="px-4 py-3 text-center">{formatDuration(item.Duree || 0)}</td>
                        <td className="px-4 py-3 text-center">{item.Quantite_produite || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'hebdo' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Vue hebdomadaire</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Jour</th>
                      <th className="px-4 py-3 text-center">Affectations</th>
                      <th className="px-4 py-3 text-center">Durée totale</th>
                      <th className="px-4 py-3 text-center">Opérateurs actifs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumeHebdo.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          Aucun enregistrement sur cette période
                        </td>
                      </tr>
                    )}
                    {resumeHebdo.map((day) => (
                      <tr key={day.date} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">{day.total}</td>
                        <td className="px-4 py-3 text-center">{formatDuration(day.secondes)}</td>
                        <td className="px-4 py-3 text-center">{day.operateurs.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AffectationsTemps;
