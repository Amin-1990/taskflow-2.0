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
        const [rows] = await connection.execute("SHOW CREATE TABLE affectations");
        const createSql = rows[0]['Create Table'];
        console.log('--- SCHEMA ---');
        console.log(createSql);

        // Specifically looking for check_dates
        if (createSql.includes('check_dates')) {
            const lines = createSql.split('\n');
            const constraintLine = lines.find(l => l.includes('check_dates'));
            console.log('--- CONSTRAINT LINE ---');
            console.log(constraintLine);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
