require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  ERP API Server rodando na porta ${PORT}`);
  console.log(`  Ambiente: ${process.env.NODE_ENV}`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log(`========================================\n`);
});
