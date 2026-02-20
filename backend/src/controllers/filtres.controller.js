const db = require('../config/database');

exports.getUnites = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT Unite_production as unite
      FROM commandes
      WHERE Unite_production IS NOT NULL
        AND TRIM(Unite_production) <> ''
      ORDER BY Unite_production ASC
    `);

    res.json({
      success: true,
      data: rows.map((r) => r.unite)
    });
  } catch (error) {
    console.error('Erreur getUnites:', error);
    res.status(500).json({ success: false, error: 'Erreur recuperation unites' });
  }
};

exports.getAnnees = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT Annee as annee
      FROM semaines
      WHERE Annee IS NOT NULL
      ORDER BY Annee DESC
    `);

    res.json({
      success: true,
      data: rows.map((r) => r.annee)
    });
  } catch (error) {
    console.error('Erreur getAnnees:', error);
    res.status(500).json({ success: false, error: 'Erreur recuperation annees' });
  }
};

exports.getSemaines = async (req, res) => {
  try {
    const { annee } = req.query;
    const params = [];
    let where = '';

    if (annee) {
      where = 'WHERE Annee = ?';
      params.push(parseInt(annee, 10));
    }

    const [rows] = await db.query(
      `
      SELECT ID, Annee, Numero_semaine, Code_semaine, Date_debut, Date_fin
      FROM semaines
      ${where}
      ORDER BY Annee DESC, Numero_semaine ASC
      `,
      params
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getSemaines:', error);
    res.status(500).json({ success: false, error: 'Erreur recuperation semaines' });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const { search } = req.query;
    const params = [];
    let where = '';

    if (search && String(search).trim() !== '') {
      where = 'WHERE Code_article LIKE ? OR Client LIKE ?';
      const q = `%${String(search).trim()}%`;
      params.push(q, q);
    }

    const [rows] = await db.query(
      `
      SELECT ID, Code_article, Client
      FROM articles
      ${where}
      ORDER BY Code_article ASC
      LIMIT 50
      `,
      params
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erreur getArticles filtres:', error);
    res.status(500).json({ success: false, error: 'Erreur recuperation articles' });
  }
};

