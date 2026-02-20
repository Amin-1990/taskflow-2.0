const { body, param } = require('express-validator');

/**
 * Validateur pour créer un employé
 */
exports.createPersonnelValidator = [
  body('Nom_prenom')
    .notEmpty().withMessage('Nom/Prénom requis')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nom/Prénom doit faire 2-100 caractères'),
  
  body('Matricule')
    .notEmpty().withMessage('Matricule requis')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Matricule doit faire 1-20 caractères'),
  
  body('Date_embauche')
    .notEmpty().withMessage('Date embauche requise')
    .isISO8601().withMessage('Date embauche invalide (format: YYYY-MM-DD)'),
  
  body('Qr_code')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('QR code max 100 caractères'),
  
  body('Email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('Date_naissance')
    .optional()
    .isISO8601().withMessage('Date naissance invalide (format: YYYY-MM-DD)'),
  
  body('Adresse')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Adresse max 255 caractères'),
  
  body('Ville')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Ville max 50 caractères'),
  
  body('Code_postal')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Code postal max 10 caractères'),
  
  body('Telephone')
    .optional()
    .trim()
    .matches(/^[0-9\s\-\+\(\)]+$/).withMessage('Téléphone invalide'),
  
  body('Poste')
    .optional()
    .isIn(['Operateur', 'Chef de ligne', 'Responsable QC', 'Maintenance'])
    .withMessage('Poste invalide (Operateur, Chef de ligne, Responsable QC, Maintenance)'),
  
  body('Statut')
    .optional()
    .isIn(['actif', 'inactif'])
    .withMessage('Statut invalide (actif, inactif)'),
  
  body('Type_contrat')
    .optional()
    .isIn(['CDI', 'CDD', 'Stage', 'Contrat temporaire'])
    .withMessage('Type contrat invalide (CDI, CDD, Stage, Contrat temporaire)'),
  
  body('Date_fin_contrat')
    .optional()
    .isISO8601().withMessage('Date fin contrat invalide (format: YYYY-MM-DD)'),
  
  body('Site_affectation')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Site affectation max 50 caractères'),
  
  body('Numero_CNSS')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro CNSS max 20 caractères'),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
];

/**
 * Validateur pour modifier un employé
 */
exports.updatePersonnelValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID employé invalide')
    .toInt(),
  
  body('Nom_prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nom/Prénom doit faire 2-100 caractères'),
  
  body('Matricule')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Matricule doit faire 1-20 caractères'),
  
  body('Date_embauche')
    .optional()
    .isISO8601().withMessage('Date embauche invalide (format: YYYY-MM-DD)'),
  
  body('Qr_code')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('QR code max 100 caractères'),
  
  body('Email')
    .optional()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('Date_naissance')
    .optional()
    .isISO8601().withMessage('Date naissance invalide (format: YYYY-MM-DD)'),
  
  body('Adresse')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Adresse max 255 caractères'),
  
  body('Ville')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Ville max 50 caractères'),
  
  body('Code_postal')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Code postal max 10 caractères'),
  
  body('Telephone')
    .optional()
    .trim()
    .matches(/^[0-9\s\-\+\(\)]+$/).withMessage('Téléphone invalide'),
  
  body('Poste')
    .optional()
    .isIn(['Operateur', 'Chef de ligne', 'Responsable QC', 'Maintenance'])
    .withMessage('Poste invalide (Operateur, Chef de ligne, Responsable QC, Maintenance)'),
  
  body('Statut')
    .optional()
    .isIn(['actif', 'inactif'])
    .withMessage('Statut invalide (actif, inactif)'),
  
  body('Type_contrat')
    .optional()
    .isIn(['CDI', 'CDD', 'Stage', 'Contrat temporaire'])
    .withMessage('Type contrat invalide (CDI, CDD, Stage, Contrat temporaire)'),
  
  body('Date_fin_contrat')
    .optional()
    .isISO8601().withMessage('Date fin contrat invalide (format: YYYY-MM-DD)'),
  
  body('Site_affectation')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Site affectation max 50 caractères'),
  
  body('Numero_CNSS')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro CNSS max 20 caractères'),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
];

/**
 * Validateur pour récupérer un employé par ID
 */
exports.personnelIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID employé invalide')
    .toInt()
];

/**
 * Validateur pour récupérer un employé par matricule
 */
exports.personnelMatriculeValidator = [
  param('matricule')
    .notEmpty().withMessage('Matricule requis')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Matricule invalide')
];

/**
 * Validateur pour changer le statut
 */
exports.changeStatutValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID employé invalide')
    .toInt(),
  
  body('Statut')
    .notEmpty().withMessage('Statut requis')
    .isIn(['actif', 'inactif'])
    .withMessage('Statut invalide (actif, inactif)')
];

/**
 * Validateur pour filtrer par statut
 */
exports.personnelByStatutValidator = [
  param('statut')
    .isIn(['actif', 'inactif'])
    .withMessage('Statut invalide (actif, inactif)')
];

/**
 * Validateur pour filtrer par poste
 */
exports.personnelByPosteValidator = [
  param('poste')
    .isIn(['Operateur', 'Chef de ligne', 'Responsable QC', 'Maintenance'])
    .withMessage('Poste invalide')
];

/**
 * Validateur pour filtrer par site
 */
exports.personnelBySiteValidator = [
  param('site')
    .notEmpty().withMessage('Site requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Site invalide')
];
