/**
 * Test script for new assignment feature endpoints
 * 
 * Endpoints à tester:
 * 1. GET /api/commandes/semaines-disponibles
 * 2. GET /api/commandes/articles-filtres?semaineId=X&unite=Y
 * 3. GET /api/commandes/unites (existant)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // À remplacer par un vrai token

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
});

async function testEndpoints() {
  try {
    console.log('🧪 Test des nouveaux endpoints...\n');

    // Test 1: Semaines disponibles
    console.log('1️⃣ GET /api/commandes/semaines-disponibles');
    const semaines = await client.get('/api/commandes/semaines-disponibles');
    console.log('✅ Réponse:', JSON.stringify(semaines.data, null, 2));
    const semaineId = semaines.data.data?.[0]?.id;
    console.log('');

    // Test 2: Unités de production
    console.log('2️⃣ GET /api/commandes/unites');
    const unites = await client.get('/api/commandes/unites');
    console.log('✅ Réponse:', JSON.stringify(unites.data, null, 2));
    const unite = unites.data.data?.[0];
    console.log('');

    // Test 3: Articles filtrés
    if (semaineId && unite) {
      console.log('3️⃣ GET /api/commandes/articles-filtres');
      const articles = await client.get('/api/commandes/articles-filtres', {
        params: {
          semaineId: semaineId,
          unite: unite,
        },
      });
      console.log('✅ Réponse:', JSON.stringify(articles.data, null, 2));
    } else {
      console.log('⚠️ Impossible de tester articles-filtres (pas de semaine ou unité)');
    }

    console.log('\n✨ Tous les tests sont terminés!');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testEndpoints();
