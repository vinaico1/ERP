const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./sales.controller');

router.use(authenticate);
router.get('/', authorizeAction('sales', 'read'), ctrl.list);
router.get('/export', authorizeAction('sales', 'read'), ctrl.exportData);
router.get('/:id', authorizeAction('sales', 'read'), ctrl.getOne);
router.post('/', authorizeAction('sales', 'write'), ctrl.create);
router.put('/:id', authorizeAction('sales', 'write'), ctrl.update);
router.patch('/:id/status', authorizeAction('sales', 'write'), ctrl.updateStatus);
router.delete('/:id', authorizeAction('sales', 'delete'), ctrl.cancel);

module.exports = router;
