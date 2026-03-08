const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./inventory.controller');

router.use(authenticate);
router.get('/', authorizeAction('inventory', 'read'), ctrl.list);
router.get('/movements', authorizeAction('inventory', 'read'), ctrl.movements);
router.get('/low-stock', authorizeAction('inventory', 'read'), ctrl.lowStock);
router.get('/:productId', authorizeAction('inventory', 'read'), ctrl.getByProduct);
router.post('/adjustment', authorizeAction('inventory', 'write'), ctrl.adjustment);
router.post('/movement', authorizeAction('inventory', 'write'), ctrl.registerMovement);

module.exports = router;
