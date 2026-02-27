const db = require('../config/database');
const { logAction } = require('../services/audit.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/personnel - Récupérer tout le personnel
exports.getAllPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ID, Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
             Date_naissance, Adresse, Ville, Code_postal, Telephone, Poste,
             Statut, Type_contrat, Date_fin_contrat, Site_affectation,
             Numero_CNSS, Commentaire
      FROM personnel 
      ORDER BY Nom_prenom
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllPersonnel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du personnel' 
    });
  }
};

// GET /api/personnel/:id - Récupérer un employé par ID
exports.getPersonnelById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE ID = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employé non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getPersonnelById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'employé' 
    });
  }
};

// GET /api/personnel/matricule/:matricule - Récupérer par matricule
exports.getPersonnelByMatricule = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE Matricule = ?', [req.params.matricule]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employé non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getPersonnelByMatricule:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'employé' 
    });
  }
};

// GET /api/personnel/recherche?q=... - Recherche par nom, prénom ou matricule
exports.searchPersonnel = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    
    if (query.length === 0) {
      const [rows] = await db.query(`
        SELECT ID, Nom_prenom, Matricule, Statut, Poste
        FROM personnel
        WHERE Statut = 'actif'
        ORDER BY Nom_prenom
        LIMIT 50
      `);
      return res.json({
        success: true,
        data: rows
      });
    }

    const searchPattern = `%${query}%`;
    const [rows] = await db.query(`
      SELECT ID, Nom_prenom, Matricule, Statut, Poste
      FROM personnel
      WHERE (Nom_prenom LIKE ? OR Matricule LIKE ?)
        AND Statut = 'actif'
      ORDER BY 
        CASE 
          WHEN Nom_prenom LIKE ? THEN 0
          WHEN Matricule LIKE ? THEN 1
          ELSE 2
        END,
        Nom_prenom
      LIMIT 50
    `, [searchPattern, searchPattern, `${query}%`, `${query}%`]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur searchPersonnel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la recherche du personnel' 
    });
  }
};

// POST /api/personnel - Créer un nouvel employé
exports.createPersonnel = async (req, res) => {
  try {
    const {
      Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
      Date_naissance, Adresse, Ville, Code_postal, Telephone,
      Poste, Statut, Type_contrat, Date_fin_contrat,
      Site_affectation, Numero_CNSS, Commentaire
    } = req.body;
    
    // Validations
    if (!Nom_prenom || !Matricule || !Date_embauche) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nom, matricule et date d\'embauche sont requis' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO personnel (
        Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
        Date_naissance, Adresse, Ville, Code_postal, Telephone,
        Poste, Statut, Type_contrat, Date_fin_contrat,
        Site_affectation, Numero_CNSS, Commentaire
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Nom_prenom, Matricule, Qr_code || null, Date_embauche, Email || null,
        Date_naissance || null, Adresse || null, Ville || null, Code_postal || null, Telephone || null,
        Poste || 'Operateur', Statut || 'actif', Type_contrat || 'CDI', Date_fin_contrat || null,
        Site_affectation || null, Numero_CNSS || null, Commentaire || null
      ]
    );
    
    const [newPersonnel] = await db.query('SELECT * FROM personnel WHERE ID = ?', [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'personnel',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newPersonnel[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Employé créé avec succès',
      data: newPersonnel[0]
    });
  } catch (error) {
    console.error('Erreur createPersonnel:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      // Déterminer quel champ est en double
      if (error.message.includes('Matricule')) {
        return res.status(400).json({ success: false, error: 'Ce matricule existe déjà' });
      }
      if (error.message.includes('Email')) {
        return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
      }
      if (error.message.includes('Qr_code')) {
        return res.status(400).json({ success: false, error: 'Ce QR code existe déjà' });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'employé' 
    });
  }
};

// PUT /api/personnel/:id - Modifier un employé
exports.updatePersonnel = async (req, res) => {
  try {
    const personnelId = req.params.id;
    const {
      Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
      Date_naissance, Adresse, Ville, Code_postal, Telephone,
      Poste, Statut, Type_contrat, Date_fin_contrat,
      Site_affectation, Numero_CNSS, Commentaire
    } = req.body;
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM personnel WHERE ID = ?', [personnelId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Employé non trouvé' });
    }
    const oldValue = existing[0];
    
    await db.query(
      `UPDATE personnel SET
        Nom_prenom = ?, Matricule = ?, Qr_code = ?, Date_embauche = ?, Email = ?,
        Date_naissance = ?, Adresse = ?, Ville = ?, Code_postal = ?, Telephone = ?,
        Poste = ?, Statut = ?, Type_contrat = ?, Date_fin_contrat = ?,
        Site_affectation = ?, Numero_CNSS = ?, Commentaire = ?
      WHERE ID = ?`,
      [
        Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
        Date_naissance, Adresse, Ville, Code_postal, Telephone,
        Poste, Statut, Type_contrat, Date_fin_contrat,
        Site_affectation, Numero_CNSS, Commentaire,
        personnelId
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM personnel WHERE ID = ?', [personnelId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'personnel',
      ID_Enregistrement: personnelId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Employé modifié avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updatePersonnel:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('Matricule')) {
        return res.status(400).json({ success: false, error: 'Ce matricule existe déjà' });
      }
      if (error.message.includes('Email')) {
        return res.status(400).json({ success: false, error: 'Cet email existe déjà' });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification de l\'employé' 
    });
  }
};

// DELETE /api/personnel/:id - Supprimer un employé
exports.deletePersonnel = async (req, res) => {
  try {
    const personnelId = req.params.id;
    
    // Récupérer valeur AVANT suppression
    const [existing] = await db.query('SELECT * FROM personnel WHERE ID = ?', [personnelId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employé non trouvé' 
      });
    }
    const deletedValue = existing[0];
    
    const [result] = await db.query('DELETE FROM personnel WHERE ID = ?', [personnelId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'personnel',
      ID_Enregistrement: personnelId,
      Ancienne_valeur: deletedValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Employé supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePersonnel:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer cet employé car il est utilisé ailleurs' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'employé' 
    });
  }
};

// GET /api/personnel/statut/:statut - Filtrer par statut
exports.getPersonnelByStatut = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE Statut = ?', [req.params.statut]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPersonnelByStatut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du personnel' 
    });
  }
};

// GET /api/personnel/poste/:poste - Filtrer par poste
exports.getPersonnelByPoste = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE Poste = ?', [req.params.poste]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPersonnelByPoste:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du personnel' 
    });
  }
};

// GET /api/personnel/site/:site - Filtrer par site
exports.getPersonnelBySite = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE Site_affectation = ?', [req.params.site]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPersonnelBySite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du personnel' 
    });
  }
};

// PATCH /api/personnel/:id/statut - Changer statut
exports.changeStatut = async (req, res) => {
  try {
    const { Statut } = req.body;
    const personnelId = req.params.id;
    
    if (!['actif', 'inactif'].includes(Statut)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Statut invalide (actif/inactif)' 
      });
    }
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM personnel WHERE ID = ?', [personnelId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employé non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      'UPDATE personnel SET Statut = ? WHERE ID = ?',
      [Statut, personnelId]
    );
    
    const [updated] = await db.query('SELECT * FROM personnel WHERE ID = ?', [personnelId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'personnel',
      ID_Enregistrement: personnelId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: `Statut modifié avec succès`,
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur changeStatut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du changement de statut' 
    });
  }
};