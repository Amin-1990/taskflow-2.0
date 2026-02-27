const express = require('express');
const router = express.Router();
const affectationController = require('../controllers/affectation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// GET - Routes de recherche (routes spécifiques avant les paramétrées)
router.get('/operateur/stats', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getOperateurDashboardStats);
router.get('/operateurs/unité', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getOperateurs);
router.get('/', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getAllAffectations);
router.get('/operateur/:id/en-cours', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getAffectationsEnCoursByOperateur);
router.get('/commande/:id', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getAffectationsByCommande);
router.get('/calculer-duree', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.calculerDuree);
router.get('/:id', authMiddleware, requirePermission('AFFECTATIONS_READ'), affectationController.getAffectationById);


// POST - Creer une affectation
router.post('/', authMiddleware, requirePermission('AFFECTATIONS_WRITE'), affectationController.createAffectation);

// PATCH - Actions sur les affectations
router.patch('/:id', authMiddleware, requirePermission('AFFECTATIONS_WRITE'), affectationController.updateAffectation);
router.patch('/:id/terminer', authMiddleware, requirePermission('AFFECTATIONS_WRITE'), affectationController.terminerAffectation);
router.patch('/:id/heures-supp', authMiddleware, requirePermission('AFFECTATIONS_WRITE'), affectationController.ajouterHeuresSupp);

// DELETE - Supprimer une affectation
router.delete('/:id', authMiddleware, requirePermission('AFFECTATIONS_WRITE'), affectationController.deleteAffectation);

module.exports = router;
