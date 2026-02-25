const express = require('express');
const router = express.Router();
const semainesController = require('../controllers/semaines.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

/**
 * Routes pour la gestion des semaines
 * Prefix: /api/semaines
 */

// GET: Récupérer toutes les semaines avec pagination et filtres
// Query params: page, limit, sort, order, annee, mois, recherche
router.get('/', authMiddleware, requirePermission('SEMAINES_READ'), semainesController.getList);

// GET: Récupérer une semaine par ID
router.get('/:id', authMiddleware, requirePermission('SEMAINES_READ'), semainesController.getById);

// POST: Créer une nouvelle semaine
router.post('/', authMiddleware, requirePermission('SEMAINES_WRITE'), semainesController.create);

// PUT: Mettre à jour une semaine
router.put('/:id', authMiddleware, requirePermission('SEMAINES_WRITE'), semainesController.update);

// DELETE: Supprimer une semaine
router.delete('/:id', authMiddleware, requirePermission('SEMAINES_WRITE'), semainesController.delete);

module.exports = router;
