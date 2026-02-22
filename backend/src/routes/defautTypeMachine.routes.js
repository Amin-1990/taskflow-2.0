const express = require('express');
const router = express.Router();
const defautController = require('../controllers/defautTypeMachine.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes principales
router.get('/', authMiddleware, defautController.getAllDefauts);
router.get('/export/xlsx', authMiddleware, defautController.exportDefautsTypeMachineXLSX);
router.get('/:id', authMiddleware, defautController.getDefautById);
router.post('/', authMiddleware, defautController.createDefaut);
router.put('/:id', authMiddleware, defautController.updateDefaut);
router.delete('/:id', authMiddleware, defautController.deleteDefaut);

// Routes de recherche
router.get('/type/:typeMachineId', authMiddleware, defautController.getDefautsByType);
router.get('/code/:code', authMiddleware, defautController.getDefautByCode);
router.get('/recherche/:texte', authMiddleware, defautController.rechercheDefauts);

// Routes spécifiques
router.post('/dupliquer', authMiddleware, defautController.dupliquerDefauts);
router.get('/statistiques/utilisation', authMiddleware, defautController.getStatistiquesUtilisation);

module.exports = router;
