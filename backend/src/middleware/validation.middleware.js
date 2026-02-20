const { validationResult } = require('express-validator');

/**
 * Middleware pour vérifier les erreurs de validation
 * À utiliser après les validateurs express-validator
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Erreurs de validation',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value !== undefined ? err.value : null
      }))
    });
  }
  
  next();
};

/**
 * Wrapper pour faciliter l'application des validateurs avec le middleware
 * Utilisation: router.post('/route', validate(...validateurs), validate, controller.action)
 */
exports.withValidation = (...validators) => {
  return [...validators, exports.validate];
};

/**
 * Middleware personnalisé pour valider les objets imbriqués
 */
exports.validateNested = (fieldName, schema) => {
  return (req, res, next) => {
    const data = req.body[fieldName];
    
    if (!data) {
      return next();
    }
    
    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        details: [{
          field: fieldName,
          message: 'Le champ doit être un tableau',
          value: data
        }]
      });
    }
    
    next();
  };
};

/**
 * Middleware pour nettoyer les champs non utilisés
 */
exports.sanitizeBody = (allowedFields = []) => {
  return (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return next();
    }
    
    const sanitized = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    });
    
    req.body = sanitized;
    next();
  };
};

/**
 * Middleware pour limiter la taille du body
 */
exports.limitBodySize = (maxSizeKb = 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'), 10);
    
    if (contentLength && contentLength > maxSizeKb * 1024) {
      return res.status(413).json({
        success: false,
        error: `Taille du body dépasse la limite de ${maxSizeKb}KB`
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier les champs requis
 */
exports.checkRequiredFields = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = [];
    
    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    });
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants',
        details: missing.map(field => ({
          field,
          message: `${field} est requis`,
          value: null
        }))
      });
    }
    
    next();
  };
};
