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
        const query = "SELECT CONSTRAINT_NAME, CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE TABLE_NAME = 'affectations'";
        const [constraints] = await connection.execute(query);
        console.log('--- Constraints for affectations ---');
        constraints.forEach(c => {
            console.log(`Constraint: ${c.CONSTRAINT_NAME}`);
            console.log(`Clause: ${c.CHECK_CLAUSE}`);
        });

        if (constraints.length === 0) {
            console.log('No CHECK constraints found in information_schema. Trying SHOW CREATE TABLE...');
            const [rows] = await connection.execute('SHOW CREATE TABLE affectations');
            console.log(rows[0]['Create Table']);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
