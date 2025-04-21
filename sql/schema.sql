-- Create all tables for MakeMyTrade

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullname       TEXT NOT NULL,
    email          TEXT UNIQUE NOT NULL,
    phone          TEXT,
    username       TEXT UNIQUE NOT NULL,
    password_hash  TEXT NOT NULL,
    address        TEXT,
    country        TEXT NOT NULL,
    state          TEXT NOT NULL,
    organization   TEXT,
    dob            DATE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (for express-session + connect-pg-simple)
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Order log storage
CREATE TABLE IF NOT EXISTS order_logs (
    order_id INT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT,
    json_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login audit logging
CREATE TABLE IF NOT EXISTS login_audit (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    ip_address TEXT,
    status TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Per-user config (risk, leverage, etc.)
CREATE TABLE IF NOT EXISTS user_config (
    user_id TEXT PRIMARY KEY,
    risk_limit INT DEFAULT 100000,
    leverage DECIMAL DEFAULT 1.0
);
