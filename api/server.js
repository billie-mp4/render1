import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(cors());            // allow frontend to call us
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // works for Render, Neon, Supabase
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
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

// demo: ensure a table and return last 5 rows
app.get('/api/hello', async (_req, res) => {
  await pool.query(`create table if not exists greetings(
    id serial primary key, msg text not null, created_at timestamptz default now()
  )`);
  await pool.query('insert into greetings(msg) values($1)', ['Hello from Postgres 👋']);
  const { rows } = await pool.query('select * from greetings order by id desc limit 5');
  res.json(rows);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));