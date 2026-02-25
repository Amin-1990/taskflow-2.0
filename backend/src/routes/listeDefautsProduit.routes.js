const express = require('express');
const router = express.Router();
const defautController = require('../controllers/listeDefautsProduit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes principales
router.get('/', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.getAllDefauts);
router.post('/', authMiddleware, requirePermission('DEFAUTS_PRODUIT_WRITE'), defautController.createDefaut);
router.put('/:id', authMiddleware, requirePermission('DEFAUTS_PRODUIT_WRITE'), defautController.updateDefaut);
router.delete('/:id', authMiddleware, requirePermission('DEFAUTS_PRODUIT_WRITE'), defautController.deleteDefaut);

// Routes de recherche
router.get('/code/:code', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.getDefautByCode);
router.get('/recherche/:texte', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.rechercheDefauts);
router.get('/export/xlsx', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.exportDefautsProduitXlsx);

// Routes specifiques
router.get('/statistiques/utilisation', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.getStatistiquesUtilisation);
router.get('/categories/liste', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.getCategories);
router.patch('/:id/cout', authMiddleware, requirePermission('DEFAUTS_PRODUIT_WRITE'), defautController.updateCout);

// Import en masse
router.post('/import', authMiddleware, requirePermission('DEFAUTS_PRODUIT_WRITE'), defautController.importDefauts);

// Route parametree en dernier pour eviter les conflits
router.get('/:id', authMiddleware, requirePermission('DEFAUTS_PRODUIT_READ'), defautController.getDefautById);

module.exports = router;
