const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator } = require('../validators');
const typeMachineController = require('../controllers/typeMachine.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes CRUD pour types_machine
router.get('/', authMiddleware, requirePermission('TYPES_MACHINE_READ'), typeMachineController.getAllTypesMachine);
router.get('/export/xlsx', authMiddleware, requirePermission('TYPES_MACHINE_READ'), typeMachineController.exportTypesMachineXLSX);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('TYPES_MACHINE_READ'),
  idValidator,
  validate,
  typeMachineController.getTypeMachineById
);

router.post('/', authMiddleware, requirePermission('TYPES_MACHINE_WRITE'), typeMachineController.createTypeMachine);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('TYPES_MACHINE_WRITE'),
  idValidator,
  validate,
  typeMachineController.updateTypeMachine
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('TYPES_MACHINE_WRITE'),
  idValidator,
  validate,
  typeMachineController.deleteTypeMachine
);

module.exports = router;
