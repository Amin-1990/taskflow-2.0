const db = require('../config/database');
const { logAction } = require('./audit.service');
const affectationService = require('./affectation.service');

/**
 * Service de gestion des commandes
 * Gère la logique métier: quantité emballée, clôture automatique
 */
class CommandeService {
    /**
     * Met à jour la quantité emballée
     * Clôture automatiquement la commande si Quantite_emballe >= Quantite_facturee
     * 
     * @param {number} commandeId - ID de la commande
     * @param {number} quantiteEmballe - Quantité à ajouter
     * @param {Object} auditInfo - Infos audit (IP, User-Agent)
     * @param {Object} user - Utilisateur actuel
     * @returns {Promise<Object>} Résultat de la mise à jour
     */
    async updateQuantiteEmballe(commandeId, quantiteEmballe, auditInfo = {}, user = {}) {
        let connection = null;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Récupérer la commande actuelle
            const [commandes] = await connection.query(
                'SELECT * FROM commandes WHERE ID = ?',
                [commandeId]
            );

            if (commandes.length === 0) {
                throw new Error('Commande non trouvée');
            }

            const oldValue = commandes[0];
            const { Quantite: quantiteCommande, Quantite_emballe: currentQuantite } = oldValue;

            const [objectifRows] = await connection.query(
                `SELECT COALESCE(SUM(Quantite_facturee_semaine), 0) as objectif_total
                 FROM planning_hebdo
                 WHERE ID_Commande = ?`,
                [commandeId]
            );
            const objectifTotal = objectifRows[0]?.objectif_total || 0;
            const limiteCible = objectifTotal > 0 ? objectifTotal : (quantiteCommande || 0);

            // Vérifier R1: Quantite_emballe ne peut pas dépasser Quantite_facturee
            const newQuantite = (currentQuantite || 0) + quantiteEmballe;
            if (limiteCible > 0 && newQuantite > limiteCible) {
                throw new Error(
                    `Quantité emballée (${newQuantite}) ne peut pas dépasser cible (${limiteCible})`
                );
            }

            // Mettre à jour la quantité
            await connection.query(
                'UPDATE commandes SET Quantite_emballe = ? WHERE ID = ?',
                [newQuantite, commandeId]
            );

            const [updated] = await connection.query(
                'SELECT * FROM commandes WHERE ID = ?',
                [commandeId]
            );

            let commandeTerminee = false;
            let affectationsResult = null;

            // Vérifier R2: Si Quantite_emballe >= Quantite_facturee, clôturer la commande
            if (limiteCible > 0 && newQuantite >= limiteCible) {
                commandeTerminee = true;

                // Mettre à jour le statut
                await connection.query(
                    'UPDATE commandes SET Statut = ?, Date_fin = NOW() WHERE ID = ?',
                    ['Terminée', commandeId]
                );

                // Récupérer à nouveau pour avoir le statut à jour
                const [finalCommande] = await connection.query(
                    'SELECT * FROM commandes WHERE ID = ?',
                    [commandeId]
                );
                updated[0] = finalCommande[0];

                // R3: Clôturer toutes les affectations en cours de cette commande
                affectationsResult = await affectationService.cloturerAffectationsCommande(
                    commandeId,
                    auditInfo,
                    user
                );
            }

            // Log audit
            this._logAuditAsync({
                ID_Utilisateur: user.id || null,
                Username: user.username || null,
                Action: 'UPDATE',
                Table_concernee: 'commandes',
                ID_Enregistrement: commandeId,
                Ancienne_valeur: oldValue,
                Nouvelle_valeur: updated[0],
                IP_address: auditInfo.IP_address || null,
                User_agent: auditInfo.User_agent || null
            });

            await connection.commit();

            return {
                success: true,
                data: updated[0],
                commandeTerminee,
                message: commandeTerminee
                    ? 'Commande automatiquement clôturée'
                    : 'Quantité emballée mise à jour',
                affectationsResult
            };
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('❌ Erreur rollback:', rollbackError);
                }
            }

            console.error('❌ Erreur dans updateQuantiteEmballe:', error);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.release();
                } catch (releaseError) {
                    console.error('❌ Erreur release:', releaseError);
                }
            }
        }
    }

    /**
     * Récupère une commande avec toutes ses affectations
     * 
     * @param {number} commandeId - ID de la commande
     * @returns {Promise<Object>} Commande avec affectations
     */
    async getCommandeWithAffectations(commandeId) {
        try {
            // Récupérer la commande
            const [commandes] = await db.query('SELECT * FROM commandes WHERE ID = ?', [commandeId]);

            if (commandes.length === 0) {
                return null;
            }

            const commande = commandes[0];

            // Récupérer les affectations
            const affectations = await affectationService.getAffectationsByCommande(commandeId);

            return {
                ...commande,
                affectations
            };
        } catch (error) {
            console.error('❌ Erreur dans getCommandeWithAffectations:', error);
            throw error;
        }
    }

    /**
     * Récupère les commandes en cours
     * 
     * @returns {Promise<Array>} Commandes non terminées
     */
    async getCommandesEnCours() {
        try {
            const [commandes] = await db.query(
                `SELECT c.*, a.Code_article, s.Code_semaine
         FROM commandes c
         LEFT JOIN articles a ON c.ID_Article = a.ID
         LEFT JOIN semaines s ON c.ID_Semaine = s.ID
         WHERE c.Statut != 'Terminée'
         ORDER BY c.Date_debut DESC`
            );

            return commandes;
        } catch (error) {
            console.error('❌ Erreur dans getCommandesEnCours:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques de production d'une commande
     * 
     * @param {number} commandeId - ID de la commande
     * @returns {Promise<Object>} Statistiques
     */
    async getStatistiquesCommande(commandeId) {
        try {
            const [stats] = await db.query(
                `SELECT 
           c.Quantite,
           COALESCE(pf.objectif_total, 0) as Quantite_facturee,
           COALESCE(c.Quantite_emballe, 0) as Quantite_emballe,
           COUNT(a.ID) as nb_affectations,
           SUM(CASE WHEN a.Statut = 'En cours' THEN 1 ELSE 0 END) as affectations_en_cours,
           SUM(CASE WHEN a.Statut = 'Clôturée' THEN 1 ELSE 0 END) as affectations_cloturees,
           SEC_TO_TIME(SUM(TIME_TO_SEC(a.Duree))) as duree_totale
         FROM commandes c
         LEFT JOIN (
           SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
           FROM planning_hebdo
           GROUP BY ID_Commande
         ) pf ON pf.ID_Commande = c.ID
         LEFT JOIN affectations a ON c.ID = a.ID_Commande
         WHERE c.ID = ?
         GROUP BY c.ID`,
                [commandeId]
            );

            return stats[0] || {};
        } catch (error) {
            console.error('❌ Erreur dans getStatistiquesCommande:', error);
            throw error;
        }
    }

    /**
     * Clôture une commande manuellement
     * 
     * @param {number} commandeId - ID de la commande
     * @param {Object} auditInfo - Infos audit
     * @param {Object} user - Utilisateur actuel
     * @returns {Promise<Object>} Résultat
     */
    async cloturerCommande(commandeId, auditInfo = {}, user = {}) {
        let connection = null;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Récupérer la commande
            const [existing] = await connection.query('SELECT * FROM commandes WHERE ID = ?', [
                commandeId
            ]);

            if (existing.length === 0) {
                throw new Error('Commande non trouvée');
            }

            const oldValue = existing[0];

            // Clôturer la commande
            await connection.query(
                'UPDATE commandes SET Statut = ?, Date_fin = NOW() WHERE ID = ?',
                ['Terminée', commandeId]
            );

            // Clôturer les affectations
            const [affectations] = await connection.query(
                `SELECT * FROM affectations
         WHERE ID_Commande = ? AND Date_fin IS NULL AND Statut NOT IN ('Clôturée', 'Annulée')`,
                [commandeId]
            );

            for (const affectation of affectations) {
                await connection.query(
                    `UPDATE affectations 
           SET Date_fin = NOW(), Statut = 'Clôturée', 
               Commentaire = CONCAT(COALESCE(Commentaire, ''), ' | Clôture manuelle')
           WHERE ID = ?`,
                    [affectation.ID]
                );
            }

            const [updated] = await connection.query('SELECT * FROM commandes WHERE ID = ?', [
                commandeId
            ]);

            // Log audit
            this._logAuditAsync({
                ID_Utilisateur: user.id || null,
                Username: user.username || null,
                Action: 'UPDATE',
                Table_concernee: 'commandes',
                ID_Enregistrement: commandeId,
                Ancienne_valeur: oldValue,
                Nouvelle_valeur: updated[0],
                IP_address: auditInfo.IP_address || null,
                User_agent: auditInfo.User_agent || null
            });

            await connection.commit();

            return {
                success: true,
                data: updated[0],
                affectationsCloturees: affectations.length,
                message: `Commande clôturée - ${affectations.length} affectation(s)`
            };
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('❌ Erreur rollback:', rollbackError);
                }
            }

            console.error('❌ Erreur dans cloturerCommande:', error);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.release();
                } catch (releaseError) {
                    console.error('❌ Erreur release:', releaseError);
                }
            }
        }
    }

    /**
     * Verifier si une commande doit etre cloturee apres production
     * Met a jour Quantite_produite a partir des affectations
     */
    async verifierEtCloturerSiTerminee(commandeId, req = null, connection = null) {
        let localConnection = connection;
        let ownConnection = false;
        try {
            if (!localConnection) {
                localConnection = await db.getConnection();
                ownConnection = true;
                await localConnection.beginTransaction();
            }

            const [commandeRows] = await localConnection.query(
                'SELECT * FROM commandes WHERE ID = ?',
                [commandeId]
            );
            if (commandeRows.length === 0) {
                throw new Error('Commande non trouvee');
            }

            const [sumRows] = await localConnection.query(
                'SELECT COALESCE(SUM(Quantite_produite), 0) as total_produit FROM affectations WHERE ID_Commande = ?',
                [commandeId]
            );
            const totalProduit = sumRows[0]?.total_produit || 0;

            await localConnection.query(
                'UPDATE commandes SET Quantite_produite = ? WHERE ID = ?',
                [totalProduit, commandeId]
            );

            let commandeTerminee = false;
            const commande = commandeRows[0];
            const [objectifRows] = await localConnection.query(
                `SELECT COALESCE(SUM(Quantite_facturee_semaine), 0) as objectif_total
                 FROM planning_hebdo
                 WHERE ID_Commande = ?`,
                [commandeId]
            );
            const objectifTotal = objectifRows[0]?.objectif_total || 0;
            const cibleCloture = objectifTotal > 0 ? objectifTotal : (commande.Quantite || 0);

            if (cibleCloture > 0 && totalProduit >= cibleCloture) {
                await localConnection.query(
                    'UPDATE commandes SET Statut = ?, Date_fin = NOW() WHERE ID = ?',
                    ['Terminée', commandeId]
                );
                commandeTerminee = true;
            }

            if (ownConnection) {
                await localConnection.commit();
            }

            return { commandeTerminee, totalProduit };
        } catch (error) {
            if (ownConnection && localConnection) {
                try { await localConnection.rollback(); } catch {}
            }
            console.error('Erreur verifierEtCloturerSiTerminee:', error);
            return { commandeTerminee: false, totalProduit: 0, error: error.message };
        } finally {
            if (ownConnection && localConnection) {
                try { await localConnection.release(); } catch {}
            }
        }
    }

    /**
     * Enregistre une action dans le log audit (asynchrone, sans bloquer)
     * 
     * @private
     * @param {Object} auditData - Données à enregistrer
     */
    _logAuditAsync(auditData) {
        logAction(auditData).catch(err => {
            console.error('❌ Audit log failed:', err);
        });
    }
}

module.exports = new CommandeService();
