const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/types-machine - Récupérer tous les types de machine
exports.getAllTypesMachine = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM types_machine ORDER BY ID');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllTypesMachine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des types de machine' 
    });
  }
};

// GET /api/types-machine/:id - Récupérer un type par ID
exports.getTypeMachineById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM types_machine WHERE ID = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Type de machine non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getTypeMachineById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du type de machine' 
    });
  }
};

// POST /api/types-machine - Créer un nouveau type
exports.createTypeMachine = async (req, res) => {
  try {
    const { Type_machine } = req.body;
    
    if (!Type_machine) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom du type de machine est requis' 
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO types_machine (Type_machine) VALUES (?)',
      [Type_machine]
    );
    
    const [newType] = await db.query('SELECT * FROM types_machine WHERE ID = ?', [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'types_machine',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newType[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Type de machine créé avec succès',
      data: newType[0]
    });
  } catch (error) {
    console.error('Erreur createTypeMachine:', error);
    
    // Gestion de l'erreur d'unicité
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce type de machine existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du type de machine' 
    });
  }
};

// PUT /api/types-machine/:id - Modifier un type
exports.updateTypeMachine = async (req, res) => {
  try {
    const { Type_machine } = req.body;
    const typeId = req.params.id;
    
    if (!Type_machine) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom du type de machine est requis' 
      });
    }
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM types_machine WHERE ID = ?', [typeId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Type de machine non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      'UPDATE types_machine SET Type_machine = ? WHERE ID = ?',
      [Type_machine, typeId]
    );
    
    const [updated] = await db.query('SELECT * FROM types_machine WHERE ID = ?', [typeId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'types_machine',
      ID_Enregistrement: typeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Type de machine modifié avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateTypeMachine:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce type de machine existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du type de machine' 
    });
  }
};

// DELETE /api/types-machine/:id - Supprimer un type
exports.deleteTypeMachine = async (req, res) => {
  try {
    const typeId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM types_machine WHERE ID = ?', [typeId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Type de machine non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM types_machine WHERE ID = ?', [typeId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'types_machine',
      ID_Enregistrement: typeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Type de machine supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteTypeMachine:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer ce type car il est utilisé par des machines' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du type de machine' 
    });
  }
};

// GET /api/types-machine/export/xlsx - Exporter les types machine en XLSX
exports.exportTypesMachineXLSX = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ID as 'ID',
        Type_machine as 'Type machine'
      FROM types_machine
      ORDER BY ID ASC
    `);

    const buffer = await exportService.toExcel(rows, 'Types Machine');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=types_machine.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Erreur exportTypesMachineXLSX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de export des types machine'
    });
  }
};
