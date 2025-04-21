const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  req.session.captchaAnswer = a + b;
  res.json({ a, b });
});

module.exports = router;
