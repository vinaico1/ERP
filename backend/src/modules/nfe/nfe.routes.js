const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const nfe = require('./nfe.controller');

router.use(authenticate);

router.get('/config', nfe.getConfig);
router.get('/order/:orderId', nfe.listarPorPedido);
router.get('/:id', nfe.consultar);
router.post('/emitir', nfe.emitir);
router.post('/:id/cancelar', nfe.cancelar);

module.exports = router;
