const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/defauts-produit - Récupérer tous les défauts
exports.getAllDefauts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM liste_defauts_produit 
      ORDER BY Code_defaut
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

// GET /api/defauts-produit/:id - Récupérer un défaut par ID
exports.getDefautById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [req.params.id]
    );
    
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

// GET /api/defauts-produit/code/:code - Récupérer un défaut par code
exports.getDefautByCode = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE Code_defaut = ?',
      [req.params.code]
    );
    
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

// GET /api/defauts-produit/recherche/:texte - Recherche dans description
exports.rechercheDefauts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM liste_defauts_produit 
      WHERE Code_defaut LIKE ? OR Description LIKE ?
      ORDER BY Code_defaut
    `, [`%${req.params.texte}%`, `%${req.params.texte}%`]);
    
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

// POST /api/defauts-produit - Créer un nouveau défaut
exports.createDefaut = async (req, res) => {
  try {
    const { Code_defaut, Description, Cout_min, Commentaire } = req.body;
    
    // Validations
    if (!Code_defaut || !Description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code défaut et description sont requis' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO liste_defauts_produit (
        Code_defaut, Description, Cout_min, Commentaire,
        Date_creation
      ) VALUES (?, ?, ?, ?, NOW())`,
      [
        Code_defaut,
        Description,
        Cout_min || null,
        Commentaire || null
      ]
    );
    
    const [newDefaut] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [result.insertId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'liste_defauts_produit',
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
        error: 'Ce code défaut existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du défaut' 
    });
  }
};

// PUT /api/defauts-produit/:id - Modifier un défaut
exports.updateDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    const { Code_defaut, Description, Cout_min, Commentaire } = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [defautId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    await db.query(
      `UPDATE liste_defauts_produit SET
        Code_defaut = ?,
        Description = ?,
        Cout_min = ?,
        Commentaire = ?,
        Date_modification = NOW()
      WHERE ID = ?`,
      [
        Code_defaut,
        Description,
        Cout_min || null,
        Commentaire || null,
        defautId
      ]
    );
    
    const [updated] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [defautId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'liste_defauts_produit',
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
        error: 'Ce code défaut existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du défaut' 
    });
  }
};

// DELETE /api/defauts-produit/:id - Supprimer un défaut
exports.deleteDefaut = async (req, res) => {
  try {
    const defautId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [defautId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      'DELETE FROM liste_defauts_produit WHERE ID = ?',
      [defautId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'liste_defauts_produit',
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

// POST /api/defauts-produit/import - Importer plusieurs défauts
exports.importDefauts = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { defauts } = req.body;
    
    if (!Array.isArray(defauts) || defauts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Liste de défauts requise' 
      });
    }
    
    const resultats = [];
    const erreurs = [];
    
    for (const defaut of defauts) {
      try {
        const [existing] = await connection.query(
          'SELECT ID FROM liste_defauts_produit WHERE Code_defaut = ?',
          [defaut.Code_defaut]
        );
        
        if (existing.length > 0) {
          // Mise à jour
          await connection.query(
            `UPDATE liste_defauts_produit SET
              Description = ?,
              Cout_min = ?,
              Commentaire = ?,
              Date_modification = NOW()
            WHERE Code_defaut = ?`,
            [
              defaut.Description,
              defaut.Cout_min || null,
              defaut.Commentaire || null,
              defaut.Code_defaut
            ]
          );
          resultats.push({ code: defaut.Code_defaut, action: 'mis à jour' });
        } else {
          // Création
          await connection.query(
            `INSERT INTO liste_defauts_produit (
              Code_defaut, Description, Cout_min, Commentaire,
              Date_creation
            ) VALUES (?, ?, ?, ?, NOW())`,
            [
              defaut.Code_defaut,
              defaut.Description,
              defaut.Cout_min || null,
              defaut.Commentaire || null
            ]
          );
          resultats.push({ code: defaut.Code_defaut, action: 'créé' });
        }
      } catch (err) {
        erreurs.push({ code: defaut.Code_defaut, error: err.message });
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${resultats.length} défauts traités`,
      resultats,
      erreurs: erreurs.length > 0 ? erreurs : undefined
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur importDefauts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'import des défauts' 
    });
  } finally {
    connection.release();
  }
};

// GET /api/defauts-produit/statistiques/utilisation - Statistiques d'utilisation
exports.getStatistiquesUtilisation = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        lp.Code_defaut,
        lp.Description,
        lp.Cout_min,
        COUNT(dp.ID) as nb_occurrences,
        SUM(dp.Quantite_concernee) as pieces_impactees,
        AVG(dp.Impact_production) as arret_moyen
      FROM liste_defauts_produit lp
      LEFT JOIN defauts_process dp ON lp.Code_defaut = dp.Code_defaut
      GROUP BY lp.ID, lp.Code_defaut, lp.Description, lp.Cout_min
      ORDER BY nb_occurrences DESC
    `);
    
    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getStatistiquesUtilisation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// GET /api/defauts-produit/categories - Liste des catégories (préfixes)
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUBSTRING_INDEX(Code_defaut, '-', 1) as categorie,
        COUNT(*) as nb_defauts,
        MIN(Cout_min) as cout_min,
        AVG(Cout_min) as cout_moyen,
        MAX(Cout_min) as cout_max
      FROM liste_defauts_produit
      GROUP BY SUBSTRING_INDEX(Code_defaut, '-', 1)
      ORDER BY categorie
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getCategories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des catégories' 
    });
  }
};

// PATCH /api/defauts-produit/:id/cout - Mettre à jour le coût
exports.updateCout = async (req, res) => {
  try {
    const { Cout_min } = req.body;
    
    if (Cout_min === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Coût minimum requis' 
      });
    }
    
    const [result] = await db.query(
      'UPDATE liste_defauts_produit SET Cout_min = ?, Date_modification = NOW() WHERE ID = ?',
      [Cout_min, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Défaut non trouvé' 
      });
    }
    
    const [updated] = await db.query(
      'SELECT * FROM liste_defauts_produit WHERE ID = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Coût mis à jour',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateCout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du coût' 
    });
  }
};

// GET /api/defauts-produit/export/xlsx - Exporter les defauts produit en Excel
exports.exportDefautsProduitXlsx = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ID,
        Code_defaut as 'Code defaut',
        Description,
        Cout_min as 'Cout minimum',
        Date_creation as 'Date creation',
        Date_modification as 'Date modification',
        Commentaire
      FROM liste_defauts_produit
      ORDER BY Code_defaut
    `);

    const buffer = await exportService.toExcel(rows, 'DefautsProduit');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=defauts_produit_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur exportDefautsProduitXlsx:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l export des defauts produit'
    });
  }
};
