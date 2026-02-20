const { body, param } = require('express-validator');
const { idValidator, stringValidator, decimalValidator, optionalBodyIdValidator, enumValidator } = require('./common.validators');

/**
 * Validateur pour créer un article
 */
exports.createArticleValidator = [
  body('Code_article')
    .notEmpty().withMessage('Code article requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Code article doit faire 1-50 caractères'),
  
  body('Client')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Client max 50 caractères'),
  
  body('Temps_theorique')
    .optional()
    .isDecimal({ decimal_digits: '1,4' }).withMessage('Temps théorique doit être un nombre décimal')
    .toFloat(),
  
  body('Temps_reel')
    .optional()
    .isDecimal({ decimal_digits: '1,4' }).withMessage('Temps réel doit être un nombre décimal')
    .toFloat(),
  
  body('Indice_revision')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Indice révision max 10 caractères'),
  
  body('Date_revision')
    .optional()
    .isISO8601().withMessage('Date révision invalide (format: YYYY-MM-DD)'),
  
  body('Nombre_postes')
    .optional()
    .isInt({ min: 0 }).withMessage('Nombre de postes doit être un entier positif')
    .toInt(),
  
  body('Lien_dossier_client')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien dossier client max 255 caractères'),
  
  body('Lien_photo')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien photo max 255 caractères'),
  
  body('Lien_dossier_technique')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien dossier technique max 255 caractères'),
  
  body('Ctrl_elect_disponible')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Ctrl élect disponible doit être 0 ou 1')
    .toInt(),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),
  
  body('valide')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Valide doit être 0 ou 1')
    .toInt(),
  
  body('statut')
    .optional()
    .isIn(['nouveau', 'passage de révision', 'normale', 'obsolète'])
    .withMessage('Statut invalide (nouveau, passage de révision, normale, obsolète)')
];

/**
 * Validateur pour modifier un article
 */
exports.updateArticleValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID article invalide')
    .toInt(),
  
  body('Code_article')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Code article doit faire 1-50 caractères'),
  
  body('Client')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Client max 50 caractères'),
  
  body('Temps_theorique')
    .optional()
    .isDecimal({ decimal_digits: '1,4' }).withMessage('Temps théorique doit être un nombre décimal')
    .toFloat(),
  
  body('Temps_reel')
    .optional()
    .isDecimal({ decimal_digits: '1,4' }).withMessage('Temps réel doit être un nombre décimal')
    .toFloat(),
  
  body('Indice_revision')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Indice révision max 10 caractères'),
  
  body('Date_revision')
    .optional()
    .isISO8601().withMessage('Date révision invalide (format: YYYY-MM-DD)'),
  
  body('Nombre_postes')
    .optional()
    .isInt({ min: 0 }).withMessage('Nombre de postes doit être un entier positif')
    .toInt(),
  
  body('Lien_dossier_client')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien dossier client max 255 caractères'),
  
  body('Lien_photo')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien photo max 255 caractères'),
  
  body('Lien_dossier_technique')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien dossier technique max 255 caractères'),
  
  body('Ctrl_elect_disponible')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Ctrl élect disponible doit être 0 ou 1')
    .toInt(),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),
  
  body('valide')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Valide doit être 0 ou 1')
    .toInt(),
  
  body('statut')
    .optional()
    .isIn(['nouveau', 'passage de révision', 'normale', 'obsolète'])
    .withMessage('Statut invalide (nouveau, passage de révision, normale, obsolète)')
];

/**
 * Validateur pour récupérer un article par ID
 */
exports.articleIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID article invalide')
    .toInt()
];

/**
 * Validateur pour récupérer un article par code
 */
exports.articleCodeValidator = [
  param('code')
    .notEmpty().withMessage('Code article requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Code article invalide')
];

/**
 * Validateur pour filtrer par statut
 */
exports.articleStatutValidator = [
  param('statut')
    .isIn(['nouveau', 'passage de révision', 'normale', 'obsolète'])
    .withMessage('Statut invalide (nouveau, passage de révision, normale, obsolète)')
];

/**
 * Validateur pour filtrer par client
 */
exports.articleClientValidator = [
  param('client')
    .notEmpty().withMessage('Client requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Client invalide')
];

/**
 * Validateur pour valider/invalider un article
 */
exports.toggleValideValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID article invalide')
    .toInt(),
  
  body('valide')
    .notEmpty().withMessage('Valide requis')
    .isBoolean().withMessage('Valide doit être un booléen (true/false)')
    .toBoolean()
];
