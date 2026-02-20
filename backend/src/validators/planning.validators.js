const { body, param } = require('express-validator');

/**
 * Validateur pour creer un planning hebdomadaire
 */
exports.createPlanningValidator = [
  body('ID_Semaine_planifiee')
    .notEmpty().withMessage('ID semaine planifiee requis')
    .isInt({ min: 1 }).withMessage('ID semaine doit etre un entier positif')
    .toInt(),

  body('ID_Commande')
    .notEmpty().withMessage('ID commande requis')
    .isInt({ min: 1 }).withMessage('ID commande doit etre un entier positif')
    .toInt(),

  body('ID_Semaine_precedente')
    .optional()
    .isInt({ min: 1 }).withMessage('ID semaine precedente invalide')
    .toInt(),

  body('Date_debut_planification')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date debut planification invalide')
    .toDate(),

  body('Identifiant_lot')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Identifiant lot invalide (1-50 caracteres)'),

  body('Quantite_facturee_semaine')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantite facturee semaine invalide')
    .toInt(),

  body('Stock_actuel')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock actuel doit etre un entier positif')
    .toInt(),

  body('Stock_embale_precedent')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock embale precedent doit etre un entier positif')
    .toInt(),

  body('Lundi_planifie').optional().isInt({ min: 0 }).withMessage('Lundi planifie invalide').toInt(),
  body('Lundi_emballe').optional().isInt({ min: 0 }).withMessage('Lundi emballe invalide').toInt(),
  body('Mardi_planifie').optional().isInt({ min: 0 }).withMessage('Mardi planifie invalide').toInt(),
  body('Mardi_emballe').optional().isInt({ min: 0 }).withMessage('Mardi emballe invalide').toInt(),
  body('Mercredi_planifie').optional().isInt({ min: 0 }).withMessage('Mercredi planifie invalide').toInt(),
  body('Mercredi_emballe').optional().isInt({ min: 0 }).withMessage('Mercredi emballe invalide').toInt(),
  body('Jeudi_planifie').optional().isInt({ min: 0 }).withMessage('Jeudi planifie invalide').toInt(),
  body('Jeudi_emballe').optional().isInt({ min: 0 }).withMessage('Jeudi emballe invalide').toInt(),
  body('Vendredi_planifie').optional().isInt({ min: 0 }).withMessage('Vendredi planifie invalide').toInt(),
  body('Vendredi_emballe').optional().isInt({ min: 0 }).withMessage('Vendredi emballe invalide').toInt(),
  body('Samedi_planifie').optional().isInt({ min: 0 }).withMessage('Samedi planifie invalide').toInt(),
  body('Samedi_emballe').optional().isInt({ min: 0 }).withMessage('Samedi emballe invalide').toInt(),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caracteres')
];

/**
 * Validateur pour modifier un planning
 */
exports.updatePlanningValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID planning invalide')
    .toInt(),

  body('ID_Semaine_planifiee')
    .optional()
    .isInt({ min: 1 }).withMessage('ID semaine invalide')
    .toInt(),

  body('ID_Commande')
    .optional()
    .isInt({ min: 1 }).withMessage('ID commande invalide')
    .toInt(),

  body('ID_Semaine_precedente')
    .optional()
    .isInt({ min: 1 }).withMessage('ID semaine precedente invalide')
    .toInt(),

  body('Date_debut_planification')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date debut planification invalide')
    .toDate(),

  body('Identifiant_lot')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Identifiant lot invalide (1-50 caracteres)'),

  body('Quantite_facturee_semaine')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantite facturee semaine invalide')
    .toInt(),

  body('Stock_actuel').optional().isInt({ min: 0 }).withMessage('Stock actuel invalide').toInt(),
  body('Stock_embale_precedent').optional().isInt({ min: 0 }).withMessage('Stock embale precedent invalide').toInt(),

  body('Lundi_planifie').optional().isInt({ min: 0 }).withMessage('Lundi planifie invalide').toInt(),
  body('Lundi_emballe').optional().isInt({ min: 0 }).withMessage('Lundi emballe invalide').toInt(),
  body('Mardi_planifie').optional().isInt({ min: 0 }).withMessage('Mardi planifie invalide').toInt(),
  body('Mardi_emballe').optional().isInt({ min: 0 }).withMessage('Mardi emballe invalide').toInt(),
  body('Mercredi_planifie').optional().isInt({ min: 0 }).withMessage('Mercredi planifie invalide').toInt(),
  body('Mercredi_emballe').optional().isInt({ min: 0 }).withMessage('Mercredi emballe invalide').toInt(),
  body('Jeudi_planifie').optional().isInt({ min: 0 }).withMessage('Jeudi planifie invalide').toInt(),
  body('Jeudi_emballe').optional().isInt({ min: 0 }).withMessage('Jeudi emballe invalide').toInt(),
  body('Vendredi_planifie').optional().isInt({ min: 0 }).withMessage('Vendredi planifie invalide').toInt(),
  body('Vendredi_emballe').optional().isInt({ min: 0 }).withMessage('Vendredi emballe invalide').toInt(),
  body('Samedi_planifie').optional().isInt({ min: 0 }).withMessage('Samedi planifie invalide').toInt(),
  body('Samedi_emballe').optional().isInt({ min: 0 }).withMessage('Samedi emballe invalide').toInt(),

  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caracteres')
];

/**
 * Validateur pour recuperer un planning par ID
 */
exports.planningIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID planning invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par semaine
 */
exports.planningBySemaineValidator = [
  param('semaineId')
    .isInt({ min: 1 }).withMessage('ID semaine invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par commande
 */
exports.planningByCommandeValidator = [
  param('commandeId')
    .isInt({ min: 1 }).withMessage('ID commande invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par identifiant lot
 */
exports.planningByLotValidator = [
  param('identifiant')
    .notEmpty().withMessage('Identifiant lot requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Identifiant lot invalide')
];

/**
 * Validateur pour mettre a jour la realisation
 */
exports.updateRealisationValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID planning invalide')
    .toInt(),

  body('Quantite_realise')
    .notEmpty().withMessage('Quantite realisee requise')
    .isInt({ min: 0 }).withMessage('Quantite realisee doit etre un entier positif')
    .toInt(),

  body('Nombre_articles_rejetes')
    .optional()
    .isInt({ min: 0 }).withMessage('Nombre rejetes invalide')
    .toInt(),

  body('Notes_realisation')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes realisation max 500 caracteres')
];
