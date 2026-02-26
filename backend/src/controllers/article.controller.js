const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/articles - Récupérer tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles ORDER BY ID');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllArticles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des articles' 
    });
  }
};

// GET /api/articles/:id - Récupérer un article par ID
exports.getArticleById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles WHERE ID = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getArticleById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'article' 
    });
  }
};

// GET /api/articles/code/:code - Récupérer un article par code
exports.getArticleByCode = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles WHERE Code_article = ?', [req.params.code]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getArticleByCode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'article' 
    });
  }
};

// POST /api/articles - Créer un nouvel article
exports.createArticle = async (req, res) => {
  try {
    const { 
      Code_article, 
      Client, 
      Temps_theorique, 
      Temps_reel,
      Indice_revision,
      Date_revision,
      Nombre_postes,
      Lien_dossier_client,
      Lien_photo,
      Lien_dossier_technique,
      Ctrl_elect_disponible,
      Commentaire,
      valide,
      statut
    } = req.body;
    
    // Validation
    if (!Code_article) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le code article est requis' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO articles (
        Code_article, Client, Temps_theorique, Temps_reel, 
        Indice_revision, Date_revision, Nombre_postes,
        Lien_dossier_client, Lien_photo, Lien_dossier_technique,
        Ctrl_elect_disponible, Commentaire, valide, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Code_article, Client || null, Temps_theorique || null, Temps_reel || null,
        Indice_revision || null, Date_revision || null, Nombre_postes || null,
        Lien_dossier_client || null, Lien_photo || null, Lien_dossier_technique || null,
        Ctrl_elect_disponible || 0, Commentaire || null, valide !== undefined ? valide : 1,
        statut || 'normale'
      ]
    );
    
    const [newArticle] = await db.query('SELECT * FROM articles WHERE ID = ?', [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'articles',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newArticle[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: newArticle[0]
    });
  } catch (error) {
    console.error('Erreur createArticle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce code article existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'article' 
    });
  }
};

// PUT /api/articles/:id - Modifier un article
exports.updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const {
      Code_article,
      Client,
      Temps_theorique,
      Temps_reel,
      Indice_revision,
      Date_revision,
      Nombre_postes,
      Lien_dossier_client,
      Lien_photo,
      Lien_dossier_technique,
      Ctrl_elect_disponible,
      Commentaire,
      valide,
      statut
    } = req.body;
    
    // Récupérer l'ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM articles WHERE ID = ?', [articleId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    await db.query(
      `UPDATE articles SET
        Code_article = ?, Client = ?, Temps_theorique = ?, Temps_reel = ?,
        Indice_revision = ?, Date_revision = ?, Nombre_postes = ?,
        Lien_dossier_client = ?, Lien_photo = ?, Lien_dossier_technique = ?,
        Ctrl_elect_disponible = ?, Commentaire = ?, valide = ?, statut = ?
      WHERE ID = ?`,
      [
        Code_article, Client, Temps_theorique, Temps_reel,
        Indice_revision, Date_revision, Nombre_postes,
        Lien_dossier_client, Lien_photo, Lien_dossier_technique,
        Ctrl_elect_disponible, Commentaire, valide, statut,
        articleId
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM articles WHERE ID = ?', [articleId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'articles',
      ID_Enregistrement: articleId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Article modifié avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateArticle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce code article existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification de l\'article' 
    });
  }
};

// DELETE /api/articles/:id - Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    
    // Récupérer la valeur AVANT suppression
    const [existing] = await db.query('SELECT * FROM articles WHERE ID = ?', [articleId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    const deletedValue = existing[0];
    
    const [result] = await db.query('DELETE FROM articles WHERE ID = ?', [articleId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'articles',
      ID_Enregistrement: articleId,
      Ancienne_valeur: deletedValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteArticle:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer cet article car il est utilisé ailleurs' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'article' 
    });
  }
};

// GET /api/articles/statut/:statut - Filtrer par statut
exports.getArticlesByStatut = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles WHERE statut = ?', [req.params.statut]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getArticlesByStatut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des articles' 
    });
  }
};

// GET /api/articles/client/:client - Filtrer par client
exports.getArticlesByClient = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles WHERE Client = ?', [req.params.client]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getArticlesByClient:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des articles' 
    });
  }
};

// PATCH /api/articles/:id/valider - Valider/invalider un article
exports.toggleValide = async (req, res) => {
  try {
    const { valide } = req.body;
    const articleId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM articles WHERE ID = ?', [articleId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      'UPDATE articles SET valide = ? WHERE ID = ?',
      [valide ? 1 : 0, articleId]
    );
    
    const [updated] = await db.query('SELECT * FROM articles WHERE ID = ?', [articleId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'articles',
      ID_Enregistrement: articleId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: `Article ${valide ? 'validé' : 'invalidé'} avec succès`,
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur toggleValide:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la validation de l\'article' 
    });
  }
};

// GET /api/articles/export/xlsx - Exporter les articles en XLSX
exports.exportXLSX = async (req, res) => {
  try {
    // Récupérer tous les articles (ou filtrer selon les params si nécessaire)
    const [articles] = await db.query('SELECT * FROM articles ORDER BY ID');
    
    if (!articles || articles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun article à exporter'
      });
    }
    
    // Définir les colonnes pour Excel
    const columns = [
      { header: 'ID', key: 'ID', width: 10 },
      { header: 'Code Article', key: 'Code_article', width: 15 },
      { header: 'Designation', key: 'Designation', width: 30 },
      { header: 'Description', key: 'Description', width: 40 },
      { header: 'Client', key: 'Client', width: 15 },
      { header: 'Statut', key: 'Statut', width: 12 },
      { header: 'Validé', key: 'valide', width: 10 },
      { header: 'Date Création', key: 'Date_creation', width: 15 },
      { header: 'Date Modification', key: 'Date_modification', width: 15 }
    ];
    
    // Exporter en XLSX
    const buffer = await exportService.toExcel(articles, 'Articles', columns);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=articles.xlsx');
    res.send(buffer);
    
    // Log audit
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'EXPORT',
      Table_concernee: 'articles',
      Nouvelle_valeur: { format: 'XLSX', count: articles.length }
    }).catch(err => console.error('❌ Audit log failed:', err));
    
  } catch (error) {
    console.error('Erreur exportXLSX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export XLSX'
    });
  }
};