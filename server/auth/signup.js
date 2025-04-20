// server/auth/signup.js
const pool   = require('../db/pg');
const bcrypt = require('bcrypt');

module.exports = async function signupHandler(req, res) {
  const {
    fullname,
    email,
    phone,
    username,
    password,
    address,
    country,
    state,
    organization,
    dob
  } = req.body;

  // 1) Required‑field check
  if (!fullname || !email || !username || !password || !country || !state) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  try {
    // 2) Uniqueness check on username OR email
    const dup = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (dup.rows.length) {
      return res
        .status(400)
        .json({ success: false, message: 'Username or email already in use' });
    }

    // 3) Hash the password
    const hash = await bcrypt.hash(password, 10);

    // 4) Insert everything
    const result = await pool.query(
      `INSERT INTO users
         (full_name, email, phone, username, password_hash,
          address, country, state, organization, dob)
       VALUES
         ($1,        $2,    $3,    $4,       $5,
          $6,         $7,      $8,    $9,            $10)
       RETURNING id`,
      [
        fullname,
        email,
        phone || null,
        username,
        hash,            // this is your password_hash
        address || null,
        country,
        state,
        organization || null,
        dob || null
      ]
    );

    // 5) Set the session and return success
    req.session.userId = result.rows[0].id;
    return res.status(201).json({ success: true });

  } catch (err) {
    console.error('💥 Signup error:', err.stack || err.message);
    return res
      .status(500)
      .json({ success: false, message: 'Server error' });
  }
};
