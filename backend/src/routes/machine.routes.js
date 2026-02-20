const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createMachineValidator,
  updateMachineValidator,
  machineIdValidator,
  machineCodeValidator,
  machineBySiteValidator,
  machineByTypeValidator,
  machineByStatutValidator
} = require('../validators');
const machineController = require('../controllers/machine.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes spécifiques et d'administration D'ABORD
router.get(
  '/dashboard/stats',
  authMiddleware,
  validate,
  machineController.getDashboardStats
);

router.get(
  '/maintenance/retard',
  authMiddleware,
  validate,
  machineController.getMachinesMaintenanceRetard
);

// Routes de recherche
router.get(
  '/code/:code',
  authMiddleware,
  machineCodeValidator,
  validate,
  machineController.getMachineByCode
);

router.get(
  '/site/:site',
  authMiddleware,
  machineBySiteValidator,
  validate,
  machineController.getMachinesBySite
);

router.get(
  '/type/:typeId',
  authMiddleware,
  machineByTypeValidator,
  validate,
  machineController.getMachinesByType
);

router.get(
  '/statut/:statut',
  authMiddleware,
  machineByStatutValidator,
  validate,
  machineController.getMachinesByStatutOperationnel
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  machineIdValidator,
  validate,
  machineController.getMachineById
);

// Liste (pas de validation)
router.get('/', authMiddleware, machineController.getAllMachines);

// POST
router.post(
  '/',
  authMiddleware,
  createMachineValidator,
  validate,
  machineController.createMachine
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  updateMachineValidator,
  validate,
  machineController.updateMachine
);

// PATCH
router.patch(
  '/:id/maintenance',
  authMiddleware,
  machineIdValidator,
  validate,
  machineController.updateMaintenance
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  machineIdValidator,
  validate,
  machineController.deleteMachine
);

module.exports = router;