const http = require('http');

const API_URL = 'http://localhost:3000/api';
const USERNAME = 'Amine';
const PASSWORD = '7410';

async function request(path, method = 'GET', token = null, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${path}`);
        const options = {
            hostname: 'localhost',
            port: 3000,
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
    const results = [];

    // 1. Login
    const loginRes = await request('/auth/login', 'POST', null, {
        username: USERNAME,
        password: PASSWORD
    });
    results.push({ test: 'LOGIN', status: loginRes.status, success: loginRes.status === 200 });
    if (loginRes.status !== 200) {
        console.log(JSON.stringify(results));
        return;
    }
    const token = loginRes.data.data.token;

    // 2. GET /commandes
    const getRes = await request('/commandes', 'GET', token);
    results.push({ test: 'GET_COMMANDES', status: getRes.status, success: getRes.status === 200 });

    // 3. POST /commandes
    const postRes = await request('/commandes', 'POST', token, {
        Num_lot: 'TEST-RBAC',
        ID_Article: 1,
        Quantite_commandee: 100
    });
    results.push({ test: 'POST_COMMANDES', status: postRes.status, success: postRes.status === 403 });

    // 4. GET /commandes NO TOKEN
    const noTokenRes = await request('/commandes', 'GET');
    results.push({ test: 'NO_TOKEN', status: noTokenRes.status, success: noTokenRes.status === 401 });

    console.log('RESULTS_START');
    console.log(JSON.stringify(results, null, 2));
    console.log('RESULTS_END');
}

runTests().catch(err => {
    console.error('ERROR:', err.message);
});
