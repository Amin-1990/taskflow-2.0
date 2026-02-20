const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/audit.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const MAX_SESSIONS = 5;

/**
 * Inscription
 */
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { ID_Personnel, Username, Email, Password } = req.body;

    // Validations minimales
    if (!Username || !Email || !Password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email et password sont requis' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await connection.query(
      'SELECT ID FROM utilisateurs WHERE Username = ? OR Email = ?',
      [Username, Email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username ou email déjà utilisé' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Créer l'utilisateur
    const [result] = await connection.query(
      `INSERT INTO utilisateurs (
        ID_Personnel, Username, Email, Password_hash,
        Est_actif, Est_verifie, Date_creation
      ) VALUES (?, ?, ?, ?, 1, 1, NOW())`,
      [ID_Personnel || null, Username, Email, hashedPassword]
    );

    await connection.commit();

    // Audit (asynchrone en arrière-plan)
    logAction({
      ID_Utilisateur: result.insertId,
      Username,
      Action: 'REGISTER',
      Table_concernee: 'utilisateurs',
      ID_Enregistrement: result.insertId,
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch(err => console.error('Erreur audit register:', err));

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { ID: result.insertId, Username, Email }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur register:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'inscription' 
    });
  } finally {
    connection.release();
  }
};

/**
 * Connexion
 */
exports.login = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username et password requis' 
      });
    }

    // Chercher l'utilisateur
    const [users] = await connection.query(
      `SELECT u.*, p.Nom_prenom, p.Poste, p.Site_affectation
       FROM utilisateurs u
       LEFT JOIN personnel p ON u.ID_Personnel = p.ID
       WHERE u.Username = ? OR u.Email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      await connection.commit();
      
      // Audit échec (asynchrone en arrière-plan)
      logAction({
        Username: username,
        Action: 'LOGIN_FAILED',
        Table_concernee: 'auth',
        IP_address: req.ip,
        User_agent: req.get('User-Agent')
      }).catch(err => console.error('Erreur audit login_failed:', err));
      
      return res.status(401).json({ 
        success: false, 
        error: 'Identifiants incorrects' 
      });
    }

    const user = users[0];

    // Vérifier mot de passe
    const validPassword = await bcrypt.compare(password, user.Password_hash);
    if (!validPassword) {
      // Incrémenter tentatives
      await connection.query(
        'UPDATE utilisateurs SET Tentatives_echec = Tentatives_echec + 1, Date_derniere_tentative = NOW() WHERE ID = ?',
        [user.ID]
      );

      await connection.commit();

      // Audit (asynchrone en arrière-plan)
      logAction({
        ID_Utilisateur: user.ID,
        Username: user.Username,
        Action: 'LOGIN_FAILED',
        Table_concernee: 'auth',
        IP_address: req.ip,
        User_agent: req.get('User-Agent')
      }).catch(err => console.error('Erreur audit login_failed:', err));
      
      return res.status(401).json({ 
        success: false, 
        error: 'Identifiants incorrects' 
      });
    }

    // Vérifier statut compte
    if (!user.Est_actif) {
      return res.status(403).json({ 
        success: false, 
        error: 'Compte désactivé' 
      });
    }

    if (user.Est_verrouille) {
      return res.status(403).json({ 
        success: false, 
        error: 'Compte verrouillé' 
      });
    }

    // Réinitialiser tentatives
    await connection.query(
      'UPDATE utilisateurs SET Tentatives_echec = 0, Derniere_connexion = NOW() WHERE ID = ?',
      [user.ID]
    );

    // Créer token JWT
    const token = jwt.sign(
      { 
        id: user.ID, 
        username: user.Username,
        email: user.Email,
        personnelId: user.ID_Personnel
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Date d'expiration
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 7);

    // Vérifier nombre de sessions
    const [activeSessions] = await connection.query(
      'SELECT COUNT(*) as count FROM sessions WHERE ID_Utilisateur = ? AND Est_active = 1',
      [user.ID]
    );

    if (activeSessions[0].count >= MAX_SESSIONS) {
      // Supprimer la plus ancienne
      await connection.query(
        `UPDATE sessions SET Est_active = 0 
         WHERE ID_Utilisateur = ? AND Est_active = 1 
         ORDER BY Date_connexion ASC LIMIT 1`,
        [user.ID]
      );
    }

    // Créer la session
    const [sessionResult] = await connection.query(
      `INSERT INTO sessions (
        ID_Utilisateur, Token_session, IP_address, User_agent,
        Date_connexion, Derniere_activite, Date_expiration, Est_active
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [user.ID, token, req.ip, req.get('User-Agent'), expiresIn]
    );

    await connection.commit();

    // Audit succès (asynchrone en arrière-plan)
    logAction({
      ID_Utilisateur: user.ID,
      Username: user.Username,
      Action: 'LOGIN_SUCCESS',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch(err => console.error('Erreur audit login_success:', err));

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.ID,
          username: user.Username,
          email: user.Email,
          nom_prenom: user.Nom_prenom,
          poste: user.Poste,
          site: user.Site_affectation
        },
        sessionId: sessionResult.insertId,
        expiresIn
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la connexion' 
    });
  } finally {
    connection.release();
  }
};

/**
 * Déconnexion
 */
exports.logout = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await connection.query(
        'UPDATE sessions SET Est_active = 0, Date_modification = NOW() WHERE Token_session = ?',
        [token]
      );
    }

    await connection.commit();

    // Audit (asynchrone en arrière-plan)
    logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'LOGOUT',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch(err => console.error('Erreur audit logout:', err));

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur logout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    });
  } finally {
    connection.release();
  }
};

/**
 * Rafraîchir le token
 */
exports.refreshToken = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const oldToken = req.headers.authorization?.split(' ')[1];
    
    if (!oldToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token requis' 
      });
    }

    const [sessions] = await connection.query(
      'SELECT * FROM sessions WHERE Token_session = ? AND Est_active = 1',
      [oldToken]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session invalide' 
      });
    }

    const session = sessions[0];

    const [users] = await connection.query(
      'SELECT * FROM utilisateurs WHERE ID = ?',
      [session.ID_Utilisateur]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const user = users[0];

    // Désactiver ancienne session
    await connection.query(
      'UPDATE sessions SET Est_active = 0 WHERE ID = ?',
      [session.ID]
    );

    // Nouveau token
    const newToken = jwt.sign(
      { id: user.ID, username: user.Username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 7);

    // Nouvelle session
    await connection.query(
      `INSERT INTO sessions (
        ID_Utilisateur, Token_session, IP_address, User_agent,
        Date_connexion, Derniere_activite, Date_expiration, Est_active
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [user.ID, newToken, req.ip, req.get('User-Agent'), expiresIn]
    );

    await connection.commit();

    // Audit (asynchrone en arrière-plan)
    logAction({
      ID_Utilisateur: user.ID,
      Username: user.Username,
      Action: 'REFRESH_TOKEN',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch(err => console.error('Erreur audit refresh_token:', err));

    res.json({
      success: true,
      data: { token: newToken, expiresIn }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur refreshToken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du rafraîchissement' 
    });
  } finally {
    connection.release();
  }
};

/**
 * Profil utilisateur connecté
 */
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.ID, u.Username, u.Email, u.Est_actif, u.Est_verifie,
              u.Derniere_connexion, u.Date_creation,
              p.ID as personnel_id, p.Nom_prenom, p.Matricule, p.Poste,
              p.Site_affectation, p.Telephone, p.Email as personnel_email
       FROM utilisateurs u
       LEFT JOIN personnel p ON u.ID_Personnel = p.ID
       WHERE u.ID = ?`,
      [req.user.ID]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Récupérer les rôles
    const [roles] = await db.query(
      `SELECT r.ID, r.Code_role, r.Nom_role
       FROM utilisateurs_roles ur
       JOIN roles r ON ur.ID_Role = r.ID
       WHERE ur.ID_Utilisateur = ?`,
      [req.user.ID]
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        roles
      }
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du profil' 
    });
  }
};