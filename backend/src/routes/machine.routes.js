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
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes specifiques et d'administration D'ABORD
router.get(
  '/dashboard/stats',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  validate,
  machineController.getDashboardStats
);

router.get(
  '/maintenance/retard',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  validate,
  machineController.getMachinesMaintenanceRetard
);

// Routes de recherche
router.get(
  '/code/:code',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineCodeValidator,
  validate,
  machineController.getMachineByCode
);

router.get(
  '/site/:site',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineBySiteValidator,
  validate,
  machineController.getMachinesBySite
);

router.get(
  '/type/:typeId',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineByTypeValidator,
  validate,
  machineController.getMachinesByType
);

router.get(
  '/statut/:statut',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineByStatutValidator,
  validate,
  machineController.getMachinesByStatutOperationnel
);

router.get(
  '/export/xlsx',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineController.exportMachinesXLSX
);

// Route avec parametre
router.get(
  '/:id',
  authMiddleware,
  requirePermission('MACHINES_READ'),
  machineIdValidator,
  validate,
  machineController.getMachineById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('MACHINES_READ'), machineController.getAllMachines);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('MACHINES_WRITE'),
  createMachineValidator,
  validate,
  machineController.createMachine
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  requirePermission('MACHINES_WRITE'),
  updateMachineValidator,
  validate,
  machineController.updateMachine
);

// PATCH
router.patch(
  '/:id/maintenance',
  authMiddleware,
  requirePermission('MACHINES_WRITE'),
  machineIdValidator,
  validate,
  machineController.updateMaintenance
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('MACHINES_WRITE'),
  machineIdValidator,
  validate,
  machineController.deleteMachine
);

module.exports = router;

