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
        const [rows] = await connection.execute(`
        SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
        FROM information_schema.CHECK_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'affectations'
    `, [process.env.DB_NAME || 'taskflow']);

        console.log('--- CHECK CONSTRAINTS ---');
        console.table(rows);

        if (rows.length === 0) {
            console.log('No CHECK constraints found in information_schema.CHECK_CONSTRAINTS.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
