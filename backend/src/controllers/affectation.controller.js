const db = require('../config/database');
const affectationService = require('../services/affectation.service');
const commandeService = require('../services/commande.service');
const { logAction } = require('../services/audit.service');

exports.createAffectation = async (req, res) => {
  try {
    let {
      ID_Commande,
      ID_Operateur,
      ID_Poste,
      ID_Article,
      ID_Semaine,
      Date_debut,
      Commentaire,
      Quantite_produite
    } = req.body;

    // Validation des champs obligatoires (ID_Commande peut être déterminé automatiquement)
    if (!ID_Operateur || !ID_Poste || !ID_Article) {
      return res.status(400).json({
        success: false,
        error: 'Operateur, poste et article sont requis'
      });
    }

    // Si ID_Commande non fourni, le déduire depuis la combinaison Article + Semaine + Unité
    if (!ID_Commande) {
      // Récupérer l'unite_production depuis le context ou depuis ID_Article
      const [articleRows] = await db.query(
        'SELECT c.ID, c.Unite_production FROM commandes c WHERE c.ID_Article = ? AND c.ID_Semaine = ? LIMIT 1',
        [ID_Article, ID_Semaine]
      );

      if (articleRows.length > 0) {
        ID_Commande = articleRows[0].ID;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Commande non trouvée pour cette combinaison Article/Semaine'
        });
      }
    }

    const affectationsEnCours = await affectationService.getAffectationsEnCours(ID_Operateur);
    if (affectationsEnCours.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cet operateur a deja une affectation en cours',
        affectationEnCours: affectationsEnCours[0]
      });
    }

    const nouvelleAffectation = await affectationService.createAffectation({
      ID_Commande,
      ID_Operateur,
      ID_Poste,
      ID_Article,
      ID_Semaine: ID_Semaine || null,
      Date_debut: Date_debut || new Date(),
      Commentaire,
      Quantite_produite: Quantite_produite || null
    });

    await logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'CREATE',
      Table_concernee: 'affectations',
      ID_Enregistrement: nouvelleAffectation.data?.ID,
      Nouvelle_valeur: nouvelleAffectation,
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Affectation creee avec succes',
      data: nouvelleAffectation.data || nouvelleAffectation
    });
  } catch (error) {
    console.error('Erreur createAffectation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAffectationsEnCoursByOperateur = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 [getAffectationsEnCoursByOperateur] ID_Operateur reçu:', id);
    const affectations = await affectationService.getAffectationsEnCours(id);
    console.log('🔍 [getAffectationsEnCoursByOperateur] Affectations trouvées:', affectations.length);

    // Si une seule affectation, retourner l'objet directement
    if (affectations.length === 1) {
      res.json({
        success: true,
        count: 1,
        data: affectations[0]  // Objet unique, pas de tableau
      });
    } else if (affectations.length === 0) {
      res.json({
        success: true,
        count: 0,
        data: null  // null au lieu de tableau vide
      });
    } else {
      // Plusieurs affectations (ne devrait pas arriver normalement)
      res.json({
        success: true,
        count: affectations.length,
        data: affectations[0]  // Retourner la première
      });
    }
  } catch (error) {
    console.error('Erreur getAffectationsEnCoursByOperateur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAffectationsByCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const affectations = await affectationService.getAffectationsByCommande(id);
    res.json({
      success: true,
      count: affectations.length,
      data: affectations
    });
  } catch (error) {
    console.error('Erreur getAffectationsByCommande:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.terminerAffectation = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { quantite_produite } = req.body;

    if (!quantite_produite || quantite_produite <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La quantite produite est requise et doit etre positive'
      });
    }

    const [affectation] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    if (affectation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affectation non trouvee'
      });
    }

    const affectationTerminee = await affectationService.terminerAffectation(
      id,
      quantite_produite,
      connection
    );

    const commandeTerminee = await commandeService.verifierEtCloturerSiTerminee(
      affectation[0].ID_Commande,
      req,
      connection
    );

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'UPDATE',
      Table_concernee: 'affectations',
      ID_Enregistrement: id,
      Ancienne_valeur: affectation[0],
      Nouvelle_valeur: affectationTerminee,
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Affectation terminee avec succes',
      data: {
        affectation: affectationTerminee,
        commandeTerminee: commandeTerminee
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur terminerAffectation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.ajouterHeuresSupp = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { heures } = req.body;

    if (!heures || heures <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le nombre d heures supplementaires doit etre positif'
      });
    }

    const [affectation] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    if (affectation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affectation non trouvee'
      });
    }

    await connection.query(
      `UPDATE affectations
       SET Heure_supp = COALESCE(Heure_supp, 0) + ?,
           Commentaire = CONCAT(IFNULL(Commentaire,''), ' | +', ?, 'h supp manuelles')
       WHERE ID = ?`,
      [heures, heures, id]
    );

    const [affectationModifiee] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'UPDATE',
      Table_concernee: 'affectations',
      ID_Enregistrement: id,
      Ancienne_valeur: affectation[0],
      Nouvelle_valeur: affectationModifiee[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `${heures} heure(s) supplementaire(s) ajoutee(s)`,
      data: affectationModifiee[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur ajouterHeuresSupp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.updateAffectation = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const allowedFields = [
      'ID_Commande',
      'ID_Operateur',
      'ID_Poste',
      'ID_Article',
      'ID_Semaine',
      'Date_debut',
      'Date_fin',
      'Duree',
      'Heure_supp',
      'Quantite_produite',
      'Commentaire',
    ];

    const entries = Object.entries(req.body || {}).filter(([key, value]) => (
      allowedFields.includes(key) && value !== undefined
    ));

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun champ valide a mettre a jour'
      });
    }

    const [existing] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affectation non trouvee'
      });
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    await connection.query(
      `UPDATE affectations
       SET ${setClause}, Date_modification = NOW()
       WHERE ID = ?`,
      [...values, id]
    );

    const [updated] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'UPDATE',
      Table_concernee: 'affectations',
      ID_Enregistrement: id,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: updated[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Affectation mise a jour avec succes',
      data: updated[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur updateAffectation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.getAllAffectations = async (req, res) => {
  try {
    const { operateurId, commandeId, enCours, dateDebut, dateFin } = req.query;

    let query = `
      SELECT a.*,
             c.Code_article, c.Lot,
             p.Nom_prenom as Operateur_nom,
             po.Description as Poste_nom
      FROM affectations a
      LEFT JOIN commandes c ON a.ID_Commande = c.ID
      LEFT JOIN personnel p ON a.ID_Operateur = p.ID
      LEFT JOIN postes po ON a.ID_Poste = po.ID
      WHERE 1=1
    `;
    const params = [];

    if (operateurId) {
      query += ' AND a.ID_Operateur = ?';
      params.push(operateurId);
    }
    if (commandeId) {
      query += ' AND a.ID_Commande = ?';
      params.push(commandeId);
    }
    if (enCours === 'true') {
      query += ' AND a.Date_fin IS NULL';
    }
    if (dateDebut && dateFin) {
      query += ' AND DATE(a.Date_debut) BETWEEN ? AND ?';
      params.push(dateDebut, dateFin);
    }

    query += ' ORDER BY a.Date_debut DESC';

    const [affectations] = await db.query(query, params);

    res.json({
      success: true,
      count: affectations.length,
      data: affectations
    });
  } catch (error) {
    console.error('Erreur getAllAffectations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAffectationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [affectations] = await db.query(
      `SELECT a.*,
              c.Code_article, c.Lot,
              p.Nom_prenom as Operateur_nom,
              po.Description as Poste_nom
       FROM affectations a
       LEFT JOIN commandes c ON a.ID_Commande = c.ID
       LEFT JOIN personnel p ON a.ID_Operateur = p.ID
       LEFT JOIN postes po ON a.ID_Poste = po.ID
       WHERE a.ID = ?`,
      [id]
    );

    if (affectations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affectation non trouvee'
      });
    }

    res.json({
      success: true,
      data: affectations[0]
    });
  } catch (error) {
    console.error('Erreur getAffectationById:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteAffectation = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const [affectation] = await connection.query(
      'SELECT * FROM affectations WHERE ID = ?',
      [id]
    );

    if (affectation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affectation non trouvee'
      });
    }

    await connection.query('DELETE FROM affectations WHERE ID = ?', [id]);
    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'DELETE',
      Table_concernee: 'affectations',
      ID_Enregistrement: id,
      Ancienne_valeur: affectation[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Affectation supprimee avec succes'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur deleteAffectation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
};
exports.calculerDuree = async (req, res) => {
  try {
    const { debut, fin } = req.query;

    if (!debut || !fin) {
      return res.status(400).json({
        success: false,
        error: 'Les dates de debut et de fin sont requises'
      });
    }

    const dureeMinutes = await affectationService.calculateDurationWithHoraires(
      db,
      debut,
      fin
    );

    res.json({
      success: true,
      data: {
        duree: dureeMinutes
      }
    });
  } catch (error) {
    console.error('Erreur calculerDuree:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
