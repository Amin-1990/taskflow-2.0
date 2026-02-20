const express = require('express');
const router = express.Router();
const affectationController = require('../controllers/affectation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET - Routes de recherche
router.get('/', authMiddleware, affectationController.getAllAffectations);
router.get('/operateur/:id/en-cours', authMiddleware, affectationController.getAffectationsEnCoursByOperateur);
router.get('/commande/:id', authMiddleware, affectationController.getAffectationsByCommande);
router.get('/:id', authMiddleware, affectationController.getAffectationById);

// POST - Creer une affectation
router.post('/', authMiddleware, affectationController.createAffectation);

// PATCH - Actions sur les affectations
router.patch('/:id', authMiddleware, affectationController.updateAffectation);
router.patch('/:id/terminer', authMiddleware, affectationController.terminerAffectation);
router.patch('/:id/heures-supp', authMiddleware, affectationController.ajouterHeuresSupp);

// DELETE - Supprimer une affectation
router.delete('/:id', authMiddleware, affectationController.deleteAffectation);

module.exports = router;
