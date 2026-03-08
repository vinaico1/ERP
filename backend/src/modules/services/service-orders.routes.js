const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./service-orders.controller');

router.use(authenticate);
router.get('/', authorizeAction('services', 'read'), ctrl.list);
router.get('/:id', authorizeAction('services', 'read'), ctrl.getOne);
router.post('/', authorizeAction('services', 'write'), ctrl.create);
router.put('/:id', authorizeAction('services', 'write'), ctrl.update);
router.patch('/:id/status', authorizeAction('services', 'write'), ctrl.updateStatus);
router.delete('/:id', authorizeAction('services', 'delete'), ctrl.cancel);

module.exports = router;
