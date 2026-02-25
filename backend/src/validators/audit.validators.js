const { body, param, query } = require('express-validator');

const codeLike = /^[A-Za-z0-9_\-]{1,100}$/;
const ipLike = /^[0-9a-fA-F:.]{3,45}$/;

exports.auditTableParamValidator = [
  param('table')
    .trim()
    .matches(codeLike).withMessage('table invalide')
];

exports.auditActionParamValidator = [
  param('action')
    .trim()
    .matches(codeLike).withMessage('action invalide')
];

exports.auditDateParamValidator = [
  param('date')
    .isISO8601({ strict: true }).withMessage('date invalide (YYYY-MM-DD)')
];

exports.auditHistoriqueParamsValidator = [
  param('table')
    .trim()
    .matches(codeLike).withMessage('table invalide'),
  param('id')
    .isInt({ min: 1 }).withMessage('id invalide')
    .toInt()
];

exports.auditPurgeDaysParamValidator = [
  param('jours')
    .isInt({ min: 1, max: 3650 }).withMessage('jours doit etre entre 1 et 3650')
    .toInt()
];

exports.auditDateRangeRequiredQueryValidator = [
  query('debut')
    .notEmpty().withMessage('debut requis')
    .isISO8601({ strict: true }).withMessage('debut invalide (YYYY-MM-DD)'),
  query('fin')
    .notEmpty().withMessage('fin requis')
    .isISO8601({ strict: true }).withMessage('fin invalide (YYYY-MM-DD)')
];

exports.auditPeriodeQueryValidator = [
  ...exports.auditDateRangeRequiredQueryValidator,
  query('utilisateur')
    .optional()
    .isInt({ min: 1 }).withMessage('utilisateur invalide')
    .toInt(),
  query('table')
    .optional()
    .trim()
    .matches(codeLike).withMessage('table invalide'),
  query('action')
    .optional()
    .trim()
    .matches(codeLike).withMessage('action invalide')
];

exports.auditExportQueryValidator = [
  ...exports.auditDateRangeRequiredQueryValidator,
  query('format')
    .optional()
    .isIn(['json', 'csv']).withMessage('format doit etre json ou csv')
];

exports.auditCreateLogValidator = [
  body('Action')
    .notEmpty().withMessage('Action requise')
    .trim()
    .matches(codeLike).withMessage('Action invalide'),
  body('Table_concernee')
    .notEmpty().withMessage('Table_concernee requise')
    .trim()
    .matches(codeLike).withMessage('Table_concernee invalide'),
  body('ID_Utilisateur')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID_Utilisateur invalide')
    .toInt(),
  body('Username')
    .optional({ nullable: true })
    .isString().withMessage('Username invalide')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Username doit faire 1-50 caracteres'),
  body('ID_Enregistrement')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID_Enregistrement invalide')
    .toInt(),
  body('Ancienne_valeur')
    .optional({ nullable: true })
    .isObject().withMessage('Ancienne_valeur doit etre un objet JSON'),
  body('Nouvelle_valeur')
    .optional({ nullable: true })
    .isObject().withMessage('Nouvelle_valeur doit etre un objet JSON'),
  body('IP_address')
    .optional({ nullable: true })
    .trim()
    .matches(ipLike).withMessage('IP_address invalide'),
  body('User_agent')
    .optional({ nullable: true })
    .isString().withMessage('User_agent invalide')
    .isLength({ max: 2000 }).withMessage('User_agent trop long')
];

