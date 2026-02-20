const express = require('express');
const router = express.Router();
const amtController = require('../controllers/articleMachineTest.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes principales
router.get('/', authMiddleware, amtController.getAllAssociations);
router.get('/:id', authMiddleware, amtController.getAssociationById);
router.post('/', authMiddleware, amtController.createAssociation);
router.put('/:id', authMiddleware, amtController.updateAssociation);
router.delete('/:id', authMiddleware, amtController.deleteAssociation);

// Routes par filtre
router.get('/article/:articleId', authMiddleware, amtController.getByArticle);
router.get('/machine/:machineId', authMiddleware, amtController.getByMachine);
router.get('/disponible/article/:articleId', authMiddleware, amtController.getMachinesDisponibles);

// Routes spécifiques
router.patch('/:id/programme', authMiddleware, amtController.updateProgramme);
router.get('/statistiques/resume', authMiddleware, amtController.getStatistiquesTests);

module.exports = router;