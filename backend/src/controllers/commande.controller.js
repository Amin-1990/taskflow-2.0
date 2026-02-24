const db = require('../config/database');
const { logAction } = require('../services/audit.service');
const commandeService = require('../services/commande.service');
const exportService = require('../services/export.service');

// Helper pour extraire IP et User-Agent
const getAuditInfo = (req) => ({
    IP_address: req.ip || req.connection.remoteAddress,
    User_agent: req.get('User-Agent')
});

// GET /api/commandes - Récupérer toutes les commandes
exports.getAllCommandes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sort = 'date_debut',
            order = 'desc',
            recherche,
            date_debut,
            date_fin,
            priorite,
            statut,
            lot,
            unite_production,
            semaine,
            code_article
        } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
        const offset = (pageNum - 1) * limitNum;

        const [columnsRows] = await db.query('SHOW COLUMNS FROM commandes');
        const columns = new Set((columnsRows || []).map((c) => String(c.Field || '').toLowerCase()));
        const hasPriorite = columns.has('priorite');
        const hasStatut = columns.has('statut');
        const hasUnite = columns.has('unite_production');

        const where = ['1=1'];
        const params = [];

        if (recherche) {
            where.push('(c.Code_article LIKE ? OR c.Lot LIKE ? OR a.Code_article LIKE ?)');
            const term = `%${String(recherche).trim()}%`;
            params.push(term, term, term);
        }

        if (date_debut) {
            where.push('c.Date_debut >= ?');
            params.push(date_debut);
        }

        if (date_fin) {
            where.push('c.Date_debut <= ?');
            params.push(date_fin);
        }

        if (code_article) {
            where.push('c.Code_article LIKE ?');
            params.push(`%${String(code_article).trim()}%`);
        }

        if (lot) {
            where.push('c.Lot LIKE ?');
            params.push(`%${String(lot).trim()}%`);
        }

        if (semaine) {
            where.push('s.Code_semaine = ?');
            params.push(String(semaine).trim());
        }

        if (hasPriorite && priorite) {
            where.push('c.priorite = ?');
            params.push(String(priorite).trim());
        }

        if (hasStatut && statut) {
            where.push('c.Statut = ?');
            params.push(String(statut).trim());
        }

        if (hasUnite && unite_production) {
            where.push('c.Unite_production LIKE ?');
            params.push(`%${String(unite_production).trim()}%`);
        }

        const sortMap = {
            date_creation: 'c.Date_creation',
            date_debut: 'c.Date_debut',
            quantite: 'c.Quantite',
            priorite: hasPriorite ? 'c.priorite' : 'c.Date_debut',
            lot: 'c.Lot',
            code_article: 'c.Code_article'
        };
        const sortColumn = sortMap[String(sort)] || 'c.Date_debut';
        const sortOrder = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const whereClause = where.join(' AND ');

        const [countRows] = await db.query(
            `SELECT COUNT(*) as total
             FROM commandes c
             LEFT JOIN articles a ON c.ID_Article = a.ID
             LEFT JOIN semaines s ON c.ID_Semaine = s.ID
             WHERE ${whereClause}`,
            params
        );
        const total = countRows[0]?.total || 0;

        const [rows] = await db.query(
            `SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article as Article_code, a.Client as Article_client, s.Code_semaine
             FROM commandes c
             LEFT JOIN articles a ON c.ID_Article = a.ID
             LEFT JOIN semaines s ON c.ID_Semaine = s.ID
             LEFT JOIN (
               SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
               FROM planning_hebdo
               GROUP BY ID_Commande
             ) pf ON pf.ID_Commande = c.ID
             WHERE ${whereClause}
             ORDER BY ${sortColumn} ${sortOrder}
             LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        res.json({
            success: true,
            count: total,
            page: pageNum,
            limit: limitNum,
            data: rows
        });
    } catch (error) {
        console.error('Erreur getAllCommandes:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la r?cup?ration des commandes'
        });
    }
};

// GET /api/commandes/:id - Récupérer une commande par ID
// GET /api/commandes/unites - Liste distincte des unites de production
// GET /api/commandes/semaines-disponibles - Semaines avec commandes
exports.getSemainesAvecCommandes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT
                s.ID,
                s.Annee,
                s.Code_semaine,
                s.Numero_semaine
            FROM semaines s
            INNER JOIN commandes c ON s.ID = c.ID_Semaine
            ORDER BY s.Annee DESC, s.Code_semaine DESC
        `);

        res.json({
            success: true,
            data: rows.map((row) => ({
                id: row.ID,
                codeSemaine: row.Code_semaine,
                numeroSemaine: row.Numero_semaine,
                annee: row.Annee,
                label: `${row.Code_semaine} - ${row.Annee}`
            }))
        });
    } catch (error) {
        console.error('Erreur getSemainesAvecCommandes:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des semaines'
        });
    }
};

// GET /api/commandes/articles-filtres - Articles filtrés par semaine et unité
exports.getArticlesFiltres = async (req, res) => {
    try {
        const { semaineId, unite } = req.query;

        if (!semaineId || !unite) {
            return res.status(400).json({
                success: false,
                error: 'Les paramètres semaineId et unite sont requis'
            });
        }

        const [rows] = await db.query(`
            SELECT DISTINCT
                a.ID,
                a.Code_article
            FROM articles a
            INNER JOIN commandes c ON a.Code_article COLLATE utf8mb4_unicode_ci = c.Code_article
            WHERE c.ID_Semaine = ? AND c.Unite_production = ?
            ORDER BY a.Code_article
        `, [semaineId, unite]);

        res.json({
            success: true,
            data: rows.map((row) => ({
                id: row.ID,
                code: row.Code_article
            }))
        });
    } catch (error) {
        console.error('Erreur getArticlesFiltres:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des articles'
        });
    }
};

// GET /api/commandes/articles-lots-filtres - Articles avec lots filtrés par semaine et unité
exports.getArticlesLotsFiltres = async (req, res) => {
    try {
        const { semaineId, unite } = req.query;

        if (!semaineId || !unite) {
            return res.status(400).json({
                success: false,
                error: 'Les paramètres semaineId et unite sont requis'
            });
        }

        const [rows] = await db.query(`
            SELECT DISTINCT 
                c.ID as commandeId,
                c.Code_article,
                c.Lot,
                a.ID as articleId,
                CONCAT(c.Code_article, ' | ', COALESCE(c.Lot, 'Sans Lot')) as displayLabel
            FROM commandes c
            LEFT JOIN articles a ON c.ID_Article = a.ID
            WHERE c.ID_Semaine = ? AND c.Unite_production = ?
            ORDER BY c.Code_article, c.Lot
        `, [semaineId, unite]);

        res.json({
            success: true,
            data: rows.map((row) => ({
                commandeId: row.commandeId,
                codeArticle: row.Code_article,
                lot: row.Lot,
                articleId: row.articleId,
                displayLabel: row.displayLabel
            }))
        });
    } catch (error) {
        console.error('Erreur getArticlesLotsFiltres:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des articles avec lots'
        });
    }
};

exports.getUnitesProduction = async (req, res) => {
    try {
        const [columnsRows] = await db.query('SHOW COLUMNS FROM commandes');
        const columns = new Set((columnsRows || []).map((c) => String(c.Field || '').toLowerCase()));
        if (!columns.has('unite_production')) {
            return res.json({ success: true, data: [] });
        }

        const [rows] = await db.query(`
            SELECT DISTINCT Unite_production as unite
            FROM commandes
            WHERE Unite_production IS NOT NULL
              AND TRIM(Unite_production) <> ''
            ORDER BY Unite_production ASC
        `);

        res.json({
            success: true,
            data: rows.map((r) => r.unite).filter(Boolean)
        });
    } catch (error) {
        console.error('Erreur getUnitesProduction:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recuperation des unites de production'
        });
    }
};

exports.getCommandeById = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article as Article_code, a.Client as Article_client,
             s.Code_semaine, s.Date_debut as Semaine_debut, s.Date_fin as Semaine_fin
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.ID = ?
    `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Erreur getCommandeById:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la commande'
        });
    }
};

// GET /api/commandes/semaine/:semaineId - Commandes par semaine
exports.getCommandesBySemaine = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article, a.Client
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.ID_Semaine = ?
      ORDER BY c.Code_article
    `, [req.params.semaineId]);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Erreur getCommandesBySemaine:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des commandes'
        });
    }
};

// GET /api/commandes/article/:articleId - Commandes par article
exports.getCommandesByArticle = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, s.Code_semaine
      FROM commandes c
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.ID_Article = ?
      ORDER BY c.Date_debut DESC
    `, [req.params.articleId]);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Erreur getCommandesByArticle:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des commandes'
        });
    }
};

// GET /api/commandes/lot/:lot - Recherche par lot
exports.getCommandeByLot = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article, a.Client, s.Code_semaine
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.Lot = ?
    `, [req.params.lot]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Lot non trouvé'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Erreur getCommandeByLot:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la commande'
        });
    }
};

// POST /api/commandes - Créer une nouvelle commande
exports.createCommande = async (req, res) => {
    try {
        const {
            Date_debut, Code_article, Lot, Quantite,
            Origine, Unite_production, ID_Semaine, ID_Article,
            priorite = 'normale',  // ✨ NOUVEAU (défaut)
            notes = null           // ✨ NOUVEAU
        } = req.body;

        // Validations
        if (!Date_debut || !Code_article || !Quantite) {
            return res.status(400).json({
                success: false,
                error: 'Date début, code article et quantité sont requis'
            });
        }

        // Validation priorite
        const priorites_valides = ['basse', 'normale', 'haute', 'urgente'];
        if (priorite && !priorites_valides.includes(priorite)) {
            return res.status(400).json({
                success: false,
                error: 'Priorité invalide. Valeurs acceptées: basse, normale, haute, urgente'
            });
        }

        // Vérifier si l'article existe si ID_Article fourni
        if (ID_Article) {
            const [article] = await db.query('SELECT ID FROM articles WHERE ID = ?', [ID_Article]);
            if (article.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Article non trouvé'
                });
            }
        }

        // Vérifier si la semaine existe
        if (ID_Semaine) {
            const [semaine] = await db.query('SELECT ID FROM semaines WHERE ID = ?', [ID_Semaine]);
            if (semaine.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Semaine non trouvée'
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO commandes (
        Date_debut, Code_article, Lot, Quantite,
        Origine, Unite_production, ID_Semaine, ID_Article, priorite, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Date_debut, Code_article, Lot || null, Quantite,
                Origine || null, Unite_production || null, ID_Semaine || null, ID_Article || null,
                priorite, notes
            ]
        );

        const [newCommande] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article as Article_code, s.Code_semaine
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.ID = ?
    `, [result.insertId]);

        // Log audit
        const auditInfo = getAuditInfo(req);
        logAction({
            ID_Utilisateur: req.user?.id || null,
            Username: req.user?.username || null,
            Action: 'CREATE',
            Table_concernee: 'commandes',
            ID_Enregistrement: result.insertId,
            Ancienne_valeur: null,
            Nouvelle_valeur: newCommande[0],
            IP_address: auditInfo.IP_address,
            User_agent: auditInfo.User_agent
        }).catch(err => console.error('❌ Audit log failed:', err));

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès',
            data: newCommande[0]
        });
    } catch (error) {
        console.error('Erreur createCommande:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de la commande'
        });
    }
};

// PUT /api/commandes/:id - Modifier une commande
exports.updateCommande = async (req, res) => {
    try {
        const commandeId = req.params.id;
        const {
            Date_debut, Code_article, Lot, Quantite,
            Origine, Unite_production, ID_Semaine, ID_Article,
            priorite,   // ✨ NOUVEAU
            notes       // ✨ NOUVEAU
        } = req.body;

        // Récupérer ancienne valeur AVANT modification
        const [existing] = await db.query(`
      SELECT c.*, a.Code_article as Article_code, s.Code_semaine
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      WHERE c.ID = ?
    `, [commandeId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }
        const oldValue = existing[0];

        // Validation priorite si fournie
        if (priorite) {
            const priorites_valides = ['basse', 'normale', 'haute', 'urgente'];
            if (!priorites_valides.includes(priorite)) {
                return res.status(400).json({
                    success: false,
                    error: 'Priorité invalide. Valeurs acceptées: basse, normale, haute, urgente'
                });
            }
        }

        // Construire la requête UPDATE dynamiquement (pour n'updater que les champs fournis)
        const updates = [];
        const values = [];

        if (Date_debut !== undefined) { updates.push('Date_debut = ?'); values.push(Date_debut); }
        if (Code_article !== undefined) { updates.push('Code_article = ?'); values.push(Code_article); }
        if (Lot !== undefined) { updates.push('Lot = ?'); values.push(Lot); }
        if (Quantite !== undefined) { updates.push('Quantite = ?'); values.push(Quantite); }
        if (Origine !== undefined) { updates.push('Origine = ?'); values.push(Origine); }
        if (Unite_production !== undefined) { updates.push('Unite_production = ?'); values.push(Unite_production); }
        if (ID_Semaine !== undefined) { updates.push('ID_Semaine = ?'); values.push(ID_Semaine); }
        if (ID_Article !== undefined) { updates.push('ID_Article = ?'); values.push(ID_Article); }
        if (priorite !== undefined) { updates.push('priorite = ?'); values.push(priorite); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucune donnée à mettre à jour'
            });
        }

        values.push(commandeId);

        await db.query(
            `UPDATE commandes SET ${updates.join(', ')} WHERE ID = ?`,
            values
        );

        const [updated] = await db.query(`
      SELECT c.*, COALESCE(pf.objectif_total, 0) as Quantite_facturee, a.Code_article as Article_code, s.Code_semaine
      FROM commandes c
      LEFT JOIN articles a ON c.ID_Article = a.ID
      LEFT JOIN semaines s ON c.ID_Semaine = s.ID
      LEFT JOIN (
        SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
        FROM planning_hebdo
        GROUP BY ID_Commande
      ) pf ON pf.ID_Commande = c.ID
      WHERE c.ID = ?
    `, [commandeId]);

        // Log audit
        const auditInfo = getAuditInfo(req);
        logAction({
            ID_Utilisateur: req.user?.id || null,
            Username: req.user?.username || null,
            Action: 'UPDATE',
            Table_concernee: 'commandes',
            ID_Enregistrement: commandeId,
            Ancienne_valeur: oldValue,
            Nouvelle_valeur: updated[0],
            IP_address: auditInfo.IP_address,
            User_agent: auditInfo.User_agent
        }).catch(err => console.error('❌ Audit log failed:', err));

        res.json({
            success: true,
            message: 'Commande modifiée avec succès',
            data: updated[0]
        });
    } catch (error) {
        console.error('Erreur updateCommande:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification de la commande'
        });
    }
};

// DELETE /api/commandes/:id - Supprimer une commande
exports.deleteCommande = async (req, res) => {
    try {
        const commandeId = req.params.id;

        // Récupérer valeur AVANT suppression
        const [existing] = await db.query('SELECT * FROM commandes WHERE ID = ?', [commandeId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }
        const deletedValue = existing[0];

        const [result] = await db.query('DELETE FROM commandes WHERE ID = ?', [commandeId]);

        // Log audit
        const auditInfo = getAuditInfo(req);
        logAction({
            ID_Utilisateur: req.user?.id || null,
            Username: req.user?.username || null,
            Action: 'DELETE',
            Table_concernee: 'commandes',
            ID_Enregistrement: commandeId,
            Ancienne_valeur: deletedValue,
            Nouvelle_valeur: null,
            IP_address: auditInfo.IP_address,
            User_agent: auditInfo.User_agent
        }).catch(err => console.error('❌ Audit log failed:', err));

        res.json({
            success: true,
            message: 'Commande supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur deleteCommande:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                error: 'Impossible de supprimer cette commande car elle est utilisée ailleurs'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de la commande'
        });
    }
};

// PATCH /api/commandes/:id/facturer - Endpoint historique deprecie
exports.updateFacturee = async (req, res) => {
    return res.status(410).json({
        success: false,
        error: 'Endpoint deprecie: utiliser planning_hebdo.Quantite_facturee_semaine via /api/planning'
    });
};
// GET /api/commandes/statistiques/semaine/:semaineId - Stats de production
exports.getStatistiquesSemaine = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        COUNT(c.ID) as total_commandes,
        SUM(c.Quantite) as total_quantite,
        SUM(COALESCE(p.Quantite_facturee_semaine, 0)) as total_facture,
        ROUND((SUM(COALESCE(p.Quantite_facturee_semaine, 0)) / NULLIF(SUM(c.Quantite), 0)) * 100, 2) as taux_realisation
      FROM commandes c
      LEFT JOIN planning_hebdo p ON p.ID_Commande = c.ID AND p.ID_Semaine_planifiee = c.ID_Semaine
      WHERE c.ID_Semaine = ?
    `, [req.params.semaineId]);

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Erreur getStatistiquesSemaine:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du calcul des statistiques'
        });
    }
};

// ✅ NOUVELLES FONCTIONS POUR L'EMBALLAGE

// PATCH /api/commandes/:id/emballe - Mise à jour quantité emballée
exports.updateQuantiteEmballe = async (req, res) => {
    try {
        const { quantite } = req.body;
        const commandeId = req.params.id;

        // Validation
        if (!quantite || quantite <= 0) {
            return res.status(400).json({
                success: false,
                error: 'La quantité doit être un nombre positif'
            });
        }

        const auditInfo = getAuditInfo(req);
        const user = { id: req.user?.id, username: req.user?.username };

        // Utiliser le service
        const result = await commandeService.updateQuantiteEmballe(
            commandeId,
            quantite,
            auditInfo,
            user
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur updateQuantiteEmballe:', error);

        // Erreur de validation métier
        if (error.message.includes('ne peut pas dépasser')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour de la quantité emballée'
        });
    }
};

// GET /api/commandes/:id/emballage/stats - Stats d'emballage
exports.getEmballageStats = async (req, res) => {
    try {
        const commandeId = req.params.id;

        const [commandes] = await db.query(
            `SELECT 
        c.ID,
        c.Code_article,
        c.Quantite,
        COALESCE(pf.objectif_total, 0) as Quantite_facturee,
        COALESCE(c.Quantite_emballe, 0) as Quantite_emballe,
        GREATEST(0, COALESCE(pf.objectif_total, 0) - COALESCE(c.Quantite_emballe, 0)) as reste_a_emballer,
        CASE 
          WHEN COALESCE(c.Quantite_emballe, 0) >= COALESCE(pf.objectif_total, 0) AND COALESCE(pf.objectif_total, 0) > 0 THEN 'Terminee'
          WHEN COALESCE(c.Quantite_emballe, 0) > 0 THEN 'En cours'
          ELSE 'En attente'
        END as statut_emballage,
        c.Statut
       FROM commandes c
       LEFT JOIN (
         SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
         FROM planning_hebdo
         GROUP BY ID_Commande
       ) pf ON pf.ID_Commande = c.ID
       WHERE c.ID = ?`,
            [commandeId]
        );

        if (commandes.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        const stats = commandes[0];
        const tauxEmballage = stats.Quantite_facturee > 0
            ? Math.round((stats.Quantite_emballe / stats.Quantite_facturee) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                ...stats,
                taux_emballage: tauxEmballage
            }
        });
    } catch (error) {
        console.error('❌ Erreur getEmballageStats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques'
        });
    }
};

// POST /api/commandes/:id/emballe/reset - Reset quantité emballée (admin)
exports.resetQuantiteEmballe = async (req, res) => {
    try {
        const commandeId = req.params.id;

        // Récupérer avant modification
        const [existing] = await db.query(
            'SELECT * FROM commandes WHERE ID = ?',
            [commandeId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        const oldValue = existing[0];

        // Reset quantité emballée
        await db.query(
            'UPDATE commandes SET Quantite_emballe = 0, Date_modification = NOW() WHERE ID = ?',
            [commandeId]
        );

        // Récupérer après reset
        const [updated] = await db.query(
            'SELECT * FROM commandes WHERE ID = ?',
            [commandeId]
        );

        // Audit
        const auditInfo = getAuditInfo(req);
        logAction({
            ID_Utilisateur: req.user?.id || null,
            Username: req.user?.username || null,
            Action: 'RESET_EMBALLAGE',
            Table_concernee: 'commandes',
            ID_Enregistrement: commandeId,
            Ancienne_valeur: oldValue,
            Nouvelle_valeur: updated[0],
            IP_address: auditInfo.IP_address,
            User_agent: auditInfo.User_agent
        }).catch(err => console.error('❌ Audit log failed:', err));

        res.json({
            success: true,
            message: 'Quantité emballée réinitialisée',
            data: updated[0]
        });
    } catch (error) {
        console.error('❌ Erreur resetQuantiteEmballe:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la réinitialisation'
        });
    }
};

// ========================================
// EXPORT COMMANDES - XLSX
// ========================================

// GET /api/commandes/export/xlsx
exports.exportCommandesXLSX = async (req, res) => {
    try {
        const { date_debut, date_fin, code_article, lot, semaine } = req.query;

        let query = `
            SELECT
                c.ID,
                c.Date_debut as 'Date debut',
                c.Code_article as 'Code article',
                c.Lot as 'Lot',
                c.Quantite as 'Quantite',
                COALESCE(pf.objectif_total, 0) as 'Quantite facturee',
                c.Quantite_emballe as 'Quantite emballee',
                c.Origine as 'Origine',
                c.Unite_production as 'Unite production',
                s.Code_semaine as 'Semaine',
                c.Date_creation as 'Date creation',
                c.Date_modification as 'Date modification'
            FROM commandes c
            LEFT JOIN semaines s ON c.ID_Semaine = s.ID
            LEFT JOIN (
              SELECT ID_Commande, SUM(Quantite_facturee_semaine) as objectif_total
              FROM planning_hebdo
              GROUP BY ID_Commande
            ) pf ON pf.ID_Commande = c.ID
            WHERE 1=1
        `;

        const params = [];

        if (date_debut) {
            query += ` AND c.Date_debut >= ?`;
            params.push(date_debut);
        }

        if (date_fin) {
            query += ` AND c.Date_debut <= ?`;
            params.push(date_fin);
        }

        if (code_article) {
            query += ` AND c.Code_article = ?`;
            params.push(code_article);
        }

        if (lot) {
            query += ` AND c.Lot = ?`;
            params.push(lot);
        }

        if (semaine) {
            query += ` AND s.Code_semaine = ?`;
            params.push(semaine);
        }

        query += ` ORDER BY c.Date_debut DESC`;

        const [commandes] = await db.query(query, params);
        const excel = await exportService.toExcel(commandes, 'Commandes');

        const fileDate = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=commandes_${fileDate}.xlsx`);
        res.send(excel);
    } catch (error) {
        console.error('Erreur exportCommandesXLSX:', error);
        res.status(500).json({ error: error.message });
    }
};

// Alias temporaire de compatibilite
exports.exportCommandesCSV = exports.exportCommandesXLSX;

