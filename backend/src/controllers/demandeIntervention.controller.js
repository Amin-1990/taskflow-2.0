const db = require('../config/database');
const { logAction } = require('../services/audit.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/interventions - Récupérer toutes les demandes
exports.getAllDemandes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
             tm.Type_machine,
             m.Nom_machine, m.Code_interne,
             def.Nom_defaut, def.Code_defaut as Code_defaut_ref,
             tech.Nom_prenom as Technicien_nom,
             demandeur.Nom_prenom as Demandeur_nom
      FROM demande_intervention d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      LEFT JOIN machines m ON d.ID_Machine = m.ID
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      LEFT JOIN personnel tech ON d.ID_Technicien = tech.ID
      LEFT JOIN personnel demandeur ON d.Demandeur = demandeur.ID
      ORDER BY 
        FIELD(d.Statut, 'EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'REPORTEE'),
        d.Priorite DESC,
        d.Date_heure_demande DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllDemandes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des demandes' 
    });
  }
};

// GET /api/interventions/:id - Récupérer une demande par ID
exports.getDemandeById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
             tm.Type_machine,
             m.Nom_machine, m.Code_interne, m.Site_affectation,
             def.Nom_defaut, def.Code_defaut as Code_defaut_ref,
             tech.Nom_prenom as Technicien_nom,
             tech.Telephone as Technicien_tel,
             demandeur.Nom_prenom as Demandeur_nom
      FROM demande_intervention d
      LEFT JOIN types_machine tm ON d.ID_Type_machine = tm.ID
      LEFT JOIN machines m ON d.ID_Machine = m.ID
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      LEFT JOIN personnel tech ON d.ID_Technicien = tech.ID
      LEFT JOIN personnel demandeur ON d.Demandeur = demandeur.ID
      WHERE d.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getDemandeById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la demande' 
    });
  }
};

// GET /api/interventions/statut/:statut - Filtrer par statut
exports.getDemandesByStatut = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, m.Nom_machine, def.Nom_defaut
      FROM demande_intervention d
      LEFT JOIN machines m ON d.ID_Machine = m.ID
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      WHERE d.Statut = ?
      ORDER BY d.Date_heure_demande DESC
    `, [req.params.statut]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDemandesByStatut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des demandes' 
    });
  }
};

// GET /api/interventions/technicien/:id - Demandes d'un technicien
exports.getDemandesByTechnicien = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, m.Nom_machine, def.Nom_defaut
      FROM demande_intervention d
      LEFT JOIN machines m ON d.ID_Machine = m.ID
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      WHERE d.ID_Technicien = ?
      ORDER BY 
        FIELD(d.Statut, 'EN_COURS', 'AFFECTEE', 'EN_ATTENTE'),
        d.Date_heure_demande DESC
    `, [req.params.id]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getDemandesByTechnicien:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des demandes' 
    });
  }
};

// GET /api/interventions/machine/:id - Historique d'une machine
exports.getHistoriqueMachine = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, def.Nom_defaut, tech.Nom_prenom as Technicien_nom
      FROM demande_intervention d
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      LEFT JOIN personnel tech ON d.ID_Technicien = tech.ID
      WHERE d.ID_Machine = ?
      ORDER BY d.Date_heure_demande DESC
    `, [req.params.id]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getHistoriqueMachine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
};

// POST /api/interventions - Créer une nouvelle demande
exports.createDemande = async (req, res) => {
  try {
    const {
      ID_Type_machine, ID_Machine, ID_Defaut,
      Demandeur, Description_panne,
      Priorite, Impact_production
    } = req.body;
    
    // Validations
    if (!ID_Type_machine || !ID_Machine || !Demandeur || !Description_panne) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type machine, machine, demandeur et description sont requis' 
      });
    }
    
    // Vérifier si la machine existe
    const [machine] = await db.query('SELECT ID FROM machines WHERE ID = ?', [ID_Machine]);
    if (machine.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Machine non trouvée' 
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO demande_intervention (
        ID_Type_machine, ID_Machine, ID_Defaut,
        Date_heure_demande, Demandeur, Description_panne,
        Priorite, Impact_production, Statut,
        Date_creation
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, 'EN_ATTENTE', NOW())`,
      [
        ID_Type_machine, ID_Machine, ID_Defaut || null,
        Demandeur, Description_panne,
        Priorite || 'Normale', Impact_production || 'Partiel'
      ]
    );
    
    const [newDemande] = await db.query(`
      SELECT d.*, m.Nom_machine
      FROM demande_intervention d
      LEFT JOIN machines m ON d.ID_Machine = m.ID
      WHERE d.ID = ?
    `, [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'demande_intervention',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newDemande[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Demande d\'intervention créée avec succès',
      data: newDemande[0]
    });
  } catch (error) {
    console.error('Erreur createDemande:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la demande' 
    });
  }
};

// PATCH /api/interventions/:id/affecter - Affecter un technicien
exports.affecterTechnicien = async (req, res) => {
  try {
    const demandeId = req.params.id;
    const { ID_Technicien } = req.body;
    
    if (!ID_Technicien) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID Technicien requis' 
      });
    }
    
    // Vérifier si le technicien existe et a le bon rôle
    const [tech] = await db.query(
      'SELECT ID FROM personnel WHERE ID = ? AND Poste IN ("Technicien", "Responsable")',
      [ID_Technicien]
    );
    
    if (tech.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Technicien non trouvé ou non autorisé' 
      });
    }
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      `UPDATE demande_intervention 
       SET ID_Technicien = ?, Statut = 'AFFECTEE', Date_modification = NOW()
       WHERE ID = ?`,
      [ID_Technicien, demandeId]
    );
    
    const [updated] = await db.query(`
      SELECT d.*, tech.Nom_prenom as Technicien_nom
      FROM demande_intervention d
      LEFT JOIN personnel tech ON d.ID_Technicien = tech.ID
      WHERE d.ID = ?
    `, [demandeId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'demande_intervention',
      ID_Enregistrement: demandeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Technicien affecté avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur affecterTechnicien:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'affectation du technicien' 
    });
  }
};

// PATCH /api/interventions/:id/demarrer - Démarrer intervention
exports.demarrerIntervention = async (req, res) => {
  try {
    const demandeId = req.params.id;
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    if (existing.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Intervention non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      `UPDATE demande_intervention 
       SET Date_heure_debut = NOW(), Statut = 'EN_COURS', Date_modification = NOW()
       WHERE ID = ? AND Statut IN ('AFFECTEE', 'EN_ATTENTE')`,
      [demandeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de démarrer cette intervention' 
      });
    }
    
    const [updated] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    
    // Calculer temps d'attente
    const tempsAttente = Math.floor(
      (new Date(updated[0].Date_heure_debut) - new Date(updated[0].Date_heure_demande)) / 60000
    );
    
    await db.query(
      'UPDATE demande_intervention SET Temps_attente_minutes = ? WHERE ID = ?',
      [tempsAttente, demandeId]
    );
    
    updated[0].Temps_attente_minutes = tempsAttente;
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'demande_intervention',
      ID_Enregistrement: demandeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Intervention démarrée',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur demarrerIntervention:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du démarrage de l\'intervention' 
    });
  }
};

// PATCH /api/interventions/:id/terminer - Terminer intervention
exports.terminerIntervention = async (req, res) => {
  try {
    const demandeId = req.params.id;
    const {
      Cause_racine, Action_realisee, Pieces_remplacees,
      Commentaire
    } = req.body;
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    if (existing.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Intervention non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      `UPDATE demande_intervention 
       SET Date_heure_fin = NOW(), 
           Date_cloture = NOW(),
           Statut = 'TERMINEE',
           Cause_racine = ?,
           Action_realisee = ?,
           Pieces_remplacees = ?,
           Commentaire = ?,
           Date_modification = NOW()
       WHERE ID = ? AND Statut = 'EN_COURS'`,
      [
        Cause_racine || null,
        Action_realisee || null,
        Pieces_remplacees || null,
        Commentaire || null,
        demandeId
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de terminer cette intervention' 
      });
    }
    
    const [updated] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    
    // Calculer durée intervention
    const duree = Math.floor(
      (new Date(updated[0].Date_heure_fin) - new Date(updated[0].Date_heure_debut)) / 60000
    );
    
    await db.query(
      'UPDATE demande_intervention SET Duree_intervention_minutes = ? WHERE ID = ?',
      [duree, demandeId]
    );
    
    updated[0].Duree_intervention_minutes = duree;
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'demande_intervention',
      ID_Enregistrement: demandeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Intervention terminée avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur terminerIntervention:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la fin de l\'intervention' 
    });
  }
};

// PATCH /api/interventions/:id/annuler - Annuler intervention
exports.annulerIntervention = async (req, res) => {
  try {
    const demandeId = req.params.id;
    const { Commentaire } = req.body;
    
    // Récupérer ancienne valeur AVANT modification
    const [existing] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    if (existing.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Intervention non trouvée' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query(
      `UPDATE demande_intervention 
       SET Statut = 'ANNULEE',
           Commentaire = CONCAT(IFNULL(Commentaire, ''), ' | ANNULÉ: ', ?),
           Date_modification = NOW()
       WHERE ID = ? AND Statut NOT IN ('TERMINEE', 'ANNULEE')`,
      [Commentaire || 'Sans motif', demandeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible d\'annuler cette intervention' 
      });
    }
    
    const [updated] = await db.query('SELECT * FROM demande_intervention WHERE ID = ?', [demandeId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'demande_intervention',
      ID_Enregistrement: demandeId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Intervention annulée',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur annulerIntervention:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'annulation' 
    });
  }
};

// GET /api/interventions/statistiques - Dashboard maintenance
exports.getStatistiquesMaintenance = async (req, res) => {
  try {
    // Statistiques générales
    const [global] = await db.query(`
      SELECT 
        COUNT(*) as total_demandes,
        SUM(CASE WHEN Statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN Statut = 'AFFECTEE' THEN 1 ELSE 0 END) as affectees,
        SUM(CASE WHEN Statut = 'EN_COURS' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN Statut = 'TERMINEE' THEN 1 ELSE 0 END) as terminees,
        SUM(CASE WHEN Statut = 'ANNULEE' THEN 1 ELSE 0 END) as annulees,
        ROUND(AVG(CASE WHEN Statut = 'TERMINEE' THEN Temps_attente_minutes END), 0) as temps_attente_moyen,
        ROUND(AVG(CASE WHEN Statut = 'TERMINEE' THEN Duree_intervention_minutes END), 0) as duree_moyenne
      FROM demande_intervention
      WHERE MONTH(Date_creation) = MONTH(CURDATE())
        AND YEAR(Date_creation) = YEAR(CURDATE())
    `);
    
    // Top pannes
    const [topPannes] = await db.query(`
      SELECT 
        def.Nom_defaut,
        COUNT(*) as nb_occurrences
      FROM demande_intervention d
      LEFT JOIN defauts_par_type_machine def ON d.ID_Defaut = def.ID
      WHERE d.Statut = 'TERMINEE'
      GROUP BY def.ID, def.Nom_defaut
      ORDER BY nb_occurrences DESC
      LIMIT 5
    `);
    
    // Performance techniciens
    const [perfTechniciens] = await db.query(`
      SELECT 
        tech.Nom_prenom,
        COUNT(*) as interventions,
        ROUND(AVG(Duree_intervention_minutes), 0) as duree_moyenne
      FROM demande_intervention d
      LEFT JOIN personnel tech ON d.ID_Technicien = tech.ID
      WHERE d.Statut = 'TERMINEE'
        AND d.ID_Technicien IS NOT NULL
      GROUP BY tech.ID, tech.Nom_prenom
      ORDER BY interventions DESC
    `);
    
    res.json({
      success: true,
      data: {
        global: global[0],
        top_pannes: topPannes,
        performance_techniciens: perfTechniciens
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesMaintenance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};