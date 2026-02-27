const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

function toDateTimeOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const raw = String(value).trim();
    const dateMatch = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        let year = parseInt(dateMatch[3], 10);
        if (year < 100) year += 2000;
        const hour = parseInt(dateMatch[4], 10);
        const minute = parseInt(dateMatch[5], 10);
        const second = parseInt(dateMatch[6] || '0', 10);

        const d = new Date(year, month - 1, day, hour, minute, second);
        if (!Number.isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
        }
    }
    return null;
}

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taskflow'
    });

    try {
        console.log('--- Testing Date Parsing ---');
        console.log('26/1/26 7:29 =>', toDateTimeOrNull('26/1/26 7:29'));
        console.log('26/1/26 15:23 =>', toDateTimeOrNull('26/1/26 15:23'));

        console.log('\n--- Checking Constraints ---');
        const [constraints] = await connection.execute(`
        SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
        FROM information_schema.CHECK_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = '${process.env.DB_NAME || 'taskflow'}'
    `);
        console.table(constraints);

        // If no results in CHECK_CONSTRAINTS (older MySQL), try to parse from SHOW CREATE TABLE again but better
        if (constraints.length === 0) {
            const [rows] = await connection.execute('SHOW CREATE TABLE affectations');
            console.log('Full Create Table:');
            console.log(rows[0]['Create Table']);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
