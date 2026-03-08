const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./products.controller');

router.use(authenticate);
router.get('/categories', authorizeAction('products', 'read'), ctrl.listCategories);
router.post('/categories', authorizeAction('products', 'write'), ctrl.createCategory);
router.get('/', authorizeAction('products', 'read'), ctrl.list);
router.get('/export', authorizeAction('products', 'read'), ctrl.exportData);
router.get('/low-stock', authorizeAction('products', 'read'), ctrl.lowStock);
router.get('/:id', authorizeAction('products', 'read'), ctrl.getOne);
router.post('/', authorizeAction('products', 'write'), ctrl.create);
router.put('/:id', authorizeAction('products', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('products', 'delete'), ctrl.remove);

module.exports = router;
