const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bible_secret_key_railway_99!';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// PostgreSQL Pool setup with robust SSL for Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize DB Table
async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('schema.sql not found at:', schemaPath);
      return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('PostgreSQL database initialized successfully.');
  } catch (err) {
    console.error('Database initialization error:', err.message, err.stack);
  }
}
initDb();

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, openrouter_key, huggingface_key } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (username, password_hash, openrouter_key, huggingface_key, streak)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING id, username, openrouter_key, huggingface_key, streak
    `;
    const values = [username, passwordHash, openrouter_key || null, huggingface_key || null];
    const result = await pool.query(query, values);
    const user = result.rows[0];

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { username: user.username, openrouter_key: user.openrouter_key, huggingface_key: user.huggingface_key, streak: user.streak } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Registration error details:', err);
    res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    await pool.query('UPDATE users SET streak = COALESCE(streak, 1) WHERE id = $1', [user.id]);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { username: user.username, openrouter_key: user.openrouter_key, huggingface_key: user.huggingface_key, streak: user.streak || 1 } });
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

// Get User Profile & Streak
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT username, openrouter_key, huggingface_key, streak FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update API Keys
app.put('/api/user/keys', authenticateToken, async (req, res) => {
  const { openrouter_key, huggingface_key } = req.body;
  try {
    const query = `
      UPDATE users
      SET openrouter_key = COALESCE($1, openrouter_key),
          huggingface_key = COALESCE($2, huggingface_key)
      WHERE id = $3
      RETURNING username, openrouter_key, huggingface_key
    `;
    const result = await pool.query(query, [openrouter_key, huggingface_key, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update keys error:', err);
    res.status(500).json({ error: 'Server error updating keys' });
  }
});

// --- BIBLE NOTES API ---
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bible_notes WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Server error fetching notes' });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  const { title, content, ai_guide } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const result = await pool.query(
      'INSERT INTO bible_notes (user_id, title, content, ai_guide) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, content || '', ai_guide || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Server error creating note' });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  const { title, content, ai_guide } = req.body;
  const noteId = req.params.id;
  try {
    const result = await pool.query(
      'UPDATE bible_notes SET title = COALESCE($1, title), content = COALESCE($2, content), ai_guide = COALESCE($3, ai_guide) WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, content, ai_guide, noteId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Server error updating note' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  const noteId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM bible_notes WHERE id = $1 AND user_id = $2 RETURNING id', [noteId, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

// --- GAME LEADERBOARD API ---
app.get('/api/games/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, g.game_name, g.score, g.created_at 
      FROM game_scores g 
      JOIN users u ON g.user_id = u.id 
      ORDER BY g.score DESC 
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

app.post('/api/games/score', authenticateToken, async (req, res) => {
  const { game_name, score } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO game_scores (user_id, game_name, score) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, game_name || 'Bible Trivia', score || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save score error:', err);
    res.status(500).json({ error: 'Server error saving score' });
  }
});

// --- STUDY PROGRESS API ---
app.get('/api/study/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT week_number, completed FROM study_progress WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get study progress error:', err);
    res.status(500).json({ error: 'Server error fetching study progress' });
  }
});

app.post('/api/study/progress', authenticateToken, async (req, res) => {
  const { week_number, completed } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO study_progress (user_id, week_number, completed, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, week_number)
      DO UPDATE SET completed = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, week_number, completed]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save study progress error:', err);
    res.status(500).json({ error: 'Server error saving study progress' });
  }
});

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
