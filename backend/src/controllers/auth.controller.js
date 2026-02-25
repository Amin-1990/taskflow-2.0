const crypto = require('crypto');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logAction } = require('../services/audit.service');
const {
  getJwtSecret,
  getSessionDurationDays,
  getSessionMaxCount
} = require('../config/auth');

const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || process.env.JWT_EXPIRE || '15m';
const JWT_SECRET = getJwtSecret();
const MAX_SESSIONS = getSessionMaxCount();
const SESSION_DURATION_DAYS = getSessionDurationDays();
const MAX_FAILED_ATTEMPTS = Number.parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10) || 5;

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildRefreshExpiration = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  return expiresAt;
};

const buildAccessToken = (user, sessionId) =>
  jwt.sign(
    {
      id: user.ID,
      username: user.Username,
      email: user.Email,
      personnelId: user.ID_Personnel,
      sid: sessionId,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRE }
  );

const buildRefreshToken = () => crypto.randomBytes(48).toString('hex');

/**
 * Inscription (usage admin uniquement - route publique supprimée)
 */
exports.register = async (req, res) => {
  try {
    const { ID_Personnel, Username, Email, Password } = req.body;

    if (!Username || !Email || !Password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email et password sont requis'
      });
    }

    const [existing] = await db.query(
      'SELECT ID FROM utilisateurs WHERE Username = ? OR Email = ?',
      [Username, Email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username ou email deja utilise'
      });
    }

    const hashedPassword = await bcrypt.hash(Password, 12);

    const [result] = await db.query(
      `INSERT INTO utilisateurs (
        ID_Personnel, Username, Email, Password_hash,
        Est_actif, Est_verifie, Est_verrouille, Tentatives_echec,
        Double_auth_active, Date_creation
      ) VALUES (?, ?, ?, ?, 1, 1, 0, 0, 0, NOW())`,
      [ID_Personnel || null, Username, Email, hashedPassword]
    );

    logAction({
      ID_Utilisateur: result.insertId,
      Username,
      Action: 'REGISTER',
      Table_concernee: 'utilisateurs',
      ID_Enregistrement: result.insertId,
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch((err) => console.error('Erreur audit register:', err));

    return res.status(201).json({
      success: true,
      message: 'Utilisateur cree avec succes',
      data: { ID: result.insertId, Username, Email }
    });
  } catch (error) {
    console.error('Erreur register:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription'
    });
  }
};

/**
 * Connexion
 */
exports.login = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username et password requis'
      });
    }

    const [users] = await connection.query(
      `SELECT u.*, p.Nom_prenom, p.Poste, p.Site_affectation
       FROM utilisateurs u
       LEFT JOIN personnel p ON u.ID_Personnel = p.ID
       WHERE u.Username = ? OR u.Email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      logAction({
        Username: username,
        Action: 'LOGIN_FAILED',
        Table_concernee: 'auth',
        IP_address: req.ip,
        User_agent: req.get('User-Agent')
      }).catch((err) => console.error('Erreur audit login_failed:', err));

      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.Password_hash);
    if (!validPassword) {
      await connection.query(
        `UPDATE utilisateurs
         SET Tentatives_echec = Tentatives_echec + 1,
             Date_derniere_tentative = NOW(),
             Est_verrouille = CASE
               WHEN Tentatives_echec + 1 >= ? THEN 1
               ELSE Est_verrouille
             END,
             Date_verrouillage = CASE
               WHEN Tentatives_echec + 1 >= ? THEN NOW()
               ELSE Date_verrouillage
             END
         WHERE ID = ?`,
        [MAX_FAILED_ATTEMPTS, MAX_FAILED_ATTEMPTS, user.ID]
      );

      logAction({
        ID_Utilisateur: user.ID,
        Username: user.Username,
        Action: 'LOGIN_FAILED',
        Table_concernee: 'auth',
        IP_address: req.ip,
        User_agent: req.get('User-Agent')
      }).catch((err) => console.error('Erreur audit login_failed:', err));

      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    if (!user.Est_actif) {
      return res.status(403).json({
        success: false,
        error: 'Compte desactive'
      });
    }

    if (user.Est_verrouille) {
      return res.status(403).json({
        success: false,
        error: 'Compte verrouille'
      });
    }

    await connection.beginTransaction();

    await connection.query(
      'UPDATE utilisateurs SET Tentatives_echec = 0, Derniere_connexion = NOW() WHERE ID = ?',
      [user.ID]
    );

    const [activeSessions] = await connection.query(
      'SELECT COUNT(*) as count FROM sessions WHERE ID_Utilisateur = ? AND Est_active = 1',
      [user.ID]
    );

    if (activeSessions[0].count >= MAX_SESSIONS) {
      await connection.query(
        `UPDATE sessions
         SET Est_active = 0
         WHERE ID_Utilisateur = ? AND Est_active = 1
         ORDER BY Date_connexion ASC LIMIT 1`,
        [user.ID]
      );
    }

    const refreshToken = buildRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = buildRefreshExpiration();

    const [sessionResult] = await connection.query(
      `INSERT INTO sessions (
        ID_Utilisateur, Token_session, IP_address, User_agent,
        Date_connexion, Derniere_activite, Date_expiration, Est_active
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [user.ID, refreshTokenHash, req.ip, req.get('User-Agent'), refreshExpiresAt]
    );

    const accessToken = buildAccessToken(user, sessionResult.insertId);

    await connection.commit();

    logAction({
      ID_Utilisateur: user.ID,
      Username: user.Username,
      Action: 'LOGIN_SUCCESS',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch((err) => console.error('Erreur audit login_success:', err));

    return res.json({
      success: true,
      message: 'Connexion reussie',
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        user: {
          id: user.ID,
          username: user.Username,
          email: user.Email,
          nom_prenom: user.Nom_prenom,
          poste: user.Poste,
          site: user.Site_affectation
        },
        sessionId: sessionResult.insertId,
        accessTokenExpiresIn: ACCESS_TOKEN_EXPIRE,
        refreshTokenExpiresAt: refreshExpiresAt,
        expiresIn: refreshExpiresAt
      }
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Erreur rollback login:', rollbackError);
    }

    console.error('Erreur login:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  } finally {
    connection.release();
  }
};

/**
 * Deconnexion
 */
exports.logout = async (req, res) => {
  try {
    if (req.user?.sessionId) {
      await db.query('UPDATE sessions SET Est_active = 0 WHERE ID = ?', [req.user.sessionId]);
    }

    logAction({
      ID_Utilisateur: req.user?.ID,
      Username: req.user?.Username,
      Action: 'LOGOUT',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch((err) => console.error('Erreur audit logout:', err));

    return res.json({
      success: true,
      message: 'Deconnexion reussie'
    });
  } catch (error) {
    console.error('Erreur logout:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la deconnexion'
    });
  }
};

/**
 * Rafraichir le token via refresh token (rotation)
 */
exports.refreshToken = async (req, res) => {
  try {
    const providedRefreshToken = req.body.refreshToken || req.get('x-refresh-token');

    if (!providedRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token requis'
      });
    }

    const refreshTokenHash = hashRefreshToken(providedRefreshToken);

    const [sessions] = await db.query(
      `SELECT s.ID, s.ID_Utilisateur, s.Date_expiration, u.*
       FROM sessions s
       JOIN utilisateurs u ON u.ID = s.ID_Utilisateur
       WHERE s.Token_session = ?
         AND s.Est_active = 1
         AND s.Date_expiration > NOW()`,
      [refreshTokenHash]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token invalide ou expire'
      });
    }

    const session = sessions[0];

    if (!session.Est_actif || session.Est_verrouille) {
      return res.status(403).json({
        success: false,
        error: 'Compte non autorise'
      });
    }

    const newRefreshToken = buildRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const refreshExpiresAt = buildRefreshExpiration();

    await db.query(
      `UPDATE sessions
       SET Token_session = ?,
           Derniere_activite = NOW(),
           Date_expiration = ?
       WHERE ID = ?`,
      [newRefreshTokenHash, refreshExpiresAt, session.ID]
    );

    const accessToken = buildAccessToken(session, session.ID);

    logAction({
      ID_Utilisateur: session.ID_Utilisateur,
      Username: session.Username,
      Action: 'REFRESH_TOKEN',
      Table_concernee: 'auth',
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    }).catch((err) => console.error('Erreur audit refresh_token:', err));

    return res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        accessTokenExpiresIn: ACCESS_TOKEN_EXPIRE,
        refreshTokenExpiresAt: refreshExpiresAt,
        expiresIn: refreshExpiresAt
      }
    });
  } catch (error) {
    console.error('Erreur refreshToken:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du rafraichissement'
    });
  }
};

/**
 * Profil utilisateur connecte
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
        error: 'Utilisateur non trouve'
      });
    }

    const [roles] = await db.query(
      `SELECT r.ID, r.Code_role, r.Nom_role
       FROM utilisateurs_roles ur
       JOIN roles r ON ur.ID_Role = r.ID
       WHERE ur.ID_Utilisateur = ?`,
      [req.user.ID]
    );

    return res.json({
      success: true,
      data: {
        ...users[0],
        roles
      }
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du profil'
    });
  }
};
