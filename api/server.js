// server.js
import express from 'express';
import cors from 'cors';

const app = express();

// Allow calls from your static site origin(s)
// For quick demos you can use app.use(cors()) to allow all origins
app.use(cors());
app.use(express.json());

// health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// echo endpoint
app.post('/api/echo', (req, res) => {
  const text = (req.body && typeof req.body.text === 'string') ? req.body.text : '';
  if (!text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  res.json({
    echo: text,
    length: [...text].length,
    timestamp: new Date().toISOString()
  });
});

// default route (optional)
app.get('/', (_req, res) => {
  res.type('text').send('API is running. Try POST /api/echo');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));