const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator } = require('../validators');
const typeMachineController = require('../controllers/typeMachine.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes CRUD pour types_machine
router.get('/', authMiddleware, typeMachineController.getAllTypesMachine);
router.get('/export/xlsx', authMiddleware, typeMachineController.exportTypesMachineXLSX);

router.get(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  typeMachineController.getTypeMachineById
);

router.post('/', authMiddleware, typeMachineController.createTypeMachine);

router.put(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  typeMachineController.updateTypeMachine
);

router.delete(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  typeMachineController.deleteTypeMachine
);

module.exports = router;
