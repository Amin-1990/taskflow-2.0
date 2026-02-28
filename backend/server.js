require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`* Serveur demarre sur le port ${PORT}`);
  console.log(`* URL: http://10.0.1.6:${PORT}`);
  console.log(`* Health: http://10.0.1.6:${PORT}/api/health`);
  console.log(`*  Database: ${process.env.DB_NAME}`);
});


