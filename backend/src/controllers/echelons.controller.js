const db = require('../config/database');
const { logAction } = require('../services/audit.service');

const getAuditInfo = (req) => ({
  IP_address: req.ip || req.connection.remoteAddress,
  User_agent: req.get('User-Agent')
});

const getAuthUser = (req) => ({
  ID_Utilisateur: req.user?.id || req.user?.ID || null,
  Username: req.user?.username || req.user?.Username || null
});

exports.getAllEchelonsReference = async (req, res) => {
  try {
    const { categorie } = req.query;

    let query = `
      SELECT ID, Categorie, Echelon, Duree, Montant_base, Description, Date_creation, Date_modification
      FROM echelons_reference
    `;
    const params = [];

    if (categorie) {
      query += ' WHERE Categorie = ?';
      params.push(categorie);
    }

    query += ' ORDER BY Categorie ASC, Echelon ASC';

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getAllEchelonsReference:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des echelons de reference' });
  }
};

exports.getEchelonReferenceById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ID, Categorie, Echelon, Duree, Montant_base, Description, Date_creation, Date_modification
       FROM echelons_reference
       WHERE ID = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Echelon de reference non trouve' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur getEchelonReferenceById:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation de l echelon de reference' });
  }
};

exports.createEchelonReference = async (req, res) => {
  try {
    const { Categorie, Echelon, Duree, Montant_base, Description } = req.body;

    const [result] = await db.query(
      `INSERT INTO echelons_reference
       (Categorie, Echelon, Duree, Montant_base, Description, Date_creation, Date_modification)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [Categorie, Echelon, Duree, Montant_base, Description || null]
    );

    const [created] = await db.query(
      `SELECT ID, Categorie, Echelon, Duree, Montant_base, Description, Date_creation, Date_modification
       FROM echelons_reference
       WHERE ID = ?`,
      [result.insertId]
    );

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'CREATE',
      Table_concernee: 'echelons_reference',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: created[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.status(201).json({
      success: true,
      message: 'Echelon de reference cree avec succes',
      data: created[0]
    });
  } catch (error) {
    console.error('Erreur createEchelonReference:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Cette combinaison categorie/echelon existe deja' });
    }

    res.status(500).json({ success: false, error: 'Erreur lors de la creation de l echelon de reference' });
  }
};

exports.updateEchelonReference = async (req, res) => {
  try {
    const echelonRefId = req.params.id;
    const { Categorie, Echelon, Duree, Montant_base, Description } = req.body;

    const [existing] = await db.query('SELECT * FROM echelons_reference WHERE ID = ?', [echelonRefId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Echelon de reference non trouve' });
    }

    await db.query(
      `UPDATE echelons_reference
       SET Categorie = ?, Echelon = ?, Duree = ?, Montant_base = ?, Description = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [Categorie, Echelon, Duree, Montant_base, Description || null, echelonRefId]
    );

    const [updated] = await db.query(
      `SELECT ID, Categorie, Echelon, Duree, Montant_base, Description, Date_creation, Date_modification
       FROM echelons_reference
       WHERE ID = ?`,
      [echelonRefId]
    );

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'UPDATE',
      Table_concernee: 'echelons_reference',
      ID_Enregistrement: echelonRefId,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.json({
      success: true,
      message: 'Echelon de reference modifie avec succes',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateEchelonReference:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Cette combinaison categorie/echelon existe deja' });
    }

    res.status(500).json({ success: false, error: 'Erreur lors de la modification de l echelon de reference' });
  }
};

exports.deleteEchelonReference = async (req, res) => {
  try {
    const echelonRefId = req.params.id;

    const [existing] = await db.query('SELECT * FROM echelons_reference WHERE ID = ?', [echelonRefId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Echelon de reference non trouve' });
    }

    await db.query('DELETE FROM echelons_reference WHERE ID = ?', [echelonRefId]);

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'DELETE',
      Table_concernee: 'echelons_reference',
      ID_Enregistrement: echelonRefId,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.json({ success: true, message: 'Echelon de reference supprime avec succes' });
  } catch (error) {
    console.error('Erreur deleteEchelonReference:', error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, error: 'Impossible de supprimer cet echelon: il est utilise dans l historique' });
    }

    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l echelon de reference' });
  }
};

exports.getHistoriqueByPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.ID, h.ID_personnel, h.ID_echelon_ref, h.Date_debut, h.Date_fin,
              h.Montant_applique, h.Duree_effective, h.Motif_changement, h.Commentaire,
              h.Date_creation, h.Date_modification,
              er.Categorie, er.Echelon, er.Duree AS Duree_reference, er.Montant_base, er.Description
       FROM historique_echelons_personnel h
       INNER JOIN echelons_reference er ON er.ID = h.ID_echelon_ref
       WHERE h.ID_personnel = ?
       ORDER BY h.Date_debut DESC, h.ID DESC`,
      [req.params.idPersonnel]
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Erreur getHistoriqueByPersonnel:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation de l historique des echelons' });
  }
};

exports.getCurrentEchelonByPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.ID, h.ID_personnel, h.ID_echelon_ref, h.Date_debut, h.Date_fin,
              h.Montant_applique, h.Duree_effective, h.Motif_changement, h.Commentaire,
              h.Date_creation, h.Date_modification,
              er.Categorie, er.Echelon, er.Duree AS Duree_reference, er.Montant_base, er.Description
       FROM historique_echelons_personnel h
       INNER JOIN echelons_reference er ON er.ID = h.ID_echelon_ref
       WHERE h.ID_personnel = ?
         AND (h.Date_fin IS NULL OR h.Date_fin >= CURDATE())
       ORDER BY h.Date_debut DESC, h.ID DESC
       LIMIT 1`,
      [req.params.idPersonnel]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucun echelon actif trouve pour ce personnel' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur getCurrentEchelonByPersonnel:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation de l echelon actuel' });
  }
};

exports.getHistoriqueById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.ID, h.ID_personnel, h.ID_echelon_ref, h.Date_debut, h.Date_fin,
              h.Montant_applique, h.Duree_effective, h.Motif_changement, h.Commentaire,
              h.Date_creation, h.Date_modification,
              er.Categorie, er.Echelon, er.Duree AS Duree_reference, er.Montant_base, er.Description
       FROM historique_echelons_personnel h
       INNER JOIN echelons_reference er ON er.ID = h.ID_echelon_ref
       WHERE h.ID = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Historique d echelon non trouve' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur getHistoriqueById:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation de l historique d echelon' });
  }
};

exports.createHistoriqueEchelon = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      ID_personnel,
      ID_echelon_ref,
      Date_debut,
      Date_fin,
      Montant_applique,
      Duree_effective,
      Motif_changement,
      Commentaire
    } = req.body;

    const [personnelRows] = await connection.query('SELECT ID FROM personnel WHERE ID = ?', [ID_personnel]);
    if (personnelRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Personnel non trouve' });
    }

    const [echelonRows] = await connection.query('SELECT ID FROM echelons_reference WHERE ID = ?', [ID_echelon_ref]);
    if (echelonRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Echelon de reference non trouve' });
    }

    if (Date_fin && new Date(Date_fin) < new Date(Date_debut)) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Date_fin doit etre superieure ou egale a Date_debut' });
    }

    if (!Date_fin) {
      await connection.query(
        `UPDATE historique_echelons_personnel
         SET Date_fin = DATE_SUB(?, INTERVAL 1 DAY), Date_modification = NOW()
         WHERE ID_personnel = ?
           AND (Date_fin IS NULL OR Date_fin >= ?)
           AND Date_debut < ?`,
        [Date_debut, ID_personnel, Date_debut, Date_debut]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO historique_echelons_personnel
       (ID_personnel, ID_echelon_ref, Date_debut, Date_fin, Montant_applique,
        Duree_effective, Motif_changement, Commentaire, Date_creation, Date_modification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        ID_personnel,
        ID_echelon_ref,
        Date_debut,
        Date_fin || null,
        Montant_applique,
        Duree_effective || null,
        Motif_changement || null,
        Commentaire || null
      ]
    );

    const [created] = await connection.query(
      'SELECT * FROM historique_echelons_personnel WHERE ID = ?',
      [result.insertId]
    );

    await connection.commit();

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'CREATE',
      Table_concernee: 'historique_echelons_personnel',
      ID_Enregistrement: result.insertId,
      Ancienne_valeur: null,
      Nouvelle_valeur: created[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.status(201).json({
      success: true,
      message: 'Historique d echelon cree avec succes',
      data: created[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur createHistoriqueEchelon:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la creation de l historique d echelon' });
  } finally {
    connection.release();
  }
};

exports.updateHistoriqueEchelon = async (req, res) => {
  try {
    const historiqueId = req.params.id;
    const {
      ID_echelon_ref,
      Date_debut,
      Date_fin,
      Montant_applique,
      Duree_effective,
      Motif_changement,
      Commentaire
    } = req.body;

    const [existing] = await db.query('SELECT * FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Historique d echelon non trouve' });
    }

    const [echelonRows] = await db.query('SELECT ID FROM echelons_reference WHERE ID = ?', [ID_echelon_ref]);
    if (echelonRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Echelon de reference non trouve' });
    }

    if (Date_fin && new Date(Date_fin) < new Date(Date_debut)) {
      return res.status(400).json({ success: false, error: 'Date_fin doit etre superieure ou egale a Date_debut' });
    }

    await db.query(
      `UPDATE historique_echelons_personnel
       SET ID_echelon_ref = ?, Date_debut = ?, Date_fin = ?, Montant_applique = ?, Duree_effective = ?,
           Motif_changement = ?, Commentaire = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [
        ID_echelon_ref,
        Date_debut,
        Date_fin || null,
        Montant_applique,
        Duree_effective || null,
        Motif_changement || null,
        Commentaire || null,
        historiqueId
      ]
    );

    const [updated] = await db.query('SELECT * FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'UPDATE',
      Table_concernee: 'historique_echelons_personnel',
      ID_Enregistrement: historiqueId,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.json({
      success: true,
      message: 'Historique d echelon modifie avec succes',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur updateHistoriqueEchelon:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la modification de l historique d echelon' });
  }
};

exports.deleteHistoriqueEchelon = async (req, res) => {
  try {
    const historiqueId = req.params.id;

    const [existing] = await db.query('SELECT * FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Historique d echelon non trouve' });
    }

    await db.query('DELETE FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'DELETE',
      Table_concernee: 'historique_echelons_personnel',
      ID_Enregistrement: historiqueId,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: null,
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.json({ success: true, message: 'Historique d echelon supprime avec succes' });
  } catch (error) {
    console.error('Erreur deleteHistoriqueEchelon:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l historique d echelon' });
  }
};

exports.closeHistoriqueEchelon = async (req, res) => {
  try {
    const historiqueId = req.params.id;
    const { Date_fin } = req.body;

    const [existing] = await db.query('SELECT * FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Historique d echelon non trouve' });
    }

    if (new Date(Date_fin) < new Date(existing[0].Date_debut)) {
      return res.status(400).json({ success: false, error: 'Date_fin doit etre superieure ou egale a Date_debut' });
    }

    await db.query(
      `UPDATE historique_echelons_personnel
       SET Date_fin = ?, Date_modification = NOW()
       WHERE ID = ?`,
      [Date_fin, historiqueId]
    );

    const [updated] = await db.query('SELECT * FROM historique_echelons_personnel WHERE ID = ?', [historiqueId]);

    const auditInfo = getAuditInfo(req);
    const authUser = getAuthUser(req);
    logAction({
      ...authUser,
      Action: 'UPDATE',
      Table_concernee: 'historique_echelons_personnel',
      ID_Enregistrement: historiqueId,
      Ancienne_valeur: existing[0],
      Nouvelle_valeur: updated[0],
      IP_address: auditInfo.IP_address,
      User_agent: auditInfo.User_agent
    }).catch((err) => console.error('Audit log failed:', err));

    res.json({
      success: true,
      message: 'Historique d echelon cloture avec succes',
      data: updated[0]
    });
  } catch (error) {
    console.error('Erreur closeHistoriqueEchelon:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la cloture de l historique d echelon' });
  }
};
