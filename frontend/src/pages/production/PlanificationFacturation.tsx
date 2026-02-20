import { type FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { api } from '../../services/api';
import { planningApi } from '../../api/planning';
import { filtresApi } from '../../api/filtres';
import { ROUTES } from '../../constants';
import { showToast } from '../../utils/toast';

interface PlanificationFacturationProps {
  path?: string;
}

interface WeekOption {
  id: number;
  numero: number;
  annee: number;
  label: string;
  dateDebut?: string;
}

interface CommandeFacturationRow {
  ID: number;
  Code_article?: string;
  Lot?: string;
  Quantite?: number;
  ID_Semaine?: number | null;
  Unite_production?: string | null;
  priorite?: string | null;
}

type PlanificationMode = 'simple' | 'avance';

interface AdvancedWeekRow {
  week: WeekOption;
  existingId?: number;
  objectif: number;
  planifie: number;
  emballe: number;
}

const splitQty = (qty: number) => {
  const base = Math.floor(qty / 5);
  let rem = qty % 5;
  const take = () => {
    const value = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    return value;
  };
  return {
    Lundi_planifie: take(),
    Mardi_planifie: take(),
    Mercredi_planifie: take(),
    Jeudi_planifie: take(),
    Vendredi_planifie: take(),
    Samedi_planifie: 0,
  };
};

export const PlanificationFacturation: FunctionComponent<PlanificationFacturationProps> = () => {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [annees, setAnnees] = useState<number[]>([]);
  const [semaine, setSemaine] = useState(1);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [commandes, setCommandes] = useState<CommandeFacturationRow[]>([]);
  const [unitesOptions, setUnitesOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unite, setUnite] = useState('Toutes');
  const [selected, setSelected] = useState<number[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<number, number>>({});
  const [plannedByCommande, setPlannedByCommande] = useState<Record<number, any>>({});
  const [mode, setMode] = useState<PlanificationMode>('simple');
  const [advancedCommande, setAdvancedCommande] = useState<CommandeFacturationRow | null>(null);
  const [advancedHorizon, setAdvancedHorizon] = useState(3);
  const [advancedRows, setAdvancedRows] = useState<AdvancedWeekRow[]>([]);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedSaving, setAdvancedSaving] = useState(false);
  const [advancedTargetTotal, setAdvancedTargetTotal] = useState(0);

  const loadWeeks = async (year: number) => {
    try {
      const response = await filtresApi.getSemaines(year);
      const raw = (response.data.data || []) as any[];
      const mapped = raw.map((w) => ({
        id: w.ID,
        numero: w.Numero_semaine,
        annee: w.Annee ?? year,
        dateDebut: w.Date_debut,
        label: `S${String(w.Numero_semaine).padStart(2, '0')} - ${new Date(
          w.Date_debut
        ).toLocaleDateString()} au ${new Date(w.Date_fin).toLocaleDateString()}`,
      }));
      setWeeks(mapped);
      if (mapped.length > 0 && !mapped.some((w) => w.numero === semaine)) {
        setSemaine(mapped[0].numero);
      }
    } catch {
      setWeeks([]);
    }
  };

  const loadAnnees = async () => {
    try {
      const response = await filtresApi.getAnnees();
      const list = (response.data.data || []) as number[];
      if (list.length > 0) {
        setAnnees(list);
        if (!list.includes(annee)) setAnnee(list[0]);
      } else {
        setAnnees([annee]);
      }
    } catch {
      setAnnees([annee]);
    }
  };

  const loadUnites = async () => {
    try {
      const response = await filtresApi.getUnites();
      const list = (response.data.data || []) as string[];
      if (list.length > 0) {
        setUnitesOptions(list);
      }
    } catch {
      // ignore
    }
  };

  const loadCommandes = async (semaineId?: number) => {
    try {
      setLoading(true);
      const response = semaineId
        ? await api.get(`/commandes/semaine/${semaineId}`)
        : await api.get('/commandes');
      const list = (response.data?.data || []) as CommandeFacturationRow[];
      setCommandes(list);
      const defaults: Record<number, number> = {};
      list.forEach((cmd) => {
        const qte = cmd.Quantite || 0;
        defaults[cmd.ID] = Math.max(0, qte);
      });
      setQtyMap(defaults);
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Erreur chargement commandes');
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlannedWeek = async () => {
    try {
      const response = await planningApi.getGrilleHebdo(
        semaine,
        annee,
        unite === 'Toutes' ? undefined : unite
      );
      const rows = response.data?.data?.commandes || [];
      const map: Record<number, any> = {};
      rows.forEach((r: any) => {
        map[r.commande_id] = r;
      });
      setPlannedByCommande(map);
    } catch {
      setPlannedByCommande({});
    }
  };

  const weekOption = useMemo(
    () => weeks.find((w) => w.numero === semaine),
    [weeks, semaine]
  );

  useEffect(() => {
    void loadAnnees();
    void loadUnites();
  }, []);

  useEffect(() => {
    void loadWeeks(annee);
  }, [annee]);

  useEffect(() => {
    void loadPlannedWeek();
  }, [semaine, annee, unite]);

  useEffect(() => {
    if (weekOption?.id) {
      void loadCommandes(weekOption.id);
    }
  }, [weekOption?.id]);

  const filtered = useMemo(() => {
    return commandes.filter((cmd) => {
      const qte = cmd.Quantite || 0;
      if (qte <= 0) return false;
      if (unite !== 'Toutes' && (cmd.Unite_production || '') !== unite) return false;
      return true;
    });
  }, [commandes, unite]);

  const unites = useMemo(() => {
    const set = new Set<string>();
    unitesOptions.forEach((u) => set.add(u));
    commandes.forEach((c) => {
      if (c.Unite_production) set.add(c.Unite_production);
    });
    return ['Toutes', ...Array.from(set).sort()];
  }, [commandes, unitesOptions]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelected(filtered.map((c) => c.ID));
  };

  const clearSelection = () => {
    setSelected([]);
  };

  const planifierCommande = async (cmd: CommandeFacturationRow) => {
    if (!weekOption?.id) {
      showToast.error('Semaine invalide');
      return;
    }
    const qty = Math.max(0, Number(qtyMap[cmd.ID] || 0));
    if (qty <= 0) {
      showToast.error('Quantite a planifier invalide');
      return;
    }

    const split = splitQty(qty);
    const current = plannedByCommande[cmd.ID];

    try {
      if (current?.id) {
        await planningApi.update(current.id, {
          Quantite_facturee_semaine: (current.quantite_facturee_semaine || 0) + qty,
          Date_debut_planification: weekOption.dateDebut || null,
          Identifiant_lot: current.identifiant_lot || `${cmd.Lot || cmd.ID}-${annee}`,
          Lundi_planifie: (current.planification?.lundi?.planifie || 0) + split.Lundi_planifie,
          Mardi_planifie: (current.planification?.mardi?.planifie || 0) + split.Mardi_planifie,
          Mercredi_planifie: (current.planification?.mercredi?.planifie || 0) + split.Mercredi_planifie,
          Jeudi_planifie: (current.planification?.jeudi?.planifie || 0) + split.Jeudi_planifie,
          Vendredi_planifie: (current.planification?.vendredi?.planifie || 0) + split.Vendredi_planifie,
          Samedi_planifie: (current.planification?.samedi?.planifie || 0) + split.Samedi_planifie,
        } as any);
      } else {
        await planningApi.create({
          ID_Semaine_planifiee: weekOption.id,
          ID_Commande: cmd.ID,
          Date_debut_planification: weekOption.dateDebut || null,
          Identifiant_lot: `${cmd.Lot || cmd.ID}-${annee}`,
          Quantite_facturee_semaine: qty,
          Stock_actuel: 0,
          ...split,
          Lundi_emballe: 0,
          Mardi_emballe: 0,
          Mercredi_emballe: 0,
          Jeudi_emballe: 0,
          Vendredi_emballe: 0,
          Samedi_emballe: 0,
          Commentaire: 'Planification rapide facturation',
        } as any);
      }
      showToast.success(`Commande ${cmd.Code_article || cmd.ID} planifiee`);
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Echec planification');
    }
  };

  const planifierSelection = async () => {
    if (mode === 'avance') {
      showToast.warning('En mode avance, utilisez la planification detaillee par commande.');
      return;
    }
    if (selected.length === 0) {
      showToast.warning('Aucune commande selectionnee');
      return;
    }
    setSaving(true);
    try {
      for (const id of selected) {
        const cmd = filtered.find((c) => c.ID === id);
        if (cmd) {
          // eslint-disable-next-line no-await-in-loop
          await planifierCommande(cmd);
        }
      }
      await loadPlannedWeek();
      showToast.success('Selection planifiee');
    } finally {
      setSaving(false);
    }
  };

  const buildAdvancedRows = async (cmd: CommandeFacturationRow, horizonCount: number) => {
    if (weeks.length === 0) return [];
    const startIndex = weeks.findIndex((w) => w.numero === semaine);
    const idx = startIndex >= 0 ? startIndex : 0;
    const selectedWeeks = weeks.slice(idx, idx + Math.max(1, horizonCount));
    const rows: AdvancedWeekRow[] = [];

    for (const week of selectedWeeks) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await planningApi.getGrilleHebdo(
          week.numero,
          week.annee,
          unite === 'Toutes' ? undefined : unite
        );
        const existing = (response.data?.data?.commandes || []).find((r: any) => r.commande_id === cmd.ID);
        rows.push({
          week,
          existingId: existing?.id,
          objectif: Number(existing?.quantite_facturee_semaine || 0),
          planifie: Number(existing?.total_planifie_semaine || 0),
          emballe: Number(existing?.total_emballe_semaine || 0),
        });
      } catch {
        rows.push({
          week,
          objectif: 0,
          planifie: 0,
          emballe: 0,
        });
      }
    }
    return rows;
  };

  const openAdvancedModal = async (cmd: CommandeFacturationRow) => {
    setAdvancedCommande(cmd);
    setAdvancedLoading(true);
    try {
      const rows = await buildAdvancedRows(cmd, advancedHorizon);
      const defaultQty = Math.max(0, Number(qtyMap[cmd.ID] || 0));
      const withDefaults = rows.map((r, index) => ({
        ...r,
        objectif: r.objectif || (index === 0 ? defaultQty : 0),
        planifie: r.planifie || (index === 0 ? defaultQty : 0),
      }));
      setAdvancedRows(withDefaults);
      const sumPlanifie = withDefaults.reduce((acc, r) => acc + (r.planifie || 0), 0);
      setAdvancedTargetTotal(sumPlanifie > 0 ? sumPlanifie : defaultQty);
    } finally {
      setAdvancedLoading(false);
    }
  };

  const closeAdvancedModal = () => {
    setAdvancedCommande(null);
    setAdvancedRows([]);
  };

  const onChangeAdvancedField = (index: number, field: 'objectif' | 'planifie', value: number) => {
    setAdvancedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: Math.max(0, value) } : r))
    );
  };

  const refreshAdvancedRows = async () => {
    if (!advancedCommande) return;
    setAdvancedLoading(true);
    try {
      const rows = await buildAdvancedRows(advancedCommande, advancedHorizon);
      setAdvancedRows(rows);
      const sumPlanifie = rows.reduce((acc, r) => acc + (r.planifie || 0), 0);
      setAdvancedTargetTotal(sumPlanifie);
    } finally {
      setAdvancedLoading(false);
    }
  };

  const distributeEvenly = (total: number, length: number) => {
    if (length <= 0) return [];
    const safeTotal = Math.max(0, Math.floor(total));
    const base = Math.floor(safeTotal / length);
    let rem = safeTotal % length;
    return Array.from({ length }, () => {
      const value = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
      return value;
    });
  };

  const applyCopyObjectifToPlanifie = () => {
    const sumObjectifs = advancedRows.reduce((acc, r) => acc + Math.max(0, Math.floor(r.objectif || 0)), 0);
    setAdvancedRows((prev) => prev.map((r) => ({ ...r, planifie: Math.max(0, Math.floor(r.objectif || 0)) })));
    setAdvancedTargetTotal(sumObjectifs);
  };

  const applyEqualize = () => {
    setAdvancedRows((prev) => {
      const distribution = distributeEvenly(advancedTargetTotal, prev.length);
      return prev.map((r, i) => ({ ...r, planifie: distribution[i] || 0 }));
    });
  };

  const applyProportional = () => {
    setAdvancedRows((prev) => {
      const weights = prev.map((r) => Math.max(0, Math.floor(r.objectif || 0)));
      const weightSum = weights.reduce((a, b) => a + b, 0);
      if (prev.length === 0) return prev;
      if (weightSum <= 0) {
        const distribution = distributeEvenly(advancedTargetTotal, prev.length);
        return prev.map((r, i) => ({ ...r, planifie: distribution[i] || 0 }));
      }

      const raw = weights.map((w) => (w / weightSum) * Math.max(0, Math.floor(advancedTargetTotal)));
      const floored = raw.map((v) => Math.floor(v));
      let remaining = Math.max(0, Math.floor(advancedTargetTotal)) - floored.reduce((a, b) => a + b, 0);
      const order = raw
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac);

      for (let k = 0; k < order.length && remaining > 0; k += 1) {
        floored[order[k].i] += 1;
        remaining -= 1;
      }

      return prev.map((r, i) => ({ ...r, planifie: floored[i] || 0 }));
    });
  };

  const applyHalfStartHalfEnd = () => {
    setAdvancedRows((prev) => {
      const count = prev.length;
      if (count === 0) return prev;

      const total = Math.max(0, Math.floor(advancedTargetTotal));
      const firstCount = Math.ceil(count / 2);
      const secondCount = count - firstCount;

      const firstTotal = Math.floor(total / 2);
      const secondTotal = total - firstTotal;

      const firstDistribution = distributeEvenly(firstTotal, firstCount);
      const secondDistribution = distributeEvenly(secondTotal, secondCount);

      return prev.map((r, i) => {
        if (i < firstCount) {
          return { ...r, planifie: firstDistribution[i] || 0 };
        }
        const idx = i - firstCount;
        return { ...r, planifie: secondDistribution[idx] || 0 };
      });
    });
  };

  const saveAdvancedPlanification = async () => {
    if (!advancedCommande) return;
    setAdvancedSaving(true);
    try {
      for (const row of advancedRows) {
        const objectif = Math.max(0, Number(row.objectif || 0));
        const planifie = Math.max(0, Number(row.planifie || 0));
        if (objectif <= 0 && planifie <= 0) continue;

        const split = splitQty(planifie);
        const payload: any = {
          Date_debut_planification: row.week.dateDebut || null,
          Identifiant_lot: `${advancedCommande.Lot || advancedCommande.ID}-${row.week.annee}`,
          Quantite_facturee_semaine: objectif,
          Stock_actuel: 0,
          ...split,
          Commentaire: 'Planification mode avance',
        };

        if (row.existingId) {
          // eslint-disable-next-line no-await-in-loop
          await planningApi.update(row.existingId, payload);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await planningApi.create({
            ID_Semaine_planifiee: row.week.id,
            ID_Commande: advancedCommande.ID,
            Lundi_emballe: 0,
            Mardi_emballe: 0,
            Mercredi_emballe: 0,
            Jeudi_emballe: 0,
            Vendredi_emballe: 0,
            Samedi_emballe: 0,
            ...payload,
          });
        }
      }

      showToast.success('Planification avancee enregistree');
      await loadPlannedWeek();
      closeAdvancedModal();
    } catch (err: any) {
      showToast.error(err?.error || err?.message || 'Echec planification avancee');
    } finally {
      setAdvancedSaving(false);
    }
  };

  const advancedTotals = useMemo(() => {
    return advancedRows.reduce(
      (acc, row) => {
        acc.objectif += row.objectif;
        acc.planifie += row.planifie;
        acc.emballe += row.emballe;
        return acc;
      },
      { objectif: 0, planifie: 0, emballe: 0 }
    );
  }, [advancedRows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Planification Automatique</h1>
        <p className="text-sm text-gray-500 mt-1">Horizon multi-semaines et repartition assistée</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_MANUEL)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Manuel
        </button>
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_AUTO)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Auto
        </button>
        <button
          onClick={() => route(ROUTES.PRODUCTION_PLANNING_ANALYSE)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Analyse
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Annee</label>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt((e.target as HTMLSelectElement).value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {annees.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Semaine</label>
            <select
              value={semaine}
              onChange={(e) => setSemaine(parseInt((e.target as HTMLSelectElement).value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-64"
            >
              {weeks.map((w) => (
                <option key={`${w.annee}-${w.numero}`} value={w.numero}>{w.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unite production</label>
            <select
              value={unite}
              onChange={(e) => setUnite((e.target as HTMLSelectElement).value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-48"
            >
              {unites.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mode</label>
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setMode('simple')}
                className={`px-3 py-2 text-sm ${mode === 'simple' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode('avance')}
                className={`px-3 py-2 text-sm ${mode === 'avance' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Avance
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Commandes a facturer (reste a planifier)</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Selectionner tout
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Vider
            </button>
            <button
              disabled={saving}
              onClick={() => void planifierSelection()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Planification...' : 'Planifier la selection'}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-3 text-center">Sel</th>
                  <th className="px-3 py-3 text-left">Article</th>
                  <th className="px-3 py-3 text-left">Lot</th>
                  <th className="px-3 py-3 text-right">Qte totale</th>
                  <th className="px-3 py-3 text-right">Quantite a facturer</th>
                  <th className="px-3 py-3 text-right">Reste</th>
                  <th className="px-3 py-3 text-center">Priorite</th>
                  <th className="px-3 py-3 text-right">Deja planifie S{semaine}</th>
                  <th className="px-3 py-3 text-center">Planification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Aucune commande a planifier
                    </td>
                  </tr>
                )}
                {filtered.map((cmd) => {
                  const total = cmd.Quantite || 0;
                  const objectifSemaine = plannedByCommande[cmd.ID]?.quantite_facturee_semaine || 0;
                  const reste = Math.max(0, total - objectifSemaine);
                  const planned = plannedByCommande[cmd.ID]?.total_planifie_semaine || 0;
                  return (
                    <tr key={cmd.ID}>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(cmd.ID)}
                          onChange={() => toggleSelect(cmd.ID)}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium">{cmd.Code_article || '-'}</td>
                      <td className="px-3 py-3">{cmd.Lot || '-'}</td>
                      <td className="px-3 py-3 text-right">{total}</td>
                      <td className="px-3 py-3 text-right">{objectifSemaine}</td>
                      <td className="px-3 py-3 text-right">{reste}</td>
                      <td className="px-3 py-3 text-center">{cmd.priorite || '-'}</td>
                      <td className="px-3 py-3 text-right">{planned}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={qtyMap[cmd.ID] || 0}
                            onChange={(e) =>
                              setQtyMap((prev) => ({
                                ...prev,
                                [cmd.ID]: Math.max(
                                  0,
                                  parseInt((e.target as HTMLInputElement).value || '0', 10)
                                ),
                              }))
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => void planifierCommande(cmd)}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Planifier
                          </button>
                          <button
                            onClick={() => void openAdvancedModal(cmd)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Avance
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {advancedCommande && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Planification avancee - {advancedCommande.Code_article || advancedCommande.ID} / Lot {advancedCommande.Lot || '-'}
              </h3>
              <button onClick={closeAdvancedModal} className="text-gray-500 hover:text-gray-700">X</button>
            </div>

            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Horizon semaines</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={advancedHorizon}
                  onChange={(e) => setAdvancedHorizon(Math.max(1, Math.min(8, parseInt((e.target as HTMLInputElement).value || '3', 10))))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => void refreshAdvancedRows()}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Recharger
              </button>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Total cible a repartir</label>
                <input
                  type="number"
                  min={0}
                  value={advancedTargetTotal}
                  onChange={(e) =>
                    setAdvancedTargetTotal(Math.max(0, parseInt((e.target as HTMLInputElement).value || '0', 10)))
                  }
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={applyCopyObjectifToPlanifie}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Objectif → Planifie
              </button>
              <button
                onClick={applyEqualize}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Egaliser
              </button>
              <button
                onClick={applyProportional}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Proportionnelle
              </button>
              <button
                onClick={applyHalfStartHalfEnd}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                50% debut / 50% fin
              </button>
            </div>

            {advancedLoading ? (
              <div className="py-8 text-center text-gray-600">Chargement des semaines...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Semaine</th>
                      <th className="px-3 py-2 text-right">Objectif</th>
                      <th className="px-3 py-2 text-right">Planifie</th>
                      <th className="px-3 py-2 text-right">Emballe</th>
                      <th className="px-3 py-2 text-right">Ecart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {advancedRows.map((row, index) => (
                      <tr key={`${row.week.id}-${index}`}>
                        <td className="px-3 py-2">{row.week.label}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.objectif}
                            onChange={(e) =>
                              onChangeAdvancedField(
                                index,
                                'objectif',
                                parseInt((e.target as HTMLInputElement).value || '0', 10)
                              )
                            }
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.planifie}
                            onChange={(e) =>
                              onChangeAdvancedField(
                                index,
                                'planifie',
                                parseInt((e.target as HTMLInputElement).value || '0', 10)
                              )
                            }
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">{row.emballe}</td>
                        <td className="px-3 py-2 text-right">{row.planifie - row.objectif}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">{advancedTotals.objectif}</td>
                      <td className="px-3 py-2 text-right">{advancedTotals.planifie}</td>
                      <td className="px-3 py-2 text-right">{advancedTotals.emballe}</td>
                      <td className="px-3 py-2 text-right">{advancedTotals.planifie - advancedTotals.objectif}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={closeAdvancedModal}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                disabled={advancedSaving}
                onClick={() => void saveAdvancedPlanification()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {advancedSaving ? 'Enregistrement...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanificationFacturation;
