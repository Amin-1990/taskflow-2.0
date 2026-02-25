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
  adminCreatePermissionValidator,
  adminUsersListQueryValidator,
  adminRolesListQueryValidator,
  adminPermissionsListQueryValidator,
  adminSessionsListQueryValidator,
  adminAuditQueryValidator
} = require('../validators');
const adminController = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(requirePermission('ADMIN_ACCESS'));

router.get('/dashboard', requirePermission('ADMIN_DASHBOARD_READ'), validate, adminController.getDashboard);

router.get('/users', requirePermission('ADMIN_USERS_READ'), adminUsersListQueryValidator, validate, adminController.listUsers);
router.get('/users/:id', requirePermission('ADMIN_USERS_READ'), adminIdParamValidator, validate, adminController.getUserDetail);
router.post('/users', requirePermission('ADMIN_USERS_WRITE'), adminCreateUserValidator, validate, adminController.createUser);
router.patch('/users/:id', requirePermission('ADMIN_USERS_WRITE'), adminUpdateUserValidator, validate, adminController.updateUser);
router.patch('/users/:id/status', requirePermission('ADMIN_USERS_WRITE'), adminUpdateUserStatusValidator, validate, adminController.updateUserStatus);
router.patch('/users/:id/password-reset', requirePermission('ADMIN_USERS_WRITE'), adminResetPasswordValidator, validate, adminController.resetUserPassword);
router.patch('/users/:id/expire-sessions', requirePermission('SESSION_MANAGE'), adminIdParamValidator, validate, adminController.forceExpireUserSessions);
router.put('/users/:id/roles', requirePermission('ADMIN_ROLES_WRITE'), adminReplaceUserRolesValidator, validate, adminController.replaceUserRoles);
router.put('/users/:id/permissions', requirePermission('ADMIN_PERMISSIONS_WRITE'), adminReplaceUserPermissionsValidator, validate, adminController.replaceUserPermissions);

router.get('/roles', requirePermission('ADMIN_ROLES_READ'), adminRolesListQueryValidator, validate, adminController.listRoles);
router.get('/roles/:id/permissions', requirePermission('ADMIN_ROLES_READ'), adminIdParamValidator, validate, adminController.getRolePermissions);
router.post('/roles', requirePermission('ADMIN_ROLES_WRITE'), adminCreateRoleValidator, validate, adminController.createRole);
router.patch('/roles/:id', requirePermission('ADMIN_ROLES_WRITE'), adminUpdateRoleValidator, validate, adminController.updateRole);
router.delete('/roles/:id', requirePermission('ADMIN_ROLES_WRITE'), adminIdParamValidator, validate, adminController.deleteRole);
router.put('/roles/:id/permissions', requirePermission('ADMIN_ROLES_WRITE'), adminReplaceRolePermissionsValidator, validate, adminController.replaceRolePermissions);

router.get('/permissions', requirePermission('ADMIN_PERMISSIONS_READ'), adminPermissionsListQueryValidator, validate, adminController.listPermissions);
router.post('/permissions', requirePermission('ADMIN_PERMISSIONS_WRITE'), adminCreatePermissionValidator, validate, adminController.createPermission);
router.delete('/permissions/:id', requirePermission('ADMIN_PERMISSIONS_WRITE'), adminIdParamValidator, validate, adminController.deletePermission);

router.delete('/users/:id', requirePermission('ADMIN_USERS_WRITE'), adminIdParamValidator, validate, adminController.deleteUser);

router.get('/sessions', requirePermission('SESSION_MANAGE'), adminSessionsListQueryValidator, validate, adminController.listSessions);
router.patch('/sessions/:id/revoke', requirePermission('SESSION_MANAGE'), adminIdParamValidator, validate, adminController.revokeSession);

router.get('/audit', requirePermission('AUDIT_READ'), adminAuditQueryValidator, validate, adminController.listAuditLogs);

module.exports = router;
