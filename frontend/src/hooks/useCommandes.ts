/**
 * Hook personnalisé pour gérer les commandes
 * Chargement, filtrage, pagination et recherche
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { commandesApi } from '../api/commandes';
import { showToast } from '../utils/toast';
import type {
  Commande,
  CommandeDetail,
  FiltresCommandes,
  Article,
  CommandeSortField,
  CommandesListResponse,
} from '../types/production.types';

/**
 * Options de pagination et tri
 */
export interface UseCommandesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: CommandeSortField;
  initialOrder?: 'asc' | 'desc';
}

/**
 * Valeur retournée par le hook
 */
interface UseCommandesReturn {
  // Données
  commandes: Commande[];
  commandeDetail: CommandeDetail | null;
  articles: Article[];

  // États
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;

  // Pagination
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Filtres
  filtres: FiltresCommandes;
  setFiltres: (filtres: Partial<FiltresCommandes>) => void;
  clearFiltres: () => void;

  // Tri
  sort: CommandeSortField;
  order: 'asc' | 'desc';
  setSort: (field: CommandeSortField, order?: 'asc' | 'desc') => void;

  // Recherche
  recherche: string;
  setRecherche: (terme: string) => void;

  // Actions
  fetchCommandes: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  fetchArticles: () => Promise<void>;
  createCommande: (data: any) => Promise<Commande | null>;
  updateCommande: (id: number, data: any) => Promise<Commande | null>;
  deleteCommande: (id: number) => Promise<boolean>;
  updateStatut: (id: number, statut: string) => Promise<boolean>;
}

/**
 * Hook useCommandes
 * Gère toute la logique de chargement et manipulation des commandes
 */
export const useCommandes = (
  options: UseCommandesOptions = {}
): UseCommandesReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'date_creation',
    initialOrder = 'desc',
  } = options;

  // États de données
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandeDetail, setCommandeDetail] = useState<CommandeDetail | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  // Filtres
  const [filtres, setFiltresState] = useState<FiltresCommandes>({});

  // Tri
  const [sort, setSort] = useState<CommandeSortField>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Recherche
  const [recherche, setRecherche] = useState('');

  const normalizeCommande = useCallback((raw: any): Commande => {
    const id = Number(raw?.id ?? raw?.ID ?? 0);
    const quantite = Number(raw?.quantite ?? raw?.Quantite ?? 0);
    const quantiteProduite = Number(
      raw?.quantite_produite ?? raw?.Quantite_produite ?? raw?.quantite_emballe ?? raw?.Quantite_emballe ?? 0
    );
    const quantiteEmballe = Number(raw?.quantite_emballe ?? raw?.Quantite_emballe ?? 0);
    const prioriteRaw = String(raw?.priorite ?? raw?.Priorite ?? 'normale').toLowerCase();
    const priorite = (['basse', 'normale', 'haute', 'urgente'].includes(prioriteRaw)
      ? prioriteRaw
      : 'normale') as any;
    const statutRaw = String(raw?.statut ?? raw?.Statut ?? '').toLowerCase();
    const statut = ([
      'creee',
      'en_cours',
      'en_attente',
      'suspendue',
      'completee',
      'annulee',
      'en_controle',
      'emballe',
    ].includes(statutRaw)
      ? statutRaw
      : (quantiteEmballe >= quantite && quantite > 0 ? 'emballe' : quantiteProduite > 0 ? 'en_cours' : 'creee')) as any;
    const pourcentage = quantite > 0 ? Math.min(100, Math.round((quantiteProduite / quantite) * 100)) : 0;

    return {
      id,
      numero: String(raw?.numero ?? raw?.Numero ?? `CMD-${id || 'N/A'}`),
      article_id: Number(raw?.article_id ?? raw?.ID_Article ?? 0),
      article_nom: String(raw?.article_nom ?? raw?.Article_code ?? raw?.Code_article ?? ''),
      lot: String(raw?.lot ?? raw?.Lot ?? ''),
      quantite,
      quantite_produite: quantiteProduite,
      quantite_emballe: quantiteEmballe,
      date_creation: String(raw?.date_creation ?? raw?.Date_creation ?? raw?.created_at ?? new Date().toISOString()),
      date_debut: raw?.date_debut ?? raw?.Date_debut ?? null,
      date_fin_prevue: raw?.date_fin_prevue ?? raw?.Date_fin_prevue ?? null,
      date_fin_reelle: raw?.date_fin_reelle ?? raw?.Date_fin_reelle ?? null,
      statut,
      priorite,
      pourcentage_avancement: Number(raw?.pourcentage_avancement ?? pourcentage),
      affectation_id: raw?.affectation_id ?? null,
      operateur_id: raw?.operateur_id ?? null,
      operateur_nom: raw?.operateur_nom ?? null,
      total_defauts: Number(raw?.total_defauts ?? 0),
      taux_conformite: Number(raw?.taux_conformite ?? 100),
      notes: raw?.notes ?? null,
      created_at: String(raw?.created_at ?? raw?.Date_creation ?? new Date().toISOString()),
      updated_at: String(raw?.updated_at ?? raw?.Date_modification ?? new Date().toISOString()),
      created_by: Number(raw?.created_by ?? 0),
      updated_by: raw?.updated_by ?? null,
    };
  }, []);

  /**
   * Charger la liste des commandes
   */
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await commandesApi.getList({
        page,
        limit,
        sort,
        order,
        ...filtres,
        recherche: recherche || undefined,
      });

      if (response.data.success) {
        const rootData: any = response.data.data;
        const isSimpleList = Array.isArray(rootData);
        const rows = isSimpleList
          ? rootData
          : (Array.isArray(rootData?.data) ? rootData.data : []);
        const totalCount = isSimpleList
          ? (typeof (response.data as any).count === 'number' ? (response.data as any).count : rows.length)
          : (typeof rootData?.total === 'number' ? rootData.total : rows.length);

        const normalizedRows = (rows || []).map((row: any) => normalizeCommande(row));
        setCommandes(normalizedRows);
        setTotal(totalCount || 0);
        console.log(`✅ ${normalizedRows.length} commandes chargées`);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement commandes:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, filtres, recherche, normalizeCommande]);

  /**
   * Charger les détails d'une commande
   */
  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await commandesApi.getById(id);

      if (response.data.success && response.data.data) {
        const normalized = normalizeCommande(response.data.data);
        setCommandeDetail({
          ...normalized,
          historique_affectations: Array.isArray((response.data.data as any).historique_affectations)
            ? (response.data.data as any).historique_affectations
            : [],
          defauts: Array.isArray((response.data.data as any).defauts)
            ? (response.data.data as any).defauts
            : [],
        } as any);
        console.log(`✅ Détails commande ${id} chargés`);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement détails:', err);
      showToast.error(errorMsg);
    } finally {
      setLoadingDetail(false);
    }
  }, [normalizeCommande]);

  /**
   * Charger la liste des articles
   */
  const fetchArticles = useCallback(async () => {
    try {
      const response = await commandesApi.getArticles();

      if (response.data.success && response.data.data) {
        setArticles(response.data.data);
        console.log(`✅ ${response.data.data.length} articles chargés`);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement articles:', err);
    }
  }, []);

  /**
   * Créer une nouvelle commande
   */
  const createCommande = useCallback(async (data: any) => {
    const toastId = showToast.loading('Création de la commande...');

    try {
      const response = await commandesApi.create(data);

      if (response.data.success && response.data.data) {
        showToast.update(
          toastId,
          `Commande créée: ${response.data.data.numero}`,
          'success'
        );
        console.log('✅ Commande créée:', response.data.data.numero);
        setPage(1); // Revenir à la première page
        await fetchCommandes();
        return response.data.data as any;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur création:', err);
    }
    return null;
  }, [fetchCommandes]);

  /**
   * Mettre à jour une commande
   */
  const updateCommande = useCallback(async (id: number, data: any) => {
    const toastId = showToast.loading('Mise à jour...');

    try {
      const response = await commandesApi.update(id, data);

      if (response.data.success && response.data.data) {
        showToast.update(toastId, 'Commande mise à jour', 'success');
        console.log('✅ Commande mise à jour');
        await fetchCommandes();
        return response.data.data as any;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur mise à jour:', err);
    }
    return null;
  }, [fetchCommandes]);

  /**
   * Supprimer une commande
   */
  const deleteCommande = useCallback(async (id: number) => {
    const toastId = showToast.loading('Suppression...');

    try {
      const response = await commandesApi.delete(id);

      if (response.data.success) {
        showToast.update(toastId, 'Commande supprimée', 'success');
        console.log('✅ Commande supprimée');
        await fetchCommandes();
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur suppression:', err);
    }
    return false;
  }, [fetchCommandes]);

  /**
   * Mettre à jour le statut d'une commande
   */
  const updateCommandeStatut = useCallback(async (id: number, statut: string) => {
    try {
      const response = await commandesApi.updateStatut(id, statut);

      if (response.data.success) {
        showToast.success('Statut mis à jour');
        console.log('✅ Statut mis à jour');
        await fetchCommandes();
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.error(errorMsg);
      console.error('❌ Erreur mise à jour statut:', err);
    }
    return false;
  }, [fetchCommandes]);

  /**
   * Mettre à jour les filtres
   */
  const setFiltres = useCallback((newFiltres: Partial<FiltresCommandes>) => {
    setFiltresState(prev => ({ ...prev, ...newFiltres }));
    setPage(1); // Réinitialiser à la première page
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const clearFiltres = useCallback(() => {
    setFiltresState({});
    setPage(1);
  }, []);

  /**
   * Changer le tri
   */
  const handleSetSort = useCallback((field: CommandeSortField, ord?: 'asc' | 'desc') => {
    setSort(field);
    if (ord) setOrder(ord);
    setPage(1);
  }, []);

  /**
   * Charger les commandes quand les paramètres changent
   */
  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  return {
    commandes,
    commandeDetail,
    articles,
    loading,
    loadingDetail,
    error,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    setPage,
    setLimit,
    filtres,
    setFiltres,
    clearFiltres,
    sort,
    order,
    setSort: handleSetSort,
    recherche,
    setRecherche,
    fetchCommandes,
    fetchDetail,
    fetchArticles,
    createCommande,
    updateCommande,
    deleteCommande,
    updateStatut: updateCommandeStatut,
  };
};

export default useCommandes;
