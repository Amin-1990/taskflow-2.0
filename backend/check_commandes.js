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
        const dataToCheck = [
            { code: '191/150002/C', lot: '287' },
            { code: 'DE546047', lot: '23094' },
            { code: 'DE534253', lot: '24965' },
            { code: 'DE534258', lot: '25005' }
        ];

        console.log('--- Checking Commandes ---');
        for (const item of dataToCheck) {
            const [rows] = await connection.execute(
                'SELECT ID, Code_article, Lot FROM commandes WHERE Code_article = ? AND Lot = ?',
                [item.code, item.lot]
            );
            console.log(`Searching for Article: ${item.code}, Lot: ${item.lot} => Found: ${rows.length}`);
            if (rows.length > 0) console.table(rows);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
