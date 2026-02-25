const { body, param, query } = require('express-validator');

const passwordComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const positiveIntParam = (name) =>
  param(name)
    .isInt({ min: 1 }).withMessage(`${name} doit etre un entier positif`)
    .toInt();

const optionalPositiveIntBody = (name) =>
  body(name)
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage(`${name} doit etre un entier positif`)
    .toInt();

const optionalBoolBody = (name) =>
  body(name)
    .optional()
    .isBoolean().withMessage(`${name} doit etre un booleen`)
    .toBoolean();

const adminListCommonQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page doit etre >= 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit doit etre entre 1 et 100')
    .toInt(),
  query('search')
    .optional()
    .isString().withMessage('search doit etre une chaine')
    .isLength({ max: 200 }).withMessage('search trop long')
    .trim(),
  query('sortBy')
    .optional()
    .isString().withMessage('sortBy doit etre une chaine')
    .isLength({ max: 50 }).withMessage('sortBy invalide')
    .trim(),
  query('sortDir')
    .optional()
    .isIn(['asc', 'desc']).withMessage('sortDir doit etre asc ou desc')
];

exports.adminIdParamValidator = [positiveIntParam('id')];

exports.adminCreateUserValidator = [
  body('Username')
    .notEmpty().withMessage('Username requis')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username invalide'),
  body('Email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('Password')
    .notEmpty().withMessage('Password requis')
    .isLength({ min: 8 }).withMessage('Password doit faire au minimum 8 caracteres')
    .matches(passwordComplexity)
    .withMessage('Password doit contenir majuscule, minuscule, chiffre et caractere special'),
  optionalPositiveIntBody('ID_Personnel'),
  body('roles')
    .optional()
    .isArray({ max: 100 }).withMessage('roles doit etre un tableau'),
  body('roles.*')
    .optional()
    .isInt({ min: 1 }).withMessage('Chaque role doit etre un entier positif')
    .toInt()
];

exports.adminUpdateUserValidator = [
  positiveIntParam('id'),
  body().custom((value) => {
    const hasUpdatable =
      value &&
      (
        value.Username !== undefined ||
        value.Email !== undefined ||
        value.ID_Personnel !== undefined ||
        value.Est_verifie !== undefined
      );
    if (!hasUpdatable) {
      throw new Error('Aucun champ modifiable fourni');
    }
    return true;
  }),
  body('Username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username invalide'),
  body('Email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  optionalPositiveIntBody('ID_Personnel'),
  optionalBoolBody('Est_verifie')
];

exports.adminUpdateUserStatusValidator = [
  positiveIntParam('id'),
  body().custom((value) => {
    const hasStatus = value && (value.Est_actif !== undefined || value.Est_verrouille !== undefined);
    if (!hasStatus) {
      throw new Error('Est_actif ou Est_verrouille est requis');
    }
    return true;
  }),
  optionalBoolBody('Est_actif'),
  optionalBoolBody('Est_verrouille')
];

exports.adminResetPasswordValidator = [
  positiveIntParam('id'),
  body('New_password')
    .notEmpty().withMessage('New_password requis')
    .isLength({ min: 8 }).withMessage('New_password doit faire au minimum 8 caracteres')
    .matches(passwordComplexity)
    .withMessage('New_password doit contenir majuscule, minuscule, chiffre et caractere special')
];

exports.adminReplaceUserRolesValidator = [
  positiveIntParam('id'),
  body('roleIds')
    .isArray().withMessage('roleIds doit etre un tableau'),
  body('roleIds.*')
    .isInt({ min: 1 }).withMessage('Chaque roleId doit etre un entier positif')
    .toInt()
];

exports.adminReplaceUserPermissionsValidator = [
  positiveIntParam('id'),
  body('permissions')
    .isArray().withMessage('permissions doit etre un tableau'),
  body('permissions.*.permissionId')
    .isInt({ min: 1 }).withMessage('permissionId doit etre un entier positif')
    .toInt(),
  body('permissions.*.type')
    .optional()
    .isIn(['ACCORDER', 'REFUSER']).withMessage('type doit etre ACCORDER ou REFUSER'),
  body('permissions.*.expiration')
    .optional({ nullable: true })
    .isISO8601().withMessage('expiration doit etre une date valide (YYYY-MM-DD)')
];

exports.adminCreateRoleValidator = [
  body('Code_role')
    .notEmpty().withMessage('Code_role requis')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Code_role doit faire 2-50 caracteres')
    .matches(/^[A-Z0-9_]+$/).withMessage('Code_role doit contenir A-Z, 0-9, _'),
  body('Nom_role')
    .notEmpty().withMessage('Nom_role requis')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nom_role doit faire 2-100 caracteres'),
  body('Description')
    .optional({ nullable: true })
    .isString().withMessage('Description doit etre une chaine')
    .isLength({ max: 2000 }).withMessage('Description trop longue'),
  body('Niveau_priorite')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Niveau_priorite invalide')
    .toInt(),
  body('Est_systeme')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_systeme doit etre 0 ou 1')
    .toInt(),
  body('Est_actif')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_actif doit etre 0 ou 1')
    .toInt()
];

exports.adminUpdateRoleValidator = [
  positiveIntParam('id'),
  body().custom((value) => {
    const hasUpdatable =
      value &&
      (
        value.Nom_role !== undefined ||
        value.Description !== undefined ||
        value.Niveau_priorite !== undefined ||
        value.Est_actif !== undefined
      );
    if (!hasUpdatable) {
      throw new Error('Aucun champ role modifiable fourni');
    }
    return true;
  }),
  body('Nom_role')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nom_role doit faire 2-100 caracteres'),
  body('Description')
    .optional({ nullable: true })
    .isString().withMessage('Description doit etre une chaine')
    .isLength({ max: 2000 }).withMessage('Description trop longue'),
  body('Niveau_priorite')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Niveau_priorite invalide')
    .toInt(),
  body('Est_actif')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_actif doit etre 0 ou 1')
    .toInt()
];

exports.adminReplaceRolePermissionsValidator = [
  positiveIntParam('id'),
  body('permissionIds')
    .isArray().withMessage('permissionIds doit etre un tableau'),
  body('permissionIds.*')
    .isInt({ min: 1 }).withMessage('Chaque permissionId doit etre un entier positif')
    .toInt()
];

exports.adminCreatePermissionValidator = [
  body('Code_permission')
    .notEmpty().withMessage('Code_permission requis')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Code_permission doit faire 2-100 caracteres')
    .matches(/^[A-Z0-9_]+$/).withMessage('Code_permission doit contenir A-Z, 0-9, _'),
  body('Nom_permission')
    .notEmpty().withMessage('Nom_permission requis')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Nom_permission doit faire 2-255 caracteres'),
  body('Description')
    .optional({ nullable: true })
    .isString().withMessage('Description doit etre une chaine')
    .isLength({ max: 2000 }).withMessage('Description trop longue'),
  body('Categorie')
    .optional({ nullable: true })
    .isString().withMessage('Categorie doit etre une chaine')
    .isLength({ min: 1, max: 100 }).withMessage('Categorie doit faire 1-100 caracteres')
];

exports.adminUsersListQueryValidator = [
  ...adminListCommonQueryValidator,
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'locked']).withMessage('status invalide'),
  query('roleId')
    .optional()
    .isInt({ min: 1 }).withMessage('roleId doit etre un entier positif')
    .toInt(),
  query('createdFrom')
    .optional()
    .isISO8601().withMessage('createdFrom doit etre une date valide (YYYY-MM-DD)'),
  query('createdTo')
    .optional()
    .isISO8601().withMessage('createdTo doit etre une date valide (YYYY-MM-DD)')
];

exports.adminRolesListQueryValidator = [
  ...adminListCommonQueryValidator,
  query('active')
    .optional()
    .isIn(['0', '1']).withMessage('active doit etre 0 ou 1'),
  query('system')
    .optional()
    .isIn(['0', '1']).withMessage('system doit etre 0 ou 1')
];

exports.adminPermissionsListQueryValidator = [
  ...adminListCommonQueryValidator,
  query('module')
    .optional()
    .isString().withMessage('module doit etre une chaine')
    .isLength({ max: 100 }).withMessage('module invalide')
    .trim()
];

exports.adminSessionsListQueryValidator = [
  ...adminListCommonQueryValidator,
  query('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('userId doit etre un entier positif')
    .toInt(),
  query('active')
    .optional()
    .isIn(['0', '1']).withMessage('active doit etre 0 ou 1'),
  query('from')
    .optional()
    .isISO8601().withMessage('from doit etre une date valide (YYYY-MM-DD)'),
  query('to')
    .optional()
    .isISO8601().withMessage('to doit etre une date valide (YYYY-MM-DD)')
];

exports.adminAuditQueryValidator = [
  ...adminListCommonQueryValidator,
  query('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('userId doit etre un entier positif')
    .toInt(),
  query('action')
    .optional()
    .isString().withMessage('action doit etre une chaine')
    .isLength({ max: 120 }).withMessage('action invalide')
    .trim(),
  query('table')
    .optional()
    .isString().withMessage('table doit etre une chaine')
    .isLength({ max: 120 }).withMessage('table invalide')
    .trim(),
  query('from')
    .optional()
    .isISO8601().withMessage('from doit etre une date valide (YYYY-MM-DD)'),
  query('to')
    .optional()
    .isISO8601().withMessage('to doit etre une date valide (YYYY-MM-DD)')
];

