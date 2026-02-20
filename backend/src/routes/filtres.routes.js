const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const filtresController = require('../controllers/filtres.controller');

router.get('/unites', authMiddleware, filtresController.getUnites);
router.get('/annees', authMiddleware, filtresController.getAnnees);
router.get('/semaines', authMiddleware, filtresController.getSemaines);
router.get('/articles', authMiddleware, filtresController.getArticles);

module.exports = router;

