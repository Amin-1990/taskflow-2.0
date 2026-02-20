const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes de test (pour vérifier que ça marche)
router.get('/test/excel', authMiddleware, exportController.testExcel);
router.get('/test/pdf', authMiddleware, exportController.testPDF);

// Routes réelles - Export Planning
router.get('/planning/:semaineId/pdf', authMiddleware, exportController.exportPlanningPDF);
router.get('/planning/:semaineId/excel', authMiddleware, exportController.exportPlanningExcel);
router.get('/planning/:semaineId', authMiddleware, exportController.exportPlanning);

// Routes réelles - Export Pointage
router.get('/pointage', authMiddleware, exportController.exportPointage);

// Routes réelles - Export Commandes
router.get('/commandes/xlsx', authMiddleware, exportController.exportCommandesXLSX);
router.get('/commandes/csv', authMiddleware, exportController.exportCommandesXLSX);

module.exports = router;
