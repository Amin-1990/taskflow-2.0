require('dotenv').config();
const db = require('./src/config/database');

async function check() {
  try {
    const [semaines] = await db.query('SELECT COUNT(*) as count FROM semaines');
    console.log('Total semaines:', semaines[0].count);
    
    if (semaines[0].count > 0) {
      const [sample] = await db.query('SELECT * FROM semaines LIMIT 3');
      console.table(sample);
    }
    
    const [planning] = await db.query('SELECT COUNT(*) as count FROM planning_hebdo');
    console.log('\nTotal planning records:', planning[0].count);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

check();
