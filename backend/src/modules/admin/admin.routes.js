const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./admin.controller');

router.use(authenticate);

// Roles
router.get('/roles', ctrl.listRoles);
router.post('/roles', authorizeAction('admin', 'write'), ctrl.createRole);
router.put('/roles/:id', authorizeAction('admin', 'write'), ctrl.updateRole);
router.delete('/roles/:id', authorizeAction('admin', 'delete'), ctrl.deleteRole);

// Audit Logs
router.get('/audit-logs', authorizeAction('admin', 'read'), ctrl.listAuditLogs);

// System info
router.get('/stats', ctrl.systemStats);

module.exports = router;
