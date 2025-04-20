// server/auth/logout.js
module.exports = (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      // Clear the cookie so the browser forgets it
      res.clearCookie('connect.sid', {
        httpOnly: true,
        sameSite: 'strict',
        secure: false, // true in prod over HTTPS
      });
      // Redirect client to login page
      res.redirect('/login.html');
    });
  };
  