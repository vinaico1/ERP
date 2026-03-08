const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./purchases.controller');

router.use(authenticate);
router.get('/', authorizeAction('purchases', 'read'), ctrl.list);
router.get('/:id', authorizeAction('purchases', 'read'), ctrl.getOne);
router.post('/', authorizeAction('purchases', 'write'), ctrl.create);
router.put('/:id', authorizeAction('purchases', 'write'), ctrl.update);
router.patch('/:id/status', authorizeAction('purchases', 'write'), ctrl.updateStatus);
router.patch('/:id/receive', authorizeAction('purchases', 'write'), ctrl.receiveItems);
router.delete('/:id', authorizeAction('purchases', 'delete'), ctrl.cancel);

module.exports = router;
