const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const { getSessionMaxCount } = require('../config/auth');

const sanitizeSession = (session) => {
  if (!session) return session;
  const { Token_session, ...safe } = session;
  return safe;
};

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

// GET /api/sessions - Récupérer toutes les sessions actives
exports.getAllSessions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.Username, u.Email, p.Nom_prenom
      FROM sessions s
      LEFT JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE s.Est_active = 1
      ORDER BY s.Date_connexion DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows.map(sanitizeSession)
    });
  } catch (error) {
    console.error('Erreur getAllSessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des sessions' 
    });
  }
};

// GET /api/sessions/utilisateur/:userId - Sessions d'un utilisateur
exports.getSessionsByUser = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM sessions 
      WHERE ID_Utilisateur = ? AND Est_active = 1
      ORDER BY Date_connexion DESC
    `, [req.params.userId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows.map(sanitizeSession)
    });
  } catch (error) {
    console.error('Erreur getSessionsByUser:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des sessions' 
    });
  }
};

// GET /api/sessions/:id - Récupérer une session par ID
exports.getSessionById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.Username, u.Email, p.Nom_prenom
      FROM sessions s
      LEFT JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE s.ID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: sanitizeSession(rows[0])
    });
  } catch (error) {
    console.error('Erreur getSessionById:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la session' 
    });
  }
};

// GET /api/sessions/token/:token - Récupérer session par token
exports.getSessionByToken = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.Username, u.Email
      FROM sessions s
      LEFT JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
      WHERE s.Token_session = ?
    `, [req.params.token]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session non trouvée' 
      });
    }
    
    res.json({
      success: true,
      data: sanitizeSession(rows[0])
    });
  } catch (error) {
    console.error('Erreur getSessionByToken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la session' 
    });
  }
};

// POST /api/sessions - Créer une nouvelle session (utilisé par login)
exports.createSession = async (req, res) => {
  try {
    const {
      ID_Utilisateur,
      Token_session,
      IP_address,
      User_agent,
      Date_expiration
    } = req.body;
    
    // Validations
    if (!ID_Utilisateur || !Token_session) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID Utilisateur et token sont requis' 
      });
    }
    
    // Vérifier le nombre de sessions actives
    const [activeSessions] = await db.query(
      'SELECT COUNT(*) as count FROM sessions WHERE ID_Utilisateur = ? AND Est_active = 1',
      [ID_Utilisateur]
    );
    
    const MAX_SESSIONS = getSessionMaxCount();
    
    if (activeSessions[0].count >= MAX_SESSIONS) {
      // Déconnecter la plus ancienne session
      await db.query(
        `UPDATE sessions SET Est_active = 0 
WHERE ID_Utilisateur = ? AND Est_active = 1 
         ORDER BY Date_connexion ASC LIMIT 1`,
        [ID_Utilisateur]
      );
    }
    
    const [result] = await db.query(
      `INSERT INTO sessions (
        ID_Utilisateur, Token_session, IP_address, User_agent,
        Date_connexion, Derniere_activite, Date_expiration, Est_active) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [
        ID_Utilisateur,
        Token_session,
        IP_address || null,
        User_agent || null,
        Date_expiration
      ]
    );
    
    const [newSession] = await db.query(
      'SELECT * FROM sessions WHERE ID = ?',
      [result.insertId]
    );
    
    // Log audit - LOGIN action
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: ID_Utilisateur,
      Username: null, // Sera rempli par la requête
      Action: 'LOGIN',
      Table_concernee: 'sessions',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: { session_id: result.insertId, user_id: ID_Utilisateur },
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.status(201).json({
      success: true,
      message: 'Session créée avec succès',
      data: sanitizeSession(newSession[0])
    });
  } catch (error) {
    console.error('Erreur createSession:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce token existe déjà' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la session' 
    });
  }
};

// PATCH /api/sessions/:id/activite - Mettre à jour la dernière activité
exports.updateActivite = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE sessions SET Derniere_activite = NOW() WHERE ID = ? AND Est_active = 1',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session non trouvée ou inactive' 
      });
    }
    
    const [updated] = await db.query(
      'SELECT * FROM sessions WHERE ID = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Dernière activité mise à jour',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateActivite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour' 
    });
  }
};

// PATCH /api/sessions/:id/deconnecter - Déconnecter une session
exports.deconnecterSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Récupérer la session avant modification
    const [existing] = await db.query('SELECT * FROM sessions WHERE ID = ?', [sessionId]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session non trouvée' 
      });
    }
    
    const [result] = await db.query(
      'UPDATE sessions SET Est_active = 0 WHERE ID = ?',
      [sessionId]
    );
    
    // Log audit - LOGOUT action
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: existing[0].ID_Utilisateur,
      Username: req.user?.username || null,
      Action: 'LOGOUT',
      Table_concernee: 'sessions',
      ID_Enregistrement: sessionId,
      Ancienne_valeur: null,
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: 'Session déconnectée avec succès'
    });
  } catch (error) {
    console.error('Erreur deconnecterSession:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    });
  }
};

// POST /api/sessions/deconnecter/toutes/:userId - Déconnecter toutes les sessions d'un utilisateur
exports.deconnecterToutesSessions = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [result] = await db.query(
      'UPDATE sessions SET Est_active = 0 WHERE ID_Utilisateur = ?',
      [userId]
    );
    
    // Log audit
    const auditInfo = getAuditInfo(req);
    logAction({
      ID_Utilisateur: userId,
      Username: req.user?.username || null,
      Action: 'LOGOUT',
      Table_concernee: 'sessions',
      ID_Enregistrement: null,
      Ancienne_valeur: null,
      Nouvelle_valeur: { sessions_deconnectees: result.affectedRows },
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch(err => console.error('❌ Audit log failed:', err));
    
    res.json({
      success: true,
      message: `${result.affectedRows} sessions déconnectées`
    });
  } catch (error) {
    console.error('Erreur deconnecterToutesSessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    });
  }
};

// DELETE /api/sessions/expirees - Nettoyer les sessions expirées
exports.nettoyerSessionsExpirees = async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM sessions 
       WHERE Date_expiration < NOW() 
          OR (Est_active = 0 AND Derniere_activite < DATE_SUB(NOW(), INTERVAL 7 DAY))`
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} sessions nettoyées`
    });
  } catch (error) {
    console.error('Erreur nettoyerSessionsExpirees:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du nettoyage' 
    });
  }
};

// GET /api/sessions/statistiques - Statistiques des sessions
exports.getStatistiques = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN Est_active = 1 THEN 1 ELSE 0 END) as sessions_actives,
        COUNT(DISTINCT ID_Utilisateur) as utilisateurs_connectes,
        AVG(TIMESTAMPDIFF(MINUTE, Date_connexion, Derniere_activite)) as duree_moyenne_minutes
      FROM sessions
      WHERE Est_active = 1
    `);
    
    const [parUser] = await db.query(`
      SELECT 
        u.Username,
        p.Nom_prenom,
        COUNT(s.ID) as nb_sessions
      FROM sessions s
      LEFT JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
      LEFT JOIN personnel p ON u.ID_Personnel = p.ID
      WHERE s.Est_active = 1
      GROUP BY s.ID_Utilisateur, u.Username, p.Nom_prenom
      ORDER BY nb_sessions DESC
    `);
    
    res.json({
      success: true,
      data: {
        resume: stats[0],
        detail_utilisateurs: parUser
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

// GET /api/sessions/verifier/:token - Vérifier si un token est valide
exports.verifierToken = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.Username, u.Email
      FROM sessions s
      LEFT JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
      WHERE s.Token_session = ? 
        AND s.Est_active = 1 
        AND s.Date_expiration > NOW()
    `, [req.params.token]);
    
    if (rows.length === 0) {
      return res.json({
        success: false,
        valide: false,
        message: 'Token invalide ou expiré'
      });
    }
    
    // Mettre à jour la dernière activité
    await db.query(
      'UPDATE sessions SET Derniere_activite = NOW() WHERE ID = ?',
      [rows[0].ID]
    );
    
    res.json({
      success: true,
      valide: true,
      data: {
        utilisateur: {
          id: rows[0].ID_Utilisateur,
          username: rows[0].Username,
          email: rows[0].Email
        },
        session: {
          id: rows[0].ID,
          connexion: rows[0].Date_connexion,
          expiration: rows[0].Date_expiration,
          ip: rows[0].IP_address
        }
      }
    });
  } catch (error) {
    console.error('Erreur verifierToken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification' 
    });
  }
};


