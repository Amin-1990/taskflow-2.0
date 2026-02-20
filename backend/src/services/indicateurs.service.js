const db = require('../config/database');

class IndicateursService {

    /**
     * Point d'entrée unique - Récupère tous les indicateurs
     * @param {string} periode - 'jour', 'semaine', 'mois', 'annee'
     */
    async getAllIndicateurs(periode = 'jour') {
        try {
            const [production, qualite, maintenance, rh] = await Promise.all([
                this.getIndicateursProduction(periode).catch(e => {
                    console.warn('❌ Erreur production:', e.message);
                    return this.getDefaultProduction();
                }),
                this.getIndicateursQualite(periode).catch(e => {
                    console.warn('❌ Erreur qualité:', e.message);
                    return this.getDefaultQualite();
                }),
                this.getIndicateursMaintenance(periode).catch(e => {
                    console.warn('❌ Erreur maintenance:', e.message);
                    return this.getDefaultMaintenance();
                }),
                this.getIndicateursRH(periode).catch(e => {
                    console.warn('❌ Erreur RH:', e.message);
                    return this.getDefaultRH();
                })
            ]);

            return {
                production,
                qualite,
                maintenance,
                rh,
                timestamp: new Date(),
                periode
            };
        } catch (error) {
            console.error('❌ Erreur critique getAllIndicateurs:', error);
            throw error;
        }
    }

    // ===========================================
    // PRODUCTION
    // ===========================================

    async getIndicateursProduction(periode) {
        try {
            const dateCondition = this.getDateCondition(periode, 'c.Date_creation');

            // Données commandes
            const [commandes] = await db.query(`
              SELECT 
                COUNT(*) as total_commandes,
                SUM(CASE WHEN COALESCE(pf.objectif_total, 0) < COALESCE(c.Quantite, 0) THEN 1 ELSE 0 END) as commandes_en_cours,
                SUM(CASE WHEN COALESCE(pf.objectif_total, 0) >= COALESCE(c.Quantite, 0) THEN 1 ELSE 0 END) as commandes_terminees,
                SUM(CASE WHEN COALESCE(c.Quantite_emballe, 0) = 0 THEN 1 ELSE 0 END) as commandes_non_emballe,
                SUM(COALESCE(c.Quantite, 0)) as quantite_totale,
                SUM(COALESCE(pf.objectif_total, 0)) as quantite_produite,
                SUM(COALESCE(c.Quantite_emballe, 0)) as quantite_emballe
              FROM commandes c
              LEFT JOIN (
                SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
                FROM planning_hebdo
                GROUP BY ID_Commande
              ) pf ON pf.ID_Commande = c.ID
              WHERE ${dateCondition}
            `);

            // Données affectations
            const [affectations] = await db.query(`
        SELECT 
          COUNT(*) as total_affectations,
          SUM(CASE WHEN Date_fin IS NULL THEN 1 ELSE 0 END) as affectations_en_cours,
          ROUND(AVG(COALESCE(Duree, 0)), 2) as duree_moyenne,
          ROUND(AVG(COALESCE(Heure_supp, 0)), 2) as heures_sup_moyenne
        FROM affectations
        WHERE ${dateCondition}
      `);

            // Planning hebdomadaire
            const [planning] = await db.query(`
        SELECT 
          ROUND(SUM(COALESCE(Total_planifie_semaine, 0)), 2) as total_prevus,
          ROUND(SUM(COALESCE(Total_emballe_semaine, 0)), 2) as total_realises,
          COUNT(*) as total_semaines
        FROM planning_hebdo ph
        JOIN semaines s ON ph.ID_Semaine_planifiee = s.ID
        WHERE ${dateCondition.replace(/c\./g, 's.')}
      `);

            const comData = commandes[0] || {};
            const affecData = affectations[0] || {};
            const planData = planning[0] || {};

            const totalPrevus = parseFloat(planData.total_prevus) || 0;
            const totalRealises = parseFloat(planData.total_realises) || 0;
            const quantiteTotale = parseFloat(comData.quantite_totale) || 0;
            const quantiteProduite = parseFloat(comData.quantite_produite) || 0;

            return {
                commandes: {
                    total: comData.total_commandes || 0,
                    en_cours: comData.commandes_en_cours || 0,
                    terminees: comData.commandes_terminees || 0,
                    non_emballe: comData.commandes_non_emballe || 0,
                    quantite_totale: comData.quantite_totale || 0,
                    quantite_produite: comData.quantite_produite || 0,
                    quantite_emballe: comData.quantite_emballe || 0
                },
                affectations: {
                    total: affecData.total_affectations || 0,
                    en_cours: affecData.affectations_en_cours || 0,
                    duree_moyenne: affecData.duree_moyenne || 0,
                    heures_sup_moyenne: affecData.heures_sup_moyenne || 0
                },
                planning: {
                    total_prevus: planData.total_prevus || 0,
                    total_realises: planData.total_realises || 0,
                    total_semaines: planData.total_semaines || 0
                },
                taux_rendement: totalPrevus > 0 ? (totalRealises / totalPrevus * 100).toFixed(1) : 0,
                taux_avancement: quantiteTotale > 0 ? (quantiteProduite / quantiteTotale * 100).toFixed(1) : 0,
                taux_emballage: quantiteProduite > 0 ? ((comData.quantite_emballe || 0) / quantiteProduite * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('⚠️ Erreur production:', error.message);
            return this.getDefaultProduction();
        }
    }

    // ===========================================
    // QUALITÉ
    // ===========================================

    async getIndicateursQualite(periode) {
        try {
            const dateCondition = this.getDateCondition(periode, 'c.Date_creation');

            // Qualité basée sur les commandes
            const [commandes] = await db.query(`
              SELECT 
                COUNT(*) as total_commandes,
                SUM(CASE WHEN COALESCE(c.Quantite_emballe, 0) >= COALESCE(pf.objectif_total, 0) AND COALESCE(pf.objectif_total, 0) > 0 THEN 1 ELSE 0 END) as commandes_parfaites,
                SUM(CASE WHEN COALESCE(c.Quantite_emballe, 0) < COALESCE(pf.objectif_total, 0) AND COALESCE(c.Quantite_emballe, 0) > 0 THEN 1 ELSE 0 END) as commandes_partielles,
                SUM(CASE WHEN COALESCE(c.Quantite_emballe, 0) = 0 THEN 1 ELSE 0 END) as commandes_non_emballe,
                ROUND(SUM(COALESCE(pf.objectif_total, 0)) - SUM(COALESCE(c.Quantite_emballe, 0))) as pieces_non_emballe
              FROM commandes c
              LEFT JOIN (
                SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
                FROM planning_hebdo
                GROUP BY ID_Commande
              ) pf ON pf.ID_Commande = c.ID
              WHERE ${dateCondition}
            `);

            const comData = commandes[0] || {};
            const totalCom = comData.total_commandes || 0;
            const parfaites = comData.commandes_parfaites || 0;

            return {
                conformite: {
                    total_commandes: totalCom,
                    commandes_parfaites: parfaites,
                    commandes_partielles: comData.commandes_partielles || 0,
                    commandes_non_emballe: comData.commandes_non_emballe || 0,
                    pieces_non_emballe: comData.pieces_non_emballe || 0
                },
                qualite: {
                    total_controles: totalCom,
                    controles_acceptes: parfaites
                },
                taux_conformite: totalCom > 0 ? (parfaites / totalCom * 100).toFixed(1) : 100,
                taux_qualite: totalCom > 0 ? (parfaites / totalCom * 100).toFixed(1) : 100,
                defauts: {
                    total_defauts: 0,
                    total_pieces_defectueuses: comData.pieces_non_emballe || 0,
                    taux_defaut: totalCom > 0 ? ((comData.pieces_non_emballe || 0) / (totalCom * 100)).toFixed(3) : 0
                }
            };
        } catch (error) {
            console.error('⚠️ Erreur qualité:', error.message);
            return this.getDefaultQualite();
        }
    }

    // ===========================================
    // MAINTENANCE
    // ===========================================

    async getIndicateursMaintenance(periode) {
        try {
            const dateCondition = this.getDateCondition(periode, 'm.Date_creation');

            // Machines
            const [machines] = await db.query(`
        SELECT 
          COUNT(*) as total_machines,
          SUM(CASE WHEN Statut_operationnel = 'en_production' THEN 1 ELSE 0 END) as machines_operationnelles,
          SUM(CASE WHEN Statut_operationnel = 'en_panne' THEN 1 ELSE 0 END) as machines_panne,
          SUM(CASE WHEN Statut_operationnel = 'maintenance' THEN 1 ELSE 0 END) as machines_maintenance
        FROM machines m
        WHERE m.Statut = 'actif'
      `);

            // Interventions
            const [interventions] = await db.query(`
              SELECT 
                COUNT(*) as total_interventions,
                SUM(CASE WHEN Statut = 'EN_COURS' THEN 1 ELSE 0 END) as interventions_en_cours,
                SUM(CASE WHEN Statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as interventions_attente,
                SUM(CASE WHEN Statut = 'TERMINEES' THEN 1 ELSE 0 END) as interventions_terminees,
                ROUND(AVG(COALESCE(Duree_intervention_minutes, 0)), 2) as duree_moyenne,
                ROUND(AVG(COALESCE(Temps_attente_minutes, 0)), 2) as temps_attente_moyen
              FROM demande_intervention
              WHERE Date_heure_demande IS NOT NULL
            `);

            const machData = machines[0] || {};
            const interpData = interventions[0] || {};

            const totalMachines = machData.total_machines || 0;
            const machinesOp = machData.machines_operationnelles || 0;

            return {
                machines: {
                    total: totalMachines,
                    operationnelles: machData.machines_operationnelles || 0,
                    panne: machData.machines_panne || 0,
                    maintenance: machData.machines_maintenance || 0
                },
                interventions: {
                    total: interpData.total_interventions || 0,
                    en_cours: interpData.interventions_en_cours || 0,
                    attente: interpData.interventions_attente || 0,
                    terminees: interpData.interventions_terminees || 0,
                    duree_moyenne: interpData.duree_moyenne || 0,
                    temps_attente_moyen: interpData.temps_attente_moyen || 0
                },
                disponibilite: totalMachines > 0 ? (machinesOp / totalMachines * 100).toFixed(1) : 0,
                taux_panne: totalMachines > 0 ? ((machData.machines_panne || 0) / totalMachines * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('⚠️ Erreur maintenance:', error.message);
            return this.getDefaultMaintenance();
        }
    }

    // ===========================================
    // RESSOURCES HUMAINES
    // ===========================================

    async getIndicateursRH(periode) {
        try {
            const dateCondition = this.getDateCondition(periode, 'Date');

            // Personnel
            const [personnel] = await db.query(`
        SELECT 
          COUNT(*) as total_personnel,
          SUM(CASE WHEN Statut = 'actif' THEN 1 ELSE 0 END) as personnel_actif,
          SUM(CASE WHEN Statut = 'inactif' THEN 1 ELSE 0 END) as personnel_inactif
        FROM personnel
      `);

            // Pointages
            const [pointage] = await db.query(`
              SELECT 
                COUNT(DISTINCT ID_Personnel) as presents,
                SUM(CASE WHEN Absent = 1 THEN 1 ELSE 0 END) as absents,
                SUM(CASE WHEN Retard IS NOT NULL THEN 1 ELSE 0 END) as retards,
                ROUND(AVG(COALESCE(H_sup, 0)), 2) as heures_sup_moyennes
              FROM pointage
              WHERE Date IS NOT NULL
            `);

            // Affectations avec heures supplémentaires
            const [affectations] = await db.query(`
        SELECT 
          COUNT(DISTINCT ID_Operateur) as operateurs_actifs,
          SUM(CASE WHEN Date_fin IS NULL THEN 1 ELSE 0 END) as affectations_en_cours,
          ROUND(AVG(COALESCE(Heure_supp, 0)), 2) as heures_sup_moyennes,
          ROUND(SUM(COALESCE(Heure_supp, 0)), 2) as heures_totales
        FROM affectations
        WHERE Date_creation IS NOT NULL
      `);

            const persoData = personnel[0] || {};
            const pointData = pointage[0] || {};
            const affecData = affectations[0] || {};

            const totalPersonnelActif = persoData.personnel_actif || 0;
            const presents = pointData.presents || 0;

            return {
                personnel: {
                    total: persoData.total_personnel || 0,
                    actif: persoData.personnel_actif || 0,
                    inactif: persoData.personnel_inactif || 0
                },
                pointage: {
                    presents: pointData.presents || 0,
                    absents: pointData.absents || 0,
                    retards: pointData.retards || 0,
                    heures_sup_moyennes: pointData.heures_sup_moyennes || 0
                },
                affectations: {
                    operateurs_actifs: affecData.operateurs_actifs || 0,
                    affectations_en_cours: affecData.affectations_en_cours || 0,
                    heures_sup_moyennes: affecData.heures_sup_moyennes || 0,
                    heures_totales: affecData.heures_totales || 0
                },
                taux_presence: totalPersonnelActif > 0 ? (presents / totalPersonnelActif * 100).toFixed(1) : 0,
                taux_absence: totalPersonnelActif > 0 ? ((pointData.absents || 0) / totalPersonnelActif * 100).toFixed(1) : 0,
                taux_retard: totalPersonnelActif > 0 ? ((pointData.retards || 0) / totalPersonnelActif * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('⚠️ Erreur RH:', error.message);
            return this.getDefaultRH();
        }
    }

    // ===========================================
    // VALEURS PAR DÉFAUT
    // ===========================================

    getDefaultProduction() {
        return {
            commandes: {
                total: 0,
                en_cours: 0,
                terminees: 0,
                non_emballe: 0,
                quantite_totale: 0,
                quantite_produite: 0,
                quantite_emballe: 0
            },
            affectations: {
                total: 0,
                en_cours: 0,
                duree_moyenne: 0,
                heures_sup_moyenne: 0
            },
            planning: {
                total_prevus: 0,
                total_realises: 0,
                total_semaines: 0
            },
            taux_rendement: 0,
            taux_avancement: 0,
            taux_emballage: 0
        };
    }

    getDefaultQualite() {
        return {
            conformite: {
                total_commandes: 0,
                commandes_parfaites: 0,
                commandes_partielles: 0,
                commandes_non_emballe: 0,
                pieces_non_emballe: 0
            },
            qualite: {
                total_controles: 0,
                controles_acceptes: 0
            },
            taux_conformite: 100,
            taux_qualite: 100,
            defauts: {
                total_defauts: 0,
                total_pieces_defectueuses: 0,
                taux_defaut: 0
            }
        };
    }

    getDefaultMaintenance() {
        return {
            machines: {
                total: 0,
                operationnelles: 0,
                panne: 0,
                maintenance: 0
            },
            interventions: {
                total: 0,
                en_cours: 0,
                attente: 0,
                terminees: 0,
                duree_moyenne: 0,
                temps_attente_moyen: 0
            },
            disponibilite: 0,
            taux_panne: 0
        };
    }

    getDefaultRH() {
        return {
            personnel: {
                total: 0,
                actif: 0,
                inactif: 0
            },
            pointage: {
                presents: 0,
                absents: 0,
                retards: 0,
                heures_sup_moyennes: 0
            },
            affectations: {
                operateurs_actifs: 0,
                affectations_en_cours: 0,
                heures_sup_moyennes: 0,
                heures_totales: 0
            },
            taux_presence: 0,
            taux_absence: 0,
            taux_retard: 0
        };
    }

    // ===========================================
    // UTILITAIRES
    // ===========================================

    /**
     * Génère une condition SQL pour filtrer par période
     * @param {string} periode - 'jour', 'semaine', 'mois', 'annee'
     * @param {string} champDate - Nom du champ date à utiliser
     * @returns {string} Condition SQL
     */
    getDateCondition(periode, champDate = 'Date_creation') {
        switch (periode) {
            case 'jour':
                return `DATE(${champDate}) = CURDATE()`;
            case 'semaine':
                return `YEARWEEK(${champDate}) = YEARWEEK(CURDATE())`;
            case 'mois':
                return `MONTH(${champDate}) = MONTH(CURDATE()) AND YEAR(${champDate}) = YEAR(CURDATE())`;
            case 'annee':
                return `YEAR(${champDate}) = YEAR(CURDATE())`;
            default:
                return `1=1`; // Tous
        }
    }
}

module.exports = new IndicateursService();
