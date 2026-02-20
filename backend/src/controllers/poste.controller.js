const db = require('../config/database');
const { logAction } = require('../services/audit.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/postes - Récupérer tous les postes
exports.getAllPostes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM postes ORDER BY ID');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllPostes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des postes' 
    });
  }
};

// GET /api/postes/:id - Récupérer un poste par ID
exports.getPosteById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM postes WHERE ID = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Poste non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getPosteById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du poste' 
    });
  }
};

// POST /api/postes - Créer un nouveau poste
exports.createPoste = async (req, res) => {
  try {
    const { Description } = req.body;
    
    if (!Description) {
      return res.status(400).json({ 
        success: false, 
        error: 'La description est requise' 
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO postes (Description) VALUES (?)',
      [Description]
    );
    
    const [newPoste] = await db.query('SELECT * FROM postes WHERE ID = ?', [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'postes',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newPoste[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Poste créé avec succès',
      data: newPoste[0]
    });
  } catch (error) {
    console.error('Erreur createPoste:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du poste' 
    });
  }
};

// PUT /api/postes/:id - Modifier un poste
exports.updatePoste = async (req, res) => {
  try {
    const { Description } = req.body;
    const posteId = req.params.id;
    
    if (!Description) {
      return res.status(400).json({ 
        success: false, 
        error: 'La description est requise' 
      });
    }
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM postes WHERE ID = ?', [posteId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Poste non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      'UPDATE postes SET Description = ? WHERE ID = ?',
      [Description, posteId]
    );
    
    const [updatedPoste] = await db.query('SELECT * FROM postes WHERE ID = ?', [posteId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'postes',
      ID_Enregistrement: posteId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updatedPoste[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Poste modifié avec succès',
      data: updatedPoste[0]
    });
  } catch (error) {
    console.error('Erreur updatePoste:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du poste' 
    });
  }
};

// DELETE /api/postes/:id - Supprimer un poste
exports.deletePoste = async (req, res) => {
  try {
    const posteId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM postes WHERE ID = ?', [posteId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Poste non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM postes WHERE ID = ?', [posteId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'postes',
      ID_Enregistrement: posteId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Poste supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePoste:', error);
    
    // Vérifier si l'erreur est due à une contrainte de clé étrangère
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer ce poste car il est utilisé ailleurs' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du poste' 
    });
  }
};