const { body, param } = require('express-validator');

/**
 * Validateur pour créer une demande d'intervention
 */
exports.createInterventionValidator = [
  body('ID_Type_machine')
    .notEmpty().withMessage('Type machine requis')
    .isInt({ min: 1 }).withMessage('ID type machine doit être un entier positif')
    .toInt(),
  
  body('Date_heure_demande')
    .notEmpty().withMessage('Date/heure demande requise')
    .isISO8601().withMessage('Date/heure invalide (format: YYYY-MM-DDTHH:MM:SS)'),
  
  body('Statut')
    .optional()
    .isIn(['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'REPORTEE'])
    .withMessage('Statut invalide'),
  
  body('Priorite')
    .optional()
    .isIn(['URGENTE', 'HAUTE', 'NORMALE', 'BASSE'])
    .withMessage('Priorité invalide (URGENTE, HAUTE, NORMALE, BASSE)'),
  
  body('ID_Machine')
    .optional()
    .isInt({ min: 1 }).withMessage('ID machine doit être un entier positif')
    .toInt(),
  
  body('ID_Defaut')
    .optional()
    .isInt({ min: 1 }).withMessage('ID défaut doit être un entier positif')
    .toInt(),
  
  body('ID_Technicien')
    .optional()
    .isInt({ min: 1 }).withMessage('ID technicien doit être un entier positif')
    .toInt(),
  
  body('Demandeur')
    .optional()
    .isInt({ min: 1 }).withMessage('ID demandeur doit être un entier positif')
    .toInt(),
  
  body('Description_probleme')
    .notEmpty().withMessage('Description du problème requise')
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Description doit faire 5-1000 caractères'),
  
  body('Date_heure_debut_reparation')
    .optional()
    .isISO8601().withMessage('Date/heure début réparation invalide'),
  
  body('Date_heure_fin_reparation')
    .optional()
    .isISO8601().withMessage('Date/heure fin réparation invalide'),
  
  body('Duree_reparation_min')
    .optional()
    .isInt({ min: 1 }).withMessage('Durée doit être un entier positif')
    .toInt(),
  
  body('Cause_defaut')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Cause max 500 caractères'),
  
  body('Solution_apportee')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Solution max 500 caractères'),
  
  body('Pieces_changees')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Pièces changées max 500 caractères'),
  
  body('Cout_reparation')
    .optional()
    .isDecimal().withMessage('Coût doit être un nombre décimal')
    .toFloat(),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Commentaire max 1000 caractères')
];

/**
 * Validateur pour modifier une demande d'intervention
 */
exports.updateInterventionValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID intervention invalide')
    .toInt(),
  
  body('ID_Type_machine')
    .optional()
    .isInt({ min: 1 }).withMessage('ID type machine doit être un entier positif')
    .toInt(),
  
  body('Date_heure_demande')
    .optional()
    .isISO8601().withMessage('Date/heure invalide'),
  
  body('Statut')
    .optional()
    .isIn(['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'REPORTEE'])
    .withMessage('Statut invalide'),
  
  body('Priorite')
    .optional()
    .isIn(['URGENTE', 'HAUTE', 'NORMALE', 'BASSE'])
    .withMessage('Priorité invalide'),
  
  body('ID_Machine')
    .optional()
    .isInt({ min: 1 }).withMessage('ID machine invalide')
    .toInt(),
  
  body('ID_Defaut')
    .optional()
    .isInt({ min: 1 }).withMessage('ID défaut invalide')
    .toInt(),
  
  body('ID_Technicien')
    .optional()
    .isInt({ min: 1 }).withMessage('ID technicien invalide')
    .toInt(),
  
  body('Demandeur')
    .optional()
    .isInt({ min: 1 }).withMessage('ID demandeur invalide')
    .toInt(),
  
  body('Description_probleme')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Description doit faire 5-1000 caractères'),
  
  body('Date_heure_debut_reparation')
    .optional()
    .isISO8601().withMessage('Date/heure invalide'),
  
  body('Date_heure_fin_reparation')
    .optional()
    .isISO8601().withMessage('Date/heure invalide'),
  
  body('Duree_reparation_min')
    .optional()
    .isInt({ min: 1 }).withMessage('Durée doit être un entier positif')
    .toInt(),
  
  body('Cause_defaut')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Cause max 500 caractères'),
  
  body('Solution_apportee')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Solution max 500 caractères'),
  
  body('Pieces_changees')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Pièces changées max 500 caractères'),
  
  body('Cout_reparation')
    .optional()
    .isDecimal().withMessage('Coût doit être un nombre décimal')
    .toFloat(),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Commentaire max 1000 caractères')
];

/**
 * Validateur pour récupérer une intervention par ID
 */
exports.interventionIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID intervention invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par statut
 */
exports.interventionByStatutValidator = [
  param('statut')
    .isIn(['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'REPORTEE'])
    .withMessage('Statut invalide')
];

/**
 * Validateur pour filtrer par priorité
 */
exports.interventionByPrioriteValidator = [
  param('priorite')
    .isIn(['URGENTE', 'HAUTE', 'NORMALE', 'BASSE'])
    .withMessage('Priorité invalide')
];

/**
 * Validateur pour filtrer par technicien
 */
exports.interventionByTechnicienValidator = [
  param('technicienId')
    .isInt({ min: 1 }).withMessage('ID technicien invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par machine
 */
exports.interventionByMachineValidator = [
  param('machineId')
    .isInt({ min: 1 }).withMessage('ID machine invalide')
    .toInt()
];

/**
 * Validateur pour assigner une intervention
 */
exports.assignInterventionValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID intervention invalide')
    .toInt(),
  
  body('ID_Technicien')
    .notEmpty().withMessage('ID technicien requis')
    .isInt({ min: 1 }).withMessage('ID technicien doit être un entier positif')
    .toInt()
];

/**
 * Validateur pour marquer une intervention comme terminée
 */
exports.completeInterventionValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID intervention invalide')
    .toInt(),
  
  body('Date_heure_fin_reparation')
    .notEmpty().withMessage('Date/heure fin requise')
    .isISO8601().withMessage('Date/heure invalide'),
  
  body('Solution_apportee')
    .notEmpty().withMessage('Solution apportée requise')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Solution doit faire 5-500 caractères'),
  
  body('Cout_reparation')
    .optional()
    .isDecimal().withMessage('Coût doit être un nombre décimal')
    .toFloat()
];
