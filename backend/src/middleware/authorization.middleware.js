const db = require('../config/database');

const hydrateAuthorization = async (req, res, next) => {
  try {
    if (!req.user?.ID) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifie'
      });
    }

    if (req.authz) {
      return next();
    }

    const userId = req.user.ID;

    const [directRows] = await db.query(
      `SELECT p.Code_permission, up.Type
       FROM utilisateurs_permissions up
       JOIN permissions p ON p.ID = up.ID_Permission
       WHERE up.ID_Utilisateur = ?
         AND (up.Expiration IS NULL OR up.Expiration >= CURDATE())`,
      [userId]
    );

    const [roleRows] = await db.query(
      `SELECT DISTINCT p.Code_permission
       FROM utilisateurs_roles ur
       JOIN roles r ON r.ID = ur.ID_Role
       JOIN roles_permissions rp ON rp.ID_Role = r.ID
       JOIN permissions p ON p.ID = rp.ID_Permission
       WHERE ur.ID_Utilisateur = ?
         AND r.Est_actif = 1`,
      [userId]
    );

    const [roles] = await db.query(
      `SELECT r.ID, r.Code_role, r.Nom_role, r.Niveau_priorite
       FROM utilisateurs_roles ur
       JOIN roles r ON r.ID = ur.ID_Role
       WHERE ur.ID_Utilisateur = ?
         AND r.Est_actif = 1`,
      [userId]
    );

    const allowed = new Set(roleRows.map((r) => r.Code_permission));
    const denied = new Set();

    for (const row of directRows) {
      if (row.Type === 'REFUSER') {
        denied.add(row.Code_permission);
        allowed.delete(row.Code_permission);
      }
      if (row.Type === 'ACCORDER' && !denied.has(row.Code_permission)) {
        allowed.add(row.Code_permission);
      }
    }

    req.authz = {
      roles,
      allowedPermissions: allowed,
      deniedPermissions: denied
    };

    next();
  } catch (error) {
    console.error('Erreur authorization middleware:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'autorisation"
    });
  }
};

const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    await hydrateAuthorization(req, res, async () => {
      if (req.authz.deniedPermissions.has(permissionCode)) {
        return res.status(403).json({
          success: false,
          error: `Permission refusee: ${permissionCode}`
        });
      }

      if (!req.authz.allowedPermissions.has(permissionCode)) {
        return res.status(403).json({
          success: false,
          error: `Permission requise: ${permissionCode}`
        });
      }

      next();
    });
  };
};

const requireAnyPermission = (permissionCodes) => {
  return async (req, res, next) => {
    await hydrateAuthorization(req, res, async () => {
      const hasPermission = permissionCodes.some((code) => {
        if (req.authz.deniedPermissions.has(code)) {
          return false;
        }
        return req.authz.allowedPermissions.has(code);
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Une des permissions suivantes est requise: ${permissionCodes.join(', ')}`
        });
      }

      next();
    });
  };
};

module.exports = {
  hydrateAuthorization,
  requirePermission,
  requireAnyPermission
};
