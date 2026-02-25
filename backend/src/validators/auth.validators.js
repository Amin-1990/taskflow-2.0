const { body } = require('express-validator');

/**
 * Validateur pour l'inscription (register)
 */
exports.registerValidator = [
  body('ID_Personnel')
    .optional()
    .isInt({ min: 1 }).withMessage('ID personnel doit etre un entier positif')
    .toInt(),

  body('Username')
    .notEmpty().withMessage('Username requis')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username ne peut contenir que des caracteres alphanumeriques et underscores'),

  body('Email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),

  body('Password')
    .notEmpty().withMessage('Password requis')
    .isLength({ min: 8 }).withMessage('Password doit faire au minimum 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special')
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
  body('refreshToken')
    .optional()
    .isString().withMessage('refreshToken invalide')
    .custom((value, { req }) => {
      if (value || req.get('x-refresh-token')) {
        return true;
      }
      throw new Error('Refresh token requis');
    })
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
    .isLength({ min: 8 }).withMessage('Nouveau password doit faire au minimum 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special'),

  body('Confirm_password')
    .notEmpty().withMessage('Confirmation password requise')
    .custom((value, { req }) => value === req.body.New_password)
    .withMessage('Les passwords ne correspondent pas')
];

/**
 * Validateur pour reinitialiser le password (oubli)
 */
exports.forgotPasswordValidator = [
  body('Email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
];

/**
 * Validateur pour reinitialiser avec token
 */
exports.resetPasswordValidator = [
  body('Token')
    .notEmpty().withMessage('Token requis'),

  body('New_password')
    .notEmpty().withMessage('Nouveau password requis')
    .isLength({ min: 8 }).withMessage('Nouveau password doit faire au minimum 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Nouveau password doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special'),

  body('Confirm_password')
    .notEmpty().withMessage('Confirmation password requise')
    .custom((value, { req }) => value === req.body.New_password)
    .withMessage('Les passwords ne correspondent pas')
];

/**
 * Validateur pour mettre a jour le profil
 */
exports.updateProfileValidator = [
  body('Username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username doit faire 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username invalide'),

  body('Email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
];

/**
 * Validateur pour desactiver un compte
 */
exports.disableAccountValidator = [
  body('Password')
    .notEmpty().withMessage('Password requis pour desactiver le compte')
    .isLength({ min: 1 }).withMessage('Password invalide')
];
