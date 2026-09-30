PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL,
  normalized_username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  disabled INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1)),
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX users_normalized_username_uq ON users (normalized_username);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE course_entitlements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL CHECK (course_slug IN ('ode', 'fourier')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_slug)
);

CREATE TABLE login_rate_limits (
  bucket_key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL,
  window_ms INTEGER NOT NULL
);
CREATE INDEX login_rate_limits_window_idx ON login_rate_limits (window_started_at, window_ms);
