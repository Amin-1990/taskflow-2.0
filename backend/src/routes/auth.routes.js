const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  changePasswordValidator
} = require('../validators');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes PUBLIQUES (pas de auth)
router.post(
  '/register',
  registerValidator,
  validate,
  authController.register
);

router.post(
  '/login',
  loginValidator,
  validate,
  authController.login
);

router.post(
  '/refresh-token',
  refreshTokenValidator,
  validate,
  authController.refreshToken
);

// Routes PROTÉGÉES (avec auth)
router.post(
  '/logout',
  authMiddleware,
  validate,
  authController.logout
);

router.get(
  '/profile',
  authMiddleware,
  validate,
  authController.getProfile
);

module.exports = router;