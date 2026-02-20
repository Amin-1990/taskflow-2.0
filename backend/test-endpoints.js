/**
 * Test des endpoints planning
 */

const http = require('http');

function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('🔐 Login...\n');
    
    // Étape 1: Login pour obtenir un token
    const loginData = JSON.stringify({
      username: 'Amine',
      password: '7410'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.data && response.data.token) {
              console.log('✅ Token obtenu\n');
              resolve(response.data.token);
            } else {
              reject(new Error('No token in response: ' + data));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    // Étape 2: Test endpoint semaine
    console.log('🔄 Test GET /planning/semaine?numero_semaine=8&annee=2026\n');
    const planningRes = await makeRequest('/planning/semaine?numero_semaine=8&annee=2026', token);
    console.log(`Status: ${planningRes.status}`);
    if (planningRes.status === 200) {
      console.log('✅ Success');
      console.log('Response:', JSON.stringify(planningRes.data, null, 2).substring(0, 200) + '...\n');
    } else {
      console.log('❌ Error');
      console.log('Response:', planningRes.data, '\n');
    }

    // Étape 3: Test endpoint semaines-annee
    console.log('🔄 Test GET /planning/semaines-annee?annee=2026\n');
    const semainesRes = await makeRequest('/planning/semaines-annee?annee=2026', token);
    console.log(`Status: ${semainesRes.status}`);
    if (semainesRes.status === 200) {
      console.log('✅ Success');
      const arr = semainesRes.data.data || [];
      console.log(`Found ${arr.length} weeks`);
      if (arr.length > 0) {
        console.log('First week:', JSON.stringify(arr[0], null, 2), '\n');
      }
    } else {
      console.log('❌ Error');
      console.log('Response:', semainesRes.data, '\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
