const db = require('../config/database');
const { logAction } = require('./audit.service');

/**
 * Service de gestion des pointages et des absences
 * Gère la logique métier des absences et la clôture des affectations
 */
class PointageService {
    /**
     * Traite une absence : clôture les affectations en cours d'un personnel
     * Exécuté en transaction pour garantir l'intégrité des données
     * 
     * @param {number} pointageId - ID du pointage créé
     * @param {Object} auditInfo - Infos audit (IP, User-Agent)
     * @param {Object} user - Utilisateur actuel (ID et username)
     * @returns {Promise<Object>} Résultat de l'opération
     */
    async gererAbsence(pointageId, auditInfo = {}, user = {}) {
        let connection = null;
        try {
            // Récupérer la connexion pour les transactions
            connection = await db.getConnection();

            // 1. Récupérer le pointage avec absence = TRUE
            const [pointages] = await connection.query(
                `SELECT ID, ID_Personnel, Date, Absent, Commentaire
         FROM pointage
         WHERE ID = ? AND Absent = 1`,
                [pointageId]
            );

            if (pointages.length === 0) {
                return { success: false, message: 'Pointage non trouvé ou non absent' };
            }

            const pointage = pointages[0];
            const { ID_Personnel, Date: dateAbsence } = pointage;

            // 2. Démarrer la transaction
            await connection.beginTransaction();

            // 3. Récupérer toutes les affectations EN COURS de ce personnel
            const [affectations] = await connection.query(
                `SELECT ID, Date_debut, Date_fin, Duree, Commentaire, ID_Commande
         FROM affectations
         WHERE ID_Operateur = ? AND Date_fin IS NULL`,
                [ID_Personnel]
            );

            if (affectations.length === 0) {
                // Pas d'affectation en cours, transaction vide mais valide
                await connection.commit();
                return {
                    success: true,
                    message: 'Absence signalée - Aucune affectation à clôturer',
                    affectationsCloturees: 0
                };
            }

            // 4. Pour chaque affectation, appeler cloturerPourAbsence
            let affectationsCloturees = 0;
            for (const affectation of affectations) {
                const result = await this._cloturerPourAbsence(
                    connection,
                    affectation,
                    dateAbsence,
                    auditInfo,
                    user
                );

                if (result.success) {
                    affectationsCloturees++;
                }
            }

            // 5. Valider la transaction
            await connection.commit();

            return {
                success: true,
                message: `Absence signalée - ${affectationsCloturees} affectation(s) clôturée(s)`,
                affectationsCloturees,
                dateAbsence
            };

        } catch (error) {
            // Rollback en cas d'erreur
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('❌ Erreur lors du rollback:', rollbackError);
                }
            }

            console.error('❌ Erreur dans gererAbsence:', error);
            throw error;

        } finally {
            // Libérer la connexion
            if (connection) {
                try {
                    await connection.release();
                } catch (releaseError) {
                    console.error('❌ Erreur lors de la libération de la connexion:', releaseError);
                }
            }
        }
    }

    /**
     * Clôture une affectation suite à une absence (méthode interne)
     * 
     * @private
     * @param {Object} connection - Connexion MySQL pour transaction
     * @param {Object} affectation - Données de l'affectation
     * @param {Date} dateAbsence - Date de l'absence
     * @param {Object} auditInfo - Infos audit
     * @param {Object} user - Utilisateur actuel
     * @returns {Promise<Object>} Résultat de la clôture
     */
    async _cloturerPourAbsence(connection, affectation, dateAbsence, auditInfo = {}, user = {}) {
        try {
            const { ID, Date_debut, Commentaire, ID_Commande } = affectation;

            // 1. Calculer le dernier jour travaillé (jour précédent l'absence)
            const lastWorkingDate = new Date(dateAbsence);
            lastWorkingDate.setDate(lastWorkingDate.getDate() - 1);

            // 2. Récupérer l'heure de fin du dernier jour travaillé
            let heureFinJour = await this._getHeureFinJour(connection, lastWorkingDate);

            if (!heureFinJour) {
                console.warn(`⚠️  Aucun horaire trouvé pour ${lastWorkingDate.toISOString().split('T')[0]}`);
                // Utiliser un horaire par défaut (17h00)
                heureFinJour = '17:00:00';
            }

            // 3. Construire la date_fin complète
            const dateFinStr = this._formatDateTimeMySQL(lastWorkingDate, heureFinJour);
            const dateFin = new Date(dateFinStr);

            // 4. Calculer la durée jusqu'à cette date
            const duree = await this._calculerDuree(connection, Date_debut, dateFin);

            // 5. Construire le commentaire
            const commentaireAbsence = `Clôture auto - Absent le ${this._formatDateFrench(dateAbsence)}`;
            const nouveauCommentaire = Commentaire
                ? `${Commentaire} | ${commentaireAbsence}`
                : commentaireAbsence;

            // Récupérer l'ancienne valeur avant modification
            const [existingAffectation] = await connection.query(
                `SELECT * FROM affectations WHERE ID = ?`,
                [ID]
            );
            const oldValue = existingAffectation[0];

            // 6. Mettre à jour l'affectation
            await connection.query(
                `UPDATE affectations 
         SET Date_fin = ?, Duree = ?, Commentaire = ?, Statut = 'Clôturée', Date_modification = NOW()
         WHERE ID = ?`,
                [dateFinStr, duree, nouveauCommentaire, ID]
            );

            // Récupérer la nouvelle valeur après modification
            const [updatedAffectation] = await connection.query(
                `SELECT * FROM affectations WHERE ID = ?`,
                [ID]
            );

            // 7. Log audit (sans bloquer si erreur)
            this._logAuditAsync({
                ID_Utilisateur: user.id || null,
                Username: user.username || null,
                Action: 'UPDATE',
                Table_concernee: 'affectations',
                ID_Enregistrement: ID,
                Ancienne_valeur: oldValue,
                Nouvelle_valeur: updatedAffectation[0],
                IP_address: auditInfo.IP_address || null,
                User_agent: auditInfo.User_agent || null
            });

            return {
                success: true,
                affectationId: ID,
                dateFin: dateFinStr,
                duree
            };

        } catch (error) {
            console.error('❌ Erreur dans _cloturerPourAbsence:', error);
            return {
                success: false,
                affectationId: affectation.ID,
                error: error.message
            };
        }
    }

    /**
     * Récupère l'heure de fin d'une journée donnée depuis la table horaires
     * 
     * @private
     * @param {Object} connection - Connexion MySQL
     * @param {Date} date - Date à vérifier
     * @returns {Promise<string|null>} Heure au format HH:MM:SS ou null
     */
    async _getHeureFinJour(connection, date) {
        try {
            const dateStr = this._formatDateMySQL(date);

            const [horaires] = await connection.query(
                `SELECT Heure_fin FROM horaires WHERE Date = ?`,
                [dateStr]
            );

            if (horaires.length > 0) {
                return horaires[0].Heure_fin;
            }

            return null;

        } catch (error) {
            console.error('❌ Erreur dans _getHeureFinJour:', error);
            return null;
        }
    }

    /**
     * Calcule la durée d'une affectation entre deux dates
     * Soustrait les pauses présentes dans l'intervalle
     * 
     * @private
     * @param {Object} connection - Connexion MySQL
     * @param {Date|string} dateDebut - Date/heure de début
     * @param {Date|string} dateFin - Date/heure de fin
     * @returns {Promise<string>} Durée au format HH:MM:SS
     */
    async _calculerDuree(connection, dateDebut, dateFin) {
        try {
            // Normaliser les dates
            const debut = new Date(dateDebut);
            const fin = new Date(dateFin);

            // Calcul brut en millisecondes
            let durationMs = fin.getTime() - debut.getTime();

            // Récupérer les pauses dans cet intervalle
            const debutStr = this._formatDateTimeMySQL(debut);
            const finStr = this._formatDateTimeMySQL(fin);

            const [pauses] = await connection.query(
                `SELECT Heure_debut, Heure_fin FROM pauses
         WHERE Date >= DATE(?) AND Date <= DATE(?)
         AND Heure_debut >= TIME(?) AND Heure_fin <= TIME(?)`,
                [debutStr, finStr, this._extractTime(debutStr), this._extractTime(finStr)]
            );

            // Soustraire les pauses
            for (const pause of pauses) {
                // Note: Pour simplifier, on suppose les pauses sans date
                // Adapter selon votre structure réelle
                const pauseDebut = new Date(`2000-01-01T${pause.Heure_debut}`);
                const pauseFin = new Date(`2000-01-01T${pause.Heure_fin}`);
                const pauseMs = pauseFin.getTime() - pauseDebut.getTime();
                durationMs -= pauseMs;
            }

            // Convertir en secondes puis en HH:MM:SS
            const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        } catch (error) {
            console.error('❌ Erreur dans _calculerDuree:', error);
            // Retourner une durée par défaut en cas d'erreur
            return '00:00:00';
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

    /**
     * Formate une date au format MySQL (YYYY-MM-DD)
     * 
     * @private
     * @param {Date} date - Date à formater
     * @returns {string} Date au format YYYY-MM-DD
     */
    _formatDateMySQL(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formate une date-heure au format MySQL (YYYY-MM-DD HH:MM:SS)
     * 
     * @private
     * @param {Date} date - Date à formater
     * @param {string} time - Heure optionnelle au format HH:MM:SS
     * @returns {string} DateTime au format YYYY-MM-DD HH:MM:SS
     */
    _formatDateTimeMySQL(date, time = null) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        if (time) {
            return `${year}-${month}-${day} ${time}`;
        }

        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    /**
     * Extrait l'heure d'une chaîne YYYY-MM-DD HH:MM:SS
     * 
     * @private
     * @param {string} dateTimeStr - DateTime au format MySQL
     * @returns {string} Heure au format HH:MM:SS
     */
    _extractTime(dateTimeStr) {
        const parts = dateTimeStr.split(' ');
        return parts.length > 1 ? parts[1] : '00:00:00';
    }

    /**
     * Formate une date au format français lisible (DD/MM/YYYY)
     * 
     * @private
     * @param {Date|string} date - Date à formater
     * @returns {string} Date au format DD/MM/YYYY
     */
    _formatDateFrench(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

module.exports = new PointageService();
