const express = require('express');
const router = express.Router();
const { register, login, logoutAll } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../utils/schemas');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout-all', requireAuth, logoutAll);

module.exports = router;
