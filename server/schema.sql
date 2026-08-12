CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  openrouter_key TEXT,
  huggingface_key TEXT,
  streak INTEGER DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Add the missing streak columns to your existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE;

-- 2. Create the new table for Bible Notes
CREATE TABLE IF NOT EXISTS bible_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  ai_guide TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the new table for Game Scores
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
