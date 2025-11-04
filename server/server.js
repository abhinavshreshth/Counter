// server.js
require('dotenv').config();

const strategyRoutes = require('./strategyRoutes');
const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes');
const captchaRoute = require('./auth/captcha');
const socketHandler = require('./socket/socketHandler');
const zmqReceiver = require('./zmq/receiver');
const errorHandler = require('./middleware/errorHandler');

const pool = require('./db/pg');
const sessionStore = require('./db/sessionStore');
const initDatabase = require('./db/init');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ——————————————————————————————
// Middleware Setup
// ——————————————————————————————
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// Session (use only ONE instance)
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'keyboard-cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict',
    secure: false
  }
}));

// ——————————————————————————————
// CAPTCHA Route
// ——————————————————————————————
app.use('/captcha', captchaRoute); // ✅ Now /captcha will work!

// ——————————————————————————————
// Route Guards and Pretty Redirects
// ——————————————————————————————
app.use(['/login.html', '/signup.html'], (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
});

app.use('/index.html', (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
});

app.get('/login', (req, res) => {
  // if user is already in session, send them to the dashboard
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

app.get('/*.html', (req, res) => {
  const clean = req.path.replace(/\.html$/, '');
  res.redirect(clean);
});

// Static assets
app.use(express.static(path.join(__dirname, '..', 'public'), {
  index: false
}));

app.get('/create_strategy', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'create_strategy.html'));
});


app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/strategies', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'strategies.html'));
});

app.get('/deployments', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'deployments.html'));
});
// ——————————————————————————————
// Auth routes + real-time + error handler
// ——————————————————————————————
app.use('/api', strategyRoutes);
app.use('/', authRoutes);

socketHandler(io);
zmqReceiver(io);
app.use(errorHandler);

// ——————————————————————————————
// Async Startup
// ——————————————————————————————
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    client.release();

    await initDatabase();

    const PORT = process.env.PORT || 3000;
    console.log('🗄️  Database initialized, starting server…');
    server.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();
