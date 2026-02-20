const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/horaires - Récupérer tous les horaires
exports.getAllHoraires = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM horaires 
      ORDER BY Date DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllHoraires:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des horaires' 
    });
  }
};

// GET /api/horaires/:id - Récupérer un horaire par ID
exports.getHoraireById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM horaires WHERE ID = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Horaire non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getHoraireById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'horaire' 
    });
  }
};

// GET /api/horaires/date/:date - Récupérer horaire par date
exports.getHoraireByDate = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM horaires WHERE Date = ?', [req.params.date]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Aucun horaire trouvé pour cette date' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getHoraireByDate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'horaire' 
    });
  }
};

// GET /api/horaires/periode/:debut/:fin - Horaires sur une période
exports.getHorairesByPeriode = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM horaires 
      WHERE Date BETWEEN ? AND ?
      ORDER BY Date
    `, [req.params.debut, req.params.fin]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getHorairesByPeriode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des horaires' 
    });
  }
};

// GET /api/horaires/semaine/:semaineId - Horaires d'une semaine
exports.getHorairesBySemaine = async (req, res) => {
  try {
    // Récupérer les dates de la semaine
    const [semaine] = await db.query(
      'SELECT Date_debut, Date_fin FROM semaines WHERE ID = ?',
      [req.params.semaineId]
    );
    
    if (semaine.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Semaine non trouvée' 
      });
    }
    
    const [rows] = await db.query(`
      SELECT * FROM horaires 
      WHERE Date BETWEEN ? AND ?
      ORDER BY Date
    `, [semaine[0].Date_debut, semaine[0].Date_fin]);
    
    res.json({
      success: true,
      semaine: semaine[0],
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getHorairesBySemaine:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des horaires' 
    });
  }
};

// POST /api/horaires - Créer un nouvel horaire
exports.createHoraire = async (req, res) => {
  try {
    const {
      Date, Jour_semaine, Heure_debut, Heure_fin,
      Pause_debut, Pause_fin, Heure_supp_debut, Heure_supp_fin,
      Est_ouvert, Est_jour_ferie, Type_chome,
      Description, Commentaire
    } = req.body;
    
    // Validations
    if (!Date || !Heure_debut || !Heure_fin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date, heure début et heure fin sont requis' 
      });
    }
    
    // Vérifier si la date existe déjà
    const [existant] = await db.query('SELECT ID FROM horaires WHERE Date = ?', [Date]);
    if (existant.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un horaire existe déjà pour cette date' 
      });
    }
    
    // Déterminer le jour de la semaine si non fourni
    let jour = Jour_semaine;
    if (!jour) {
      const dateObj = new Date(Date);
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      jour = jours[dateObj.getDay()];
    }
    
    const [result] = await db.query(
      `INSERT INTO horaires (
        Date, Jour_semaine, Heure_debut, Heure_fin,
        Pause_debut, Pause_fin, Heure_supp_debut, Heure_supp_fin,
        Est_ouvert, Est_jour_ferie, Type_chome,
        Description, Commentaire, Date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        Date, jour, Heure_debut, Heure_fin,
        Pause_debut || null, Pause_fin || null,
        Heure_supp_debut || null, Heure_supp_fin || null,
        Est_ouvert !== undefined ? Est_ouvert : 1,
        Est_jour_ferie || 0,
        Type_chome || 'non_chomé',
        Description || null,
        Commentaire || null
      ]
    );
    
    const [newHoraire] = await db.query('SELECT * FROM horaires WHERE ID = ?', [result.insertId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'CREATE',
      Table_concernee: 'horaires',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: newHoraire[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Horaire créé avec succès',
      data: newHoraire[0]
    });
  } catch (error) {
    console.error('Erreur createHoraire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'horaire' 
    });
  }
};

// PUT /api/horaires/:id - Modifier un horaire
exports.updateHoraire = async (req, res) => {
  try {
    const horaireId = req.params.id;
    const updates = req.body;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM horaires WHERE ID = ?', [horaireId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Horaire non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    // Construire la requête UPDATE
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'Heure_debut', 'Heure_fin', 'Pause_debut', 'Pause_fin',
      'Heure_supp_debut', 'Heure_supp_fin', 'Est_ouvert',
      'Est_jour_ferie', 'Type_chome', 'Description', 'Commentaire'
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
    
    values.push(horaireId);
    
    await db.query(
      `UPDATE horaires SET ${fields.join(', ')}, Date_modification = NOW() WHERE ID = ?`,
      values
    );
    
    const [updated] = await db.query('SELECT * FROM horaires WHERE ID = ?', [horaireId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'UPDATE',
      Table_concernee: 'horaires',
      ID_Enregistrement: horaireId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Horaire modifié avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateHoraire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification de l\'horaire' 
    });
  }
};

// DELETE /api/horaires/:id - Supprimer un horaire
exports.deleteHoraire = async (req, res) => {
  try {
    const horaireId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM horaires WHERE ID = ?', [horaireId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Horaire non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    const [result] = await db.query('DELETE FROM horaires WHERE ID = ?', [horaireId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.id || null,
      Username: req.user?.username || null,
      Action: 'DELETE',
      Table_concernee: 'horaires',
      ID_Enregistrement: horaireId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Horaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteHoraire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'horaire' 
    });
  }
};

// POST /api/horaires/import - Importer des horaires (depuis Excel par exemple)
exports.importHoraires = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { horaires } = req.body;
    
    if (!Array.isArray(horaires)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Liste des horaires requise' 
      });
    }
    
    const resultats = [];
    
    for (const h of horaires) {
      // Vérifier si la date existe déjà
      const [existant] = await connection.query(
        'SELECT ID FROM horaires WHERE Date = ?',
        [h.Date]
      );
      
      if (existant.length > 0) {
        // Mise à jour
        await connection.query(
          `UPDATE horaires SET
            Heure_debut = ?, Heure_fin = ?,
            Pause_debut = ?, Pause_fin = ?,
            Heure_supp_debut = ?, Heure_supp_fin = ?,
            Est_ouvert = ?, Est_jour_ferie = ?,
            Type_chome = ?, Description = ?, Commentaire = ?,
            Date_modification = NOW()
          WHERE Date = ?`,
          [
            h.Heure_debut, h.Heure_fin,
            h.Pause_debut || null, h.Pause_fin || null,
            h.Heure_supp_debut || null, h.Heure_supp_fin || null,
            h.Est_ouvert !== undefined ? h.Est_ouvert : 1,
            h.Est_jour_ferie || 0,
            h.Type_chome || 'non_chomé',
            h.Description || null,
            h.Commentaire || null,
            h.Date
          ]
        );
        resultats.push({ date: h.Date, action: 'mis à jour' });
      } else {
        // Création
        await connection.query(
          `INSERT INTO horaires (
            Date, Jour_semaine, Heure_debut, Heure_fin,
            Pause_debut, Pause_fin, Heure_supp_debut, Heure_supp_fin,
            Est_ouvert, Est_jour_ferie, Type_chome,
            Description, Commentaire, Date_creation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            h.Date, h.Jour_semaine, h.Heure_debut, h.Heure_fin,
            h.Pause_debut || null, h.Pause_fin || null,
            h.Heure_supp_debut || null, h.Heure_supp_fin || null,
            h.Est_ouvert !== undefined ? h.Est_ouvert : 1,
            h.Est_jour_ferie || 0,
            h.Type_chome || 'non_chomé',
            h.Description || null,
            h.Commentaire || null
          ]
        );
        resultats.push({ date: h.Date, action: 'créé' });
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${resultats.length} horaires traités`,
      data: resultats
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur importHoraires:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'import des horaires' 
    });
  } finally {
    connection.release();
  }
};

// GET /api/horaires/statistiques/mois/:mois/:annee - Statistiques mensuelles
exports.getStatistiquesMensuelles = async (req, res) => {
  try {
    const { mois, annee } = req.params;
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_jours,
        SUM(CASE WHEN Est_ouvert = 1 THEN 1 ELSE 0 END) as jours_ouverts,
        SUM(CASE WHEN Est_jour_ferie = 1 THEN 1 ELSE 0 END) as jours_feries,
        SUM(CASE WHEN Type_chome = 'chomé_payé' THEN 1 ELSE 0 END) as chomes_payes,
        SUM(CASE WHEN Type_chome = 'chomé_non_payé' THEN 1 ELSE 0 END) as chomes_non_payes,
        AVG(TIMESTAMPDIFF(HOUR, Heure_debut, Heure_fin)) as heures_moyennes
      FROM horaires
      WHERE MONTH(Date) = ? AND YEAR(Date) = ?
    `, [mois, annee]);
    
    // Détail par jour de semaine
    const [parJour] = await db.query(`
      SELECT 
        Jour_semaine,
        COUNT(*) as occurrences,
        AVG(TIMESTAMPDIFF(HOUR, Heure_debut, Heure_fin)) as heures_moyennes
      FROM horaires
      WHERE MONTH(Date) = ? AND YEAR(Date) = ?
      GROUP BY Jour_semaine
      ORDER BY FIELD(Jour_semaine, 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')
    `, [mois, annee]);
    
    res.json({
      success: true,
      periode: `${mois}/${annee}`,
      data: {
        resume: stats[0],
        detail_par_jour: parJour
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesMensuelles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// GET /api/horaires/export/xlsx - Exporter les horaires en Excel
exports.exportHorairesXlsx = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ID,
        Date,
        Jour_semaine as 'Jour semaine',
        Heure_debut as 'Heure debut',
        Heure_fin as 'Heure fin',
        Pause_debut as 'Pause debut',
        Pause_fin as 'Pause fin',
        Heure_supp_debut as 'Heure supp debut',
        Heure_supp_fin as 'Heure supp fin',
        Est_ouvert as 'Est ouvert',
        Est_jour_ferie as 'Est jour ferie',
        Type_chome as 'Type chome',
        Description,
        Commentaire,
        Date_creation as 'Date creation',
        Date_modification as 'Date modification'
      FROM horaires
      ORDER BY Date DESC
    `);

    const buffer = await exportService.toExcel(rows, 'Horaires');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=horaires_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur exportHorairesXlsx:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l export des horaires'
    });
  }
};
