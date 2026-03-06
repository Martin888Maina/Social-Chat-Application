const express = require('express');
const router = express.Router();
const passwordController = require('../controller/passwordController');

// Forgot password route
router.post('/forgot', passwordController.forgotPassword);

// Reset password route
router.post('/reset', passwordController.resetPassword);

module.exports = router;
