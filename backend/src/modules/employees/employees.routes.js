const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./employees.controller');

router.use(authenticate);
router.get('/', authorizeAction('employees', 'read'), ctrl.list);
router.get('/:id', authorizeAction('employees', 'read'), ctrl.getOne);
router.post('/', authorizeAction('employees', 'write'), ctrl.create);
router.put('/:id', authorizeAction('employees', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('employees', 'delete'), ctrl.remove);

module.exports = router;
