const { body } = require('express-validator');

/**
 * Validateur pour l'inscription (register)
 */
exports.registerValidator = [
  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit être un entier positif')
    .toInt(),
  
  body('Username')
    .notEmpty().withMessage('Username requis')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username ne peut contenir que des caractères alphanumériques et underscores'),
  
  body('Email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('Password')
    .notEmpty().withMessage('Password requis')
    .isLength({ min: 8 }).withMessage('Password doit faire au minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

/**
 * Validateur pour la connexion (login)
 */
exports.loginValidator = [
  body('username')
    .notEmpty().withMessage('Username ou email requis')
    .trim(),
  
  body('password')
    .notEmpty().withMessage('Password requis')
    .isLength({ min: 1 }).withMessage('Password invalide')
];

/**
 * Validateur pour le refresh token
 */
exports.refreshTokenValidator = [
  // Pas de body validation pour refresh, juste le header Authorization
];

/**
 * Validateur pour changer le password
 */
exports.changePasswordValidator = [
  body('Old_password')
    .notEmpty().withMessage('Ancien password requis')
    .isLength({ min: 1 }).withMessage('Ancien password invalide'),
  
  body('New_password')
    .notEmpty().withMessage('Nouveau password requis')
    .isLength({ min: 8 }).withMessage('Nouveau password doit faire au minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  body('Confirm_password')
    .notEmpty().withMessage('Confirmation password requise')
    .custom((value, { req }) => value === req.body.New_password)
    .withMessage('Les passwords ne correspondent pas')
];

/**
 * Validateur pour réinitialiser le password (oubli)
 */
exports.forgotPasswordValidator = [
  body('Email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
];

/**
 * Validateur pour réinitialiser avec token
 */
exports.resetPasswordValidator = [
  body('Token')
    .notEmpty().withMessage('Token requis'),
  
  body('New_password')
    .notEmpty().withMessage('Nouveau password requis')
    .isLength({ min: 8 }).withMessage('Nouveau password doit faire au minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  body('Confirm_password')
    .notEmpty().withMessage('Confirmation password requise')
    .custom((value, { req }) => value === req.body.New_password)
    .withMessage('Les passwords ne correspondent pas')
];

/**
 * Validateur pour mettre à jour le profil
 */
exports.updateProfileValidator = [
  body('Username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username invalide'),
  
  body('Email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
];

/**
 * Validateur pour désactiver un compte
 */
exports.disableAccountValidator = [
  body('Password')
    .notEmpty().withMessage('Password requis pour désactiver le compte')
    .isLength({ min: 1 }).withMessage('Password invalide')
];
