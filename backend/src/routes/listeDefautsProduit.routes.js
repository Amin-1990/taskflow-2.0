const express = require('express');
const router = express.Router();
const defautController = require('../controllers/listeDefautsProduit.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes principales
router.get('/', authMiddleware, defautController.getAllDefauts);
router.post('/', authMiddleware, defautController.createDefaut);
router.put('/:id', authMiddleware, defautController.updateDefaut);
router.delete('/:id', authMiddleware, defautController.deleteDefaut);

// Routes de recherche
router.get('/code/:code', authMiddleware, defautController.getDefautByCode);
router.get('/recherche/:texte', authMiddleware, defautController.rechercheDefauts);
router.get('/export/xlsx', authMiddleware, defautController.exportDefautsProduitXlsx);

// Routes specifiques
router.get('/statistiques/utilisation', authMiddleware, defautController.getStatistiquesUtilisation);
router.get('/categories/liste', authMiddleware, defautController.getCategories);
router.patch('/:id/cout', authMiddleware, defautController.updateCout);

// Import en masse
router.post('/import', authMiddleware, defautController.importDefauts);

// Route parametree en dernier pour eviter les conflits
router.get('/:id', authMiddleware, defautController.getDefautById);

module.exports = router;
