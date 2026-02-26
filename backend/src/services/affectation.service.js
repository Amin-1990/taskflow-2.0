const db = require('../config/database');
const { logAction } = require('./audit.service');

class AffectationService {
  async createAffectation(affectationData, auditInfo = {}, user = {}) {
    try {
      const {
        ID_Operateur,
        ID_Commande,
        ID_Poste,
        ID_Article,
        ID_Semaine,
        Date_debut,
        Commentaire,
        Quantite_produite
      } = affectationData;

      if (!ID_Operateur || !ID_Commande || !ID_Poste || !ID_Article || !Date_debut) {
        throw new Error('ID_Operateur, ID_Commande, ID_Poste, ID_Article et Date_debut sont requis');
      }

      const [result] = await db.query(
        `INSERT INTO affectations (
          ID_Operateur, ID_Commande, ID_Poste, ID_Article, ID_Semaine,
          Date_debut, Quantite_produite, Commentaire, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ID_Operateur,
          ID_Commande,
          ID_Poste,
          ID_Article,
          ID_Semaine || null,
          Date_debut,
          Quantite_produite || null,
          Commentaire || null
        ]
      );

      const [affectation] = await db.query(
        'SELECT * FROM affectations WHERE ID = ?',
        [result.insertId]
      );

      this._logAuditAsync({
        ID_Utilisateur: user.id || null,
        Username: user.username || null,
        Action: 'CREATE',
        Table_concernee: 'affectations',
        ID_Enregistrement: result.insertId,
        Ancienne_valeur: null,
        Nouvelle_valeur: affectation[0],
        IP_address: auditInfo.IP_address || null,
        User_agent: auditInfo.User_agent || null
      });

      return {
        success: true,
        data: affectation[0],
        message: 'Affectation creee avec succes'
      };
    } catch (error) {
      console.error('Erreur createAffectation:', error);
      throw error;
    }
  }

  async cloturerAffectation(affectationId, dateFin, dureeSeconds, auditInfo = {}, user = {}, connection = null) {
    const useConnection = connection || db;
    try {
      const [existing] = await useConnection.query(
        'SELECT * FROM affectations WHERE ID = ?',
        [affectationId]
      );

      if (existing.length === 0) {
        throw new Error('Affectation non trouvee');
      }

      const oldValue = existing[0];

      // Calculer la durée en minutes avec horaires, pauses et jours fériés
      const dureeMinutes = await this.calculateDurationWithHoraires(
        useConnection,
        new Date(oldValue.Date_debut),
        new Date(dateFin)
      );

      await useConnection.query(
        `UPDATE affectations
         SET Date_fin = ?, Duree = ?, Date_modification = NOW()
         WHERE ID = ?`,
        [dateFin, dureeMinutes, affectationId]
      );

      const [updated] = await useConnection.query(
        'SELECT * FROM affectations WHERE ID = ?',
        [affectationId]
      );

      this._logAuditAsync({
        ID_Utilisateur: user.id || null,
        Username: user.username || null,
        Action: 'UPDATE',
        Table_concernee: 'affectations',
        ID_Enregistrement: affectationId,
        Ancienne_valeur: oldValue,
        Nouvelle_valeur: updated[0],
        IP_address: auditInfo.IP_address || null,
        User_agent: auditInfo.User_agent || null
      });

      return {
        success: true,
        data: updated[0],
        message: 'Affectation cloturee avec succes'
      };
    } catch (error) {
      console.error('Erreur cloturerAffectation:', error);
      throw error;
    }
  }

  async getAffectationsEnCours(operateurId) {
    try {
      console.log('🔍 [getAffectationsEnCours] Requête SQL avec ID_Operateur =', operateurId);
      const [affectations] = await db.query(
        `SELECT * FROM affectations
         WHERE ID_Operateur = ? AND Date_fin IS NULL
         ORDER BY Date_debut DESC`,
        [operateurId]
      );
      console.log('🔍 [getAffectationsEnCours] Résultat SQL: ', affectations.length, 'affectations trouvées');
      if (affectations.length > 0) {
        console.log('🔍 [getAffectationsEnCours] Première affectation:', JSON.stringify(affectations[0], null, 2));
      }
      return affectations;
    } catch (error) {
      console.error('Erreur getAffectationsEnCours:', error);
      throw error;
    }
  }

  async getAffectationsByCommande(commandeId) {
    try {
      const [affectations] = await db.query(
        `SELECT a.*, p.Nom_prenom, p.Matricule
         FROM affectations a
         LEFT JOIN personnel p ON a.ID_Operateur = p.ID
         WHERE a.ID_Commande = ?
         ORDER BY a.Date_debut DESC`,
        [commandeId]
      );
      return affectations;
    } catch (error) {
      console.error('Erreur getAffectationsByCommande:', error);
      throw error;
    }
  }

  async getAffectationById(affectationId) {
    try {
      const [affectations] = await db.query(
        `SELECT a.*, p.Nom_prenom, p.Matricule
         FROM affectations a
         LEFT JOIN personnel p ON a.ID_Operateur = p.ID
         WHERE a.ID = ?`,
        [affectationId]
      );
      return affectations.length > 0 ? affectations[0] : null;
    } catch (error) {
      console.error('Erreur getAffectationById:', error);
      throw error;
    }
  }

  async cloturerAffectationsCommande(commandeId, auditInfo = {}, user = {}) {
    let connection = null;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [affectations] = await connection.query(
        `SELECT * FROM affectations
         WHERE ID_Commande = ? AND Date_fin IS NULL`,
        [commandeId]
      );

      let affectationsCloturees = 0;

      for (const affectation of affectations) {
        const [oldValue] = await connection.query(
          'SELECT * FROM affectations WHERE ID = ?',
          [affectation.ID]
        );

        const now = new Date();
        // Calculer la durée en minutes avec horaires, pauses et jours fériés
        const dureeMinutes = await this.calculateDurationWithHoraires(
          connection,
          new Date(affectation.Date_debut),
          now
        );

        await connection.query(
          `UPDATE affectations
           SET Date_fin = NOW(), Duree = ?,
               Commentaire = CONCAT(COALESCE(Commentaire, ''), ' | Cloture auto - Commande terminee'),
               Date_modification = NOW()
           WHERE ID = ?`,
          [dureeMinutes, affectation.ID]
        );

        const [newValue] = await connection.query(
          'SELECT * FROM affectations WHERE ID = ?',
          [affectation.ID]
        );

        this._logAuditAsync({
          ID_Utilisateur: user.id || null,
          Username: user.username || null,
          Action: 'UPDATE',
          Table_concernee: 'affectations',
          ID_Enregistrement: affectation.ID,
          Ancienne_valeur: oldValue[0],
          Nouvelle_valeur: newValue[0],
          IP_address: auditInfo.IP_address || null,
          User_agent: auditInfo.User_agent || null
        });

        affectationsCloturees++;
      }

      await connection.commit();

      return {
        success: true,
        message: `${affectationsCloturees} affectation(s) cloturee(s)`,
        affectationsCloturees
      };
    } catch (error) {
      if (connection) {
        try { await connection.rollback(); } catch {}
      }
      console.error('Erreur cloturerAffectationsCommande:', error);
      throw error;
    } finally {
      if (connection) {
        try { await connection.release(); } catch {}
      }
    }
  }

  _logAuditAsync(auditData) {
    logAction(auditData).catch((err) => {
      console.error('Audit log failed:', err);
    });
  }

  /**
   * Calcule la durée d'une affectation en prenant en compte:
   * - Les horaires de travail (table horaires)
   * - Les pauses (table pauses)
   * - Les jours non travaillés / fériés
   * 
   * @param {Object} connection - Connexion MySQL
   * @param {Date|string} dateDebut - Début de l'affectation
   * @param {Date|string} dateFin - Fin de l'affectation
   * @returns {Promise<number>} Durée en minutes
   */
  async calculateDurationWithHoraires(connection, dateDebut, dateFin) {
    try {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);

      // 1. Récupérer tous les horaires entre ces deux dates
      const debutStr = this._formatDateMySQL(debut);
      const finStr = this._formatDateMySQL(fin);

      const [horaires] = await connection.query(
        `SELECT Date, Heure_debut, Heure_fin, Est_ouvert, Est_jour_ferie
         FROM horaires
         WHERE Date >= ? AND Date <= ?
         ORDER BY Date ASC`,
        [debutStr, finStr]
      );

      if (horaires.length === 0) {
        // Fallback: calcul simple en minutes
        const diffMs = Math.max(0, fin.getTime() - debut.getTime());
        return Math.floor(diffMs / (1000 * 60));
      }

      let totalMinutes = 0;

      // 2. Parcourir chaque jour de l'intervalle
      for (const horaire of horaires) {
        // Ignorer les jours non ouvert ou fériés
        if (horaire.Est_ouvert === 0 || horaire.Est_jour_ferie === 1) {
          continue;
        }

        const dayDate = new Date(horaire.Date);
        const horaireDebut = new Date(`${horaire.Date} ${horaire.Heure_debut}`);
        const horaireFin = new Date(`${horaire.Date} ${horaire.Heure_fin}`);

        // Déterminer l'heure réelle de début/fin pour ce jour
        let dayStart = horaireDebut;
        let dayEnd = horaireFin;

        // Si c'est le premier jour, utiliser l'heure de début de l'affectation
        if (this._isSameDay(debut, dayDate)) {
          dayStart = new Date(Math.max(debut.getTime(), horaireDebut.getTime()));
        }

        // Si c'est le dernier jour, utiliser l'heure de fin de l'affectation
        if (this._isSameDay(fin, dayDate)) {
          dayEnd = new Date(Math.min(fin.getTime(), horaireFin.getTime()));
        }

        if (dayEnd <= dayStart) continue;

        // 3. Récupérer les pauses pour ce jour
        const dayDateStr = horaire.Date;
        const [pauses] = await connection.query(
          `SELECT Heure_debut, Heure_fin FROM pauses
           WHERE Date = ?`,
          [dayDateStr]
        );

        // Calculer la durée brute du jour
        let dayDurationMs = dayEnd.getTime() - dayStart.getTime();

        // 4. Soustraire les pauses qui chevauchent
        for (const pause of pauses) {
          const pauseDebut = new Date(`${dayDateStr} ${pause.Heure_debut}`);
          const pauseFin = new Date(`${dayDateStr} ${pause.Heure_fin}`);

          // Calculer le chevauchement entre [dayStart, dayEnd] et [pauseDebut, pauseFin]
          const overlapStart = Math.max(dayStart.getTime(), pauseDebut.getTime());
          const overlapEnd = Math.min(dayEnd.getTime(), pauseFin.getTime());

          if (overlapEnd > overlapStart) {
            dayDurationMs -= (overlapEnd - overlapStart);
          }
        }

        totalMinutes += Math.max(0, Math.floor(dayDurationMs / (1000 * 60)));
      }

      return totalMinutes;

    } catch (error) {
      console.error('❌ Erreur dans calculateDurationWithHoraires:', error);
      // Fallback: calcul simple
      const diffMs = Math.max(0, fin.getTime() - debut.getTime());
      return Math.floor(diffMs / (1000 * 60));
    }
  }

  /**
   * Formule simple de durée en secondes (fallback)
   */
  _calculateDurationSeconds(debut, fin) {
    const diff = Math.max(0, (fin.getTime() - debut.getTime()) / 1000);
    return Math.floor(diff);
  }

  /**
   * Vérifie si deux dates sont le même jour
   */
  _isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate();
  }

  /**
   * Formate une date au format MySQL (YYYY-MM-DD)
   */
  _formatDateMySQL(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async terminerAffectation(affectationId, quantiteProduite, connection) {
    const now = new Date();
    const [existing] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [affectationId]
    );
    if (existing.length === 0) {
      throw new Error('Affectation non trouvee');
    }

    // Calculer la durée en minutes avec horaires, pauses et jours fériés
    const dureeMinutes = await this.calculateDurationWithHoraires(
      connection,
      new Date(existing[0].Date_debut),
      now
    );

    await connection.query(
      `UPDATE affectations
       SET Date_fin = ?, Duree = ?, Quantite_produite = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [now, dureeMinutes, quantiteProduite, affectationId]
    );

    const [updated] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [affectationId]
    );
    return updated[0];
  }
}

module.exports = new AffectationService();
