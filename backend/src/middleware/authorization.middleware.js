const db = require('../config/database');

/**
 * Récupère les permissions d'un utilisateur depuis matrice_autorisation
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<{roles: Array, allowedPermissions: Array, deniedPermissions: Array}>}
 */
const getUserPermissions = async (userId) => {
  // Récupérer les permissions depuis matrice_autorisation
  const [permissionRows] = await db.query(
    `SELECT p.Code_permission, ma.Valeur
     FROM matrice_autorisation ma
     JOIN permissions p ON p.ID = ma.ID_Permission
     WHERE ma.ID_Utilisateur = ?
       AND ma.Valeur = 1`,
    [userId]
  );

  // Pour l'instant, pas de gestion des rôles depuis matrice_autorisation
  // On pourrait étendre la table pour inclure les rôles si nécessaire
  const roles = [];

  const allowed = new Set(permissionRows.map((r) => r.Code_permission));
  const denied = new Set();

  return {
    roles,
    allowedPermissions: Array.from(allowed),
    deniedPermissions: Array.from(denied)
  };
};

/**
 * Middleware pour charger les permissions de l'utilisateur dans req.authz
 */
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

    const { roles, allowedPermissions, deniedPermissions } = await getUserPermissions(req.user.ID);

    req.authz = {
      roles,
      allowedPermissions: new Set(allowedPermissions),
      deniedPermissions: new Set(deniedPermissions)
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

/**
 * Middleware pour exiger une permission spécifique
 * @param {string} permissionCode 
 */
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

/**
 * Middleware pour exiger au moins une permission parmi une liste
 * @param {string[]} permissionCodes 
 */
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
  getUserPermissions,
  hydrateAuthorization,
  requirePermission,
  requireAnyPermission
};
