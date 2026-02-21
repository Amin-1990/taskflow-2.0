const { body, param } = require('express-validator');

/**
 * Validateur pour creer un poste
 */
exports.createPosteValidator = [
  body('Description')
    .notEmpty().withMessage('La description est requise')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('La description doit contenir entre 2 et 100 caracteres')
];

/**
 * Validateur pour modifier un poste
 */
exports.updatePosteValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID poste invalide')
    .toInt(),

  body('Description')
    .notEmpty().withMessage('La description est requise')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('La description doit contenir entre 2 et 100 caracteres')
];
