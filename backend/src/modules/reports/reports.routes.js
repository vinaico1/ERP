const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./reports.controller');

router.use(authenticate);
router.get('/dashboard', ctrl.dashboard);
router.get('/sales-by-period', ctrl.salesByPeriod);
router.get('/sales-by-customer', ctrl.salesByCustomer);
router.get('/inventory-summary', ctrl.inventorySummary);
router.get('/financial-summary', ctrl.financialSummary);
router.get('/top-products', ctrl.topProducts);
router.get('/overdue', ctrl.overdueAccounts);

module.exports = router;
