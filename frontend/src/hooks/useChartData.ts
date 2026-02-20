/**
 * Hook personnalisé pour préparer les données des graphiques
 * Transforme les données brutes de l'API en format adapté pour Recharts
 */

import { useMemo } from 'preact/hooks';
import type { Indicateurs } from '../types/dashboard.types';

/**
 * Format de données pour le graphique de production
 */
export interface ProductionChartData {
  day: string;
  commandes: number;
  cible: number;
}

/**
 * Format de données pour le graphique de qualité
 */
export interface QualiteChartData {
  name: string;
  value: number;
  color: string;
}

/**
 * Format de données pour le graphique de maintenance
 */
export interface MaintenanceChartData {
  day: string;
  interventions: number;
  machines_panne: number;
}

interface UseChartDataReturn {
  productionData: ProductionChartData[];
  qualiteData: QualiteChartData[];
  maintenanceData: MaintenanceChartData[];
}

/**
 * Hook useChartData
 * @param data - Les données brutes du dashboard
 * @returns Objet contenant les données formatées pour chaque graphique
 */
export const useChartData = (data: Indicateurs | null): UseChartDataReturn => {
  const productionData = useMemo<ProductionChartData[]>(() => {
    if (!data) return [];

    // Création de données d'exemple basées sur les données actuelles
    // En production, ces données viendraient de l'API avec l'historique
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return jours.map((day, index) => ({
      day,
      commandes: Math.max(
        0,
        data.production.commandes.commandes_en_cours - (index > 4 ? index * 2 : 0)
      ),
      cible: 100,
    }));
  }, [data]);

  const qualiteData = useMemo<QualiteChartData[]>(() => {
    if (!data) return [];

    const total = data.qualite.defauts.total_defauts;
    
    return [
      {
        name: 'Critiques',
        value: data.qualite.defauts.defauts_critiques,
        color: '#ef4444', // red-500
      },
      {
        name: 'Bloquants',
        value: data.qualite.defauts.defauts_bloquants,
        color: '#f97316', // orange-500
      },
      {
        name: 'Acceptés',
        value: Math.max(0, data.qualite.qualite.total_controles - total),
        color: '#22c55e', // green-500
      },
    ].filter(item => item.value > 0);
  }, [data]);

  const maintenanceData = useMemo<MaintenanceChartData[]>(() => {
    if (!data) return [];

    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return jours.map((day, index) => ({
      day,
      interventions: Math.max(
        0,
        data.maintenance.interventions.interventions_en_cours + 
        data.maintenance.interventions.interventions_attente - 
        (index > 4 ? index : 0)
      ),
      machines_panne: data.maintenance.machines.machines_panne,
    }));
  }, [data]);

  return {
    productionData,
    qualiteData,
    maintenanceData,
  };
};

export default useChartData;
