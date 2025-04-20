// server/routes.js
const express       = require('express');
const router        = express.Router();
const rateLimiter   = require('./auth/rateLimiter');
const loginHandler  = require('./auth/login');
const signupHandler = require('./auth/signup');
const logoutHandler = require('./auth/logout');

// Order matters: each one needs its own `return` in the handler
router.post('/login',  rateLimiter, loginHandler);
router.post('/signup', rateLimiter, signupHandler);
router.get('/logout', logoutHandler);

module.exports = router;