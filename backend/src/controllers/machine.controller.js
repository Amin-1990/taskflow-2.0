const db = require('../config/database');
const { logAction } = require('../services/audit.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/machines - Récupérer toutes les machines
exports.getAllMachines = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      ORDER BY m.Nom_machine
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllMachines:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// GET /api/machines/:id - Récupérer une machine par ID
exports.getMachineById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getMachineById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la machine' 
    });
  }
};

// GET /api/machines/code/:code - Récupérer par code interne
exports.getMachineByCode = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.Code_interne = ?
    `, [req.params.code]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getMachineByCode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la machine' 
    });
  }
};

// GET /api/machines/site/:site - Machines par site
exports.getMachinesBySite = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.Site_affectation = ?
      ORDER BY m.Nom_machine
    `, [req.params.site]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getMachinesBySite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// GET /api/machines/type/:typeId - Machines par type
exports.getMachinesByType = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.Type_machine_id = ?
      ORDER BY m.Nom_machine
    `, [req.params.typeId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getMachinesByType:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// GET /api/machines/statut/:statut - Machines par statut opérationnel
exports.getMachinesByStatutOperationnel = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.Statut_operationnel = ?
      ORDER BY m.Nom_machine
    `, [req.params.statut]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getMachinesByStatutOperationnel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// GET /api/machines/maintenance/retard - Machines en retard de maintenance
exports.getMachinesMaintenanceRetard = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, tm.Type_machine,
             DATEDIFF(CURDATE(), m.Date_prochaine_maintenance) as jours_retard
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.Date_prochaine_maintenance < CURDATE()
        AND m.Statut = 'actif'
      ORDER BY m.Date_prochaine_maintenance ASC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getMachinesMaintenanceRetard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des machines' 
    });
  }
};

// POST /api/machines - Créer une nouvelle machine
exports.createMachine = async (req, res) => {
  try {
    const {
      Type_machine_id, Numero_serie, Code_interne, Nom_machine,
      Description, Marque, Modele, Annee_fabrication, Date_installation,
      Fournisseur, Constructeur, Site_affectation, Emplacement_detail,
      Puissance_kw, Consommation_air_m3h, Poids_kg, Dimensions_lxhxp,
      Vitesse_moteur_trmin, Capacite_production,
      Frequence_maintenance_preventive, Duree_maintenance_moyenne_min,
      Statut_operationnel, Date_derniere_maintenance, Date_prochaine_maintenance,
      Lien_manuel_pdf, Lien_fiche_technique, Lien_photo, Lien_plan,
      Date_achat, Prix_achat, Duree_garantie_mois, Date_fin_garantie,
      Amortissement_ans, Valeur_residuelle, Qr_code, Code_barre,
      Commentaire, Statut
    } = req.body;
    
    // Validations
    if (!Type_machine_id || !Nom_machine) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type machine et nom machine sont requis' 
      });
    }
    
    // Vérifier si le type machine existe
    const [type] = await db.query('SELECT ID FROM types_machine WHERE ID = ?', [Type_machine_id]);
    if (type.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type de machine non trouvé' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO machines (
        Type_machine_id, Numero_serie, Code_interne, Nom_machine,
        Description, Marque, Modele, Annee_fabrication, Date_installation,
        Fournisseur, Constructeur, Site_affectation, Emplacement_detail,
        Puissance_kw, Consommation_air_m3h, Poids_kg, Dimensions_lxhxp,
        Vitesse_moteur_trmin, Capacite_production,
        Frequence_maintenance_preventive, Duree_maintenance_moyenne_min,
        Statut_operationnel, Date_derniere_maintenance, Date_prochaine_maintenance,
        Lien_manuel_pdf, Lien_fiche_technique, Lien_photo, Lien_plan,
        Date_achat, Prix_achat, Duree_garantie_mois, Date_fin_garantie,
        Amortissement_ans, Valeur_residuelle, Qr_code, Code_barre,
        Commentaire, Statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Type_machine_id, Numero_serie || null, Code_interne || null, Nom_machine,
        Description || null, Marque || null, Modele || null, Annee_fabrication || null, Date_installation || null,
        Fournisseur || null, Constructeur || null, Site_affectation || null, Emplacement_detail || null,
        Puissance_kw || null, Consommation_air_m3h || null, Poids_kg || null, Dimensions_lxhxp || null,
        Vitesse_moteur_trmin || null, Capacite_production || null,
        Frequence_maintenance_preventive || null, Duree_maintenance_moyenne_min || null,
        Statut_operationnel || 'en_production', Date_derniere_maintenance || null, Date_prochaine_maintenance || null,
        Lien_manuel_pdf || null, Lien_fiche_technique || null, Lien_photo || null, Lien_plan || null,
        Date_achat || null, Prix_achat || null, Duree_garantie_mois || null, Date_fin_garantie || null,
        Amortissement_ans || null, Valeur_residuelle || null, Qr_code || null, Code_barre || null,
        Commentaire || null, Statut || 'actif'
      ]
    );
    
    const [newMachine] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.ID = ?
    `, [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'machines',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newMachine[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Machine créée avec succès',
      data: newMachine[0]
    });
  } catch (error) {
    console.error('Erreur createMachine:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('Numero_serie')) {
        return res.status(400).json({ success: false, error: 'Ce numéro de série existe déjà' });
      }
      if (error.message.includes('Code_interne')) {
        return res.status(400).json({ success: false, error: 'Ce code interne existe déjà' });
      }
      if (error.message.includes('Qr_code')) {
        return res.status(400).json({ success: false, error: 'Ce QR code existe déjà' });
      }
      if (error.message.includes('Code_barre')) {
        return res.status(400).json({ success: false, error: 'Ce code barre existe déjà' });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la machine' 
    });
  }
};

// PUT /api/machines/:id - Modifier une machine
exports.updateMachine = async (req, res) => {
  try {
    const machineId = req.params.id;
    const updates = req.body;
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.ID = ?
    `, [machineId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    // Construire la requête UPDATE dynamiquement
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (key !== 'ID' && key !== 'Date_creation' && key !== 'Date_modification') {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    values.push(machineId);
    
    await db.query(
      `UPDATE machines SET ${fields.join(', ')} WHERE ID = ?`,
      values
    );
    
    const [updated] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.ID = ?
    `, [machineId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'machines',
      ID_Enregistrement: machineId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Machine modifiée avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateMachine:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Une valeur unique existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification de la machine' 
    });
  }
};

// DELETE /api/machines/:id - Supprimer une machine
exports.deleteMachine = async (req, res) => {
  try {
    const machineId = req.params.id;
    
    // Récupérer valeur AVANT suppression
    const [existing] = await db.query(`
      SELECT m.*, tm.Type_machine
      FROM machines m
      LEFT JOIN types_machine tm ON m.Type_machine_id = tm.ID
      WHERE m.ID = ?
    `, [machineId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    const deletedValue = existing[0];
    
    const [result] = await db.query('DELETE FROM machines WHERE ID = ?', [machineId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'machines',
      ID_Enregistrement: machineId,
      Ancienne_valeur: deletedValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Machine supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteMachine:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer cette machine car elle est utilisée ailleurs' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de la machine' 
    });
  }
};

// PATCH /api/machines/:id/maintenance - Mettre à jour maintenance
exports.updateMaintenance = async (req, res) => {
  try {
    const machineId = req.params.id;
    const { Date_derniere_maintenance, Date_prochaine_maintenance, Statut_operationnel } = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM machines WHERE ID = ?', [machineId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      `UPDATE machines SET 
        Date_derniere_maintenance = ?,
        Date_prochaine_maintenance = ?,
        Statut_operationnel = ?
      WHERE ID = ?`,
      [Date_derniere_maintenance, Date_prochaine_maintenance, Statut_operationnel, machineId]
    );
    
    const [updated] = await db.query('SELECT * FROM machines WHERE ID = ?', [machineId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'machines',
      ID_Enregistrement: machineId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Maintenance mise à jour',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateMaintenance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour de la maintenance' 
    });
  }
};

// GET /api/machines/dashboard/stats - Statistiques dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_machines,
        SUM(CASE WHEN Statut_operationnel = 'en_production' THEN 1 ELSE 0 END) as en_production,
        SUM(CASE WHEN Statut_operationnel = 'en_panne' THEN 1 ELSE 0 END) as en_panne,
        SUM(CASE WHEN Statut_operationnel = 'maintenance' THEN 1 ELSE 0 END) as en_maintenance,
        SUM(CASE WHEN Date_prochaine_maintenance < CURDATE() THEN 1 ELSE 0 END) as maintenance_retard
      FROM machines
      WHERE Statut = 'actif'
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur getDashboardStats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};