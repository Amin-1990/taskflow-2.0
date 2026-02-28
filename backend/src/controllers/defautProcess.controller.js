const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/defauts-process - Récupérer tous les défauts
exports.getAllDefauts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
             a.Code_article, a.Client,
             p.Description as Poste_description,
             per.Nom_prenom as Operateur_nom,
             lp.Description as Defaut_description,
             lp.Cout_min
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      LEFT JOIN personnel per ON d.ID_Operateur = per.ID
      LEFT JOIN liste_defauts_produit lp ON d.Code_defaut = lp.Code_defaut
      ORDER BY d.Date_defaut DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllDefauts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-process/:id - Récupérer un défaut par ID
exports.getDefautById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
             a.Code_article, a.Client,
             p.Description as Poste_description,
             per.Nom_prenom as Operateur_nom,
             lp.Description as Defaut_description,
             lp.Cout_min
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      LEFT JOIN personnel per ON d.ID_Operateur = per.ID
      LEFT JOIN liste_defauts_produit lp ON d.Code_defaut = lp.Code_defaut
      WHERE d.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getDefautById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du défaut' 
    });
  }
};

// GET /api/defauts-process/article/:articleId - Défauts par article
exports.getDefautsByArticle = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, p.Description as Poste_description
      FROM defauts_process d
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE d.ID_Article = ?
      ORDER BY d.Date_defaut DESC
    `, [req.params.articleId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByArticle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-process/poste/:posteId - Défauts par poste
exports.getDefautsByPoste = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, a.Code_article
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      WHERE d.ID_Poste = ?
      ORDER BY d.Date_defaut DESC
    `, [req.params.posteId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByPoste:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-process/gravite/:gravite - Défauts par gravité
exports.getDefautsByGravite = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, a.Code_article, p.Description as Poste_description
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE d.Gravite = ?
      ORDER BY d.Date_defaut DESC
    `, [req.params.gravite]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByGravite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-process/date/:date - Défauts par date
exports.getDefautsByDate = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, a.Code_article, p.Description as Poste_description
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE DATE(d.Date_defaut) = ?
      ORDER BY d.Date_defaut DESC
    `, [req.params.date]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByDate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-process/periode - Défauts sur période
exports.getDefautsByPeriode = async (req, res) => {
  try {
    const { debut, fin, articleId, posteId } = req.query;
    
    let query = `
      SELECT d.*, a.Code_article, a.Client, p.Description as Poste_description
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE DATE(d.Date_defaut) BETWEEN ? AND ?
    `;
    const params = [debut, fin];
    
    if (articleId) {
      query += ` AND d.ID_Article = ?`;
      params.push(articleId);
    }
    
    if (posteId) {
      query += ` AND d.ID_Poste = ?`;
      params.push(posteId);
    }
    
    query += ` ORDER BY d.Date_defaut DESC`;
    
    const [rows] = await db.query(query, params);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByPeriode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// POST /api/defauts-process - Créer un nouveau défaut
exports.createDefaut = async (req, res) => {
  try {
    const {
      ID_Article, Code_article, Code_defaut, Description_defaut,
      ID_Poste, ID_Operateur, Gravite, Quantite_concernee, Impact_production,
      Commentaire
    } = req.body;
    
    // Validations
    if (!ID_Article || !Code_article || !Code_defaut || !Description_defaut) {
      return res.status(400).json({ 
        success: false, 
        error: 'Article, code article, code défaut et description sont requis' 
      });
    }
    
    // Vérifier si l'article existe
    const [article] = await db.query('SELECT ID FROM articles WHERE ID = ?', [ID_Article]);
    if (article.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO defauts_process (
        Date_defaut, ID_Article, Code_article, Code_defaut,
        Description_defaut, ID_Poste, ID_Operateur, Gravite,
        Quantite_concernee, Impact_production, Commentaire,
        Date_creation
      ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        ID_Article, Code_article, Code_defaut,
        Description_defaut, ID_Poste || null, ID_Operateur || null, Gravite || 'Mineure',
        Quantite_concernee || 1, Impact_production || null,
        Commentaire || null
      ]
    );
    
    const [newDefaut] = await db.query(`
      SELECT d.*, a.Code_article, a.Client,
             p.Nom_prenom as Operateur_nom
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN personnel p ON d.ID_Operateur = p.ID
      WHERE d.ID = ?
    `, [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'defauts_process',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newDefaut[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Défaut enregistré avec succès',
      data: newDefaut[0]
    });
  } catch (error) {
    console.error('Erreur createDefaut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'enregistrement du défaut' 
    });
  }
};

// PUT /api/defauts-process/:id - Modifier un défaut
exports.updateDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    const updates = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM defauts_process WHERE ID = ?', [defautId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    // Construire la requête UPDATE
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'Code_defaut', 'Description_defaut', 'ID_Poste', 'ID_Operateur',
      'Gravite', 'Quantite_concernee', 'Impact_production',
      'Commentaire'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucun champ à mettre à jour' 
      });
    }
    
    values.push(defautId);
    
    await db.query(
      `UPDATE defauts_process SET ${fields.join(', ')} WHERE ID = ?`,
      values
    );
    
    const [updated] = await db.query(`
      SELECT d.*, a.Code_article, a.Client, p.Description as Poste_description,
             per.Nom_prenom as Operateur_nom
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      LEFT JOIN personnel per ON d.ID_Operateur = per.ID
      WHERE d.ID = ?
    `, [defautId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'defauts_process',
      ID_Enregistrement: defautId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Défaut modifié avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateDefaut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du défaut' 
    });
  }
};

// DELETE /api/defauts-process/:id - Supprimer un défaut
exports.deleteDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM defauts_process WHERE ID = ?', [defautId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM defauts_process WHERE ID = ?', [defautId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'defauts_process',
      ID_Enregistrement: defautId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Défaut supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteDefaut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du défaut' 
    });
  }
};

// GET /api/defauts-process/statistiques - Statistiques qualité
exports.getStatistiquesQualite = async (req, res) => {
  try {
    const { debut, fin } = req.query;
    
    // Top défauts par fréquence
    const [topDefauts] = await db.query(`
      SELECT 
        Code_defaut,
        COUNT(*) as occurrences,
        SUM(Quantite_concernee) as pieces_impactees,
        AVG(Impact_production) as arret_moyen
      FROM defauts_process
      WHERE DATE(Date_defaut) BETWEEN ? AND ?
      GROUP BY Code_defaut
      ORDER BY occurrences DESC
      LIMIT 10
    `, [debut, fin]);
    
    // Répartition par gravité
    const [parGravite] = await db.query(`
      SELECT 
        Gravite,
        COUNT(*) as nb_defauts,
        SUM(Quantite_concernee) as pieces_impactees,
        ROUND(AVG(Impact_production), 0) as arret_moyen
      FROM defauts_process
      WHERE DATE(Date_defaut) BETWEEN ? AND ?
      GROUP BY Gravite
      ORDER BY FIELD(Gravite, 'Bloquante', 'Critique', 'Majeure', 'Mineure')
    `, [debut, fin]);
    
    // Top postes à problèmes
    const [topPostes] = await db.query(`
      SELECT 
        p.Description as poste,
        COUNT(*) as nb_defauts,
        SUM(d.Quantite_concernee) as pieces_impactees
      FROM defauts_process d
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE DATE(d.Date_defaut) BETWEEN ? AND ?
      GROUP BY p.ID, p.Description
      HAVING nb_defauts > 0
      ORDER BY nb_defauts DESC
      LIMIT 5
    `, [debut, fin]);
    
    // Évolution journalière
    const [evolution] = await db.query(`
      SELECT 
        DATE(Date_defaut) as jour,
        COUNT(*) as nb_defauts,
        SUM(Quantite_concernee) as pieces_impactees
      FROM defauts_process
      WHERE DATE(Date_defaut) BETWEEN ? AND ?
      GROUP BY DATE(Date_defaut)
      ORDER BY jour
    `, [debut, fin]);
    
    // Coût estimé des défauts
    const [coutTotal] = await db.query(`
      SELECT 
        SUM(d.Quantite_concernee * lp.Cout_min) as cout_estime_total
      FROM defauts_process d
      LEFT JOIN liste_defauts_produit lp ON d.Code_defaut = lp.Code_defaut
      WHERE DATE(d.Date_defaut) BETWEEN ? AND ?
    `, [debut, fin]);
    
    res.json({
      success: true,
      periode: { debut, fin },
      data: {
        top_defauts: topDefauts,
        par_gravite: parGravite,
        top_postes: topPostes,
        evolution: evolution,
        cout_estime_total: coutTotal[0].cout_estime_total || 0
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesQualite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// GET /api/defauts-process/dashboard/aujourdhui - Dashboard qualité du jour
exports.getDashboardAujourdhui = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as nb_defauts,
        SUM(CASE WHEN Gravite = 'Bloquante' THEN 1 ELSE 0 END) as bloquantes,
        SUM(CASE WHEN Gravite = 'Critique' THEN 1 ELSE 0 END) as critiques,
        SUM(Quantite_concernee) as pieces_impactees,
        GROUP_CONCAT(DISTINCT Code_article) as articles_conternes
      FROM defauts_process
      WHERE DATE(Date_defaut) = CURDATE()
    `);
    
    const [derniers] = await db.query(`
      SELECT d.*, a.Client, p.Description as poste
      FROM defauts_process d
      LEFT JOIN articles a ON d.ID_Article = a.ID
      LEFT JOIN postes p ON d.ID_Poste = p.ID
      WHERE DATE(d.Date_defaut) = CURDATE()
      ORDER BY d.Date_defaut DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      data: {
        resume: stats[0],
        derniers_defauts: derniers
      }
    });
  } catch (error) {
    console.error('Erreur getDashboardAujourdhui:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du dashboard' 
    });
  }
};

// GET /api/defauts-process/export/xlsx - Exporter les defauts process en Excel
exports.exportDefautsProcessXlsx = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.ID,
        d.Date_defaut as 'Date defaut',
        d.ID_Article as 'ID Article',
        d.Code_article as 'Code article',
        d.Code_defaut as 'Code defaut',
        d.Description_defaut as 'Description defaut',
        d.ID_Poste as 'ID Poste',
        d.Gravite,
        d.Quantite_concernee as 'Quantite concernee',
        d.Impact_production as 'Impact production',
        d.Date_creation as 'Date creation',
        d.Commentaire
      FROM defauts_process d
      ORDER BY d.Date_defaut DESC
    `);

    const buffer = await exportService.toExcel(rows, 'DefautsProcess');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=defauts_process_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur exportDefautsProcessXlsx:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l export des defauts process'
    });
  }
};
