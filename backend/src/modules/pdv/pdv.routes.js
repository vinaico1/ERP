const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const pdv = require('./pdv.controller');

router.use(authenticate);

router.get('/products',          pdv.products);
router.get('/categories',        pdv.categories);
router.get('/stock/:productId',  pdv.stock);
router.get('/caixa',             pdv.caixa);

module.exports = router;
