// server.js
require('dotenv').config();

const express       = require('express');
const session       = require('express-session');
const path          = require('path');
const http          = require('http');
const socketIo      = require('socket.io');

const authRoutes    = require('./routes');
const socketHandler = require('./socket/socketHandler');
const zmqReceiver   = require('./zmq/receiver');
const errorHandler  = require('./middleware/errorHandler');

const pool          = require('./db/pg');
const sessionStore  = require('./db/sessionStore');
const initDatabase  = require('./db/init');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict',
    secure: false
  }
}));

// ─── Auto‑redirect logged‑in users off login/signup ─────────────
app.use(['/login.html','/signup.html'], (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
});

// ─── Protect dashboard page ───────────────────────────────────────
app.use('/index.html', (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
});

// pretty URLs
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


// Redirect requests for *.html to the extensionless route
app.get('/*.html', (req, res) => {
  // e.g. "/login.html" → "/login"
  const clean = req.path.replace(/\.html$/, '');
  res.redirect(clean);
});

// Static assets
app.use(express.static(path.join(__dirname, '..', 'public'), {
  index: false       // don’t serve index.html at `/`
}));

// Protect the root path (“/”) too:
app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  // Clear any caching so “back” won’t show stale content:
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Auth routes
app.use('/', authRoutes);

// Real‑time wiring
socketHandler(io);
zmqReceiver(io);

// Global error handler
app.use(errorHandler);

// Async startup: ensure DB and then listen
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
