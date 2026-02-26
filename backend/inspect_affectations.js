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
        const [rows] = await connection.execute('SHOW CREATE TABLE affectations');
        console.log(rows[0]['Create Table']);

        console.log('\n--- Sample data from affectations ---');
        const [data] = await connection.execute('SELECT * FROM affectations ORDER BY ID DESC LIMIT 5');
        console.table(data);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
