const db = require('../config/database');

// GET /api/audit - Récupérer tous les logs
exports.getAllLogs = async (req, res) => {
  try {
    let query = `
      SELECT l.*, u.Username, p.Nom_prenom
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      ORDER BY l.Date_action DESC
    `;
    
    // Limiter si trop de données
    if (!req.query.all) {
      query += ' LIMIT 1000';
    }
    
    const [rows] = await db.query(query);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllLogs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/:id - Récupérer un log par ID
exports.getLogById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.Username, p.Nom_prenom
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE l.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Log non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erreur getLogById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du log' 
    });
  }
};

// GET /api/audit/utilisateur/:userId - Logs d'un utilisateur
exports.getLogsByUser = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.Username
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE l.ID_Utilisateur = ?
      ORDER BY l.Date_action DESC
    `, [req.params.userId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getLogsByUser:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/table/:table - Logs d'une table
exports.getLogsByTable = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.Username
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE l.Table_concernee = ?
      ORDER BY l.Date_action DESC
    `, [req.params.table]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getLogsByTable:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/action/:action - Logs par type d'action
exports.getLogsByAction = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.Username
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE l.Action = ?
      ORDER BY l.Date_action DESC
    `, [req.params.action]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getLogsByAction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/date/:date - Logs d'une date spécifique
exports.getLogsByDate = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.Username
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE DATE(l.Date_action) = ?
      ORDER BY l.Date_action DESC
    `, [req.params.date]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getLogsByDate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/periode - Logs sur une période
exports.getLogsByPeriode = async (req, res) => {
  try {
    const { debut, fin, utilisateur, table, action } = req.query;
    
    let query = `
      SELECT l.*, u.Username, p.Nom_prenom
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE DATE(l.Date_action) BETWEEN ? AND ?
    `;
    const params = [debut, fin];
    
    if (utilisateur) {
      query += ` AND l.ID_Utilisateur = ?`;
      params.push(utilisateur);
    }
    
    if (table) {
      query += ` AND l.Table_concernee = ?`;
      params.push(table);
    }
    
    if (action) {
      query += ` AND l.Action = ?`;
      params.push(action);
    }
    
    query += ` ORDER BY l.Date_action DESC`;
    
    const [rows] = await db.query(query, params);
    
    res.json({
      success: true,
      periode: { debut, fin },
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getLogsByPeriode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
};

// GET /api/audit/enregistrement/:table/:id - Historique d'un enregistrement
exports.getHistoriqueEnregistrement = async (req, res) => {
  try {
    const { table, id } = req.params;
    
    const [rows] = await db.query(`
      SELECT l.*, u.Username
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE l.Table_concernee = ? AND l.ID_Enregistrement = ?
      ORDER BY l.Date_action DESC
    `, [table, id]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getHistoriqueEnregistrement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
};

// POST /api/audit - Créer un log (utilisé par le système)
exports.createLog = async (req, res) => {
  try {
    const {
      ID_Utilisateur,
      Username,
      Action,
      Table_concernee,
      ID_Enregistrement,
      Ancienne_valeur,
      Nouvelle_valeur,
      IP_address,
      User_agent
    } = req.body;
    
    // Validation minimale
    if (!Action || !Table_concernee) {
      return res.status(400).json({ 
        success: false, 
        error: 'Action et table concernée sont requis' 
      });
    }
    
    const actorId = req.user?.ID || ID_Utilisateur || null;
    const actorUsername = req.user?.Username || Username || null;

    const [result] = await db.query(
      `INSERT INTO logs_audit (
        ID_Utilisateur, Username, Action, Table_concernee,
        ID_Enregistrement, Ancienne_valeur, Nouvelle_valeur,
        IP_address, User_agent, Date_action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        actorId,
        actorUsername,
        Action,
        Table_concernee,
        ID_Enregistrement || null,
        Ancienne_valeur ? JSON.stringify(Ancienne_valeur) : null,
        Nouvelle_valeur ? JSON.stringify(Nouvelle_valeur) : null,
        IP_address || null,
        User_agent || null
      ]
    );
    
    const [newLog] = await db.query(
      'SELECT * FROM logs_audit WHERE ID = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Log créé avec succès',
      data: newLog[0]
    });
  } catch (error) {
    console.error('Erreur createLog:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du log' 
    });
  }
};

// DELETE /api/audit/ancien/:jours - Supprimer les logs anciens
exports.supprimerAnciensLogs = async (req, res) => {
  try {
    const { jours } = req.params;
    
    const [result] = await db.query(
      'DELETE FROM logs_audit WHERE Date_action < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [jours]
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} logs supprimés`
    });
  } catch (error) {
    console.error('Erreur supprimerAnciensLogs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression' 
    });
  }
};

// GET /api/audit/statistiques - Statistiques des logs
exports.getStatistiques = async (req, res) => {
  try {
    const { debut, fin } = req.query;
    
    // Actions les plus fréquentes
    const [topActions] = await db.query(`
      SELECT 
        Action,
        COUNT(*) as occurrences
      FROM logs_audit
      WHERE DATE(Date_action) BETWEEN ? AND ?
      GROUP BY Action
      ORDER BY occurrences DESC
    `, [debut, fin]);
    
    // Tables les plus modifiées
    const [topTables] = await db.query(`
      SELECT 
        Table_concernee,
        COUNT(*) as nb_modifications
      FROM logs_audit
      WHERE DATE(Date_action) BETWEEN ? AND ?
      GROUP BY Table_concernee
      ORDER BY nb_modifications DESC
    `, [debut, fin]);
    
    // Utilisateurs les plus actifs
    const [topUsers] = await db.query(`
      SELECT 
        u.Username,
        p.Nom_prenom,
        COUNT(*) as nb_actions
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE DATE(l.Date_action) BETWEEN ? AND ?
      GROUP BY l.ID_Utilisateur, u.Username, p.Nom_prenom
      ORDER BY nb_actions DESC
    `, [debut, fin]);
    
    // Évolution journalière
    const [evolution] = await db.query(`
      SELECT 
        DATE(Date_action) as jour,
        COUNT(*) as nb_logs
      FROM logs_audit
      WHERE DATE(Date_action) BETWEEN ? AND ?
      GROUP BY DATE(Date_action)
      ORDER BY jour
    `, [debut, fin]);
    
    res.json({
      success: true,
      periode: { debut, fin },
      data: {
        top_actions: topActions,
        top_tables: topTables,
        top_utilisateurs: topUsers,
        evolution: evolution
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du calcul des statistiques' 
    });
  }
};

// GET /api/audit/export - Exporter les logs (pour audit externe)
exports.exportLogs = async (req, res) => {
  try {
    const { debut, fin, format = 'json' } = req.query;
    
    const [rows] = await db.query(`
      SELECT 
        l.Date_action,
        l.Action,
        l.Table_concernee,
        l.ID_Enregistrement,
        COALESCE(u.Username, l.Username) as Utilisateur,
        l.IP_address,
        l.Ancienne_valeur,
        l.Nouvelle_valeur
      FROM logs_audit l
      LEFT JOIN utilisateurs u ON l.ID_Utilisateur = u.ID
      WHERE DATE(l.Date_action) BETWEEN ? AND ?
      ORDER BY l.Date_action DESC
    `, [debut, fin]);
    
    if (format === 'csv') {
      // Format CSV
      const csv = [
        ['Date', 'Action', 'Table', 'ID', 'Utilisateur', 'IP', 'Ancien', 'Nouveau'].join(','),
        ...rows.map(r => [
          r.Date_action,
          r.Action,
          r.Table_concernee,
          r.ID_Enregistrement,
          r.Utilisateur,
          r.IP_address,
          r.Ancienne_valeur ? '"' + JSON.stringify(r.Ancienne_valeur).replace(/"/g, '""') + '"' : '',
          r.Nouvelle_valeur ? '"' + JSON.stringify(r.Nouvelle_valeur).replace(/"/g, '""') + '"' : ''
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_${debut}_${fin}.csv`);
      return res.send(csv);
    }
    
    // Format JSON par défaut
    res.json({
      success: true,
      periode: { debut, fin },
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur exportLogs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'export' 
    });
  }
};
