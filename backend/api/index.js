// Entrypoint serverless para o Vercel (@vercel/node).
// Reaproveita a mesma instância Express usada localmente (server.js faz o
// app.listen(); aqui o Vercel invoca o app diretamente por requisição).
require('dotenv').config();
const app = require('../src/app');

module.exports = app;
