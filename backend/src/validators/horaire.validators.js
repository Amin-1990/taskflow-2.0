const { body, param } = require('express-validator');

/**
 * Validateur pour créer un horaire
 */
exports.createHoraireValidator = [
  body('Date')
    .notEmpty().withMessage('Date requise')
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)'),
  
  body('Jour_semaine')
    .optional()
    .isIn(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
    .withMessage('Jour semaine invalide'),
  
  body('Heure_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure début invalide (format: HH:MM ou HH:MM:SS)'),
  
  body('Heure_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure fin invalide (format: HH:MM ou HH:MM:SS)'),
  
  body('Heure_debut_pause')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure début pause invalide'),
  
  body('Heure_fin_pause')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure fin pause invalide'),
  
  body('Pause_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Pause début invalide'),
  
  body('Pause_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Pause fin invalide'),
  
  body('Heure_supp_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure supp début invalide'),
  
  body('Heure_supp_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure supp fin invalide'),
  
  body('Duree_travail_min')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée travail doit être un entier positif')
    .toInt(),
  
  body('Duree_pause_min')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée pause doit être un entier positif')
    .toInt(),
  
  body('Type_jour')
    .optional()
    .isIn(['normal', 'chômé', 'férie', 'week_end'])
    .withMessage('Type jour invalide'),
  
  body('Nombre_equipes')
    .optional()
    .isInt({ min: 1 }).withMessage('Nombre équipes doit être un entier positif')
    .toInt(),
  
  body('Est_ouvert')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_ouvert doit être 0 ou 1')
    .toInt(),
  
  body('Est_jour_ferie')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_jour_ferie doit être 0 ou 1')
    .toInt(),
  
  body('Type_chome')
    .optional()
    .isIn(['non_chomé', 'chomé_payé', 'chomé_non_payé'])
    .withMessage('Type_chome invalide'),
  
  body('Description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 caractères'),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
];

/**
 * Validateur pour modifier un horaire
 */
exports.updateHoraireValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID horaire invalide')
    .toInt(),
  
  body('Date')
    .optional()
    .isISO8601().withMessage('Date invalide'),
  
  body('Jour_semaine')
    .optional()
    .isIn(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
    .withMessage('Jour semaine invalide'),
  
  body('Heure_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure début invalide'),
  
  body('Heure_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure fin invalide'),
  
  body('Heure_debut_pause')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure début pause invalide'),
  
  body('Heure_fin_pause')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure fin pause invalide'),
  
  body('Pause_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Pause début invalide'),
  
  body('Pause_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Pause fin invalide'),
  
  body('Heure_supp_debut')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure supp début invalide'),
  
  body('Heure_supp_fin')
    .optional({ checkFalsy: true })
    .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/).withMessage('Heure supp fin invalide'),
  
  body('Duree_travail_min')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée travail invalide')
    .toInt(),
  
  body('Duree_pause_min')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée pause invalide')
    .toInt(),
  
  body('Type_jour')
    .optional()
    .isIn(['normal', 'chômé', 'férie', 'week_end'])
    .withMessage('Type jour invalide'),
  
  body('Nombre_equipes')
    .optional()
    .isInt({ min: 1 }).withMessage('Nombre équipes invalide')
    .toInt(),
  
  body('Est_ouvert')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_ouvert doit être 0 ou 1')
    .toInt(),
  
  body('Est_jour_ferie')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('Est_jour_ferie doit être 0 ou 1')
    .toInt(),
  
  body('Type_chome')
    .optional()
    .isIn(['non_chomé', 'chomé_payé', 'chomé_non_payé'])
    .withMessage('Type_chome invalide'),
  
  body('Description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 caractères'),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
];

/**
 * Validateur pour récupérer un horaire par ID
 */
exports.horaireIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID horaire invalide')
    .toInt()
];

/**
 * Validateur pour récupérer par date
 */
exports.horaireByDateValidator = [
  param('date')
    .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)')
];

/**
 * Validateur pour filtrer par jour de semaine
 */
exports.horaireByJourValidator = [
  param('jour')
    .isIn(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
    .withMessage('Jour invalide')
];

/**
 * Validateur pour filtrer par type de jour
 */
exports.horaireByTypeJourValidator = [
  param('typeJour')
    .isIn(['normal', 'chômé', 'férie', 'week_end'])
    .withMessage('Type jour invalide')
];
