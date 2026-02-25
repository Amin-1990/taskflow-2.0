const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
    createCommandeValidator,
    updateCommandeValidator,
    commandeIdValidator,
    commandeLotValidator,
    commandeBySemaineValidator,
    commandeByArticleValidator,
    updateFactureeValidator,
    statistiquesSemaineValidator,
    updateQuantiteEmballe,
    emballageStatsValidator,
    resetQuantiteEmballe
} = require('../validators');
const commandeController = require('../controllers/commande.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes spécifiques D'ABORD
router.get(
    '/export/xlsx',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.exportCommandesXLSX
);

// Compatibilite temporaire pour anciens clients
router.get(
    '/export/csv',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.exportCommandesXLSX
);

router.get(
    '/statistiques/semaine/:semaineId',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    statistiquesSemaineValidator,
    validate,
    commandeController.getStatistiquesSemaine
);

router.get(
    '/semaine/:semaineId',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeBySemaineValidator,
    validate,
    commandeController.getCommandesBySemaine
);

router.get(
    '/article/:articleId',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeByArticleValidator,
    validate,
    commandeController.getCommandesByArticle
);

router.get(
    '/lot/:lot',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeLotValidator,
    validate,
    commandeController.getCommandeByLot
);

router.get(
    '/semaines-disponibles',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.getSemainesAvecCommandes
);

router.get(
    '/articles-filtres',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.getArticlesFiltres
);

router.get(
    '/articles-lots-filtres',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.getArticlesLotsFiltres
);

router.get(
    '/unites',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeController.getUnitesProduction
);

// Route avec paramètre
router.get(
    '/:id',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    commandeIdValidator,
    validate,
    commandeController.getCommandeById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('COMMANDES_READ'), commandeController.getAllCommandes);

// POST
router.post(
    '/',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    createCommandeValidator,
    validate,
    commandeController.createCommande
);

// PUT
router.put(
    '/:id',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    updateCommandeValidator,
    validate,
    commandeController.updateCommande
);

// PATCH
router.patch(
    '/:id/facturer',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    updateFactureeValidator,
    validate,
    commandeController.updateFacturee
);

// ✅ NOUVELLES ROUTES POUR L'EMBALLAGE

// PATCH - Mettre à jour quantité emballée
router.patch(
    '/:id/emballe',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    updateQuantiteEmballe,
    validate,
    commandeController.updateQuantiteEmballe
);

// GET - Statistiques d'emballage
router.get(
    '/:id/emballage/stats',
    authMiddleware,
    requirePermission('COMMANDES_READ'),
    emballageStatsValidator,
    validate,
    commandeController.getEmballageStats
);

// POST - Reset quantité emballée (admin)
router.post(
    '/:id/emballe/reset',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    resetQuantiteEmballe,
    validate,
    commandeController.resetQuantiteEmballe
);

// DELETE
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('COMMANDES_WRITE'),
    commandeIdValidator,
    validate,
    commandeController.deleteCommande
);

module.exports = router;
