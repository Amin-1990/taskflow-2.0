const { body, param } = require('express-validator');

/**
 * Validateur pour creer une commande
 */
exports.createCommandeValidator = [
    body('Date_debut')
        .notEmpty().withMessage('Date debut requise')
        .isISO8601().withMessage('Date debut invalide (format: YYYY-MM-DD)'),

    body('Code_article')
        .notEmpty().withMessage('Code article requis')
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('Code article invalide'),

    body('Quantite')
        .notEmpty().withMessage('Quantite requise')
        .isInt({ min: 1 }).withMessage('Quantite doit etre un entier positif')
        .toInt(),

    body('Lot')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Lot max 50 caracteres'),

    body('Origine')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Origine max 100 caracteres'),

    body('Unite_production')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Unite production max 50 caracteres'),

    body('ID_Semaine')
        .optional()
        .isInt({ min: 1 }).withMessage('ID Semaine doit etre un entier positif')
        .toInt(),

    body('ID_Article')
        .optional()
        .isInt({ min: 1 }).withMessage('ID Article doit etre un entier positif')
        .toInt(),

    body('priorite')
        .optional()
        .isIn(['basse', 'normale', 'haute', 'urgente']).withMessage('Priorite invalide')
];

/**
 * Validateur pour modifier une commande
 */
exports.updateCommandeValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt(),

    body('Date_debut')
        .optional()
        .isISO8601().withMessage('Date debut invalide (format: YYYY-MM-DD)'),

    body('Code_article')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('Code article invalide'),

    body('Quantite')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantite doit etre un entier positif')
        .toInt(),

    body('Lot')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Lot max 50 caracteres'),

    body('Origine')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Origine max 100 caracteres'),

    body('Unite_production')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Unite production max 50 caracteres'),

    body('ID_Semaine')
        .optional()
        .isInt({ min: 1 }).withMessage('ID Semaine doit etre un entier positif')
        .toInt(),

    body('ID_Article')
        .optional()
        .isInt({ min: 1 }).withMessage('ID Article doit etre un entier positif')
        .toInt(),

    body('priorite')
        .optional()
        .isIn(['basse', 'normale', 'haute', 'urgente']).withMessage('Priorite invalide')
];

/**
 * Validateur pour recuperer une commande par ID
 */
exports.commandeIdValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt()
];

/**
 * Validateur pour recuperer une commande par lot
 */
exports.commandeLotValidator = [
    param('lot')
        .notEmpty().withMessage('Lot requis')
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('Lot invalide')
];

/**
 * Validateur pour recuperer par semaine
 */
exports.commandeBySemaineValidator = [
    param('semaineId')
        .isInt({ min: 1 }).withMessage('ID semaine invalide')
        .toInt()
];

/**
 * Validateur pour recuperer par article
 */
exports.commandeByArticleValidator = [
    param('articleId')
        .isInt({ min: 1 }).withMessage('ID article invalide')
        .toInt()
];

/**
 * Endpoint historique desactive (quantite_facturee supprimee de commandes)
 */
exports.updateFactureeValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt()
];

/**
 * Validateur pour recuperer les statistiques par semaine
 */
exports.statistiquesSemaineValidator = [
    param('semaineId')
        .isInt({ min: 1 }).withMessage('ID semaine invalide')
        .toInt()
];

/**
 * Validateur pour mettre a jour la quantite emballee
 */
exports.updateQuantiteEmballe = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt(),

    body('quantite')
        .notEmpty().withMessage('Quantite requise')
        .isInt({ min: 1 }).withMessage('Quantite doit etre un entier positif')
        .toInt()
];

/**
 * Validateur pour les stats d'emballage
 */
exports.emballageStatsValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt()
];

/**
 * Validateur pour reset quantite emballee
 */
exports.resetQuantiteEmballe = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID commande invalide')
        .toInt()
];
