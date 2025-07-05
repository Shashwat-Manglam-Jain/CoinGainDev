const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validators');

// Routes with validation
router.post('/register', handleValidationErrors, registerUser);
router.post('/login', validateLogin, handleValidationErrors, loginUser);

module.exports = router;
