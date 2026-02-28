const { body, param } = require('express-validator');

/**
 * Validateur pour créer un défaut de process
 */
exports.createDefautValidator = [
  body('ID_Article')
    .notEmpty().withMessage('ID article requis')
    .isInt({ min: 1 }).withMessage('ID article doit être un entier positif')
    .toInt(),
  
  body('ID_Poste')
    .optional()
    .isInt({ min: 1 }).withMessage('ID poste doit être un entier positif')
    .toInt(),
  
  body('ID_Operateur')
    .optional()
    .isInt({ min: 1 }).withMessage('ID opérateur doit être un entier positif')
    .toInt(),
  
  body('Code_defaut')
    .notEmpty().withMessage('Code défaut requis')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Code défaut doit faire 1-20 caractères'),
  
  body('Date_defaut')
    .optional()
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)'),
  
  body('Heure_defaut')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).withMessage('Heure invalide (format: HH:MM)'),
  
  body('Lot')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Lot max 50 caractères'),
  
  body('Quantite_defaut')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantité défaut doit être un entier positif')
    .toInt(),
  
  body('Description_defaut')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 caractères'),
  
  body('Cause_supposee')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Cause supposée max 500 caractères'),
  
  body('Observation')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Observation max 500 caractères'),
  
  body('Action_corrective')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Action corrective max 500 caractères'),
  
  body('Resultat')
    .optional()
    .isIn(['accepté', 'rejeté', 'retravail', 'en_attente'])
    .withMessage('Résultat invalide')
];

/**
 * Validateur pour modifier un défaut
 */
exports.updateDefautValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID défaut invalide')
    .toInt(),
  
  body('ID_Article')
    .optional()
    .isInt({ min: 1 }).withMessage('ID article invalide')
    .toInt(),
  
  body('ID_Poste')
    .optional()
    .isInt({ min: 1 }).withMessage('ID poste invalide')
    .toInt(),
  
  body('ID_Operateur')
    .optional()
    .isInt({ min: 1 }).withMessage('ID opérateur invalide')
    .toInt(),
  
  body('Code_defaut')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Code défaut invalide'),
  
  body('Date_defaut')
    .optional()
    .isISO8601().withMessage('Date invalide'),
  
  body('Heure_defaut')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/).withMessage('Heure invalide'),
  
  body('Lot')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Lot max 50 caractères'),
  
  body('Quantite_defaut')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantité invalide')
    .toInt(),
  
  body('Description_defaut')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 caractères'),
  
  body('Cause_supposee')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Cause supposée max 500 caractères'),
  
  body('Observation')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Observation max 500 caractères'),
  
  body('Action_corrective')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Action corrective max 500 caractères'),
  
  body('Resultat')
    .optional()
    .isIn(['accepté', 'rejeté', 'retravail', 'en_attente'])
    .withMessage('Résultat invalide')
];

/**
 * Validateur pour récupérer un défaut par ID
 */
exports.defautIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID défaut invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par article
 */
exports.defautByArticleValidator = [
  param('articleId')
    .isInt({ min: 1 }).withMessage('ID article invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par poste
 */
exports.defautByPosteValidator = [
  param('posteId')
    .isInt({ min: 1 }).withMessage('ID poste invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par code défaut
 */
exports.defautByCodeValidator = [
  param('code')
    .notEmpty().withMessage('Code requis')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Code invalide')
];

/**
 * Validateur pour filtrer par résultat
 */
exports.defautByResultatValidator = [
  param('resultat')
    .isIn(['accepté', 'rejeté', 'retravail', 'en_attente'])
    .withMessage('Résultat invalide')
];
