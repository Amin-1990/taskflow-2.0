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
        `SELECT a.*,
                c.Code_article as Article_ref, 
                c.Lot as Numero_OF,
                art.Code_article as Article_nom,
                p.Nom_prenom as Operateur_nom,
                po.Description as Poste_nom
         FROM affectations a
         LEFT JOIN commandes c ON a.ID_Commande = c.ID
         LEFT JOIN articles art ON a.ID_Article = art.ID
         LEFT JOIN personnel p ON a.ID_Operateur = p.ID
         LEFT JOIN postes po ON a.ID_Poste = po.ID
         WHERE a.ID_Operateur = ? AND a.Date_fin IS NULL
         ORDER BY a.Date_debut DESC`,
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
        try { await connection.rollback(); } catch { }
      }
      console.error('Erreur cloturerAffectationsCommande:', error);
      throw error;
    } finally {
      if (connection) {
        try { await connection.release(); } catch { }
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
    let debut, fin;
    try {
      debut = new Date(dateDebut);
      fin = new Date(dateFin);

      // 1. Récupérer tous les horaires entre ces deux dates
      const debutStr = this._formatDateMySQL(debut);
      const finStr = this._formatDateMySQL(fin);

      const [horaires] = await connection.query(
        `SELECT Date, Heure_debut, Heure_fin, Pause_debut, Pause_fin, Heure_supp_debut, Heure_supp_fin, Est_ouvert, Est_jour_ferie
         FROM horaires
         WHERE Date >= ? AND Date <= ?
         ORDER BY Date ASC`,
        [debutStr, finStr]
      );

      if (horaires.length === 0) {
        // Fallback: calcul simple en secondes
        const diffMs = Math.max(0, fin.getTime() - debut.getTime());
        return Math.floor(diffMs / 1000);
      }

      let totalSeconds = 0;

      // 2. Parcourir chaque jour de l'intervalle
      for (const horaire of horaires) {
        // Ignorer les jours non ouvert ou fériés
        if (horaire.Est_ouvert === 0 || horaire.Est_jour_ferie === 1) {
          continue;
        }

        const dayDateStr = horaire.Date;

        // Plages de travail du jour
        const segments = [];

        // 1. Heures normales
        if (horaire.Heure_debut && horaire.Heure_fin) {
          segments.push({
            start: new Date(`${dayDateStr} ${horaire.Heure_debut}`),
            end: new Date(`${dayDateStr} ${horaire.Heure_fin}`),
            type: 'work'
          });
        }

        // 2. Heures supplémentaires
        if (horaire.Heure_supp_debut && horaire.Heure_supp_fin) {
          segments.push({
            start: new Date(`${dayDateStr} ${horaire.Heure_supp_debut}`),
            end: new Date(`${dayDateStr} ${horaire.Heure_supp_fin}`),
            type: 'work'
          });
        }

        // 3. Pause (à soustraire)
        const pauses = [];
        if (horaire.Pause_debut && horaire.Pause_fin) {
          pauses.push({
            start: new Date(`${dayDateStr} ${horaire.Pause_debut}`),
            end: new Date(`${dayDateStr} ${horaire.Pause_fin}`)
          });
        }

        let dayDurationMs = 0;

        // Calculer l'intersection avec chaque segment de travail
        for (const segment of segments) {
          const overlap = this._getOverlapMs(debut, fin, segment.start, segment.end);
          dayDurationMs += overlap;
        }

        // Soustraire les intersections avec les pauses (uniquement si dans [debut, fin])
        for (const pause of pauses) {
          const overlap = this._getOverlapMs(debut, fin, pause.start, pause.end);
          dayDurationMs -= overlap;
        }

        totalSeconds += Math.max(0, Math.floor(dayDurationMs / 1000));
      }

      return totalSeconds;

    } catch (error) {
      console.error('❌ Erreur dans calculateDurationWithHoraires:', error);
      // Fallback: calcul simple
      if (!debut || !fin || isNaN(debut.getTime()) || isNaN(fin.getTime())) {
        console.error('❌ Dates invalides - debut:', debut, 'fin:', fin);
        return 0;
      }
      const diffMs = Math.max(0, fin.getTime() - debut.getTime());
      return Math.floor(diffMs / 1000);
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

  /**
   * Calcule le chevauchement en millisecondes entre deux périodes
   */
  _getOverlapMs(start1, end1, start2, end2) {
    const s1 = start1.getTime();
    const e1 = end1.getTime();
    const s2 = start2.getTime();
    const e2 = end2.getTime();

    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);

    return Math.max(0, overlapEnd - overlapStart);
  }
}

module.exports = new AffectationService();
