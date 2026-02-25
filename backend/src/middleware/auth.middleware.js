const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { getJwtSecret } = require('../config/auth');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant ou format invalide'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: 'Type de token invalide'
      });
    }

    if (!decoded.sid || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    const [session] = await db.query(
      `SELECT s.ID, s.ID_Utilisateur, u.ID as user_id, u.Username, u.Email, u.ID_Personnel,
              u.Est_actif, u.Est_verrouille
       FROM sessions s
       JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
       WHERE s.ID = ?
         AND s.ID_Utilisateur = ?
         AND s.Est_active = 1
         AND s.Date_expiration > NOW()`,
      [decoded.sid, decoded.id]
    );

    if (session.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Session invalide ou expiree'
      });
    }

    if (!session[0].Est_actif) {
      return res.status(403).json({
        success: false,
        error: 'Compte desactive'
      });
    }

    if (session[0].Est_verrouille) {
      return res.status(403).json({
        success: false,
        error: 'Compte verrouille'
      });
    }

    await db.query('UPDATE sessions SET Derniere_activite = NOW() WHERE ID = ?', [session[0].ID]);

    req.user = {
      ID: session[0].user_id,
      Username: session[0].Username,
      Email: session[0].Email,
      ID_Personnel: session[0].ID_Personnel,
      sessionId: session[0].ID
    };

    req.token = token;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expire'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    console.error('Erreur auth middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'authentification'
    });
  }
};

module.exports = authMiddleware;
