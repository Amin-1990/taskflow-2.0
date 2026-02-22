const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/defauts-type-machine - Récupérer tous les défauts
exports.getAllDefauts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      ORDER BY tm.Type_machine, d.Code_defaut
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

// GET /api/defauts-type-machine/:id - Récupérer un défaut par ID
exports.getDefautById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
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

// GET /api/defauts-type-machine/type/:typeMachineId - Défauts par type de machine
exports.getDefautsByType = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*
      FROM defauts_par_type_machine d
      WHERE d.ID_Type_machine = ?
      ORDER BY d.Code_defaut
    `, [req.params.typeMachineId]);
    
    // Récupérer le nom du type de machine
    const [type] = await db.query(
      'SELECT Type_machine FROM types_machine WHERE ID = ?',
      [req.params.typeMachineId]
    );
    
    res.json({
      success: true,
      type_machine: type[0] || null,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDefautsByType:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des défauts' 
    });
  }
};

// GET /api/defauts-type-machine/code/:code - Récupérer par code
exports.getDefautByCode = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      WHERE d.Code_defaut = ?
    `, [req.params.code]);
    
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
    console.error('Erreur getDefautByCode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du défaut' 
    });
  }
};

// POST /api/defauts-type-machine - Créer un nouveau défaut
exports.createDefaut = async (req, res) => {
  try {
    const {
      ID_Type_machine, Code_defaut, Nom_defaut, Description_defaut
    } = req.body;
    
    // Validations
    if (!ID_Type_machine || !Code_defaut || !Nom_defaut) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type machine, code défaut et nom défaut sont requis' 
      });
    }
    
    // Vérifier si le type de machine existe
    const [type] = await db.query('SELECT ID FROM types_machine WHERE ID = ?', [ID_Type_machine]);
    if (type.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type de machine non trouvé' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO defauts_par_type_machine (
        ID_Type_machine, Code_defaut, Nom_defaut, Description_defaut
      ) VALUES (?, ?, ?, ?)`,
      [
        ID_Type_machine,
        Code_defaut,
        Nom_defaut,
        Description_defaut || null
      ]
    );
    
    const [newDefaut] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      WHERE d.ID = ?
    `, [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'defauts_par_type_machine',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newDefaut[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Défaut créé avec succès',
      data: newDefaut[0]
    });
  } catch (error) {
    console.error('Erreur createDefaut:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce code défaut existe déjà pour ce type de machine' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du défaut' 
    });
  }
};

// PUT /api/defauts-type-machine/:id - Modifier un défaut
exports.updateDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    const { Code_defaut, Nom_defaut, Description_defaut } = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM defauts_par_type_machine WHERE ID = ?', [defautId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    await db.query(
      `UPDATE defauts_par_type_machine SET
        Code_defaut = ?,
        Nom_defaut = ?,
        Description_defaut = ?
      WHERE ID = ?`,
      [
        Code_defaut,
        Nom_defaut,
        Description_defaut || null,
        defautId
      ]
    );
    
    const [updated] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      WHERE d.ID = ?
    `, [defautId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'defauts_par_type_machine',
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
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce code défaut existe déjà pour ce type de machine' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du défaut' 
    });
  }
};

// DELETE /api/defauts-type-machine/:id - Supprimer un défaut
exports.deleteDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM defauts_par_type_machine WHERE ID = ?', [defautId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM defauts_par_type_machine WHERE ID = ?', [defautId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'defauts_par_type_machine',
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
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer ce défaut car il est utilisé dans des demandes d\'intervention' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du défaut' 
    });
  }
};

// GET /api/defauts-type-machine/recherche/:texte - Recherche dans les défauts
exports.rechercheDefauts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, tm.Type_machine
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      WHERE d.Nom_defaut LIKE ? 
         OR d.Code_defaut LIKE ? 
         OR d.Description_defaut LIKE ?
      ORDER BY tm.Type_machine, d.Code_defaut
    `, [`%${req.params.texte}%`, `%${req.params.texte}%`, `%${req.params.texte}%`]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur rechercheDefauts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la recherche des défauts' 
    });
  }
};

// POST /api/defauts-type-machine/dupliquer - Dupliquer les défauts d'un type vers un autre
exports.dupliquerDefauts = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id_source, id_cible } = req.body;
    
    if (!id_source || !id_cible) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID source et ID cible requis' 
      });
    }
    
    // Vérifier si les types existent
    const [source] = await connection.query('SELECT ID FROM types_machine WHERE ID = ?', [id_source]);
    const [cible] = await connection.query('SELECT ID FROM types_machine WHERE ID = ?', [id_cible]);
    
    if (source.length === 0 || cible.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type de machine source ou cible non trouvé' 
      });
    }
    
    // Récupérer les défauts source
    const [defauts] = await connection.query(
      'SELECT Code_defaut, Nom_defaut, Description_defaut FROM defauts_par_type_machine WHERE ID_Type_machine = ?',
      [id_source]
    );
    
    let compteur = 0;
    
    for (const defaut of defauts) {
      // Vérifier si le défaut existe déjà dans la cible
      const [existant] = await connection.query(
        'SELECT ID FROM defauts_par_type_machine WHERE ID_Type_machine = ? AND Code_defaut = ?',
        [id_cible, defaut.Code_defaut]
      );
      
      if (existant.length === 0) {
        await connection.query(
          `INSERT INTO defauts_par_type_machine (ID_Type_machine, Code_defaut, Nom_defaut, Description_defaut)
           VALUES (?, ?, ?, ?)`,
          [id_cible, defaut.Code_defaut, defaut.Nom_defaut, defaut.Description_defaut]
        );
        compteur++;
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${compteur} défauts dupliqués avec succès`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur dupliquerDefauts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la duplication des défauts' 
    });
  } finally {
    connection.release();
  }
};

// GET /api/defauts-type-machine/statistiques/utilisation - Statistiques d'utilisation
exports.getStatistiquesUtilisation = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        d.ID_Type_machine,
        tm.Type_machine,
        COUNT(DISTINCT d.ID) as nb_defauts,
        COUNT(di.ID) as nb_utilisations,
        COUNT(di.ID) / COUNT(DISTINCT d.ID) as ratio_utilisation
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      LEFT JOIN demande_intervention di ON d.ID = di.ID_Defaut
      GROUP BY d.ID_Type_machine, tm.Type_machine
      ORDER BY nb_utilisations DESC
    `);
    
    // Top défauts les plus signalés
    const [topDefauts] = await db.query(`
      SELECT 
        d.Nom_defaut,
        d.Code_defaut,
        tm.Type_machine,
        COUNT(di.ID) as nb_signalisations
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      LEFT JOIN demande_intervention di ON d.ID = di.ID_Defaut
      GROUP BY d.ID, d.Nom_defaut, d.Code_defaut, tm.Type_machine
      ORDER BY nb_signalisations DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        par_type_machine: stats,
        top_defauts: topDefauts
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesUtilisation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// GET /api/defauts-type-machine/export/xlsx - Exporter les defauts type machine en XLSX
exports.exportDefautsTypeMachineXLSX = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.ID as 'ID',
        d.ID_Type_machine as 'ID Type machine',
        tm.Type_machine as 'Type machine',
        d.Code_defaut as 'Code defaut',
        d.Nom_defaut as 'Nom defaut',
        d.Description_defaut as 'Description defaut'
      FROM defauts_par_type_machine d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      ORDER BY tm.Type_machine, d.Code_defaut
    `);

    const buffer = await exportService.toExcel(rows, 'Defauts Type Machine');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=defauts_type_machine.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Erreur exportDefautsTypeMachineXLSX:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de export des defauts type machine'
    });
  }
};
