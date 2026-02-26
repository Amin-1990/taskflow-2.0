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

const DEFAULT_LIST_LIMIT = 25;
const MAX_LIST_LIMIT = 100;

const parseListQuery = (req, { defaultSortBy, allowedSortMap, defaultSortDir = 'desc' }) => {
  const rawPage = parseInt(req.query.page || '1', 10);
  const rawLimit = parseInt(req.query.limit || String(DEFAULT_LIST_LIMIT), 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIST_LIMIT) : DEFAULT_LIST_LIMIT;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const requestedSortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : defaultSortBy;
  const sortBy = Object.prototype.hasOwnProperty.call(allowedSortMap, requestedSortBy) ? requestedSortBy : defaultSortBy;
  const requestedSortDir = typeof req.query.sortDir === 'string' ? req.query.sortDir.toLowerCase() : defaultSortDir;
  const sortDir = requestedSortDir === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    search,
    sortBy,
    sortDir,
    sortExpr: allowedSortMap[sortBy]
  };
};

const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0
});

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
    const q = parseListQuery(req, {
      defaultSortBy: 'ID',
      allowedSortMap: {
        ID: 'u.ID',
        Username: 'u.Username',
        Email: 'u.Email',
        Nom_prenom: 'p.Nom_prenom',
        Est_actif: 'u.Est_actif',
        Est_verrouille: 'u.Est_verrouille',
        Derniere_connexion: 'u.Derniere_connexion',
        Date_creation: 'u.Date_creation'
      },
      defaultSortDir: 'desc'
    });

    const where = [];
    const params = [];

    if (q.search) {
      where.push('(u.Username LIKE ? OR u.Email LIKE ? OR p.Nom_prenom LIKE ?)');
      const like = `%${q.search}%`;
      params.push(like, like, like);
    }

    if (req.query.status === 'active') {
      where.push('u.Est_actif = 1 AND u.Est_verrouille = 0');
    } else if (req.query.status === 'inactive') {
      where.push('u.Est_actif = 0');
    } else if (req.query.status === 'locked') {
      where.push('u.Est_verrouille = 1');
    }

    if (req.query.roleId) {
      where.push('ur.ID_Role = ?');
      params.push(Number(req.query.roleId));
    }

    if (req.query.createdFrom) {
      where.push('DATE(u.Date_creation) >= ?');
      params.push(req.query.createdFrom);
    }
    if (req.query.createdTo) {
      where.push('DATE(u.Date_creation) <= ?');
      params.push(req.query.createdTo);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(DISTINCT u.ID) as total
       FROM utilisateurs u
       LEFT JOIN personnel p ON p.ID = u.ID_Personnel
       LEFT JOIN utilisateurs_roles ur ON ur.ID_Utilisateur = u.ID
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.query(
      `SELECT
        u.ID, u.ID_Personnel, u.Username, u.Email, u.Est_actif, u.Est_verifie,
        u.Est_verrouille, u.Tentatives_echec, u.Derniere_connexion,
        u.Date_creation, u.Date_modification,
        p.Nom_prenom,
        GROUP_CONCAT(DISTINCT r.Nom_role ORDER BY r.Nom_role SEPARATOR ', ') AS Roles_labels
       FROM utilisateurs u
       LEFT JOIN personnel p ON p.ID = u.ID_Personnel
       LEFT JOIN utilisateurs_roles ur ON ur.ID_Utilisateur = u.ID
       LEFT JOIN roles r ON r.ID = ur.ID_Role
       ${whereSql}
       GROUP BY u.ID
       ORDER BY ${q.sortExpr} ${q.sortDir}
       LIMIT ? OFFSET ?`,
      [...params, q.limit, q.offset]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map(sanitizeUser),
      pagination: paginationMeta(q.page, q.limit, total),
      filtersApplied: {
        search: q.search || null,
        status: req.query.status || null,
        roleId: req.query.roleId ? Number(req.query.roleId) : null,
        createdFrom: req.query.createdFrom || null,
        createdTo: req.query.createdTo || null
      }
    });
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
    const q = parseListQuery(req, {
      defaultSortBy: 'Niveau_priorite',
      allowedSortMap: {
        ID: 'r.ID',
        Code_role: 'r.Code_role',
        Nom_role: 'r.Nom_role',
        Niveau_priorite: 'r.Niveau_priorite',
        Est_actif: 'r.Est_actif',
        Est_systeme: 'r.Est_systeme',
        users_count: 'users_count',
        permissions_count: 'permissions_count',
        Date_creation: 'r.Date_creation'
      },
      defaultSortDir: 'desc'
    });

    const where = [];
    const params = [];

    if (q.search) {
      const like = `%${q.search}%`;
      where.push('(r.Code_role LIKE ? OR r.Nom_role LIKE ? OR r.Description LIKE ?)');
      params.push(like, like, like);
    }

    if (req.query.active !== undefined) {
      where.push('r.Est_actif = ?');
      params.push(req.query.active === '1' ? 1 : 0);
    }

    if (req.query.system !== undefined) {
      where.push('r.Est_systeme = ?');
      params.push(req.query.system === '1' ? 1 : 0);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM roles r
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.query(
      `SELECT r.*,
              COUNT(DISTINCT ur.ID_Utilisateur) as users_count,
              COUNT(DISTINCT rp.ID_Permission) as permissions_count
       FROM roles r
       LEFT JOIN utilisateurs_roles ur ON ur.ID_Role = r.ID
       LEFT JOIN roles_permissions rp ON rp.ID_Role = r.ID
       ${whereSql}
       GROUP BY r.ID
       ORDER BY ${q.sortExpr} ${q.sortDir}
       LIMIT ? OFFSET ?`,
      [...params, q.limit, q.offset]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: paginationMeta(q.page, q.limit, total),
      filtersApplied: {
        search: q.search || null,
        active: req.query.active ?? null,
        system: req.query.system ?? null
      }
    });
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
    const q = parseListQuery(req, {
      defaultSortBy: 'Categorie',
      allowedSortMap: {
        ID: 'p.ID',
        Code_permission: 'p.Code_permission',
        Nom_permission: 'p.Nom_permission',
        Categorie: 'p.Categorie',
        Date_creation: 'p.Date_creation',
        roles_count: 'roles_count'
      },
      defaultSortDir: 'asc'
    });

    const where = [];
    const params = [];

    if (q.search) {
      const like = `%${q.search}%`;
      where.push('(p.Code_permission LIKE ? OR p.Nom_permission LIKE ? OR p.Description LIKE ? OR p.Categorie LIKE ?)');
      params.push(like, like, like, like);
    }

    if (req.query.module) {
      where.push('p.Categorie = ?');
      params.push(req.query.module);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM permissions p
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.query(
      `SELECT p.*,
              COUNT(DISTINCT rp.ID_Role) as roles_count,
              GROUP_CONCAT(DISTINCT r.Nom_role ORDER BY r.Nom_role SEPARATOR ', ') AS roles_labels,
              MAX(CASE WHEN r.Est_systeme = 1 THEN 1 ELSE 0 END) as used_by_system_role
       FROM permissions p
       LEFT JOIN roles_permissions rp ON rp.ID_Permission = p.ID
       LEFT JOIN roles r ON r.ID = rp.ID_Role
       ${whereSql}
       GROUP BY p.ID
       ORDER BY ${q.sortExpr} ${q.sortDir}
       LIMIT ? OFFSET ?`,
      [...params, q.limit, q.offset]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: paginationMeta(q.page, q.limit, total),
      filtersApplied: {
        search: q.search || null,
        module: req.query.module || null
      }
    });
  } catch (error) {
    console.error('Erreur admin listPermissions:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture permissions' });
  }
};

exports.getRolePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    const [rows] = await db.query(
      `SELECT p.ID, p.Code_permission, p.Nom_permission, p.Categorie
       FROM roles_permissions rp
       JOIN permissions p ON p.ID = rp.ID_Permission
       WHERE rp.ID_Role = ?
       ORDER BY p.Categorie ASC, p.Nom_permission ASC`,
      [roleId]
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Erreur admin getRolePermissions:', error);
    res.status(500).json({ success: false, error: 'Erreur lecture permissions role' });
  }
};

exports.createPermission = async (req, res) => {
  try {
    const { Code_permission, Nom_permission, Description, Categorie } = req.body;

    if (!Code_permission || !Nom_permission) {
      return res.status(400).json({ success: false, error: 'Code_permission et Nom_permission requis' });
    }

    const [result] = await db.query(
      `INSERT INTO permissions (
        Code_permission, Nom_permission, Description, Categorie, Date_creation
      ) VALUES (?, ?, ?, ?, NOW())`,
      [Code_permission, Nom_permission, Description || null, Categorie || null]
    );

    await logAction({
      ID_Utilisateur: req.user.ID,
      Username: req.user.Username,
      Action: 'ADMIN_CREATE_PERMISSION',
      Table_concernee: 'permissions',
      ID_Enregistrement: result.insertId,
      Nouvelle_valeur: { Code_permission, Nom_permission, Description, Categorie },
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: { ID: result.insertId, Code_permission, Nom_permission }
    });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Code_permission deja existant' });
    }

    console.error('Erreur admin createPermission:', error);
    res.status(500).json({ success: false, error: 'Erreur creation permission' });
  }
};

exports.deletePermission = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const permissionId = req.params.id;

    await connection.beginTransaction();

    const [permissions] = await connection.query(
      'SELECT ID, Code_permission, Nom_permission FROM permissions WHERE ID = ?',
      [permissionId]
    );

    if (!permissions.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Permission non trouvee' });
    }

    await connection.query('DELETE FROM roles_permissions WHERE ID_Permission = ?', [permissionId]);
    await connection.query('DELETE FROM utilisateurs_permissions WHERE ID_Permission = ?', [permissionId]);
    await connection.query('DELETE FROM permissions WHERE ID = ?', [permissionId]);

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user.ID,
      Username: req.user.Username,
      Action: 'ADMIN_DELETE_PERMISSION',
      Table_concernee: 'permissions',
      ID_Enregistrement: permissionId,
      Ancienne_valeur: permissions[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Permission supprimee' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin deletePermission:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression permission' });
  } finally {
    connection.release();
  }
};

exports.deleteRole = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const roleId = req.params.id;

    await connection.beginTransaction();

    const [roles] = await connection.query(
      'SELECT ID, Code_role, Nom_role, Est_systeme FROM roles WHERE ID = ?',
      [roleId]
    );

    if (!roles.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Role non trouve' });
    }

    if (roles[0].Est_systeme === 1) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Suppression interdite pour un role systeme' });
    }

    await connection.query('DELETE FROM roles_permissions WHERE ID_Role = ?', [roleId]);
    await connection.query('DELETE FROM utilisateurs_roles WHERE ID_Role = ?', [roleId]);
    await connection.query('DELETE FROM roles WHERE ID = ?', [roleId]);

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user.ID,
      Username: req.user.Username,
      Action: 'ADMIN_DELETE_ROLE',
      Table_concernee: 'roles',
      ID_Enregistrement: roleId,
      Ancienne_valeur: roles[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Role supprime' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin deleteRole:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression role' });
  } finally {
    connection.release();
  }
};

exports.deleteUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.params.id;

    if (Number(userId) === Number(req.user.ID)) {
      return res.status(400).json({ success: false, error: 'Suppression de votre propre compte interdite' });
    }

    await connection.beginTransaction();

    const [users] = await connection.query(
      'SELECT ID, Username, Email FROM utilisateurs WHERE ID = ?',
      [userId]
    );

    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Utilisateur non trouve' });
    }

    await connection.query('UPDATE logs_audit SET ID_Utilisateur = NULL WHERE ID_Utilisateur = ?', [userId]);
    await connection.query('DELETE FROM sessions WHERE ID_Utilisateur = ?', [userId]);
    await connection.query('DELETE FROM utilisateurs_permissions WHERE ID_Utilisateur = ?', [userId]);
    await connection.query('DELETE FROM utilisateurs_roles WHERE ID_Utilisateur = ?', [userId]);
    await connection.query('DELETE FROM utilisateurs WHERE ID = ?', [userId]);

    await connection.commit();

    await logAction({
      ID_Utilisateur: req.user.ID,
      Username: req.user.Username,
      Action: 'ADMIN_DELETE_USER',
      Table_concernee: 'utilisateurs',
      ID_Enregistrement: userId,
      Ancienne_valeur: users[0],
      IP_address: req.ip,
      User_agent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Utilisateur supprime' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur admin deleteUser:', error);
    res.status(500).json({ success: false, error: 'Erreur suppression utilisateur' });
  } finally {
    connection.release();
  }
};

exports.listSessions = async (req, res) => {
  try {
    const q = parseListQuery(req, {
      defaultSortBy: 'Date_connexion',
      allowedSortMap: {
        ID: 's.ID',
        Username: 'u.Username',
        Email: 'u.Email',
        Date_connexion: 's.Date_connexion',
        Date_expiration: 's.Date_expiration',
        Derniere_activite: 's.Derniere_activite',
        Est_active: 's.Est_active',
        IP_address: 's.IP_address'
      },
      defaultSortDir: 'desc'
    });

    const where = [];
    const params = [];

    if (q.search) {
      const like = `%${q.search}%`;
      where.push('(u.Username LIKE ? OR u.Email LIKE ? OR s.IP_address LIKE ?)');
      params.push(like, like, like);
    }

    if (req.query.userId) {
      where.push('s.ID_Utilisateur = ?');
      params.push(Number(req.query.userId));
    }

    if (req.query.active !== undefined) {
      where.push('s.Est_active = ?');
      params.push(req.query.active === '1' ? 1 : 0);
    }

    if (req.query.from) {
      where.push('DATE(s.Date_connexion) >= ?');
      params.push(req.query.from);
    }
    if (req.query.to) {
      where.push('DATE(s.Date_connexion) <= ?');
      params.push(req.query.to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM sessions s
       JOIN utilisateurs u ON u.ID = s.ID_Utilisateur
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.query(
      `SELECT s.*, u.Username, u.Email
       FROM sessions s
       JOIN utilisateurs u ON u.ID = s.ID_Utilisateur
       ${whereSql}
       ORDER BY ${q.sortExpr} ${q.sortDir}
       LIMIT ? OFFSET ?`,
      [...params, q.limit, q.offset]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map(sanitizeSession),
      pagination: paginationMeta(q.page, q.limit, total),
      filtersApplied: {
        search: q.search || null,
        userId: req.query.userId ? Number(req.query.userId) : null,
        active: req.query.active ?? null,
        from: req.query.from || null,
        to: req.query.to || null
      }
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
    const q = parseListQuery(req, {
      defaultSortBy: 'Date_action',
      allowedSortMap: {
        ID: 'l.ID',
        Date_action: 'l.Date_action',
        Action: 'l.Action',
        Table_concernee: 'l.Table_concernee',
        Username: 'u.Username',
        IP_address: 'l.IP_address'
      },
      defaultSortDir: 'desc'
    });

    const where = [];
    const params = [];

    if (q.search) {
      const like = `%${q.search}%`;
      where.push('(l.Action LIKE ? OR l.Table_concernee LIKE ? OR u.Username LIKE ? OR l.Username LIKE ? OR l.IP_address LIKE ?)');
      params.push(like, like, like, like, like);
    }

    if (req.query.userId) {
      where.push('l.ID_Utilisateur = ?');
      params.push(Number(req.query.userId));
    }

    if (req.query.action) {
      where.push('l.Action = ?');
      params.push(req.query.action);
    }

    if (req.query.table) {
      where.push('l.Table_concernee = ?');
      params.push(req.query.table);
    }

    if (req.query.from) {
      where.push('DATE(l.Date_action) >= ?');
      params.push(req.query.from);
    }
    if (req.query.to) {
      where.push('DATE(l.Date_action) <= ?');
      params.push(req.query.to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM logs_audit l
       LEFT JOIN utilisateurs u ON u.ID = l.ID_Utilisateur
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.query(
      `SELECT l.*, u.Username as Username_utilisateur
       FROM logs_audit l
       LEFT JOIN utilisateurs u ON u.ID = l.ID_Utilisateur
       ${whereSql}
       ORDER BY ${q.sortExpr} ${q.sortDir}
       LIMIT ? OFFSET ?`,
      [...params, q.limit, q.offset]
    );
    res.json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: paginationMeta(q.page, q.limit, total),
      filtersApplied: {
        search: q.search || null,
        userId: req.query.userId ? Number(req.query.userId) : null,
        action: req.query.action || null,
        table: req.query.table || null,
        from: req.query.from || null,
        to: req.query.to || null
      }
    });
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

/**
 * GET /api/admin/matrice
 * Retourne la matrice complète permissions × utilisateurs
 * Permission requise: ADMIN_PERMISSIONS_READ
 */
exports.getMatrice = async (req, res) => {
  try {
    // Charger les utilisateurs actifs
    const [users] = await db.query(
      `SELECT u.ID, u.Username, u.Email, u.Est_actif, p.Nom_prenom
       FROM utilisateurs u
       LEFT JOIN personnel p ON p.ID = u.ID_Personnel
       WHERE u.Est_actif = 1
       ORDER BY u.Username ASC`
    );

    // Charger les permissions groupées par module
    const [permissions] = await db.query(
      `SELECT ID, Code_permission, Nom_permission, Categorie, Nom_module
       FROM permissions
       ORDER BY Nom_module ASC, Ordre_affichage ASC, Nom_permission ASC`
    );

    // Charger les valeurs actuelles de la matrice
    const [values] = await db.query(
      `SELECT ID_Utilisateur as userId, ID_Permission as permissionId, Valeur as valeur
       FROM matrice_autorisation
       WHERE Valeur = 1`
    );

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          ID: u.ID,
          Username: u.Username,
          Email: u.Email,
          Nom_prenom: u.Nom_prenom
        })),
        permissions: permissions.map(p => ({
          ID: p.ID,
          Code_permission: p.Code_permission,
          Nom_permission: p.Nom_permission,
          Categorie: p.Categorie,
          Nom_module: p.Nom_module
        })),
        values: values
      }
    });
  } catch (error) {
    console.error('Erreur admin getMatrice:', error);
    res.status(500).json({ success: false, error: 'Erreur chargement matrice' });
  }
};

/**
 * PATCH /api/admin/matrice
 * Met à jour une valeur de la matrice (userId, permissionId, valeur: 0|1)
 * Permission requise: ADMIN_PERMISSIONS_WRITE
 */
exports.updateMatrice = async (req, res) => {
  try {
    const { userId, permissionId, valeur } = req.body;

    // Validation
    if (!Number.isInteger(userId) || !Number.isInteger(permissionId) || ![0, 1].includes(valeur)) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides (userId, permissionId, valeur: 0|1)'
      });
    }

    // Vérifier que l'utilisateur et la permission existent
    const [[user]] = await db.query('SELECT ID FROM utilisateurs WHERE ID = ?', [userId]);
    const [[permission]] = await db.query('SELECT ID FROM permissions WHERE ID = ?', [permissionId]);

    if (!user || !permission) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur ou permission introuvable'
      });
    }

    if (valeur === 1) {
      // INSERT ou UPDATE à 1
      await db.query(
        `INSERT INTO matrice_autorisation (ID_Utilisateur, ID_Permission, Valeur)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE Valeur = 1`,
        [userId, permissionId]
      );
    } else {
      // DELETE (ou UPDATE à 0 selon le schéma)
      await db.query(
        `DELETE FROM matrice_autorisation
         WHERE ID_Utilisateur = ? AND ID_Permission = ?`,
        [userId, permissionId]
      );
    }

    // Ajouter à l'audit
    await logAction({
      ID_Utilisateur: req.user?.id,
      Username: req.user?.username,
      Action: `Matrice permission ${valeur === 1 ? 'ACCORDÉE' : 'RÉVOQUÉE'}`,
      Table_concernee: 'matrice_autorisation',
      Ancienne_valeur: null,
      Nouvelle_valeur: `userId=${userId}, permissionId=${permissionId}, valeur=${valeur}`,
      IP_address: req.ip
    });

    res.json({
      success: true,
      message: `Permission ${valeur === 1 ? 'accordée' : 'révoquée'}`
    });
  } catch (error) {
    console.error('Erreur admin updateMatrice:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour matrice' });
  }
};
