const express = require('express');
const router = express.Router();
const defautController = require('../controllers/defautTypeMachine.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes principales
router.get('/', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.getAllDefauts);
router.get('/export/xlsx', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.exportDefautsTypeMachineXLSX);
router.get('/:id', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.getDefautById);
router.post('/', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_WRITE'), defautController.createDefaut);
router.put('/:id', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_WRITE'), defautController.updateDefaut);
router.delete('/:id', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_WRITE'), defautController.deleteDefaut);

// Routes de recherche
router.get('/type/:typeMachineId', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.getDefautsByType);
router.get('/code/:code', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.getDefautByCode);
router.get('/recherche/:texte', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.rechercheDefauts);

// Routes spécifiques
router.post('/dupliquer', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_WRITE'), defautController.dupliquerDefauts);
router.get('/statistiques/utilisation', authMiddleware, requirePermission('DEFAUTS_TYPE_MACHINE_READ'), defautController.getStatistiquesUtilisation);

module.exports = router;
