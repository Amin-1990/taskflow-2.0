/**
 * Contrôleur pour la gestion des semaines
 * Gère toutes les opérations CRUD sur la table 'semaines'
 */

const { pool } = require('../config/database');
const { logAudit } = require('../services/audit.service');

/**
 * GET: Récupérer la liste des semaines avec pagination et filtres
 */
exports.getList = async (req, res) => {
  try {
    const { page = 1, limit = 52, sort = 'Numero_semaine', order = 'ASC', annee, mois, recherche } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    // Filtrage par année
    if (annee) {
      whereClause += ' AND Annee = ?';
      params.push(annee);
    }

    // Filtrage par mois
    if (mois) {
      whereClause += ' AND Mois = ?';
      params.push(mois);
    }

    // Recherche par code semaine
    if (recherche) {
      whereClause += ' AND Code_semaine LIKE ?';
      params.push(`%${recherche}%`);
    }

    // Récupérer le nombre total
    const countQuery = `SELECT COUNT(*) as total FROM semaines WHERE ${whereClause}`;
    const [countResult] = await pool.promise().query(countQuery, params);
    const total = countResult[0].total;

    // Récupérer les données avec pagination
    const query = `
      SELECT * FROM semaines
      WHERE ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const [semaines] = await pool.promise().query(
      query,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        data: semaines,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Erreur getList semaines:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des semaines',
    });
  }
};

/**
 * GET: Récupérer une semaine par ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [semaines] = await pool.promise().query(
      'SELECT * FROM semaines WHERE ID = ?',
      [id]
    );

    if (semaines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Semaine non trouvée',
      });
    }

    res.json({
      success: true,
      data: semaines[0],
    });
  } catch (error) {
    console.error('❌ Erreur getById semaine:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la semaine',
    });
  }
};

/**
 * POST: Créer une nouvelle semaine
 */
exports.create = async (req, res) => {
  try {
    const { Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin } = req.body;

    // Validation
    if (!Code_semaine || !Numero_semaine || !Annee || !Mois || !Date_debut || !Date_fin) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont obligatoires',
      });
    }

    // Vérifier que le code semaine n'existe pas déjà
    const [existing] = await pool.promise().query(
      'SELECT ID FROM semaines WHERE Code_semaine = ?',
      [Code_semaine]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cette semaine existe déjà',
      });
    }

    // Insérer la nouvelle semaine
    const [result] = await pool.promise().query(
      `INSERT INTO semaines (Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin]
    );

    // Audit logging
    await logAudit({
      user_id: req.user?.id,
      action: 'CREATE',
      entity: 'semaines',
      entity_id: result.insertId,
      details: `Création de la semaine ${Code_semaine}`,
    });

    res.status(201).json({
      success: true,
      data: {
        ID: result.insertId,
        Code_semaine,
        Numero_semaine,
      },
      message: 'Semaine créée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur create semaine:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la semaine',
    });
  }
};

/**
 * PUT: Mettre à jour une semaine
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin } = req.body;

    // Vérifier que la semaine existe
    const [semaines] = await pool.promise().query(
      'SELECT * FROM semaines WHERE ID = ?',
      [id]
    );

    if (semaines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Semaine non trouvée',
      });
    }

    // Construire la requête UPDATE dynamiquement
    const updates = [];
    const values = [];

    if (Code_semaine !== undefined) {
      updates.push('Code_semaine = ?');
      values.push(Code_semaine);
    }
    if (Numero_semaine !== undefined) {
      updates.push('Numero_semaine = ?');
      values.push(Numero_semaine);
    }
    if (Annee !== undefined) {
      updates.push('Annee = ?');
      values.push(Annee);
    }
    if (Mois !== undefined) {
      updates.push('Mois = ?');
      values.push(Mois);
    }
    if (Date_debut !== undefined) {
      updates.push('Date_debut = ?');
      values.push(Date_debut);
    }
    if (Date_fin !== undefined) {
      updates.push('Date_fin = ?');
      values.push(Date_fin);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour',
      });
    }

    values.push(id);

    await pool.promise().query(
      `UPDATE semaines SET ${updates.join(', ')} WHERE ID = ?`,
      values
    );

    // Audit logging
    await logAudit({
      user_id: req.user?.id,
      action: 'UPDATE',
      entity: 'semaines',
      entity_id: id,
      details: `Mise à jour de la semaine ${semaines[0].Code_semaine}`,
    });

    res.json({
      success: true,
      message: 'Semaine mise à jour avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur update semaine:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la semaine',
    });
  }
};

/**
 * DELETE: Supprimer une semaine
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la semaine existe
    const [semaines] = await pool.promise().query(
      'SELECT * FROM semaines WHERE ID = ?',
      [id]
    );

    if (semaines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Semaine non trouvée',
      });
    }

    // Supprimer la semaine
    await pool.promise().query('DELETE FROM semaines WHERE ID = ?', [id]);

    // Audit logging
    await logAudit({
      user_id: req.user?.id,
      action: 'DELETE',
      entity: 'semaines',
      entity_id: id,
      details: `Suppression de la semaine ${semaines[0].Code_semaine}`,
    });

    res.json({
      success: true,
      message: 'Semaine supprimée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur delete semaine:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la semaine',
    });
  }
};
