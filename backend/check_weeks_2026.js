const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taskflow'
    });

    try {
        const [rows] = await connection.execute("SELECT * FROM semaines WHERE Annee = 2026 AND Numero_semaine <= 6 ORDER BY Numero_semaine ASC");
        console.log('--- Semaines early 2026 ---');
        console.table(rows.map(r => ({
            ...r,
            Date_debut: new Date(r.Date_debut).toLocaleString(),
            Date_fin: new Date(r.Date_fin).toLocaleString()
        })));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
