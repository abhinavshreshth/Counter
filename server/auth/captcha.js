// server/auth/captcha.js
const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

router.get('/', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: '#f2f2f2',
  });

  // Save captcha text in lowercase for comparison
  req.session.captcha = captcha.text.toLowerCase();
  console.log('🧩 New CAPTCHA generated:', captcha.text, 'Session:', req.sessionID);

  // 🛡️ Add all cache-busting headers (important)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Send the SVG image
  res.type('svg');
  res.status(200).send(captcha.data);
});

module.exports = router;
