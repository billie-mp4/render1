// server.js
import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// --- DB connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Create table if needed (id, text, created_at)
async function ensureTable() {
  await pool.query(`
    create table if not exists entries (
      id serial primary key,
      text text not null,
      created_at timestamptz not null default now()
    )
  `);
}
ensureTable().catch(err => {
  console.error('Failed to ensure table:', err);
  process.exit(1);
});

// health
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'db_error', error: e.message });
  }
});

// POST /api/echo -> insert and return the inserted row
app.post('/api/echo', async (req, res) => {
  const text = (req.body && typeof req.body.text === 'string') ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const { rows } = await pool.query(
      'insert into entries (text) values ($1) returning id, text, created_at',
      [text]
    );
    const row = rows[0];
    res.json({
      id: row.id,
      echo: row.text,
      timestamp: row.created_at  // ISO string in UTC
    });
  } catch (e) {
    console.error('Insert failed:', e);
    res.status(500).json({ error: 'db_insert_failed' });
  }
});

// GET /api/history -> latest N rows
app.get('/api/history', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  try {
    const { rows } = await pool.query(
      'select id, text, created_at from entries order by id desc limit $1',
      [limit]
    );
    res.json(rows);
  } catch (e) {
    console.error('History failed:', e);
    res.status(500).json({ error: 'db_select_failed' });
  }
});

app.get('/', (_req, res) => res.type('text').send('API running. Use POST /api/echo and GET /api/history'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));