/**
 * Hook personnalisé pour gérer le planning hebdomadaire
 * Navigation entre semaines, mise à jour, validation
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { planningApi } from '../api/planning';
import { showToast } from '../utils/toast';
import type {
  Planning,
  PlanningSemaineInfo,
  AjouterPlanningCommandeDto,
  UpdatePlanningCommandeDto,
  CreatePlanningDto,
  ValidationPlanning,
} from '../types/planning.types';

interface UsePlanningOptions {
  initialAnnee?: number;
  initialSemaine?: number;
}

interface UsePlanningReturn {
  // Données
  planning: Planning | null;
  semainesAnnee: PlanningSemaineInfo[];
  
  // États
  loading: boolean;
  error: string | null;
  saving: boolean;
  
  // Navigation semaines
  anneeActuelle: number;
  semaineActuelle: number;
  setAnnee: (annee: number) => void;
  setSemaine: (semaine: number) => void;
  semainesSemblantes: {
    precedente: { semaine: number; annee: number; existe: boolean };
    suivante: { semaine: number; annee: number; existe: boolean };
  };
  
  // Actions sur le planning
  chargerPlanning: (semaine: number, annee: number) => Promise<void>;
  creerPlanning: (data: CreatePlanningDto) => Promise<boolean>;
  mettreAJourPlanning: (updates: any) => Promise<boolean>;
  ajouterCommande: (data: AjouterPlanningCommandeDto) => Promise<boolean>;
  supprimerCommande: (commandeId: number) => Promise<boolean>;
  deplacerCommande: (commandeId: number, jour: string, debut: string, fin: string) => Promise<boolean>;
  
  // Validation
  validerPlanning: () => Promise<ValidationPlanning | null>;
  confirmerPlanning: () => Promise<boolean>;
  
  // Export
  exporterPDF: () => Promise<void>;
  exporterExcel: () => Promise<void>;
  
  // Utilitaires
  obtenirSemainesAnnee: (annee: number) => Promise<void>;
  obtenirConflits: () => Promise<any[]>;
  obtenirSuggestions: () => Promise<any[]>;
}

/**
 * Hook usePlanning
 * Gère toute la logique du planning hebdomadaire
 */
export const usePlanning = (
  options: UsePlanningOptions = {}
): UsePlanningReturn => {
  const { initialAnnee, initialSemaine } = options;
  
  // Calculer l'année et la semaine actuelles
  const maintenant = new Date();
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  };
  
  const semaineDefaut = initialSemaine || getWeekNumber(maintenant);
  const anneeDefaut = initialAnnee || maintenant.getFullYear();

  // États
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [semainesAnnee, setSemainesAnnee] = useState<PlanningSemaineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [semaineActuelle, setSemaineState] = useState(semaineDefaut);
  const [anneeActuelle, setAnneeState] = useState(anneeDefaut);

  /**
   * Charger le planning pour une semaine
   */
  const chargerPlanning = useCallback(async (semaine: number, annee: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await planningApi.getParSemaine(semaine, annee);

      if (response.data.success && response.data.data) {
        setPlanning(response.data.data);
        setSemaineState(semaine);
        setAnneeState(annee);
        console.log(`✅ Planning semaine ${semaine}/${annee} chargé`);
      } else {
        throw new Error('Planning non trouvé');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement planning:', err);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtenir les semaines de l'année
   */
  const obtenirSemainesAnnee = useCallback(async (annee: number) => {
    try {
      const response = await planningApi.getInfosSemaines(annee);

      if (response.data.success && response.data.data) {
        setSemainesAnnee(response.data.data);
        console.log(`✅ ${response.data.data.length} semaines chargées`);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement semaines:', err);
    }
  }, []);

  /**
   * Créer un nouveau planning
   */
  const creerPlanning = useCallback(async (data: CreatePlanningDto) => {
    setSaving(true);
    const toastId = showToast.loading('Création du planning...');

    try {
      const response = await planningApi.create(data);

      if (response.data.success) {
        showToast.update(toastId, 'Planning créé', 'success');
        console.log('✅ Planning créé');
        await chargerPlanning(data.numero_semaine, data.annee);
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur création:', err);
    } finally {
      setSaving(false);
    }
    return false;
  }, [chargerPlanning]);

  /**
   * Mettre à jour le planning
   */
  const mettreAJourPlanning = useCallback(async (updates: any) => {
    if (!planning) return false;

    setSaving(true);
    const toastId = showToast.loading('Mise à jour...');

    try {
      const response = await planningApi.update(planning.id, updates);

      if (response.data.success) {
        showToast.update(toastId, 'Planning mis à jour', 'success');
        console.log('✅ Planning mis à jour');
        await chargerPlanning(semaineActuelle, anneeActuelle);
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur mise à jour:', err);
    } finally {
      setSaving(false);
    }
    return false;
  }, [planning, chargerPlanning, semaineActuelle, anneeActuelle]);

  /**
   * Ajouter une commande au planning
   */
  const ajouterCommande = useCallback(async (data: AjouterPlanningCommandeDto) => {
    setSaving(true);
    const toastId = showToast.loading('Ajout de la commande...');

    try {
      const response = await planningApi.ajouterCommande(data);

      if (response.data.success) {
        showToast.update(toastId, 'Commande ajoutée au planning', 'success');
        console.log('✅ Commande ajoutée');
        await chargerPlanning(semaineActuelle, anneeActuelle);
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur ajout:', err);
    } finally {
      setSaving(false);
    }
    return false;
  }, [chargerPlanning, semaineActuelle, anneeActuelle]);

  /**
   * Supprimer une commande du planning
   */
  const supprimerCommande = useCallback(async (commandeId: number) => {
    setSaving(true);
    const toastId = showToast.loading('Suppression...');

    try {
      const response = await planningApi.supprimerCommande(commandeId);

      if (response.data.success) {
        showToast.update(toastId, 'Commande supprimée du planning', 'success');
        console.log('✅ Commande supprimée');
        await chargerPlanning(semaineActuelle, anneeActuelle);
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur suppression:', err);
    } finally {
      setSaving(false);
    }
    return false;
  }, [chargerPlanning, semaineActuelle, anneeActuelle]);

  /**
   * Déplacer une commande (drag & drop)
   */
  const deplacerCommande = useCallback(
    async (commandeId: number, jour: string, debut: string, fin: string) => {
      setSaving(true);

      try {
        const response = await planningApi.deplacerCommande(commandeId, {
          jour_destination: jour as any,
          heure_debut: debut,
          heure_fin: fin,
        });

        if (response.data.success) {
          showToast.success('Commande déplacée');
          console.log('✅ Commande déplacée');
          await chargerPlanning(semaineActuelle, anneeActuelle);
          return true;
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
        showToast.error(errorMsg);
        console.error('❌ Erreur déplacement:', err);
      } finally {
        setSaving(false);
      }
      return false;
    },
    [chargerPlanning, semaineActuelle, anneeActuelle]
  );

  /**
   * Valider le planning
   */
  const validerPlanning = useCallback(async () => {
    if (!planning) return null;

    setSaving(true);
    const toastId = showToast.loading('Validation...');

    try {
      const response = await planningApi.valider(planning.id);

      if (response.data.success && response.data.data) {
        showToast.update(toastId, 'Planning validé', 'success');
        console.log('✅ Planning validé');
        return response.data.data;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur validation:', err);
    } finally {
      setSaving(false);
    }
    return null;
  }, [planning]);

  /**
   * Confirmer le planning
   */
  const confirmerPlanning = useCallback(async () => {
    if (!planning) return false;

    setSaving(true);
    const toastId = showToast.loading('Confirmation...');

    try {
      const response = await planningApi.confirmer(planning.id);

      if (response.data.success) {
        showToast.update(toastId, 'Planning confirmé', 'success');
        console.log('✅ Planning confirmé');
        await chargerPlanning(semaineActuelle, anneeActuelle);
        return true;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showToast.update(toastId, errorMsg, 'error');
      console.error('❌ Erreur confirmation:', err);
    } finally {
      setSaving(false);
    }
    return false;
  }, [planning, chargerPlanning, semaineActuelle, anneeActuelle]);

  /**
   * Exporter en PDF
   */
  const exporterPDF = useCallback(async () => {
    if (!planning) return;

    try {
      const response = await planningApi.exporterPDF(planning.id);
      const blob = (response as any).data ?? response;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Planning-S${planning.numero_semaine}-${planning.annee}.pdf`;
      link.click();
      showToast.success('Planning exporté');
    } catch (err: any) {
      showToast.error('Erreur export PDF');
      console.error('❌ Erreur export:', err);
    }
  }, [planning]);

  /**
   * Exporter en Excel
   */
  const exporterExcel = useCallback(async () => {
    if (!planning) return;

    try {
      const response = await planningApi.exporterExcel(planning.id);
      const blob = (response as any).data ?? response;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Planning-S${planning.numero_semaine}-${planning.annee}.xlsx`;
      link.click();
      showToast.success('Planning exporté');
    } catch (err: any) {
      showToast.error('Erreur export Excel');
      console.error('❌ Erreur export:', err);
    }
  }, [planning]);

  /**
   * Obtenir les conflits
   */
  const obtenirConflits = useCallback(async () => {
    if (!planning || !planning.id) return [];

    try {
      const response = await planningApi.obtenirConflits(planning.id);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.error('❌ Erreur conflits:', err);
    }
    return [];
  }, [planning]);

  /**
   * Obtenir les suggestions
   */
  const obtenirSuggestions = useCallback(async () => {
    if (!planning || !planning.id) return [];

    try {
      const response = await planningApi.obtenirSuggestions(planning.id);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.error('❌ Erreur suggestions:', err);
    }
    return [];
  }, [planning]);

  /**
   * Changer de semaine
   */
  const setSemaine = useCallback(
    (semaine: number) => {
      chargerPlanning(semaine, anneeActuelle);
    },
    [anneeActuelle, chargerPlanning]
  );

  /**
   * Changer d'année
   */
  const setAnnee = useCallback(
    (annee: number) => {
      setAnneeState(annee);
      obtenirSemainesAnnee(annee);
      chargerPlanning(1, annee); // Aller à semaine 1
    },
    [chargerPlanning, obtenirSemainesAnnee]
  );

  /**
   * Calculer semaines précédente et suivante
   */
  const semainesSemblantes = {
    precedente: semaineActuelle > 1
      ? { semaine: semaineActuelle - 1, annee: anneeActuelle, existe: true }
      : { semaine: 52, annee: anneeActuelle - 1, existe: true },
    suivante: semaineActuelle < 52
      ? { semaine: semaineActuelle + 1, annee: anneeActuelle, existe: true }
      : { semaine: 1, annee: anneeActuelle + 1, existe: true },
  };

  /**
   * Charger le planning au montage
   */
  useEffect(() => {
    chargerPlanning(semaineActuelle, anneeActuelle);
    obtenirSemainesAnnee(anneeActuelle);
  }, []);

  return {
    planning,
    semainesAnnee,
    loading,
    error,
    saving,
    anneeActuelle,
    semaineActuelle,
    setAnnee,
    setSemaine,
    semainesSemblantes,
    chargerPlanning,
    creerPlanning,
    mettreAJourPlanning,
    ajouterCommande,
    supprimerCommande,
    deplacerCommande,
    validerPlanning,
    confirmerPlanning,
    exporterPDF,
    exporterExcel,
    obtenirSemainesAnnee,
    obtenirConflits,
    obtenirSuggestions,
  };
};

export default usePlanning;
