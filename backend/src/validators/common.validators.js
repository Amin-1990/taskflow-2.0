const { body, param, query } = require('express-validator');

/**
 * Validateur d'ID (pour les paramètres)
 */
exports.idValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('L\'ID doit être un nombre entier positif')
    .toInt()
];

/**
 * Validateur de pagination
 */
exports.paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page doit être un nombre entier positif')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
    .toInt()
];

/**
 * Validateur de plage de dates
 */
exports.dateRangeValidator = [
  query('debut')
    .optional()
    .isISO8601().withMessage('Date de début invalide (format: YYYY-MM-DD)'),
  
  query('fin')
    .optional()
    .isISO8601().withMessage('Date de fin invalide (format: YYYY-MM-DD)')
];

/**
 * Validateur d'ID entier positif pour body
 */
exports.bodyIdValidator = (fieldName) => [
  body(fieldName)
    .isInt({ min: 1 }).withMessage(`${fieldName} doit être un nombre entier positif`)
    .toInt()
];

/**
 * Validateur optionnel d'ID
 */
exports.optionalBodyIdValidator = (fieldName) => [
  body(fieldName)
    .optional()
    .isInt({ min: 1 }).withMessage(`${fieldName} doit être un nombre entier positif`)
    .toInt()
];

/**
 * Validateur de date (YYYY-MM-DD)
 */
exports.dateValidator = (fieldName, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isISO8601().withMessage(`${fieldName} doit être au format YYYY-MM-DD`)
  ];
};

/**
 * Validateur de nombre décimal
 */
exports.decimalValidator = (fieldName, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isDecimal({ decimal_digits: '1,4' })
      .withMessage(`${fieldName} doit être un nombre décimal`)
      .toFloat()
  ];
};

/**
 * Validateur de nombre entier positif
 */
exports.positiveIntValidator = (fieldName, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isInt({ min: 0 }).withMessage(`${fieldName} doit être un nombre entier positif`)
      .toInt()
  ];
};

/**
 * Validateur d'email
 */
exports.emailValidator = (fieldName = 'Email', required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isEmail().withMessage(`${fieldName} invalide`)
      .normalizeEmail()
  ];
};

/**
 * Validateur de chaîne de caractères
 */
exports.stringValidator = (fieldName, minLength = 1, maxLength = 255, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} doit faire entre ${minLength} et ${maxLength} caractères`)
  ];
};

/**
 * Validateur booléen
 */
exports.booleanValidator = (fieldName, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isBoolean().withMessage(`${fieldName} doit être un booléen (true/false)`)
      .toBoolean()
  ];
};

/**
 * Validateur ENUM
 */
exports.enumValidator = (fieldName, allowedValues, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isIn(allowedValues).withMessage(`${fieldName} doit être l'une de ces valeurs: ${allowedValues.join(', ')}`)
  ];
};

/**
 * Validateur de code (alphanumériques et traits d'union)
 */
exports.codeValidator = (fieldName, minLength = 1, maxLength = 50, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .trim()
      .isLength({ min: minLength, max: maxLength }).withMessage(`${fieldName} doit faire entre ${minLength} et ${maxLength} caractères`)
      .matches(/^[a-zA-Z0-9\-_]+$/).withMessage(`${fieldName} ne doit contenir que des caractères alphanumériques, traits d'union ou underscores`)
  ];
};

/**
 * Validateur de URL
 */
exports.urlValidator = (fieldName, required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .isURL().withMessage(`${fieldName} doit être une URL valide`)
  ];
};

/**
 * Validateur de téléphone
 */
exports.phoneValidator = (fieldName = 'Telephone', required = true) => {
  const validator = body(fieldName);
  if (!required) validator.optional();
  
  return [
    validator
      .trim()
      .matches(/^[0-9\s\-\+\(\)]+$/).withMessage(`${fieldName} invalide`)
  ];
};


exports.userIdValidator = [
  param('userId')
    .isInt({ min: 1 }).withMessage('Le userId doit etre un nombre entier positif')
    .toInt()
];

