/**
 * Tests d'intégration pour les nouveaux endpoints d'affectation
 * 
 * Pour exécuter: npm test -- new-assignment-endpoints.test.js
 */

const request = require('supertest');
const db = require('../config/database');

describe('Nouveaux Endpoints d\'Affectation', () => {
  let authToken;

  beforeAll(async () => {
    // TODO: Obtenir un token d'authentification valide
    // authToken = await getTestToken();
  });

  afterAll(async () => {
    // Fermer la connexion DB
    // await db.end();
  });

  describe('GET /api/commandes/semaines-disponibles', () => {
    test('devrait retourner les semaines avec commandes', async () => {
      const response = await request(app)
        .get('/api/commandes/semaines-disponibles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const semaine = response.body.data[0];
        expect(semaine).toHaveProperty('id');
        expect(semaine).toHaveProperty('codeSemaine');
        expect(semaine).toHaveProperty('numeroSemaine');
        expect(semaine).toHaveProperty('annee');
        expect(semaine).toHaveProperty('label');
        expect(semaine.label).toMatch(/^S\d+ - \d{4}$/);
      }
    });

    test('devrait trier par annee DESC, numeroSemaine DESC', async () => {
      const response = await request(app)
        .get('/api/commandes/semaines-disponibles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const data = response.body.data;
      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const current = data[i];
          const next = data[i + 1];
          const isDescending =
            current.annee > next.annee ||
            (current.annee === next.annee && current.numeroSemaine > next.numeroSemaine);
          expect(isDescending).toBe(true);
        }
      }
    });
  });

  describe('GET /api/commandes/articles-filtres', () => {
    test('devrait retourner les articles filtrés par semaine ET unité', async () => {
      // D'abord, récupérer une semaine
      const semaines = await request(app)
        .get('/api/commandes/semaines-disponibles')
        .set('Authorization', `Bearer ${authToken}`);

      const semaineId = semaines.body.data[0]?.id;

      // Puis, récupérer les unités
      const unites = await request(app)
        .get('/api/commandes/unites')
        .set('Authorization', `Bearer ${authToken}`);

      const unite = unites.body.data[0];

      if (!semaineId || !unite) {
        // Skip si pas de données
        return;
      }

      const response = await request(app)
        .get('/api/commandes/articles-filtres')
        .query({ semaineId: semaineId, unite: unite })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Vérifier la structure des articles
      if (response.body.data.length > 0) {
        const article = response.body.data[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('codeArticle');
      }
    });

    test('devrait retourner 400 si semaineId manquant', async () => {
      const response = await request(app)
        .get('/api/commandes/articles-filtres')
        .query({ unite: 'Unité 1' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('devrait retourner 400 si unite manquant', async () => {
      const response = await request(app)
        .get('/api/commandes/articles-filtres')
        .query({ semaineId: '1' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/commandes/unites', () => {
    test('devrait retourner les unités de production', async () => {
      const response = await request(app)
        .get('/api/commandes/unites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Flux Complet d\'Affectation', () => {
    test('devrait permettre le flux complet: semaine -> unité -> articles', async () => {
      // 1. Récupérer les semaines
      const semaines = await request(app)
        .get('/api/commandes/semaines-disponibles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(semaines.status).toBe(200);
      const semaineId = semaines.body.data[0]?.id;
      expect(semaineId).toBeDefined();

      // 2. Récupérer les unités
      const unites = await request(app)
        .get('/api/commandes/unites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(unites.status).toBe(200);
      const unite = unites.body.data[0];
      expect(unite).toBeDefined();

      // 3. Récupérer les articles filtrés
      const articles = await request(app)
        .get('/api/commandes/articles-filtres')
        .query({ semaineId: semaineId, unite: unite })
        .set('Authorization', `Bearer ${authToken}`);

      expect(articles.status).toBe(200);
      expect(Array.isArray(articles.body.data)).toBe(true);
    });
  });
});
