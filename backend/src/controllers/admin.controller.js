const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const { getSessionDurationDays } = require('../config/auth');

const SESSION_DURATION_DAYS = getSessionDurationDays();

const sanitizeUser = (user) => {
  if (!user) return user;
  const { Password_hash, Secret_2fa, Token_reset, ...safe } = user;
  return safe;
};

const sanitizeSession = (session) => {
  if (!session) return session;
  const { Token_session, ...safe } = session;
  return safe;
};

exports.getDashboard = async (req, res) => {
  try {
    const [[users]] = await db.query(
      `SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN Est_actif = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN Est_verrouille = 1 THEN 1 ELSE 0 END) as locked_users
       FROM utilisateurs`
    );

    const [[roles]] = await db.query(
      `SELECT
        COUNT(*) as total_roles,
        SUM(CASE WHEN Est_actif = 1 THEN 1 ELSE 0 END) as active_roles
       FROM roles`
    );

    const [[permissions]] = await db.query('SELECT COUNT(*) as total_permissions FROM permissions');
    const [[sessions]] = await db.query(
      `SELECT
        COUNT(*) as active_sessions,
        COUNT(DISTINCT ID_Utilisateur) as connected_users
       FROM sessions
       WHERE Est_active = 1 AND Date_expiration > NOW()`
    );

    const [[audit]] = await db.query(
      `SELECT COUNT(*) as logs_last_24h
       FROM logs_audit
       WHERE Date_action >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
    );

    res.json({
      success: true,
      data: { users, roles, permissions, sessions, audit }
    });
  } catch (error) {
    console.error('Erreur admin getDashboard:', error);
    res.status(500).json({ success: false, error: 'Erreur dashboard admin' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        u.ID, u.ID_Personnel, u.Username, u.Email, u.Est_actif, u.Est_verifie,
        u.Est_verrouille, u.Tentatives_echec, u.Derniere_connexion,
        u.Date_creation, u.Date_modification,
        p.Nom_prenom
       FROM utilisateurs u
       LEFT JOIN personnel p ON p.ID = u.ID_Personnel
       ORDER BY u.ID DESC`
    );

    res.json({ success: true, count: rows.length, data: rows.map(sanitizeUser) });
  } catch (error) {
    console.error('Erreur admin listUsers:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture utilisateurs' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query('SELECT * FROM utilisateurs WHERE ID = ?', [userId]);
    if (!users.length) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouve' });
    }

    const [roles] = await db.query(
      `SELECT r.ID, r.Code_role, r.Nom_role, r.Niveau_priorite
       FROM utilisateurs_roles ur
       JOIN roles r ON r.ID = ur.ID_Role
       WHERE ur.ID_Utilisateur = ?`,
      [userId]
    );

    const [permissions] = await db.query(
      `SELECT p.ID, p.Code_permission, p.Nom_permission, up.Type, up.Expiration
       FROM utilisateurs_permissions up
       JOIN permissions p ON p.ID = up.ID_Permission
       WHERE up.ID_Utilisateur = ?`,
      [userId]
    );

    const [sessions] = await db.query(
      `SELECT *
       FROM sessions
       WHERE ID_Utilisateur = ?
       ORDER BY Date_connexion DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: sanitizeUser(users[0]),
        roles,
        permissions,
        sessions: sessions.map(sanitizeSession)
      }
    });
  } catch (error) {
    console.error('Erreur admin getUserDetail:', error);
    res.status(500).json({ success: false, error: 'Erreur detail utilisateur' });
  }
};

exports.createUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { ID_Personnel, Username, Email, Password, roles = [] } = req.body;
    if (!Username || !Email || !Password) {
      return res.status(400).json({ success: false, error: 'Username, Email, Password requis' });
    }

    const [existing] = await connection.query(
      'SELECT ID FROM utilisateurs WHERE Username = ? OR Email = ?',
      [Username, Email]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Username ou Email deja utilise' });
    }

    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(Password, 12);
    const [result] = await connection.query(
      `INSERT INTO utilisateurs (
        ID_Personnel, Username, Email, Password_hash,
        Est_actif, Est_verifie, Est_verrouille, Tentatives_echec,
        Double_auth_active, Date_creation
      ) VALUES (?, ?, ?, ?, 1, 1, 0, 0, 0, NOW())`,
      [ID_Personnel || null, Username, Email, hashedPassword]
    );

    if (Array.isArray(roles) && roles.length) {
      for (const roleId of roles) {
        await connection.query(
          `INSERT IGNORE INTO utilisateurs_roles (ID_Utilisateur, ID_Role, Date_assignation, Assigne_par)
           VALUES (?, ?, NOW(), ?)`,
          [result.insertId, roleId, req.user.ID]
        );
      }
    }

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user.ID,
      Username: req.user.Username,
      Action: 'ADMIN_CREATE_USER',
      Table_concernee: 'utilisateurs',
      ID_Enregistrement: result.insertId,
      Nouvelle_valeur: { Username, Email, roles },
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.status(201).json({ success: true, data: { ID: result.insertId, Username, Email } });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin createUser:', error);
    res.status(500).json({ success: false, error: 'Erreur creation utilisateur' });
  } finally {
    connection.release();
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { Username, Email, ID_Personnel, Est_verifie } = req.body;

    await db.query(
      `UPDATE utilisateurs
       SET Username = COALESCE(?, Username),
           Email = COALESCE(?, Email),
           ID_Personnel = COALESCE(?, ID_Personnel),
           Est_verifie = COALESCE(?, Est_verifie),
           Date_modification = NOW()
       WHERE ID = ?`,
      [Username ?? null, Email ?? null, ID_Personnel ?? null, Est_verifie ?? null, userId]
    );

    res.json({ success: true, message: 'Utilisateur mis a jour' });
  } catch (error) {
    console.error('Erreur admin updateUser:', error);
    res.status(500).json({ success: false, error: 'Erreur mise a jour utilisateur' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { Est_actif, Est_verrouille } = req.body;

    await db.query(
      `UPDATE utilisateurs
       SET Est_actif = COALESCE(?, Est_actif),
           Est_verrouille = COALESCE(?, Est_verrouille),
           Date_verrouillage = CASE
             WHEN COALESCE(?, Est_verrouille) = 1 THEN NOW()
             ELSE Date_verrouillage
           END,
           Date_modification = NOW()
       WHERE ID = ?`,
      [Est_actif ?? null, Est_verrouille ?? null, Est_verrouille ?? null, userId]
    );

    const shouldDisableSessions =
      Est_actif === 0 ||
      Est_actif === false ||
      Est_verrouille === 1 ||
      Est_verrouille === true;

    if (shouldDisableSessions) {
      await db.query(
        'UPDATE sessions SET Est_active = 0 WHERE ID_Utilisateur = ?',
        [userId]
      );
    }

    res.json({ success: true, message: 'Statut utilisateur mis a jour' });
  } catch (error) {
    console.error('Erreur admin updateUserStatus:', error);
    res.status(500).json({ success: false, error: 'Erreur statut utilisateur' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { New_password } = req.body;
    if (!New_password || New_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Nouveau mot de passe invalide' });
    }

    const hash = await bcrypt.hash(New_password, 12);
    await db.query(
      `UPDATE utilisateurs
       SET Password_hash = ?,
           Tentatives_echec = 0,
           Token_reset = NULL,
           Token_expiration = NULL,
           Date_modification = NOW()
       WHERE ID = ?`,
      [hash, userId]
    );

    await db.query('UPDATE sessions SET Est_active = 0 WHERE ID_Utilisateur = ?', [userId]);

    res.json({ success: true, message: 'Mot de passe reinitialise' });
  } catch (error) {
    console.error('Erreur admin resetUserPassword:', error);
    res.status(500).json({ success: false, error: 'Erreur reinitialisation mot de passe' });
  }
};

exports.replaceUserRoles = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.params.id;
    const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds : [];

    await connection.query('DELETE FROM utilisateurs_roles WHERE ID_Utilisateur = ?', [userId]);
    for (const roleId of roleIds) {
      await connection.query(
        `INSERT INTO utilisateurs_roles (ID_Utilisateur, ID_Role, Date_assignation, Assigne_par)
         VALUES (?, ?, NOW(), ?)`,
        [userId, roleId, req.user.ID]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Roles utilisateur mis a jour' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin replaceUserRoles:', error);
    res.status(500).json({ success: false, error: 'Erreur mise a jour roles utilisateur' });
  } finally {
    connection.release();
  }
};

exports.replaceUserPermissions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.params.id;
    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];

    await connection.query('DELETE FROM utilisateurs_permissions WHERE ID_Utilisateur = ?', [userId]);

    for (const p of permissions) {
      await connection.query(
        `INSERT INTO utilisateurs_permissions (
          ID_Utilisateur, ID_Permission, Type, Date_assignation, Assigne_par, Expiration
         ) VALUES (?, ?, ?, NOW(), ?, ?)`,
        [userId, p.permissionId, p.type || 'ACCORDER', req.user.ID, p.expiration || null]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Permissions utilisateur mises a jour' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin replaceUserPermissions:', error);
    res.status(500).json({ success: false, error: 'Erreur mise a jour permissions utilisateur' });
  } finally {
    connection.release();
  }
};

exports.listRoles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*,
              COUNT(DISTINCT ur.ID_Utilisateur) as users_count,
              COUNT(DISTINCT rp.ID_Permission) as permissions_count
       FROM roles r
       LEFT JOIN utilisateurs_roles ur ON ur.ID_Role = r.ID
       LEFT JOIN roles_permissions rp ON rp.ID_Role = r.ID
       GROUP BY r.ID
       ORDER BY r.Niveau_priorite DESC, r.Nom_role ASC`
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Erreur admin listRoles:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture roles' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { Code_role, Nom_role, Description, Niveau_priorite = 10, Est_systeme = 0, Est_actif = 1 } = req.body;
    if (!Code_role || !Nom_role) {
      return res.status(400).json({ success: false, error: 'Code_role et Nom_role requis' });
    }

    const [result] = await db.query(
      `INSERT INTO roles (
        Code_role, Nom_role, Description, Niveau_priorite,
        Est_systeme, Est_actif, Date_creation, Date_modification
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [Code_role, Nom_role, Description || null, Niveau_priorite, Est_systeme, Est_actif]
    );

    res.status(201).json({ success: true, data: { ID: result.insertId, Code_role, Nom_role } });
  } catch (error) {
    console.error('Erreur admin createRole:', error);
    res.status(500).json({ success: false, error: 'Erreur creation role' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { Nom_role, Description, Niveau_priorite, Est_actif } = req.body;
    await db.query(
      `UPDATE roles
       SET Nom_role = COALESCE(?, Nom_role),
           Description = COALESCE(?, Description),
           Niveau_priorite = COALESCE(?, Niveau_priorite),
           Est_actif = COALESCE(?, Est_actif),
           Date_modification = NOW()
       WHERE ID = ?`,
      [Nom_role ?? null, Description ?? null, Niveau_priorite ?? null, Est_actif ?? null, roleId]
    );

    res.json({ success: true, message: 'Role mis a jour' });
  } catch (error) {
    console.error('Erreur admin updateRole:', error);
    res.status(500).json({ success: false, error: 'Erreur mise a jour role' });
  }
};

exports.replaceRolePermissions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const roleId = req.params.id;
    const permissionIds = Array.isArray(req.body.permissionIds) ? req.body.permissionIds : [];

    await connection.query('DELETE FROM roles_permissions WHERE ID_Role = ?', [roleId]);
    for (const permissionId of permissionIds) {
      await connection.query(
        'INSERT INTO roles_permissions (ID_Role, ID_Permission) VALUES (?, ?)',
        [roleId, permissionId]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Permissions role mises a jour' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin replaceRolePermissions:', error);
    res.status(500).json({ success: false, error: 'Erreur permissions role' });
  } finally {
    connection.release();
  }
};

exports.listPermissions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM permissions
       ORDER BY Categorie ASC, Nom_permission ASC`
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Erreur admin listPermissions:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture permissions' });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.Username, u.Email
       FROM sessions s
       JOIN utilisateurs u ON u.ID = s.ID_Utilisateur
       ORDER BY s.Date_connexion DESC
       LIMIT 1000`
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map(sanitizeSession)
    });
  } catch (error) {
    console.error('Erreur admin listSessions:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture sessions' });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    await db.query('UPDATE sessions SET Est_active = 0 WHERE ID = ?', [sessionId]);
    res.json({ success: true, message: 'Session revoquee' });
  } catch (error) {
    console.error('Erreur admin revokeSession:', error);
    res.status(500).json({ success: false, error: 'Erreur revocation session' });
  }
};

exports.listAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 2000);
    const [rows] = await db.query(
      `SELECT l.*, u.Username as Username_utilisateur
       FROM logs_audit l
       LEFT JOIN utilisateurs u ON u.ID = l.ID_Utilisateur
       ORDER BY l.Date_action DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Erreur admin listAuditLogs:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture audit' });
  }
};

exports.forceExpireUserSessions = async (req, res) => {
  try {
    const userId = req.params.id;
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + SESSION_DURATION_DAYS);

    await db.query(
      `UPDATE sessions
       SET Est_active = 0,
           Date_expiration = LEAST(Date_expiration, NOW())
       WHERE ID_Utilisateur = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Toutes les sessions de l utilisateur ont ete forcees a expirer',
      expires_reference: expiresIn
    });
  } catch (error) {
    console.error('Erreur admin forceExpireUserSessions:', error);
    res.status(500).json({ success: false, error: 'Erreur expiration sessions utilisateur' });
  }
};
