const { body, param, query } = require('express-validator');

const requirePersonnelOrMatricule = body().custom((_, { req }) => {
  if (!req.body?.ID_Personnel && !req.body?.Matricule) {
    throw new Error('ID Personnel ou Matricule requis');
  }
  return true;
});

/**
 * Validateur pour pointer (entrée/sortie)
 */
exports.createPointageValidator = [
  requirePersonnelOrMatricule,

  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),

  body('Matricule')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Matricule invalide'),

  body('Nom')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Nom max 255 caractères'),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),

  body('Date')
    .optional()
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)')
];

/**
 * Validateur pour modifier un pointage
 */
exports.updatePointageValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID pointage invalide')
    .toInt(),
  
  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),
  
  body('Date')
    .optional()
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)'),
  
  body('Entree')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).withMessage('Heure entrée invalide (format: HH:MM)'),
  
  body('Sortie')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).withMessage('Heure sortie invalide (format: HH:MM)'),
  
  body('Raison_absence')
    .optional()
    .isIn(['congé', 'maladie', 'autre'])
    .withMessage('Raison absence invalide'),
  
  body('Note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note max 500 caractères')
];

/**
 * Validateur pour récupérer un pointage par ID
 */
exports.pointageIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID pointage invalide')
    .toInt()
];

/**
 * Validateur pour récupérer les pointages d'un employé
 */
exports.pointageByPersonnelValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID personnel invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par période
 */
exports.pointageByPeriodeValidator = [
  query('debut')
    .notEmpty().withMessage('Date début requise')
    .isISO8601().withMessage('Date début invalide (format: YYYY-MM-DD)'),
  
  query('fin')
    .notEmpty().withMessage('Date fin requise')
    .isISO8601().withMessage('Date fin invalide (format: YYYY-MM-DD)'),
  
  query('personnelId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel invalide')
    .toInt()
];

/**
 * Validateur pour marquer une sortie
 */
exports.markSortieValidator = [
  requirePersonnelOrMatricule,

  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),

  body('Matricule')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Matricule invalide'),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),

  body('Date')
    .optional()
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)')
];

/**
 * Validateur pour marquer une absence
 */
exports.markAbsenceValidator = [
  requirePersonnelOrMatricule,

  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),

  body('Matricule')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Matricule invalide'),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),

  body('Date')
    .optional()
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)')
];

/**
 * Validateur pour ajustement manuel pointage
 */
exports.adjustPointageValidator = [
  requirePersonnelOrMatricule,

  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),

  body('Matricule')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Matricule invalide'),

  body('Date')
    .notEmpty().withMessage('Date requise')
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)'),

  body('Statut')
    .notEmpty().withMessage('Statut requis')
    .isIn(['present', 'absent']).withMessage('Statut invalide (present|absent)'),

  body('Entree')
    .optional({ nullable: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/).withMessage('Heure entrée invalide (format: HH:MM ou HH:MM:SS)'),

  body('Sortie')
    .optional({ nullable: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/).withMessage('Heure sortie invalide (format: HH:MM ou HH:MM:SS)'),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
];
