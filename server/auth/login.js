// server/auth/login.js
const pool = require('../db/pg');
const bcrypt = require('bcrypt');

module.exports = async function loginHandler(req, res) {
  const username = req.body.username?.trim();
  const password = req.body.password?.trim();
  const captcha  = req.body.captcha?.trim();

  // 🧩 Validate CAPTCHA (SVG-based)
  const sessionCaptcha = req.session.captcha;

  // ✅ Debug Log
  console.log('🔍 CAPTCHA Debug → Submitted:', captcha, '| Session stored:', sessionCaptcha);

  if (!sessionCaptcha) {
    console.log('⚠️ No CAPTCHA stored in session → likely expired.');
    return res.status(400).json({ success: false, message: 'Session expired, please reload the page' });
  }

  if (!captcha) {
    console.log('❌ CAPTCHA empty → nothing submitted');
    return res.status(400).json({ success: false, message: 'CAPTCHA required' });
  }

  if (captcha.toLowerCase() !== sessionCaptcha.toLowerCase()) {
    console.log('❌ CAPTCHA failed → Expected:', sessionCaptcha, '| Got:', captcha);
    return res.status(400).json({ success: false, message: 'Invalid CAPTCHA' });
  }

  console.log('✅ CAPTCHA verified successfully!');

  // Clear used CAPTCHA from session
  delete req.session.captcha;

  console.log('🔑 Login attempt for:', username);

  if (!username || !password) {
    console.log('↩️ Missing fields');
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      console.log('↩️ No such user');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const { id, password_hash } = result.rows[0];
    const match = await bcrypt.compare(password, password_hash);
    if (!match) {
      console.log('↩️ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    console.log('✅ Authentication successful for user id', id);
    req.session.userId = id;

    // Ensure session saved before responding
    req.session.save(err => {
      if (err) {
        console.error('⚠️ Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      console.log(`🚀 User "${username}" logged in successfully`);
      return res.json({ success: true, message: 'Login successful' });
    });

  } catch (err) {
    console.error('💥 Login error:', err.stack || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
