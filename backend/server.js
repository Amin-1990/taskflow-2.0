require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`?? Serveur démarré sur le port ${PORT}`);
  console.log(`?? URL: http://192.168.1.161:${PORT}`);
  console.log(`?? Health: http://192.168.1.161:${PORT}/api/health`);
  console.log(`??  Database: ${process.env.DB_NAME}`);
});


