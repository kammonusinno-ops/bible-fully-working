CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  openrouter_key TEXT,
  huggingface_key TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
