const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

router.use(authMiddleware);
router.use(requirePermission('EXPORT_READ'));

// Routes de test (pour vérifier que ça marche)
router.get('/test/excel', exportController.testExcel);
router.get('/test/pdf', exportController.testPDF);

// Routes réelles - Export Planning
router.get('/planning/:semaineId/pdf', exportController.exportPlanningPDF);
router.get('/planning/:semaineId/excel', exportController.exportPlanningExcel);
router.get('/planning/:semaineId', exportController.exportPlanning);

// Routes réelles - Export Pointage
router.get('/pointage', exportController.exportPointage);

// Routes réelles - Export Commandes
router.get('/commandes/xlsx', exportController.exportCommandesXLSX);
router.get('/commandes/csv', exportController.exportCommandesXLSX);

module.exports = router;
