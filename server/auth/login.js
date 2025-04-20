// server/auth/login.js
const pool   = require('../db/pg');
const bcrypt = require('bcrypt');

module.exports = async function loginHandler(req, res) {
  const { username, password } = req.body;
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
    return res.json({ success: true });

  } catch (err) {
    console.error('💥 Login error:', err.stack || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
