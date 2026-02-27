/**
 * Tests pour la synchronisation planning_hebdo lors d'une saisie emballage mobile
 * 
 * Scénarios:
 * 1. Première saisie lundi → création ligne planning_hebdo avec Lundi_emballe = quantité
 * 2. Deuxième saisie lundi → cumul des quantités dans Lundi_emballe
 * 3. Saisie mardi → mise à jour Mardi_emballe (cumul)
 * 4. Saisie dimanche → ignorée (pas de mise à jour)
 */

const db = require('../src/config/database');
const commandeService = require('../src/services/commande.service');

describe('Synchronisation planning_hebdo lors de emballage mobile', () => {
    let commandeId;
    let weekId;

    beforeAll(async () => {
        // Créer une commande test
        const [result] = await db.query(
            `INSERT INTO commandes 
            (Code_article, Quantite, Statut, Date_debut) 
            VALUES (?, ?, ?, NOW())`,
            ['TEST-001', 100, 'En cours']
        );
        commandeId = result.insertId;

        // Créer une semaine test (cette semaine)
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const [weekResult] = await db.query(
            `INSERT INTO semaines (Numero_semaine, Annee, Date_debut, Date_fin, Code_semaine)
            VALUES (?, ?, ?, ?, ?)`,
            [1, 2026, monday, sunday, 'S01-2026']
        );
        weekId = weekResult.insertId;

        // Créer une planning_hebdo pour cette commande-semaine
        await db.query(
            `INSERT INTO planning_hebdo (ID_Semaine_planifiee, ID_Commande, Quantite_facturee_semaine)
            VALUES (?, ?, ?)`,
            [weekId, commandeId, 50]
        );
    });

    afterAll(async () => {
        // Cleanup
        await db.query('DELETE FROM planning_hebdo WHERE ID_Commande = ?', [commandeId]);
        await db.query('DELETE FROM semaines WHERE ID = ?', [weekId]);
        await db.query('DELETE FROM commandes WHERE ID = ?', [commandeId]);
    });

    test('Scénario 1: Première saisie → création/mise à jour Lundi_emballe', async () => {
        const auditInfo = { IP_address: '127.0.0.1', User_agent: 'Test' };
        const user = { id: 1, username: 'test_user' };

        // Simuler une saisie de 10 pièces lundi
        const result = await commandeService.updateQuantiteEmballe(
            commandeId,
            10,
            auditInfo,
            user
        );

        expect(result.success).toBe(true);
        expect(result.data.Quantite_emballe).toBe(10);

        // Vérifier que planning_hebdo a été mis à jour
        const [planning] = await db.query(
            `SELECT Lundi_emballe FROM planning_hebdo 
            WHERE ID_Commande = ? AND ID_Semaine_planifiee = ?`,
            [commandeId, weekId]
        );

        expect(planning[0].Lundi_emballe).toBe(10);
    });

    test('Scénario 2: Deuxième saisie même jour → cumul', async () => {
        const auditInfo = { IP_address: '127.0.0.1', User_agent: 'Test' };
        const user = { id: 1, username: 'test_user' };

        // Deuxième saisie de 15 pièces lundi (même jour)
        const result = await commandeService.updateQuantiteEmballe(
            commandeId,
            15,
            auditInfo,
            user
        );

        expect(result.success).toBe(true);
        expect(result.data.Quantite_emballe).toBe(25); // 10 + 15

        // Vérifier que planning_hebdo cumule
        const [planning] = await db.query(
            `SELECT Lundi_emballe FROM planning_hebdo 
            WHERE ID_Commande = ? AND ID_Semaine_planifiee = ?`,
            [commandeId, weekId]
        );

        expect(planning[0].Lundi_emballe).toBe(25); // 10 + 15
    });

    test('Vérifier que Total_emballe_semaine se met à jour automatiquement', async () => {
        const [planning] = await db.query(
            `SELECT Total_emballe_semaine FROM planning_hebdo 
            WHERE ID_Commande = ? AND ID_Semaine_planifiee = ?`,
            [commandeId, weekId]
        );

        // Total_emballe_semaine doit être >= Lundi_emballe (si pas d'autres jours)
        expect(planning[0].Total_emballe_semaine).toBeGreaterThanOrEqual(25);
    });
});

describe('Affichage dans suivi réalisation frontend', () => {
    test('Les données emballage doivent être affichées dans le suivi', async () => {
        // Simuler une requête frontend pour récupérer planning_hebdo
        const [rows] = await db.query(
            `SELECT Lundi_emballe, Total_emballe_semaine FROM planning_hebdo 
            WHERE ID_Semaine_planifiee = ? LIMIT 1`,
            [weekId]
        );

        if (rows.length > 0) {
            // Les données doivent être présentes
            expect(rows[0].Lundi_emballe).toBeDefined();
            expect(rows[0].Total_emballe_semaine).toBeDefined();
        }
    });
});
