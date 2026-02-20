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

  async cloturerAffectation(affectationId, dateFin, dureeSeconds, auditInfo = {}, user = {}) {
    try {
      const [existing] = await db.query(
        'SELECT * FROM affectations WHERE ID = ?',
        [affectationId]
      );

      if (existing.length === 0) {
        throw new Error('Affectation non trouvee');
      }

      const oldValue = existing[0];

      await db.query(
        `UPDATE affectations
         SET Date_fin = ?, Duree = ?, Date_modification = NOW()
         WHERE ID = ?`,
        [dateFin, dureeSeconds, affectationId]
      );

      const [updated] = await db.query(
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
      const [affectations] = await db.query(
        `SELECT * FROM affectations
         WHERE ID_Operateur = ? AND Date_fin IS NULL
         ORDER BY Date_debut DESC`,
        [operateurId]
      );
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
        const dureeSeconds = this._calculateDurationSeconds(
          new Date(affectation.Date_debut),
          now
        );

        await connection.query(
          `UPDATE affectations
           SET Date_fin = NOW(), Duree = ?,
               Commentaire = CONCAT(COALESCE(Commentaire, ''), ' | Cloture auto - Commande terminee'),
               Date_modification = NOW()
           WHERE ID = ?`,
          [dureeSeconds, affectation.ID]
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

  _calculateDurationSeconds(debut, fin) {
    const diff = Math.max(0, (fin.getTime() - debut.getTime()) / 1000);
    return Math.floor(diff);
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

    const dureeSeconds = this._calculateDurationSeconds(new Date(existing[0].Date_debut), now);

    await connection.query(
      `UPDATE affectations
       SET Date_fin = ?, Duree = ?, Quantite_produite = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [now, dureeSeconds, quantiteProduite, affectationId]
    );

    const [updated] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [affectationId]
    );
    return updated[0];
  }
}

module.exports = new AffectationService();
