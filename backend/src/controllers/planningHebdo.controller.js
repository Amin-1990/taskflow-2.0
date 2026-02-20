const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

const toYmd = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/planning/semaine - Récupérer planning par numero_semaine + annee (query params)
exports.getPlanningBySemaineParams = async (req, res) => {
  try {
    const { numero_semaine, annee } = req.query;

    // Validations
    if (!numero_semaine || !annee) {
      return res.status(400).json({
        success: false,
        error: 'Erreurs de validation',
        details: [
          { field: 'numero_semaine', message: 'numero_semaine requis' },
          { field: 'annee', message: 'annee requis' }
        ]
      });
    }

    // Trouver la semaine par numero et annee
    const [semaines] = await db.query(
      'SELECT ID FROM semaines WHERE Numero_semaine = ? AND Annee = ? LIMIT 1',
      [parseInt(numero_semaine), parseInt(annee)]
    );

    if (semaines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Semaine non trouvée'
      });
    }

    const semaineId = semaines[0].ID;

    // Récupérer le planning pour cette semaine
    const [rows] = await db.query(`
      SELECT p.*,
             s.Numero_semaine, s.Annee, s.Code_semaine,
             c.Code_article, c.Lot, c.Quantite,
             a.Client
      FROM planning_hebdo p
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      LEFT JOIN articles a ON c.ID_Article = a.ID
      WHERE p.ID_Semaine_planifiee = ?
      ORDER BY c.Code_article
    `, [semaineId]);

    // Si aucun planning, retourner une réponse valide sans ID
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          id: null,
          numero_semaine: parseInt(numero_semaine),
          annee: parseInt(annee),
          statut: null,
          est_valide: false,
          erreurs: ['Aucun planning trouvé pour cette semaine'],
          charge_totale: 0,
          commandes_planifiees: 0,
          notes: null,
          jours: [],
          plannings: []
        }
      });
    }

    // Transformer en structure Planning complète
    const planning = {
      id: rows[0].ID, // Ajouter l'ID du premier planning
      numero_semaine: parseInt(numero_semaine),
      annee: parseInt(annee),
      statut: 'brouillon', // Défaut
      est_valide: true,
      erreurs: [],
      charge_totale: 0,
      commandes_planifiees: rows.length,
      notes: null,
      jours: [], // À implémenter si besoin
      plannings: rows // Garder aussi pour compat
    };

    res.json({
      success: true,
      data: planning
    });
  } catch (error) {
    console.error('Erreur getPlanningBySemaineParams:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du planning'
    });
  }
};

// GET /api/planning/semaines-annee - Récupérer infos semaines d'une année
// GET /api/planning/grille/semaine - Vue consolidee hebdo (grille unique)
exports.getPlanningGrilleSemaine = async (req, res) => {
  try {
    const { numero_semaine, annee, unite_production } = req.query;

    if (!numero_semaine || !annee) {
      return res.status(400).json({
        success: false,
        error: 'numero_semaine et annee sont requis'
      });
    }

    const numeroSemaine = parseInt(numero_semaine, 10);
    const anneeValue = parseInt(annee, 10);

    if (Number.isNaN(numeroSemaine) || Number.isNaN(anneeValue)) {
      return res.status(400).json({
        success: false,
        error: 'numero_semaine et annee doivent etre numeriques'
      });
    }

    const [semaines] = await db.query(
      `SELECT ID, Numero_semaine, Annee, Code_semaine, Date_debut, Date_fin
       FROM semaines
       WHERE Numero_semaine = ? AND Annee = ?
       LIMIT 1`,
      [numeroSemaine, anneeValue]
    );

    if (semaines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Semaine non trouvee'
      });
    }

    const semaine = semaines[0];
    const params = [semaine.ID];
    let uniteFilterSql = '';

    if (unite_production && String(unite_production).trim() !== '') {
      uniteFilterSql = ' AND c.Unite_production = ?';
      params.push(String(unite_production).trim());
    }

    const [rows] = await db.query(
      `SELECT
        p.ID,
        p.ID_Semaine_planifiee,
        p.ID_Semaine_precedente,
        p.Date_debut_planification,
        p.ID_Commande,
        p.Identifiant_lot,
        p.Quantite_facturee_semaine,
        p.Stock_actuel,
        p.Stock_embale_precedent,
        p.Lundi_planifie,
        p.Lundi_emballe,
        p.Mardi_planifie,
        p.Mardi_emballe,
        p.Mercredi_planifie,
        p.Mercredi_emballe,
        p.Jeudi_planifie,
        p.Jeudi_emballe,
        p.Vendredi_planifie,
        p.Vendredi_emballe,
        p.Samedi_planifie,
        p.Samedi_emballe,
        p.Total_planifie_semaine,
        p.Total_emballe_semaine,
        p.Commentaire,
        c.Code_article,
        c.Lot,
        c.Quantite,
        c.Quantite_emballe,
        c.Unite_production,
        c.priorite,
        c.ID_Article,
        a.Client as Article_client,
        sp.Code_semaine as Semaine_precedente_code
      FROM planning_hebdo p
      LEFT JOIN commandes c ON c.ID = p.ID_Commande
      LEFT JOIN articles a ON a.ID = c.ID_Article
      LEFT JOIN semaines sp ON sp.ID = p.ID_Semaine_precedente
      WHERE p.ID_Semaine_planifiee = ? ${uniteFilterSql}
      ORDER BY c.Code_article, c.Lot, p.ID`,
      params
    );

    const normalizedRows = rows.map((row) => {
      const quantiteTotale = row.Quantite || 0;
      const quantiteFactureeSemaine = row.Quantite_facturee_semaine || 0;
      const totalPlanifie = row.Total_planifie_semaine || 0;
      const totalEmballe = row.Total_emballe_semaine || 0;
      const resteAFacturer = Math.max(0, quantiteFactureeSemaine - totalEmballe);
      const ecartPlanification = totalPlanifie - quantiteFactureeSemaine;

      return {
        id: row.ID,
        commande_id: row.ID_Commande,
        article_id: row.ID_Article,
        article_code: row.Code_article,
        article_nom: row.Article_client || null,
        lot: row.Lot,
        identifiant_lot: row.Identifiant_lot || row.Lot || null,
        unite_production: row.Unite_production || null,
        priorite: row.priorite || null,
        quantite_totale: quantiteTotale,
        quantite_facturee_semaine: quantiteFactureeSemaine,
        quantite_facturee: quantiteFactureeSemaine,
        quantite_emballee_commande: row.Quantite_emballe || 0,
        reste_a_facturer: resteAFacturer,
        date_debut_planification: row.Date_debut_planification || null,
        stock_actuel: row.Stock_actuel || 0,
        stock_embale_precedent: row.Stock_embale_precedent || 0,
        stock_non_emballe: Math.max(0, quantiteFactureeSemaine - totalPlanifie),
        semaine_precedente: row.Semaine_precedente_code || null,
        planification: {
          lundi: { planifie: row.Lundi_planifie || 0, emballe: row.Lundi_emballe || 0 },
          mardi: { planifie: row.Mardi_planifie || 0, emballe: row.Mardi_emballe || 0 },
          mercredi: { planifie: row.Mercredi_planifie || 0, emballe: row.Mercredi_emballe || 0 },
          jeudi: { planifie: row.Jeudi_planifie || 0, emballe: row.Jeudi_emballe || 0 },
          vendredi: { planifie: row.Vendredi_planifie || 0, emballe: row.Vendredi_emballe || 0 },
          samedi: { planifie: row.Samedi_planifie || 0, emballe: row.Samedi_emballe || 0 }
        },
        total_planifie_semaine: totalPlanifie,
        total_emballe_semaine: totalEmballe,
        ecart_planification: ecartPlanification,
        commentaire: row.Commentaire || null
      };
    });

    const recap = normalizedRows.reduce(
      (acc, row) => {
        acc.total_quantite += row.quantite_totale;
        acc.total_facturee += row.quantite_facturee_semaine;
        acc.total_reste_a_facturer += row.reste_a_facturer;
        acc.total_planifie_semaine += row.total_planifie_semaine;
        acc.total_emballe_semaine += row.total_emballe_semaine;
        acc.total_stock_non_emballe += row.stock_non_emballe;
        return acc;
      },
      {
        total_quantite: 0,
        total_facturee: 0,
        total_reste_a_facturer: 0,
        total_planifie_semaine: 0,
        total_emballe_semaine: 0,
        total_stock_non_emballe: 0
      }
    );

    res.json({
      success: true,
      data: {
        semaine: {
          id: semaine.ID,
          numero_semaine: semaine.Numero_semaine,
          annee: semaine.Annee,
          code_semaine: semaine.Code_semaine,
          date_debut: semaine.Date_debut,
          date_fin: semaine.Date_fin
        },
        unite_production: unite_production ? String(unite_production) : null,
        count: normalizedRows.length,
        commandes: normalizedRows,
        recapitulatif: {
          ...recap,
          ecart_global_planification:
            recap.total_planifie_semaine - recap.total_reste_a_facturer
        }
      }
    });
  } catch (error) {
    console.error('Erreur getPlanningGrilleSemaine:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation de la grille hebdomadaire'
    });
  }
};

exports.getInfosSemainesAnnee = async (req, res) => {
  try {
    const { annee } = req.query;

    if (!annee) {
      return res.status(400).json({
        success: false,
        error: 'Erreurs de validation',
        details: [
          { field: 'annee', message: 'annee requis' }
        ]
      });
    }

    // Récupérer toutes les semaines de l'année
    const [rows] = await db.query(`
      SELECT 
        s.ID,
        s.Numero_semaine,
        s.Annee,
        s.Code_semaine,
        s.Date_debut,
        s.Date_fin,
        COUNT(DISTINCT p.ID) as nb_plannings,
        SUM(CASE WHEN p.ID IS NOT NULL THEN 1 ELSE 0 END) as nb_commandes_planifiees
      FROM semaines s
      LEFT JOIN planning_hebdo p ON s.ID = p.ID_Semaine_planifiee
      WHERE s.Annee = ?
      GROUP BY s.ID, s.Numero_semaine, s.Annee, s.Code_semaine, s.Date_debut, s.Date_fin
      ORDER BY s.Numero_semaine
    `, [parseInt(annee)]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getInfosSemainesAnnee:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des semaines'
    });
  }
};

// GET /api/planning - Récupérer tous les plannings
exports.getAllPlannings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             s.Code_semaine as Semaine_planifiee,
             sp.Code_semaine as Semaine_precedente,
             c.Code_article, c.Lot, c.Quantite,
             a.Client
      FROM planning_hebdo p
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      LEFT JOIN semaines sp ON p.ID_Semaine_precedente = sp.ID
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      LEFT JOIN articles a ON c.ID_Article = a.ID
      ORDER BY s.Date_debut DESC, c.Code_article
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllPlannings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des plannings' 
    });
  }
};

// GET /api/planning/semaine/:semaineId - Planning d'une semaine
exports.getPlanningBySemaine = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             c.Code_article, c.Lot, c.Quantite,
             a.Client
      FROM planning_hebdo p
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      LEFT JOIN articles a ON c.ID_Article = a.ID
      WHERE p.ID_Semaine_planifiee = ?
      ORDER BY c.Code_article
    `, [req.params.semaineId]);
    
    // Récupérer les infos de la semaine
    const [semaine] = await db.query(
      'SELECT * FROM semaines WHERE ID = ?',
      [req.params.semaineId]
    );
    
    res.json({
      success: true,
      semaine: semaine[0] || null,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPlanningBySemaine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du planning' 
    });
  }
};

// GET /api/planning/:id - Récupérer un planning par ID
exports.getPlanningById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             s.Code_semaine,
             c.Code_article, c.Lot, c.Quantite,
             a.Client
      FROM planning_hebdo p
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      LEFT JOIN articles a ON c.ID_Article = a.ID
      WHERE p.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Planning non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getPlanningById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du planning' 
    });
  }
};

// GET /api/planning/commande/:commandeId - Planning d'une commande
exports.getPlanningByCommande = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.Code_semaine
      FROM planning_hebdo p
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      WHERE p.ID_Commande = ?
      ORDER BY s.Date_debut DESC
    `, [req.params.commandeId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPlanningByCommande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du planning' 
    });
  }
};

// GET /api/planning/lot/:identifiant - Historique de planification par lot
exports.getPlanningByLot = async (req, res) => {
  try {
    const { identifiant } = req.params;

    const [rows] = await db.query(
      `SELECT
        p.*,
        s.Code_semaine,
        s.Annee,
        s.Numero_semaine,
        s.Date_debut as Semaine_date_debut,
        s.Date_fin as Semaine_date_fin,
        c.Code_article,
        c.Lot,
        c.Unite_production
      FROM planning_hebdo p
      LEFT JOIN semaines s ON s.ID = p.ID_Semaine_planifiee
      LEFT JOIN commandes c ON c.ID = p.ID_Commande
      WHERE p.Identifiant_lot = ?
      ORDER BY s.Date_debut ASC, p.ID ASC`,
      [identifiant]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPlanningByLot:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du planning par lot'
    });
  }
};

// POST /api/planning - Créer un nouveau planning
exports.createPlanning = async (req, res) => {
  try {
    const {
      ID_Semaine_planifiee, ID_Semaine_precedente, ID_Commande,
      Date_debut_planification,
      Identifiant_lot,
      Quantite_facturee_semaine,
      Stock_actuel, Stock_embale_precedent,
      Lundi_planifie, Lundi_emballe,
      Mardi_planifie, Mardi_emballe,
      Mercredi_planifie, Mercredi_emballe,
      Jeudi_planifie, Jeudi_emballe,
      Vendredi_planifie, Vendredi_emballe,
      Samedi_planifie, Samedi_emballe,
      Saisie_par, Commentaire
    } = req.body;

    if (!ID_Semaine_planifiee || !ID_Commande) {
      return res.status(400).json({
        success: false,
        error: 'Semaine planifiee et commande sont requises'
      });
    }

    const [commande] = await db.query(
      'SELECT ID, Lot FROM commandes WHERE ID = ?',
      [ID_Commande]
    );
    if (commande.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Commande non trouvee'
      });
    }

    const [semaine] = await db.query(
      'SELECT ID, Annee, Date_debut, Date_fin FROM semaines WHERE ID = ?',
      [ID_Semaine_planifiee]
    );
    if (semaine.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Semaine non trouvee'
      });
    }

    const semaineCourante = semaine[0];
    const identifiantLotValue = String(
      Identifiant_lot || commande[0].Lot || `${ID_Commande}-${semaineCourante.Annee}`
    ).trim();

    const quantiteFactureeSemaineValue = Math.max(0, parseInt(Quantite_facturee_semaine || 0, 10) || 0);

    let dateDebutPlanificationValue = null;
    if (Date_debut_planification) {
      const d = toYmd(Date_debut_planification);
      const min = toYmd(semaineCourante.Date_debut);
      const max = toYmd(semaineCourante.Date_fin);
      if (!d || !min || !max) {
        return res.status(400).json({
          success: false,
          error: 'Date_debut_planification invalide'
        });
      }
      if (d < min || d > max) {
        return res.status(400).json({
          success: false,
          error: 'Date_debut_planification doit etre comprise dans la semaine selectionnee'
        });
      }
      dateDebutPlanificationValue = d;
    }

    let stockEmbalePrecedentValue = Stock_embale_precedent;
    if (stockEmbalePrecedentValue === undefined || stockEmbalePrecedentValue === null) {
      const [precedent] = await db.query(
        `SELECT p.Total_emballe_semaine
         FROM planning_hebdo p
         JOIN semaines s ON s.ID = p.ID_Semaine_planifiee
         WHERE p.Identifiant_lot = ?
           AND s.Date_debut < ?
         ORDER BY s.Date_debut DESC
         LIMIT 1`,
        [identifiantLotValue, semaineCourante.Date_debut]
      );
      stockEmbalePrecedentValue = precedent.length > 0 ? (precedent[0].Total_emballe_semaine || 0) : 0;
    }

    const [existingPlanning] = await db.query(
      'SELECT ID FROM planning_hebdo WHERE ID_Semaine_planifiee = ? AND ID_Commande = ? LIMIT 1',
      [ID_Semaine_planifiee, ID_Commande]
    );

    let planningId;
    let wasCreated = false;

    if (existingPlanning.length > 0) {
      planningId = existingPlanning[0].ID;

      await db.query(
        `UPDATE planning_hebdo SET
          ID_Semaine_precedente = ?,
          Date_debut_planification = ?,
          Identifiant_lot = ?,
          Quantite_facturee_semaine = ?,
          Stock_actuel = ?,
          Stock_embale_precedent = ?,
          Lundi_planifie = ?, Lundi_emballe = ?,
          Mardi_planifie = ?, Mardi_emballe = ?,
          Mercredi_planifie = ?, Mercredi_emballe = ?,
          Jeudi_planifie = ?, Jeudi_emballe = ?,
          Vendredi_planifie = ?, Vendredi_emballe = ?,
          Samedi_planifie = ?, Samedi_emballe = ?,
          Saisie_par = ?, Commentaire = ?,
          Date_modification = NOW()
        WHERE ID = ?`,
        [
          ID_Semaine_precedente || null,
          dateDebutPlanificationValue,
          identifiantLotValue,
          quantiteFactureeSemaineValue,
          Stock_actuel || 0,
          stockEmbalePrecedentValue || 0,
          Lundi_planifie || 0, Lundi_emballe || 0,
          Mardi_planifie || 0, Mardi_emballe || 0,
          Mercredi_planifie || 0, Mercredi_emballe || 0,
          Jeudi_planifie || 0, Jeudi_emballe || 0,
          Vendredi_planifie || 0, Vendredi_emballe || 0,
          Samedi_planifie || 0, Samedi_emballe || 0,
          Saisie_par || null, Commentaire || null,
          planningId
        ]
      );
    } else {
      const [result] = await db.query(
        `INSERT INTO planning_hebdo (
          ID_Semaine_planifiee, ID_Semaine_precedente, ID_Commande,
          Date_debut_planification, Identifiant_lot, Quantite_facturee_semaine,
          Stock_actuel, Stock_embale_precedent,
          Lundi_planifie, Lundi_emballe,
          Mardi_planifie, Mardi_emballe,
          Mercredi_planifie, Mercredi_emballe,
          Jeudi_planifie, Jeudi_emballe,
          Vendredi_planifie, Vendredi_emballe,
          Samedi_planifie, Samedi_emballe,
          Saisie_par, Commentaire, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ID_Semaine_planifiee, ID_Semaine_precedente || null, ID_Commande,
          dateDebutPlanificationValue, identifiantLotValue, quantiteFactureeSemaineValue,
          Stock_actuel || 0, stockEmbalePrecedentValue || 0,
          Lundi_planifie || 0, Lundi_emballe || 0,
          Mardi_planifie || 0, Mardi_emballe || 0,
          Mercredi_planifie || 0, Mercredi_emballe || 0,
          Jeudi_planifie || 0, Jeudi_emballe || 0,
          Vendredi_planifie || 0, Vendredi_emballe || 0,
          Samedi_planifie || 0, Samedi_emballe || 0,
          Saisie_par || null, Commentaire || null
        ]
      );

      planningId = result.insertId;
      wasCreated = true;
    }

    const [newPlanning] = await db.query(
      `SELECT p.*, c.Code_article, c.Lot
       FROM planning_hebdo p
       LEFT JOIN commandes c ON p.ID_Commande = c.ID
       WHERE p.ID = ?`,
      [planningId]
    );

    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: wasCreated ? 'CREATE' : 'UPDATE',
      Table_concernee: 'planning_hebdo',
      ID_Enregistrement: planningId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newPlanning[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('Audit log failed:', err));

    return res.status(wasCreated ? 201 : 200).json({
      success: true,
      message: wasCreated ? 'Planning cree avec succes' : 'Planning existant mis a jour avec succes',
      data: newPlanning[0]
    });
  } catch (error) {
    console.error('Erreur createPlanning:', error);
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Un planning existe deja pour cette commande et cette semaine',
        details: [error.sqlMessage || error.message]
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la creation du planning',
      details: [error.sqlMessage || error.message]
    });
  }
};
// PUT /api/planning/:id - Mettre à jour un planning
exports.updatePlanning = async (req, res) => {
  try {
    const planningId = req.params.id;
    const updates = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM planning_hebdo WHERE ID = ?', [planningId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Planning non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    // Mettre à jour les champs
    const fields = [];
    const values = [];
    
    const jours = [
      'Lundi_planifie', 'Lundi_emballe',
      'Mardi_planifie', 'Mardi_emballe',
      'Mercredi_planifie', 'Mercredi_emballe',
      'Jeudi_planifie', 'Jeudi_emballe',
      'Vendredi_planifie', 'Vendredi_emballe',
      'Samedi_planifie', 'Samedi_emballe'
    ];
    
    jours.forEach(jour => {
      if (updates[jour] !== undefined) {
        fields.push(`${jour} = ?`);
        values.push(updates[jour]);
      }
    });
    
    // Les colonnes Total_* sont gerees par la base (colonnes generees).
    
    if (updates.Stock_actuel !== undefined) {
      fields.push('Stock_actuel = ?');
      values.push(updates.Stock_actuel);
    }
    
    if (updates.Stock_embale_precedent !== undefined) {
      fields.push('Stock_embale_precedent = ?');
      values.push(updates.Stock_embale_precedent);
    }

    if (updates.Identifiant_lot !== undefined) {
      fields.push('Identifiant_lot = ?');
      values.push(updates.Identifiant_lot);
    }

    if (updates.Quantite_facturee_semaine !== undefined) {
      fields.push('Quantite_facturee_semaine = ?');
      values.push(updates.Quantite_facturee_semaine);
    }

    if (updates.Date_debut_planification !== undefined) {
      const [planningRows] = await db.query(
        `SELECT p.ID_Semaine_planifiee, s.Date_debut, s.Date_fin
         FROM planning_hebdo p
         JOIN semaines s ON s.ID = p.ID_Semaine_planifiee
         WHERE p.ID = ? LIMIT 1`,
        [planningId]
      );

      if (planningRows.length > 0 && updates.Date_debut_planification) {
        const d = toYmd(updates.Date_debut_planification);
        const min = toYmd(planningRows[0].Date_debut);
        const max = toYmd(planningRows[0].Date_fin);
        if (!d || !min || !max) {
          return res.status(400).json({
            success: false,
            error: 'Date_debut_planification invalide'
          });
        }
        if (d < min || d > max) {
          return res.status(400).json({
            success: false,
            error: 'Date_debut_planification doit etre comprise dans la semaine du planning'
          });
        }
        updates.Date_debut_planification = d;
      }

      fields.push('Date_debut_planification = ?');
      values.push(updates.Date_debut_planification || null);
    }
    
    if (updates.Commentaire !== undefined) {
      fields.push('Commentaire = ?');
      values.push(updates.Commentaire);
    }
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun champ a mettre a jour'
      });
    }

    values.push(planningId);
    
    await db.query(
      `UPDATE planning_hebdo SET ${fields.join(', ')}, Date_modification = NOW() WHERE ID = ?`,
      values
    );
    
    const [updated] = await db.query(`
      SELECT p.*, c.Code_article, c.Lot, s.Code_semaine
      FROM planning_hebdo p
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      WHERE p.ID = ?
    `, [planningId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'planning_hebdo',
      ID_Enregistrement: planningId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Planning mis à jour avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updatePlanning:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du planning' 
    });
  }
};

// PATCH /api/planning/:id/jour/:jour - Mettre à jour un jour spécifique
exports.updateJour = async (req, res) => {
  try {
    const { id, jour } = req.params;
    const { planifie, emballe } = req.body;
    
    const jourPlanifie = `${jour}_planifie`;
    const jourEmballe = `${jour}_emballe`;
    
    // Vérifier que le jour est valide
    const joursValides = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    if (!joursValides.includes(jour)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Jour invalide' 
      });
    }
    
    // Récupérer le planning actuel
    const [current] = await db.query('SELECT * FROM planning_hebdo WHERE ID = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Planning non trouvé' 
      });
    }
    
    // Mettre à jour le jour spécifique
    await db.query(
      `UPDATE planning_hebdo SET 
        ${jourPlanifie} = ?, 
        ${jourEmballe} = ?,
        Date_modification = NOW()
      WHERE ID = ?`,
      [planifie ?? current[0][jourPlanifie], emballe ?? current[0][jourEmballe], id]
    );
    
    const [final] = await db.query(`
      SELECT p.*, c.Code_article, c.Lot
      FROM planning_hebdo p
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      WHERE p.ID = ?
    `, [id]);
    
    res.json({
      success: true,
      message: `Planning du ${jour} mis à jour`,
      data: final[0]
    });
  } catch (error) {
    console.error('Erreur updateJour:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du jour' 
    });
  }
};

// DELETE /api/planning/:id - Supprimer un planning
exports.deletePlanning = async (req, res) => {
  try {
    const planningId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM planning_hebdo WHERE ID = ?', [planningId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Planning non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM planning_hebdo WHERE ID = ?', [planningId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'planning_hebdo',
      ID_Enregistrement: planningId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Planning supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePlanning:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du planning' 
    });
  }
};

// GET /api/planning/synthese/semaine/:semaineId - Synthèse de la semaine
exports.getSyntheseSemaine = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.ID_Semaine_planifiee,
        COUNT(DISTINCT p.ID_Commande) as nb_commandes,
        SUM(p.Total_planifie_semaine) as total_planifie,
        SUM(p.Total_emballe_semaine) as total_emballe,
        ROUND((SUM(p.Total_emballe_semaine) / NULLIF(SUM(p.Total_planifie_semaine), 0)) * 100, 2) as taux_realisation,
        SUM(p.Lundi_planifie) as lundi_planifie,
        SUM(p.Lundi_emballe) as lundi_emballe,
        SUM(p.Mardi_planifie) as mardi_planifie,
        SUM(p.Mardi_emballe) as mardi_emballe,
        SUM(p.Mercredi_planifie) as mercredi_planifie,
        SUM(p.Mercredi_emballe) as mercredi_emballe,
        SUM(p.Jeudi_planifie) as jeudi_planifie,
        SUM(p.Jeudi_emballe) as jeudi_emballe,
        SUM(p.Vendredi_planifie) as vendredi_planifie,
        SUM(p.Vendredi_emballe) as vendredi_emballe,
        SUM(p.Samedi_planifie) as samedi_planifie,
        SUM(p.Samedi_emballe) as samedi_emballe
      FROM planning_hebdo p
      WHERE p.ID_Semaine_planifiee = ?
      GROUP BY p.ID_Semaine_planifiee
    `, [req.params.semaineId]);
    
    res.json({
      success: true,
      data: rows[0] || null
    });
  } catch (error) {
    console.error('Erreur getSyntheseSemaine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la synthèse' 
    });
  }
};

// GET /api/planning/:id/conflits - Obtenir les conflits du planning
exports.obtenirConflits = async (req, res) => {
  try {
    const planningId = req.params.id;

    // Récupérer le planning et ses infos
    const [planning] = await db.query(`
      SELECT p.*, s.Date_debut, s.Date_fin, c.Quantite
      FROM planning_hebdo p
      LEFT JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      WHERE p.ID = ?
    `, [planningId]);

    if (planning.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planning non trouvé'
      });
    }

    // Détecteur de conflits
    const conflits = [];
    const plan = planning[0];

    // Conflit 1: Quantité planifiée > quantité commandée
    const totalPlanifie = 
      (plan.Lundi_planifie || 0) + 
      (plan.Mardi_planifie || 0) + 
      (plan.Mercredi_planifie || 0) + 
      (plan.Jeudi_planifie || 0) + 
      (plan.Vendredi_planifie || 0) + 
      (plan.Samedi_planifie || 0);

    if (totalPlanifie > plan.Quantite) {
      conflits.push({
        type: 'surcharge',
        severity: 'error',
        message: `Quantité planifiée (${totalPlanifie}) dépasse la quantité commandée (${plan.Quantite})`
      });
    }

    // Conflit 2: Stock insuffisant
    const totalEmballe = 
      (plan.Lundi_emballe || 0) + 
      (plan.Mardi_emballe || 0) + 
      (plan.Mercredi_emballe || 0) + 
      (plan.Jeudi_emballe || 0) + 
      (plan.Vendredi_emballe || 0) + 
      (plan.Samedi_emballe || 0);

    if (totalEmballe > totalPlanifie) {
      conflits.push({
        type: 'stock_insuffisant',
        severity: 'error',
        message: `Quantité emballée (${totalEmballe}) dépasse la quantité planifiée (${totalPlanifie})`
      });
    }

    // Conflit 3: Planning sans stock initial
    if (plan.Stock_actuel === null || plan.Stock_actuel === 0) {
      conflits.push({
        type: 'pas_de_stock',
        severity: 'warning',
        message: 'Aucun stock initial défini'
      });
    }

    res.json({
      success: true,
      data: conflits
    });
  } catch (error) {
    console.error('Erreur obtenirConflits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la détection des conflits'
    });
  }
};

// GET /api/planning/:id/suggestions - Obtenir les suggestions d'optimisation
exports.obtenirSuggestions = async (req, res) => {
  try {
    const planningId = req.params.id;

    // Récupérer le planning et ses infos
    const [planning] = await db.query(`
      SELECT p.*, c.Quantite
      FROM planning_hebdo p
      LEFT JOIN commandes c ON p.ID_Commande = c.ID
      WHERE p.ID = ?
    `, [planningId]);

    if (planning.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planning non trouvé'
      });
    }

    const suggestions = [];
    const plan = planning[0];

    // Suggestion 1: Équilibre de charge par jour
    const jours = {
      lundi: plan.Lundi_planifie || 0,
      mardi: plan.Mardi_planifie || 0,
      mercredi: plan.Mercredi_planifie || 0,
      jeudi: plan.Jeudi_planifie || 0,
      vendredi: plan.Vendredi_planifie || 0,
      samedi: plan.Samedi_planifie || 0
    };

    const values = Object.values(jours);
    const moyenne = values.reduce((a, b) => a + b, 0) / values.length;
    const maxEcart = Math.max(...values.map(v => Math.abs(v - moyenne)));

    if (maxEcart > moyenne * 0.5) {
      suggestions.push({
        type: 'equilibrage',
        severity: 'info',
        message: 'La charge n\'est pas équilibrée entre les jours. Envisagez de redistribuer.'
      });
    }

    // Suggestion 2: Stock tampon recommandé
    const totalPlanifie = values.reduce((a, b) => a + b, 0);
    if (plan.Stock_actuel !== null && plan.Stock_actuel < totalPlanifie * 0.1) {
      suggestions.push({
        type: 'stock_tampon',
        severity: 'warning',
        message: `Stock tampon faible (${plan.Stock_actuel}). Minimum recommandé: ${Math.ceil(totalPlanifie * 0.1)}`
      });
    }

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Erreur obtenirSuggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des suggestions'
    });
  }
};

// POST /api/planning/generer/semaine/:semaineId - Générer planning depuis commandes
exports.genererPlanningFromCommandes = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { semaineId } = req.params;
    const { semainePrecedenteId, Saisie_par } = req.body;
    
    // Récupérer les commandes de la semaine
    const [commandes] = await connection.query(
      'SELECT ID, Code_article, Quantite FROM commandes WHERE ID_Semaine = ?',
      [semaineId]
    );
    
    if (commandes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucune commande trouvée pour cette semaine' 
      });
    }
    
    const resultats = [];
    
    for (const cmd of commandes) {
      // Vérifier si déjà planifié
      const [existant] = await connection.query(
        'SELECT ID FROM planning_hebdo WHERE ID_Semaine_planifiee = ? AND ID_Commande = ?',
        [semaineId, cmd.ID]
      );
      
      if (existant.length === 0) {
        const [result] = await connection.query(
          `INSERT INTO planning_hebdo (
            ID_Semaine_planifiee, ID_Semaine_precedente, ID_Commande,
            Saisie_par, Date_creation
          ) VALUES (?, ?, ?, ?, NOW())`,
          [semaineId, semainePrecedenteId || null, cmd.ID, Saisie_par || null]
        );
        
        resultats.push({
          commande_id: cmd.ID,
          planning_id: result.insertId,
          code_article: cmd.Code_article
        });
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: `${resultats.length} plannings générés`,
      data: resultats
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur genererPlanningFromCommandes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération des plannings' 
    });
  } finally {
    connection.release();
  }
};

// ========================================
// EXPORT PLANNING - PDF & EXCEL
// ========================================

// GET /api/planning/:id/export/pdf
exports.exportPlanningPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le planning avec les détails de la semaine
    const [planning] = await db.query(`
      SELECT 
        c.Code_article as 'Code Article',
        c.Lot,
        p.Lundi_planifie as 'Lundi',
        p.Mardi_planifie as 'Mardi',
        p.Mercredi_planifie as 'Mercredi',
        p.Jeudi_planifie as 'Jeudi',
        p.Vendredi_planifie as 'Vendredi',
        p.Samedi_planifie as 'Samedi',
        p.Total_planifie_semaine as 'Total Prévu'
      FROM planning_hebdo p
      JOIN commandes c ON p.ID_Commande = c.ID
      WHERE p.ID = ?
    `, [id]);

    if (planning.length === 0) {
      return res.status(404).json({ error: 'Planning non trouvé' });
    }

    // Récupérer info semaine
    const [semaines] = await db.query(`
      SELECT s.Code_semaine 
      FROM planning_hebdo p
      JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      WHERE p.ID = ? LIMIT 1
    `, [id]);

    const nomSemaine = semaines[0]?.Code_semaine || `Planning ${id}`;

    // Générer PDF
    const doc = await exportService.planningToPDF(planning, nomSemaine);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=planning_${nomSemaine}.pdf`);
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Erreur exportPlanningPDF:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/planning/:id/export/excel
exports.exportPlanningExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le planning avec les détails
    const [planning] = await db.query(`
      SELECT 
        c.Code_article as 'Code Article',
        c.Lot,
        p.Lundi_planifie as 'Lundi',
        p.Mardi_planifie as 'Mardi',
        p.Mercredi_planifie as 'Mercredi',
        p.Jeudi_planifie as 'Jeudi',
        p.Vendredi_planifie as 'Vendredi',
        p.Samedi_planifie as 'Samedi',
        p.Total_planifie_semaine as 'Total Prévu'
      FROM planning_hebdo p
      JOIN commandes c ON p.ID_Commande = c.ID
      WHERE p.ID = ?
    `, [id]);

    if (planning.length === 0) {
      return res.status(404).json({ error: 'Planning non trouvé' });
    }

    // Récupérer info semaine
    const [semaines] = await db.query(`
      SELECT s.Code_semaine 
      FROM planning_hebdo p
      JOIN semaines s ON p.ID_Semaine_planifiee = s.ID
      WHERE p.ID = ? LIMIT 1
    `, [id]);

    const nomSemaine = semaines[0]?.Code_semaine || `Planning ${id}`;

    // Générer Excel
    const buffer = await exportService.planningToExcel(planning, nomSemaine);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=planning_${nomSemaine}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Erreur exportPlanningExcel:', error);
    res.status(500).json({ error: error.message });
  }
};
