const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator, userIdValidator, sessionListQueryValidator } = require('../validators');
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

router.use(authMiddleware);
router.use(requirePermission('SESSION_MANAGE'));

router.get('/statistiques/resume', validate, sessionController.getStatistiques);
router.delete('/expirees', validate, sessionController.nettoyerSessionsExpirees);

router.get('/utilisateur/:userId', userIdValidator, validate, sessionController.getSessionsByUser);
router.post('/deconnecter/toutes/:userId', userIdValidator, validate, sessionController.deconnecterToutesSessions);

router.get('/:id', idValidator, validate, sessionController.getSessionById);
router.get('/', sessionListQueryValidator, validate, sessionController.getAllSessions);

router.patch('/:id/activite', idValidator, validate, sessionController.updateActivite);
router.patch('/:id/deconnecter', idValidator, validate, sessionController.deconnecterSession);

module.exports = router;
