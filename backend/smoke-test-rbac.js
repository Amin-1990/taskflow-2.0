const http = require('http');

const API_URL = 'http://localhost:3000/api';
const USERNAME = 'Amine';
const PASSWORD = '7410';

async function request(path, method = 'GET', token = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- DÉBUT SMOKE TEST RBAC ---');

  // Étape 1: Login
  console.log('1. Tentative de connexion...');
  const loginRes = await request('/auth/login', 'POST', null, {
    username: USERNAME,
    password: PASSWORD
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error('❌ ÉCHEC LOGIN:', loginRes.status, loginRes.data);
    process.exit(1);
  }

  const token = loginRes.data.data.token;
  console.log('✅ Login réussi, token obtenu.\n');

  // Étape 2: GET /commandes avec token -> 200
  console.log('2. Test: GET /api/commandes avec token LECTURE_SEULE (Attendu: 200)');
  const getRes = await request('/commandes', 'GET', token);
  console.log(`Statut reçu: ${getRes.status}`);
  if (getRes.status === 200) {
    console.log('✅ OK - Status 200 reçu.\n');
  } else {
    console.error(`❌ ÉCHEC - Status ${getRes.status} reçu au lieu de 200.`);
    console.error('Réponse:', JSON.stringify(getRes.data, null, 2));
  }

  // Étape 3: POST /commandes avec token -> 403
  console.log('3. Test: POST /api/commandes avec token LECTURE_SEULE (Attendu: 403)');
  const postRes = await request('/commandes', 'POST', token, {
    Num_lot: 'TEST-RBAC',
    ID_Article: 1,
    Quantite_commandee: 100
  });
  console.log(`Statut reçu: ${postRes.status}`);
  if (postRes.status === 403) {
    console.log('✅ OK - Status 403 (Forbidden) reçu.\n');
  } else {
    console.error(`❌ ÉCHEC - Status ${postRes.status} reçu au lieu de 403.`);
    console.error('Réponse inattendue:', JSON.stringify(postRes.data, null, 2));
  }

  // Étape 4: GET /commandes sans token -> 401
  console.log('4. Test: GET /api/commandes sans token (Attendu: 401)');
  const noTokenRes = await request('/commandes', 'GET');
  console.log(`Statut reçu: ${noTokenRes.status}`);
  if (noTokenRes.status === 401) {
    console.log('✅ OK - Status 401 (Unauthorized) reçu.\n');
  } else {
    console.error(`❌ ÉCHEC - Status ${noTokenRes.status} reçu au lieu de 401.`);
    console.error('Réponse inattendue:', JSON.stringify(noTokenRes.data, null, 2));
  }

  console.log('--- FIN DU SMOKE TEST ---');
}

runTests().catch(err => {
  console.error('Erreur fatale lors du test:', err);
  process.exit(1);
});
