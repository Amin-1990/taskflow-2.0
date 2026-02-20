const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const pointageService = require('../services/pointage.service');

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const resolveTargetDate = (value) => {
  if (value === undefined || value === null || value === '') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value);
};

const parseTimeToSeconds = (time) => {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(String(time || ''));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return (hours * 3600) + (minutes * 60) + seconds;
};

const secondsToTime = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const minutesToTime = (totalMinutes) => secondsToTime((Number(totalMinutes) || 0) * 60);

const normalizeTimeInput = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  const hhmm = /^(\d{2}):(\d{2})$/.exec(raw);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h > 23 || m > 59) return null;
    return `${hhmm[1]}:${hhmm[2]}:00`;
  }
  const hhmmss = /^(\d{2}):(\d{2}):(\d{2})$/.exec(raw);
  if (hhmmss) {
    const h = Number(hhmmss[1]);
    const m = Number(hhmmss[2]);
    const s = Number(hhmmss[3]);
    if (h > 23 || m > 59 || s > 59) return null;
    return raw;
  }
  return null;
};

const calculerChampsPointage = ({ entree, sortie, debutHoraire, finHoraire }) => {
  let retard = null;
  let departAnticipe = null;
  let presenceReelle = '00:00:00';

  const entreeSec = parseTimeToSeconds(entree);
  const sortieSec = parseTimeToSeconds(sortie);
  const debutSec = parseTimeToSeconds(debutHoraire);
  const finSec = parseTimeToSeconds(finHoraire);

  if (entreeSec !== null && debutSec !== null && entreeSec > debutSec) {
    retard = secondsToTime(entreeSec - debutSec);
  }

  if (sortieSec !== null && finSec !== null && sortieSec < finSec) {
    departAnticipe = secondsToTime(finSec - sortieSec);
  }

  if (entreeSec !== null && sortieSec !== null && sortieSec >= entreeSec) {
    presenceReelle = secondsToTime(sortieSec - entreeSec);
  }

  return { retard, departAnticipe, presenceReelle };
};

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/pointage - Récupérer tout le pointage
exports.getAllPointage = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, pers.Nom_prenom, pers.Matricule, pers.Poste
      FROM pointage p
      LEFT JOIN personnel pers ON p.ID_Personnel = pers.ID
      ORDER BY p.Date DESC, p.ID_Personnel
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllPointage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du pointage' 
    });
  }
};

// GET /api/pointage/aujourdhui - Pointage du jour
exports.getPointageAujourdhui = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, pers.Nom_prenom, pers.Matricule, pers.Poste
      FROM pointage p
      LEFT JOIN personnel pers ON p.ID_Personnel = pers.ID
      WHERE p.Date = CURDATE()
      ORDER BY p.Entree
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPointageAujourdhui:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du pointage' 
    });
  }
};

// GET /api/pointage/personnel/:id - Pointage d'un employé
exports.getPointageByPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM pointage 
      WHERE ID_Personnel = ?
      ORDER BY Date DESC
    `, [req.params.id]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPointageByPersonnel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du pointage' 
    });
  }
};

// GET /api/pointage/periode - Pointage sur une période
exports.getPointageByPeriode = async (req, res) => {
  try {
    const { debut, fin, personnelId } = req.query;
    
    let query = `
      SELECT p.*, pers.Nom_prenom, pers.Matricule
      FROM pointage p
      LEFT JOIN personnel pers ON p.ID_Personnel = pers.ID
      WHERE p.Date BETWEEN ? AND ?
    `;
    const params = [debut, fin];
    
    if (personnelId) {
      query += ` AND p.ID_Personnel = ?`;
      params.push(personnelId);
    }
    
    query += ` ORDER BY p.Date, p.ID_Personnel`;
    
    const [rows] = await db.query(query, params);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getPointageByPeriode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du pointage' 
    });
  }
};

// POST /api/pointage/arrivee - Pointer arrivée
exports.pointerArrivee = async (req, res) => {
  try {
    const { ID_Personnel, Matricule, Nom, Date: dateInput } = req.body;
    const targetDate = resolveTargetDate(dateInput);

    if (!isValidIsoDate(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date invalide (format: YYYY-MM-DD)'
      });
    }
    
    if (!ID_Personnel && !Matricule) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID Personnel ou Matricule requis' 
      });
    }
    
    // Récupérer les infos personnel si nécessaire
    let personnelId = ID_Personnel;
    let matricule = Matricule;
    let nom = Nom;
    
    if (Matricule && !personnelId) {
      const [pers] = await db.query('SELECT ID, Nom_prenom FROM personnel WHERE Matricule = ?', [Matricule]);
      if (pers.length > 0) {
        personnelId = pers[0].ID;
        nom = pers[0].Nom_prenom;
      }
    }

    if (!personnelId) {
      return res.status(404).json({
        success: false,
        error: 'Personnel introuvable'
      });
    }
    
    // Vérifier si déjà pointé sur la date cible
    const [existant] = await db.query(
      'SELECT ID FROM pointage WHERE ID_Personnel = ? AND Date = ?',
      [personnelId, targetDate]
    );
    
    if (existant.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Pointage déjà enregistré pour la date ${targetDate}` 
      });
    }
    
    // Récupérer horaire prévu depuis table horaires
    const [horaire] = await db.query(
      `SELECT Heure_debut, Heure_fin FROM horaires 
       WHERE Date = ?`,
      [targetDate]
    );
    
    const heureArrivee = new Date();
    const heureArriveeStr = heureArrivee.toTimeString().split(' ')[0];
    
    // Calculer retard
    let retard = null;
    if (horaire.length > 0) {
      const heurePrevue = horaire[0].Heure_debut;
      if (heureArriveeStr > heurePrevue) {
        // Calculer différence en minutes
        const diff = (new Date(`1970-01-01T${heureArriveeStr}`) - new Date(`1970-01-01T${heurePrevue}`)) / 60000;
        if (diff > 0) {
          const roundedMinutes = Math.floor(diff);
          retard = minutesToTime(roundedMinutes);
        }
      }
    }
    
    const [result] = await db.query(
      `INSERT INTO pointage (
        ID_Personnel, Matricule, Nom, Date,
        Debut, Entree, Retard, Presence_reelle,
        Date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        personnelId,
        matricule || '',
        nom || '',
        targetDate,
        horaire.length > 0 ? horaire[0].Heure_debut : '08:00:00',
        heureArriveeStr,
        retard,
        '00:00:00'
      ]
    );
    
    const [pointage] = await db.query(
      'SELECT * FROM pointage WHERE ID = ?',
      [result.insertId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.ID || null,
      Username: req.user?.Username || null,
      Action: 'CREATE',
      Table_concernee: 'pointage',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: pointage[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Arrivée pointée avec succès',
      data: pointage[0]
    });
  } catch (error) {
    console.error('Erreur pointerArrivee:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: `Pointage déjà enregistré pour la date ${req.body?.Date || 'courante'}`
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du pointage d\'arrivée' 
    });
  }
};

// POST /api/pointage/depart - Pointer départ
exports.pointerDepart = async (req, res) => {
  try {
    const { ID_Personnel, Matricule, Date: dateInput } = req.body;
    const targetDate = resolveTargetDate(dateInput);

    if (!isValidIsoDate(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date invalide (format: YYYY-MM-DD)'
      });
    }
    
    if (!ID_Personnel && !Matricule) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID Personnel ou Matricule requis' 
      });
    }
    
    let personnelId = ID_Personnel;
    
    if (Matricule && !personnelId) {
      const [pers] = await db.query('SELECT ID FROM personnel WHERE Matricule = ?', [Matricule]);
      if (pers.length > 0) {
        personnelId = pers[0].ID;
      }
    }

    if (!personnelId) {
      return res.status(404).json({
        success: false,
        error: 'Personnel introuvable'
      });
    }
    
    // Récupérer le pointage du jour AVANT modification
     const [pointage] = await db.query(
       'SELECT * FROM pointage WHERE ID_Personnel = ? AND Date = ?',
       [personnelId, targetDate]
     );
     
     if (pointage.length === 0) {
       return res.status(404).json({ 
         success: false, 
         error: `Aucun pointage trouvé pour la date ${targetDate}` 
       });
     }
     const oldValue = pointage[0];
     
     const heureDepart = new Date();
     const heureDepartStr = heureDepart.toTimeString().split(' ')[0];
     
     // Récupérer horaire prévu
     const [horaire] = await db.query(
       'SELECT Heure_fin FROM horaires WHERE Date = ?',
       [targetDate]
     );
     
     // Calculer départ anticipé
     let departAnticipe = null;
     if (horaire.length > 0) {
       const heurePrevueFin = horaire[0].Heure_fin;
       if (heureDepartStr < heurePrevueFin) {
         const diff = (new Date(`1970-01-01T${heurePrevueFin}`) - new Date(`1970-01-01T${heureDepartStr}`)) / 60000;
         if (diff > 0) {
           const roundedMinutes = Math.floor(diff);
           departAnticipe = minutesToTime(roundedMinutes);
         }
       }
     }
     
     // Calculer durée présence
     const arrivee = pointage[0].Entree;
     const departSeconds = parseTimeToSeconds(heureDepartStr);
     const arriveeSeconds = parseTimeToSeconds(arrivee);
     if (arriveeSeconds === null || departSeconds === null) {
       return res.status(400).json({
         success: false,
         error: 'Heure d\'entrée invalide ou absente pour calculer la présence'
       });
     }
     const presenceReelle = secondsToTime(departSeconds - arriveeSeconds);
     
     await db.query(
       `UPDATE pointage SET
         Sortie = ?,
         Depart_anticipe = ?,
         Presence_reelle = ?,
         Date_modification = NOW()
       WHERE ID = ?`,
       [heureDepartStr, departAnticipe, presenceReelle, pointage[0].ID]
     );
     
     const [updated] = await db.query(
       'SELECT * FROM pointage WHERE ID = ?',
       [pointage[0].ID]
     );
     
     // Log audit
     const auditInfo = getAuditInfo(req);
     logAction({
       ID_Utilisateur: req.user?.ID || null,
       Username: req.user?.Username || null,
       Action: 'UPDATE',
       Table_concernee: 'pointage',
       ID_Enregistrement: pointage[0].ID,
       Ancienne_valeur: oldValue,
       Nouvelle_valeur: updated[0],
       IP_address: auditInfo.IP_address,
       User_agent: auditInfo.User_agent
     }).catch(err => console.error('❌ Audit log failed:', err));
     
     res.json({
       success: true,
       message: 'Départ pointé avec succès',
       data: updated[0]
     });
  } catch (error) {
    console.error('Erreur pointerDepart:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du pointage de départ' 
    });
  }
};

// POST /api/pointage/absent - Signaler absence
exports.signalerAbsent = async (req, res) => {
  try {
    const { ID_Personnel, Matricule, Commentaire, Date: dateInput } = req.body;
    const targetDate = resolveTargetDate(dateInput);

    if (!isValidIsoDate(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date invalide (format: YYYY-MM-DD)'
      });
    }
    
    if (!ID_Personnel && !Matricule) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID Personnel ou Matricule requis' 
      });
    }
    
    let personnelId = ID_Personnel;
    let matricule = Matricule;
    let nom = '';
    
    if (Matricule && !personnelId) {
      const [pers] = await db.query('SELECT ID, Nom_prenom FROM personnel WHERE Matricule = ?', [Matricule]);
      if (pers.length > 0) {
        personnelId = pers[0].ID;
        nom = pers[0].Nom_prenom;
      }
    } else if (personnelId) {
      const [pers] = await db.query('SELECT Matricule, Nom_prenom FROM personnel WHERE ID = ?', [personnelId]);
      if (pers.length > 0) {
        matricule = pers[0].Matricule;
        nom = pers[0].Nom_prenom;
      }
    }

    if (!personnelId) {
      return res.status(404).json({
        success: false,
        error: 'Personnel introuvable'
      });
    }
    
    // Vérifier si déjà un pointage existe sur la date cible
    const [existingPointage] = await db.query(
      'SELECT ID, Absent, Entree, Sortie FROM pointage WHERE ID_Personnel = ? AND Date = ?',
      [personnelId, targetDate]
    );
    if (existingPointage.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Pointage déjà enregistré pour la date ${targetDate}`
      });
    }

    // Récupérer horaire prévu
    const [horaire] = await db.query(
      'SELECT Heure_debut, Heure_fin FROM horaires WHERE Date = ?',
      [targetDate]
    );
    
    const [result] = await db.query(
      `INSERT INTO pointage (
        ID_Personnel, Matricule, Nom, Date,
        Debut, Fin, Absent, Commentaire,
        Date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
      [
        personnelId,
        matricule || '',
        nom,
        targetDate,
        horaire.length > 0 ? horaire[0].Heure_debut : '08:00:00',
        horaire.length > 0 ? horaire[0].Heure_fin : '17:00:00',
        Commentaire || null
      ]
    );
    
    const [pointage] = await db.query(
      'SELECT * FROM pointage WHERE ID = ?',
      [result.insertId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.ID || null,
      Username: req.user?.Username || null,
      Action: 'CREATE',
      Table_concernee: 'pointage',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: pointage[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    // ✅ Nouvelle logique: Gérer les affectations en cours (clôturer si absence)
    const absenceResult = await pointageService.gererAbsence(
      result.insertId,
      auditInfo,
      { id: req.user?.ID, username: req.user?.Username }
    ).catch(err => {
      console.error('⚠️  Erreur lors de la gestion de l\'absence:', err);
      // Ne pas bloquer la réponse si la gestion de l'absence échoue
      return { success: false, error: err.message };
    });
    
    res.status(201).json({
      success: true,
      message: 'Absence signalée avec succès',
      data: pointage[0],
      absenceHandling: absenceResult
    });
  } catch (error) {
    console.error('Erreur signalerAbsent:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: `Pointage déjà enregistré pour la date ${req.body?.Date || 'courante'}`
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du signalement d\'absence' 
    });
  }
};

// GET /api/pointage/releve/mensuel/:mois/:annee - Relevé mensuel
exports.getReleveMensuel = async (req, res) => {
  try {
    const { mois, annee } = req.params;
    
    const [rows] = await db.query(`
      SELECT 
        p.ID_Personnel,
        pers.Nom_prenom,
        pers.Matricule,
        COUNT(CASE WHEN p.Absent = 1 THEN 1 END) as jours_absence,
        COUNT(CASE WHEN p.Retard IS NOT NULL THEN 1 END) as jours_retard,
        SEC_TO_TIME(SUM(TIME_TO_SEC(p.Presence_reelle))) as total_presence,
        SEC_TO_TIME(SUM(TIME_TO_SEC(p.Retard))) as total_retard,
        SEC_TO_TIME(SUM(TIME_TO_SEC(p.Depart_anticipe))) as total_depart_anticipe,
        SUM(p.H_sup) as total_heures_sup
      FROM pointage p
      LEFT JOIN personnel pers ON p.ID_Personnel = pers.ID
      WHERE MONTH(p.Date) = ? AND YEAR(p.Date) = ?
      GROUP BY p.ID_Personnel, pers.Nom_prenom, pers.Matricule
      ORDER BY pers.Nom_prenom
    `, [mois, annee]);
    
    res.json({
      success: true,
      mois: `${mois}/${annee}`,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getReleveMensuel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du relevé mensuel' 
    });
  }
};

// GET /api/pointage/statistiques/presence - Stats présence
exports.getStatistiquesPresence = async (req, res) => {
  try {
    const { debut, fin } = req.query;
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT Date) as jours_ouverts,
        COUNT(*) as total_pointages,
        SUM(CASE WHEN Absent = 1 THEN 1 ELSE 0 END) as total_absences,
        SUM(CASE WHEN Retard IS NOT NULL THEN 1 ELSE 0 END) as total_retards,
        SUM(CASE WHEN Depart_anticipe IS NOT NULL THEN 1 ELSE 0 END) as total_departs_anticipes,
        ROUND(AVG(TIME_TO_SEC(Presence_reelle)/3600), 2) as moyenne_heures_jour
      FROM pointage
      WHERE Date BETWEEN ? AND ?
    `, [debut, fin]);
    
    res.json({
      success: true,
      periode: { debut, fin },
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur getStatistiquesPresence:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// PATCH /api/pointage/:id/valider - Valider un pointage
exports.validerPointage = async (req, res) => {
  try {
    const pointageId = req.params.id;
    
    // Récupérer ancienne valeur
    const [existing] = await db.query('SELECT * FROM pointage WHERE ID = ?', [pointageId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pointage non trouvé' 
      });
    }
    const oldValue = existing[0];
    
    // Adapter la mise a jour au schema reel (certaines bases n'ont pas Est_valide)
    const [columns] = await db.query('SHOW COLUMNS FROM pointage');
    const columnNames = new Set((columns || []).map((c) => c.Field));
    const updates = [];
    const params = [];

    if (columnNames.has('Est_valide')) {
      updates.push('Est_valide = 1');
    }
    if (columnNames.has('Date_modification')) {
      updates.push('Date_modification = NOW()');
    }

    if (updates.length > 0) {
      await db.query(
        `UPDATE pointage SET ${updates.join(', ')} WHERE ID = ?`,
        [pointageId]
      );
    }
    
    const [updated] = await db.query('SELECT * FROM pointage WHERE ID = ?', [pointageId]);
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: req.user?.ID || null,
      Username: req.user?.Username || null,
      Action: 'UPDATE',
      Table_concernee: 'pointage',
      ID_Enregistrement: pointageId,
      Ancienne_valeur: oldValue,
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: updates.length > 0
        ? 'Pointage valide avec succes'
        : 'Pointage confirme (aucune colonne de validation disponible)',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur validerPointage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la validation du pointage' 
    });
  }
};

// POST /api/pointage/ajuster - Ajustement manuel (statut + heures)
exports.ajusterPointage = async (req, res) => {
  try {
    const { ID_Personnel, Matricule, Nom, Date: dateInput, Statut, Entree, Sortie, Commentaire } = req.body;
    const targetDate = resolveTargetDate(dateInput);

    if (!isValidIsoDate(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date invalide (format: YYYY-MM-DD)'
      });
    }

    if (!ID_Personnel && !Matricule) {
      return res.status(400).json({
        success: false,
        error: 'ID Personnel ou Matricule requis'
      });
    }

    const statutNormalise = String(Statut || '').toLowerCase();
    if (!['present', 'absent'].includes(statutNormalise)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide (present|absent)'
      });
    }

    const entreeNorm = normalizeTimeInput(Entree);
    const sortieNorm = normalizeTimeInput(Sortie);

    if (statutNormalise === 'present' && !entreeNorm) {
      return res.status(400).json({
        success: false,
        error: 'Heure d\'entrée requise pour statut present (HH:MM ou HH:MM:SS)'
      });
    }

    if ((Entree && !entreeNorm) || (Sortie && !sortieNorm)) {
      return res.status(400).json({
        success: false,
        error: 'Format heure invalide (HH:MM ou HH:MM:SS)'
      });
    }

    let personnelId = ID_Personnel;
    let matricule = Matricule;
    let nom = Nom || '';

    if (Matricule && !personnelId) {
      const [pers] = await db.query('SELECT ID, Nom_prenom FROM personnel WHERE Matricule = ?', [Matricule]);
      if (pers.length > 0) {
        personnelId = pers[0].ID;
        nom = pers[0].Nom_prenom;
      }
    } else if (personnelId) {
      const [pers] = await db.query('SELECT Matricule, Nom_prenom FROM personnel WHERE ID = ?', [personnelId]);
      if (pers.length > 0) {
        matricule = pers[0].Matricule;
        nom = nom || pers[0].Nom_prenom;
      }
    }

    if (!personnelId) {
      return res.status(404).json({
        success: false,
        error: 'Personnel introuvable'
      });
    }

    const [horaire] = await db.query(
      'SELECT Heure_debut, Heure_fin FROM horaires WHERE Date = ?',
      [targetDate]
    );
    const debutHoraire = horaire.length > 0 ? horaire[0].Heure_debut : '08:00:00';
    const finHoraire = horaire.length > 0 ? horaire[0].Heure_fin : '17:00:00';

    const [existing] = await db.query(
      'SELECT * FROM pointage WHERE ID_Personnel = ? AND Date = ?',
      [personnelId, targetDate]
    );

    const auditInfo = getAuditInfo(req);

    if (statutNormalise === 'absent') {
      if (existing.length > 0) {
        const oldValue = existing[0];
        await db.query(
          `UPDATE pointage SET
            Matricule = ?,
            Nom = ?,
            Debut = ?,
            Fin = ?,
            Entree = NULL,
            Sortie = NULL,
            Retard = NULL,
            Depart_anticipe = NULL,
            Presence_reelle = '00:00:00',
            Absent = 1,
            Commentaire = ?,
            Date_modification = NOW()
           WHERE ID = ?`,
          [matricule || '', nom || '', debutHoraire, finHoraire, Commentaire || null, existing[0].ID]
        );

        const [updated] = await db.query('SELECT * FROM pointage WHERE ID = ?', [existing[0].ID]);
        logAction({
          ID_Utilisateur: req.user?.ID || null,
          Username: req.user?.Username || null,
          Action: 'UPDATE',
          Table_concernee: 'pointage',
          ID_Enregistrement: existing[0].ID,
          Ancienne_valeur: oldValue,
          Nouvelle_valeur: updated[0],
          IP_address: auditInfo.IP_address,
          User_agent: auditInfo.User_agent
        }).catch(err => console.error('❌ Audit log failed:', err));

        return res.json({
          success: true,
          message: 'Pointage mis a jour (absent)',
          data: updated[0]
        });
      }

      const [result] = await db.query(
        `INSERT INTO pointage (
          ID_Personnel, Matricule, Nom, Date,
          Debut, Fin, Absent, Commentaire,
          Presence_reelle, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, '00:00:00', NOW())`,
        [personnelId, matricule || '', nom || '', targetDate, debutHoraire, finHoraire, Commentaire || null]
      );

      const [created] = await db.query('SELECT * FROM pointage WHERE ID = ?', [result.insertId]);
      logAction({
        ID_Utilisateur: req.user?.ID || null,
        Username: req.user?.Username || null,
        Action: 'CREATE',
        Table_concernee: 'pointage',
        ID_Enregistrement: result.insertId,
        Ancienne_valeur: null,
        Nouvelle_valeur: created[0],
        IP_address: auditInfo.IP_address,
        User_agent: auditInfo.User_agent
      }).catch(err => console.error('❌ Audit log failed:', err));

      return res.status(201).json({
        success: true,
        message: 'Pointage cree (absent)',
        data: created[0]
      });
    }

    const champs = calculerChampsPointage({
      entree: entreeNorm,
      sortie: sortieNorm,
      debutHoraire,
      finHoraire
    });

    if (existing.length > 0) {
      const oldValue = existing[0];
      await db.query(
        `UPDATE pointage SET
          Matricule = ?,
          Nom = ?,
          Debut = ?,
          Fin = ?,
          Entree = ?,
          Sortie = ?,
          Retard = ?,
          Depart_anticipe = ?,
          Presence_reelle = ?,
          Absent = 0,
          Commentaire = ?,
          Date_modification = NOW()
         WHERE ID = ?`,
        [
          matricule || '',
          nom || '',
          debutHoraire,
          finHoraire,
          entreeNorm,
          sortieNorm,
          champs.retard,
          champs.departAnticipe,
          champs.presenceReelle,
          Commentaire || null,
          existing[0].ID
        ]
      );

      const [updated] = await db.query('SELECT * FROM pointage WHERE ID = ?', [existing[0].ID]);
      logAction({
        ID_Utilisateur: req.user?.ID || null,
        Username: req.user?.Username || null,
        Action: 'UPDATE',
        Table_concernee: 'pointage',
        ID_Enregistrement: existing[0].ID,
        Ancienne_valeur: oldValue,
        Nouvelle_valeur: updated[0],
        IP_address: auditInfo.IP_address,
        User_agent: auditInfo.User_agent
      }).catch(err => console.error('❌ Audit log failed:', err));

      return res.json({
        success: true,
        message: 'Pointage mis a jour (present)',
        data: updated[0]
      });
    }

    const [result] = await db.query(
      `INSERT INTO pointage (
        ID_Personnel, Matricule, Nom, Date,
        Debut, Fin, Entree, Sortie, Retard, Depart_anticipe,
        Presence_reelle, Absent, Commentaire, Date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
      [
        personnelId,
        matricule || '',
        nom || '',
        targetDate,
        debutHoraire,
        finHoraire,
        entreeNorm,
        sortieNorm,
        champs.retard,
        champs.departAnticipe,
        champs.presenceReelle,
        Commentaire || null
      ]
    );

    const [created] = await db.query('SELECT * FROM pointage WHERE ID = ?', [result.insertId]);
    logAction({
      ID_Utilisateur: req.user?.ID || null,
      Username: req.user?.Username || null,
      Action: 'CREATE',
      Table_concernee: 'pointage',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: created[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'Pointage cree (present)',
      data: created[0]
    });
  } catch (error) {
    console.error('Erreur ajusterPointage:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: `Pointage déjà enregistré pour la date ${req.body?.Date || 'courante'}`
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise a jour manuelle du pointage'
    });
  }
};
