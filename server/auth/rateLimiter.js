// server/auth/rateLimiter.js
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  max: 10,                   // block after 10 failed attempts
  message: {
    success: false,
    message: 'Too many failed signup attempts — please try again after 5 minutes.'
  },
  standardHeaders: true,     // send RateLimit-* headers
  legacyHeaders: false,      // disable X-RateLimit-* headers
  skipSuccessfulRequests: true // only count requests with status >= 400
});
