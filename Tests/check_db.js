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
        console.log('--- Checking Personnel ---');
        const [personnel] = await connection.execute('SELECT ID, Matricule, Nom_prenom FROM personnel WHERE Matricule IN ("685", "503", "677", "482", "563", "314", "236")');
        console.table(personnel);

        console.log('--- Checking Postes ---');
        const [postes] = await connection.execute('SELECT ID, Description FROM postes WHERE Description LIKE "Contr%" OR Description LIKE "Fin%"');
        console.table(postes);

        console.log('--- Checking Articles ---');
        const [articles] = await connection.execute('SELECT ID, Code_article FROM articles WHERE Code_article IN ("191/150002/C", "DE546047", "DE534253", "DE534258")');
        console.table(articles);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
