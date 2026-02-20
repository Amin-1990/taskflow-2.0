const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Récupérer le token du header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token manquant ou format invalide' 
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Vérifier si la session existe en base
    const [session] = await db.query(
      `SELECT s.*, u.ID as user_id, u.Username, u.Email, u.ID_Personnel,
              u.Est_actif, u.Est_verrouille
       FROM sessions s
       JOIN utilisateurs u ON s.ID_Utilisateur = u.ID
       WHERE s.Token_session = ? 
         AND s.Est_active = 1 
         AND s.Date_expiration > NOW()`,
      [token]
    );

    if (session.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session invalide ou expirée' 
      });
    }

    // 4. Vérifier si l'utilisateur est actif
    if (!session[0].Est_actif) {
      return res.status(403).json({ 
        success: false, 
        error: 'Compte désactivé' 
      });
    }

    if (session[0].Est_verrouille) {
      return res.status(403).json({ 
        success: false, 
        error: 'Compte verrouillé' 
      });
    }

    // 5. Mettre à jour la dernière activité
    await db.query(
      'UPDATE sessions SET Derniere_activite = NOW() WHERE ID = ?',
      [session[0].ID]
    );

    // 6. Ajouter les infos utilisateur à req
    req.user = {
      ID: session[0].user_id,
      Username: session[0].Username,
      Email: session[0].Email,
      ID_Personnel: session[0].ID_Personnel,
      sessionId: session[0].ID
    };
    
    req.token = token;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expiré' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token invalide' 
      });
    }
    
    console.error('Erreur auth middleware:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'authentification' 
    });
  }
};

module.exports = authMiddleware;