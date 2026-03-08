const express = require('express');
const router = express.Router();
const { authenticate, authorizeAction } = require('../../middleware/auth');
const ctrl = require('./financial.controller');

router.use(authenticate);

// Categories
router.get('/categories', authorizeAction('financial', 'read'), ctrl.listCategories);
router.post('/categories', authorizeAction('financial', 'write'), ctrl.createCategory);
router.put('/categories/:id', authorizeAction('financial', 'write'), ctrl.updateCategory);

// Cost Centers
router.get('/cost-centers', authorizeAction('financial', 'read'), ctrl.listCostCenters);
router.post('/cost-centers', authorizeAction('financial', 'write'), ctrl.createCostCenter);
router.put('/cost-centers/:id', authorizeAction('financial', 'write'), ctrl.updateCostCenter);

// Payables
router.get('/payables', authorizeAction('financial', 'read'), ctrl.listPayables);
router.get('/payables/:id', authorizeAction('financial', 'read'), ctrl.getPayable);
router.post('/payables', authorizeAction('financial', 'write'), ctrl.createPayable);
router.put('/payables/:id', authorizeAction('financial', 'write'), ctrl.updatePayable);
router.patch('/payables/:id/pay', authorizeAction('financial', 'write'), ctrl.payPayable);

// Receivables
router.get('/receivables', authorizeAction('financial', 'read'), ctrl.listReceivables);
router.get('/receivables/:id', authorizeAction('financial', 'read'), ctrl.getReceivable);
router.post('/receivables', authorizeAction('financial', 'write'), ctrl.createReceivable);
router.put('/receivables/:id', authorizeAction('financial', 'write'), ctrl.updateReceivable);
router.patch('/receivables/:id/receive', authorizeAction('financial', 'write'), ctrl.receiveReceivable);

// Cash Flow
router.get('/cashflow', authorizeAction('financial', 'read'), ctrl.listCashFlow);
router.post('/cashflow', authorizeAction('financial', 'write'), ctrl.createCashFlow);
router.get('/cashflow/summary', authorizeAction('financial', 'read'), ctrl.cashFlowSummary);

module.exports = router;
