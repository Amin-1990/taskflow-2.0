const { query } = require('express-validator');

exports.sessionListQueryValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 2000 }).withMessage('limit doit etre entre 1 et 2000')
    .toInt()
];

