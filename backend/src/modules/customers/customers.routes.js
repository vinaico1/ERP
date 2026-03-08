const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./customers.controller');

router.use(authenticate);
router.get('/', authorizeAction('customers', 'read'), ctrl.list);
router.get('/export', authorizeAction('customers', 'read'), ctrl.exportData);
router.get('/:id', authorizeAction('customers', 'read'), ctrl.getOne);
router.post('/', authorizeAction('customers', 'write'), ctrl.create);
router.put('/:id', authorizeAction('customers', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('customers', 'delete'), ctrl.remove);
router.get('/:id/sales', authorizeAction('customers', 'read'), ctrl.getSales);
router.get('/:id/receivables', authorizeAction('customers', 'read'), ctrl.getReceivables);

module.exports = router;
