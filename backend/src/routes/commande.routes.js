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

// Routes spécifiques D'ABORD
router.get(
    '/export/xlsx',
    authMiddleware,
    commandeController.exportCommandesXLSX
);

// Compatibilite temporaire pour anciens clients
router.get(
    '/export/csv',
    authMiddleware,
    commandeController.exportCommandesXLSX
);

router.get(
    '/statistiques/semaine/:semaineId',
    authMiddleware,
    statistiquesSemaineValidator,
    validate,
    commandeController.getStatistiquesSemaine
);

router.get(
    '/semaine/:semaineId',
    authMiddleware,
    commandeBySemaineValidator,
    validate,
    commandeController.getCommandesBySemaine
);

router.get(
    '/article/:articleId',
    authMiddleware,
    commandeByArticleValidator,
    validate,
    commandeController.getCommandesByArticle
);

router.get(
    '/lot/:lot',
    authMiddleware,
    commandeLotValidator,
    validate,
    commandeController.getCommandeByLot
);

router.get(
    '/semaines-disponibles',
    authMiddleware,
    commandeController.getSemainesAvecCommandes
);

router.get(
    '/articles-filtres',
    authMiddleware,
    commandeController.getArticlesFiltres
);

router.get(
    '/articles-lots-filtres',
    authMiddleware,
    commandeController.getArticlesLotsFiltres
);

router.get(
    '/unites',
    authMiddleware,
    commandeController.getUnitesProduction
);

// Route avec paramètre
router.get(
    '/:id',
    authMiddleware,
    commandeIdValidator,
    validate,
    commandeController.getCommandeById
);

// Liste (pas de validation)
router.get('/', authMiddleware, commandeController.getAllCommandes);

// POST
router.post(
    '/',
    authMiddleware,
    createCommandeValidator,
    validate,
    commandeController.createCommande
);

// PUT
router.put(
    '/:id',
    authMiddleware,
    updateCommandeValidator,
    validate,
    commandeController.updateCommande
);

// PATCH
router.patch(
    '/:id/facturer',
    authMiddleware,
    updateFactureeValidator,
    validate,
    commandeController.updateFacturee
);

// ✅ NOUVELLES ROUTES POUR L'EMBALLAGE

// PATCH - Mettre à jour quantité emballée
router.patch(
    '/:id/emballe',
    authMiddleware,
    updateQuantiteEmballe,
    validate,
    commandeController.updateQuantiteEmballe
);

// GET - Statistiques d'emballage
router.get(
    '/:id/emballage/stats',
    authMiddleware,
    emballageStatsValidator,
    validate,
    commandeController.getEmballageStats
);

// POST - Reset quantité emballée (admin)
router.post(
    '/:id/emballe/reset',
    authMiddleware,
    resetQuantiteEmballe,
    validate,
    commandeController.resetQuantiteEmballe
);

// DELETE
router.delete(
    '/:id',
    authMiddleware,
    commandeIdValidator,
    validate,
    commandeController.deleteCommande
);

module.exports = router;
