const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
