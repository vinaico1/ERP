const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./users.controller');

router.use(authenticate);
router.get('/', authorizeAction('users', 'read'), ctrl.list);
router.get('/:id', authorizeAction('users', 'read'), ctrl.getOne);
router.post('/', authorizeAction('users', 'write'), ctrl.create);
router.put('/:id', authorizeAction('users', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('users', 'delete'), ctrl.remove);
router.get('/:id/audit', authorizeAction('users', 'read'), ctrl.auditHistory);

module.exports = router;
