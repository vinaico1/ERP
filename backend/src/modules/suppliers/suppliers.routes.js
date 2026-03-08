const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./suppliers.controller');

router.use(authenticate);
router.get('/', authorizeAction('suppliers', 'read'), ctrl.list);
router.get('/export', authorizeAction('suppliers', 'read'), ctrl.exportData);
router.get('/:id', authorizeAction('suppliers', 'read'), ctrl.getOne);
router.post('/', authorizeAction('suppliers', 'write'), ctrl.create);
router.put('/:id', authorizeAction('suppliers', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('suppliers', 'delete'), ctrl.remove);

module.exports = router;
