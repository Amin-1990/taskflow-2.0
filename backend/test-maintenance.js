/**
 * Test des routes maintenance
 */
const http = require('http');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('🧪 Test des routes API...\n');

    // Test 1: Health check
    console.log('1️⃣  Health Check');
    let res = await makeRequest('/api/health');
    console.log(`   Status: ${res.status}`);
    console.log(`   Data: ${res.body}\n`);

    // Test 2: Machines (sans auth - doit échouer)
    console.log('2️⃣  Machines (sans token)');
    res = await makeRequest('/api/machines');
    console.log(`   Status: ${res.status}`);
    console.log(`   Expected: 401 (Unauthorized)`);
    console.log(`   Data: ${res.body}\n`);

    // Test 3: Types Machine (sans auth)
    console.log('3️⃣  Types Machine (sans token)');
    res = await makeRequest('/api/types-machine');
    console.log(`   Status: ${res.status}`);
    console.log(`   Expected: 401 (Unauthorized)`);
    console.log(`   Data: ${res.body}\n`);

    // Test 4: Interventions (sans auth)
    console.log('4️⃣  Interventions (sans token)');
    res = await makeRequest('/api/interventions');
    console.log(`   Status: ${res.status}`);
    console.log(`   Expected: 401 (Unauthorized)`);
    console.log(`   Data: ${res.body}\n`);

    console.log('✅ Tests complétés!');
    console.log('\n📝 Note: Les routes API sont protégées par JWT.');
    console.log('   Le frontend enverra automatiquement le token d\'authentification.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  process.exit(0);
}

test();
