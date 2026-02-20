const db = require('../config/database');
const { logAction } = require('../services/audit.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/articles-machines-test - Récupérer toutes les associations
exports.getAllAssociations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT amt.*, 
             a.Code_article, a.Client,
             m.Nom_machine, m.Code_interne, m.Site_affectation
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      ORDER BY a.Code_article, m.Nom_machine
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllAssociations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des associations' 
    });
  }
};

// GET /api/articles-machines-test/:id - Récupérer une association par ID
exports.getAssociationById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT amt.*, 
             a.Code_article, a.Client,
             m.Nom_machine, m.Code_interne
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      WHERE amt.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Association non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getAssociationById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'association' 
    });
  }
};

// GET /api/articles-machines-test/article/:articleId - Associations par article
exports.getByArticle = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT amt.*, 
             m.Nom_machine, m.Code_interne, m.Site_affectation
      FROM articles_machines_test amt
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      WHERE amt.Article_id = ?
      ORDER BY m.Nom_machine
    `, [req.params.articleId]);
    
    // Récupérer les infos de l'article
    const [article] = await db.query(
      'SELECT Code_article, Client FROM articles WHERE ID = ?',
      [req.params.articleId]
    );
    
    res.json({
      success: true,
      article: article[0] || null,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getByArticle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des associations' 
    });
  }
};

// GET /api/articles-machines-test/machine/:machineId - Associations par machine
exports.getByMachine = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT amt.*, 
             a.Code_article, a.Client
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      WHERE amt.Machine_id = ?
      ORDER BY a.Code_article
    `, [req.params.machineId]);
    
    // Récupérer les infos de la machine
    const [machine] = await db.query(
      'SELECT Nom_machine, Code_interne FROM machines WHERE ID = ?',
      [req.params.machineId]
    );
    
    res.json({
      success: true,
      machine: machine[0] || null,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getByMachine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des associations' 
    });
  }
};

// POST /api/articles-machines-test - Créer une nouvelle association
exports.createAssociation = async (req, res) => {
  try {
    const {
      Article_id, Machine_id,
      Programme_disponible, Contres_parties_completes,
      Test_complet, Test_partiel,
      Lien_programme, Commentaire
    } = req.body;
    
    // Validations
    if (!Article_id || !Machine_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Article et machine sont requis' 
      });
    }
    
    // Vérifier si l'article existe
    const [article] = await db.query('SELECT ID FROM articles WHERE ID = ?', [Article_id]);
    if (article.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Article non trouvé' 
      });
    }
    
    // Vérifier si la machine existe
    const [machine] = await db.query('SELECT ID FROM machines WHERE ID = ?', [Machine_id]);
    if (machine.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    
    // Vérifier si l'association existe déjà
    const [existant] = await db.query(
      'SELECT ID FROM articles_machines_test WHERE Article_id = ? AND Machine_id = ?',
      [Article_id, Machine_id]
    );
    
    if (existant.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cette association existe déjà' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO articles_machines_test (
        Article_id, Machine_id,
        Programme_disponible, Contres_parties_completes,
        Test_complet, Test_partiel,
        Lien_programme, Commentaire,
        Date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        Article_id, Machine_id,
        Programme_disponible !== undefined ? Programme_disponible : 1,
        Contres_parties_completes !== undefined ? Contres_parties_completes : 1,
        Test_complet || 0,
        Test_partiel || 0,
        Lien_programme || null,
        Commentaire || null
      ]
    );
    
    const [newAssociation] = await db.query(`
      SELECT amt.*, a.Code_article, m.Nom_machine
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      WHERE amt.ID = ?
    `, [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'articles_machines_test',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newAssociation[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Association créée avec succès',
      data: newAssociation[0]
    });
  } catch (error) {
    console.error('Erreur createAssociation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'association' 
    });
  }
};

// PUT /api/articles-machines-test/:id - Modifier une association
exports.updateAssociation = async (req, res) => {
  try {
    const associationId = req.params.id;
    const updates = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM articles_machines_test WHERE ID = ?', [associationId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Association non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    // Construire la requête UPDATE
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'Programme_disponible', 'Contres_parties_completes',
      'Test_complet', 'Test_partiel',
      'Lien_programme', 'Commentaire'
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
    
    values.push(associationId);
    
    await db.query(
      `UPDATE articles_machines_test SET ${fields.join(', ')}, Date_modification = NOW() WHERE ID = ?`,
      values
    );
    
    const [updated] = await db.query(`
      SELECT amt.*, a.Code_article, m.Nom_machine
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      WHERE amt.ID = ?
    `, [associationId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'articles_machines_test',
      ID_Enregistrement: associationId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Association modifiée avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateAssociation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification de l\'association' 
    });
  }
};

// DELETE /api/articles-machines-test/:id - Supprimer une association
exports.deleteAssociation = async (req, res) => {
  try {
    const associationId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM articles_machines_test WHERE ID = ?', [associationId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Association non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM articles_machines_test WHERE ID = ?', [associationId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'articles_machines_test',
      ID_Enregistrement: associationId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Association supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteAssociation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'association' 
    });
  }
};

// GET /api/articles-machines-test/disponible/article/:articleId - Machines disponibles pour un article
exports.getMachinesDisponibles = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             CASE WHEN amt.ID IS NOT NULL THEN 1 ELSE 0 END as deja_associe
      FROM machines m
      LEFT JOIN articles_machines_test amt 
        ON m.ID = amt.Machine_id AND amt.Article_id = ?
      WHERE m.Statut = 'actif'
      ORDER BY deja_associe DESC, m.Nom_machine
    `, [req.params.articleId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getMachinesDisponibles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// PATCH /api/articles-machines-test/:id/programme - Mettre à jour le programme
exports.updateProgramme = async (req, res) => {
  try {
    const { Lien_programme, Programme_disponible } = req.body;
    
    const [result] = await db.query(
      `UPDATE articles_machines_test 
       SET Lien_programme = ?, Programme_disponible = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [Lien_programme || null, Programme_disponible !== undefined ? Programme_disponible : 1, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Association non trouvée' 
      });
    }
    
    const [updated] = await db.query(`
      SELECT amt.*, a.Code_article, m.Nom_machine
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      WHERE amt.ID = ?
    `, [req.params.id]);
    
    res.json({
      success: true,
      message: 'Programme mis à jour',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateProgramme:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du programme' 
    });
  }
};

// GET /api/articles-machines-test/statistiques - Statistiques des tests
exports.getStatistiquesTests = async (req, res) => {
  try {
    // Nombre total d'associations
    const [total] = await db.query(`
      SELECT 
        COUNT(*) as total_associations,
        SUM(CASE WHEN Programme_disponible = 1 THEN 1 ELSE 0 END) as avec_programme,
        SUM(CASE WHEN Contres_parties_completes = 1 THEN 1 ELSE 0 END) as avec_contre_partie,
        SUM(CASE WHEN Test_complet = 1 THEN 1 ELSE 0 END) as test_complet_dispo,
        SUM(CASE WHEN Test_partiel = 1 THEN 1 ELSE 0 END) as test_partiel_dispo
      FROM articles_machines_test
    `);
    
    // Top articles avec le plus de machines de test
    const [topArticles] = await db.query(`
      SELECT 
        a.Code_article,
        a.Client,
        COUNT(amt.ID) as nb_machines_test
      FROM articles_machines_test amt
      LEFT JOIN articles a ON amt.Article_id = a.ID
      GROUP BY a.ID, a.Code_article, a.Client
      ORDER BY nb_machines_test DESC
      LIMIT 5
    `);
    
    // Top machines les plus utilisées pour les tests
    const [topMachines] = await db.query(`
      SELECT 
        m.Nom_machine,
        m.Code_interne,
        COUNT(amt.ID) as nb_articles_testes
      FROM articles_machines_test amt
      LEFT JOIN machines m ON amt.Machine_id = m.ID
      GROUP BY m.ID, m.Nom_machine, m.Code_interne
      ORDER BY nb_articles_testes DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        resume: total[0],
        top_articles: topArticles,
        top_machines: topMachines
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesTests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};