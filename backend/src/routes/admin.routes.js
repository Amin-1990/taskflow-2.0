const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  adminIdParamValidator,
  adminCreateUserValidator,
  adminUpdateUserValidator,
  adminUpdateUserStatusValidator,
  adminResetPasswordValidator,
  adminReplaceUserRolesValidator,
  adminReplaceUserPermissionsValidator,
  adminCreateRoleValidator,
  adminUpdateRoleValidator,
  adminReplaceRolePermissionsValidator,
  adminAuditQueryValidator
} = require('../validators');
const adminController = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(requirePermission('ADMIN_ACCESS'));

router.get('/dashboard', requirePermission('ADMIN_DASHBOARD_READ'), validate, adminController.getDashboard);

router.get('/users', requirePermission('ADMIN_USERS_READ'), validate, adminController.listUsers);
router.get('/users/:id', requirePermission('ADMIN_USERS_READ'), adminIdParamValidator, validate, adminController.getUserDetail);
router.post('/users', requirePermission('ADMIN_USERS_WRITE'), adminCreateUserValidator, validate, adminController.createUser);
router.patch('/users/:id', requirePermission('ADMIN_USERS_WRITE'), adminUpdateUserValidator, validate, adminController.updateUser);
router.patch('/users/:id/status', requirePermission('ADMIN_USERS_WRITE'), adminUpdateUserStatusValidator, validate, adminController.updateUserStatus);
router.patch('/users/:id/password-reset', requirePermission('ADMIN_USERS_WRITE'), adminResetPasswordValidator, validate, adminController.resetUserPassword);
router.patch('/users/:id/expire-sessions', requirePermission('SESSION_MANAGE'), adminIdParamValidator, validate, adminController.forceExpireUserSessions);
router.put('/users/:id/roles', requirePermission('ADMIN_ROLES_WRITE'), adminReplaceUserRolesValidator, validate, adminController.replaceUserRoles);
router.put('/users/:id/permissions', requirePermission('ADMIN_PERMISSIONS_WRITE'), adminReplaceUserPermissionsValidator, validate, adminController.replaceUserPermissions);

router.get('/roles', requirePermission('ADMIN_ROLES_READ'), validate, adminController.listRoles);
router.post('/roles', requirePermission('ADMIN_ROLES_WRITE'), adminCreateRoleValidator, validate, adminController.createRole);
router.patch('/roles/:id', requirePermission('ADMIN_ROLES_WRITE'), adminUpdateRoleValidator, validate, adminController.updateRole);
router.put('/roles/:id/permissions', requirePermission('ADMIN_ROLES_WRITE'), adminReplaceRolePermissionsValidator, validate, adminController.replaceRolePermissions);

router.get('/permissions', requirePermission('ADMIN_PERMISSIONS_READ'), validate, adminController.listPermissions);

router.get('/sessions', requirePermission('SESSION_MANAGE'), validate, adminController.listSessions);
router.patch('/sessions/:id/revoke', requirePermission('SESSION_MANAGE'), adminIdParamValidator, validate, adminController.revokeSession);

router.get('/audit', requirePermission('AUDIT_READ'), adminAuditQueryValidator, validate, adminController.listAuditLogs);

module.exports = router;
