const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./services.controller');

router.use(authenticate);
router.get('/', authorizeAction('services', 'read'), ctrl.list);
router.get('/:id', authorizeAction('services', 'read'), ctrl.getOne);
router.post('/', authorizeAction('services', 'write'), ctrl.create);
router.put('/:id', authorizeAction('services', 'write'), ctrl.update);
router.delete('/:id', authorizeAction('services', 'delete'), ctrl.remove);

module.exports = router;
