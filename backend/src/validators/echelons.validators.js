const { body, param, query } = require('express-validator');

exports.echelonReferenceIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID echelon reference invalide').toInt()
];

exports.historiqueEchelonIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID historique echelon invalide').toInt()
];

exports.personnelIdForHistoriqueValidator = [
  param('idPersonnel').isInt({ min: 1 }).withMessage('ID personnel invalide').toInt()
];

exports.echelonReferenceFilterValidator = [
  query('categorie')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5 })
    .withMessage('Categorie invalide (1-5 caracteres)')
];

exports.createEchelonReferenceValidator = [
  body('Categorie')
    .notEmpty().withMessage('Categorie requise')
    .trim()
    .isLength({ min: 1, max: 5 }).withMessage('Categorie invalide (1-5 caracteres)'),

  body('Echelon')
    .notEmpty().withMessage('Echelon requis')
    .isInt({ min: 1 }).withMessage('Echelon doit etre un entier positif')
    .toInt(),

  body('Duree')
    .notEmpty().withMessage('Duree requise')
    .isInt({ min: 0 }).withMessage('Duree doit etre un entier positif')
    .toInt(),

  body('Montant_base')
    .notEmpty().withMessage('Montant_base requis')
    .isFloat({ min: 0 }).withMessage('Montant_base invalide')
    .toFloat(),

  body('Description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Description max 255 caracteres')
];

exports.updateEchelonReferenceValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID echelon reference invalide').toInt(),

  body('Categorie')
    .notEmpty().withMessage('Categorie requise')
    .trim()
    .isLength({ min: 1, max: 5 }).withMessage('Categorie invalide (1-5 caracteres)'),

  body('Echelon')
    .notEmpty().withMessage('Echelon requis')
    .isInt({ min: 1 }).withMessage('Echelon doit etre un entier positif')
    .toInt(),

  body('Duree')
    .notEmpty().withMessage('Duree requise')
    .isInt({ min: 0 }).withMessage('Duree doit etre un entier positif')
    .toInt(),

  body('Montant_base')
    .notEmpty().withMessage('Montant_base requis')
    .isFloat({ min: 0 }).withMessage('Montant_base invalide')
    .toFloat(),

  body('Description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Description max 255 caracteres')
];

exports.createHistoriqueEchelonValidator = [
  body('ID_personnel')
    .notEmpty().withMessage('ID_personnel requis')
    .isInt({ min: 1 }).withMessage('ID_personnel invalide')
    .toInt(),

  body('ID_echelon_ref')
    .notEmpty().withMessage('ID_echelon_ref requis')
    .isInt({ min: 1 }).withMessage('ID_echelon_ref invalide')
    .toInt(),

  body('Date_debut')
    .notEmpty().withMessage('Date_debut requise')
    .isISO8601().withMessage('Date_debut invalide (YYYY-MM-DD)'),

  body('Date_fin')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date_fin invalide (YYYY-MM-DD)'),

  body('Montant_applique')
    .notEmpty().withMessage('Montant_applique requis')
    .isFloat({ min: 0 }).withMessage('Montant_applique invalide')
    .toFloat(),

  body('Duree_effective')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('Duree_effective invalide')
    .toInt(),

  body('Motif_changement')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Motif_changement max 255 caracteres'),

  body('Commentaire')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Commentaire trop long')
];

exports.updateHistoriqueEchelonValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID historique echelon invalide').toInt(),

  body('ID_echelon_ref')
    .notEmpty().withMessage('ID_echelon_ref requis')
    .isInt({ min: 1 }).withMessage('ID_echelon_ref invalide')
    .toInt(),

  body('Date_debut')
    .notEmpty().withMessage('Date_debut requise')
    .isISO8601().withMessage('Date_debut invalide (YYYY-MM-DD)'),

  body('Date_fin')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date_fin invalide (YYYY-MM-DD)'),

  body('Montant_applique')
    .notEmpty().withMessage('Montant_applique requis')
    .isFloat({ min: 0 }).withMessage('Montant_applique invalide')
    .toFloat(),

  body('Duree_effective')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('Duree_effective invalide')
    .toInt(),

  body('Motif_changement')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Motif_changement max 255 caracteres'),

  body('Commentaire')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Commentaire trop long')
];

exports.closeHistoriqueEchelonValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID historique echelon invalide').toInt(),

  body('Date_fin')
    .notEmpty().withMessage('Date_fin requise')
    .isISO8601().withMessage('Date_fin invalide (YYYY-MM-DD)')
];
