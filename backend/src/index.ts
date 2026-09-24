import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { initDb } from './db';
import authRoutes from './authRoute';
import serviceRoutes from './serviceRoute';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);

// Central error handler (also catches invalid UUIDs in :id -> Postgres error 22P02)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.code === '22P02') return res.status(400).json({ error: 'Invalid id format' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 4000;
initDb()
  .then(() => app.listen(port, () => console.log(`PulseDesk API on http://localhost:${port}`)))
  .catch((e) => {
    console.error('Failed to init DB', e);
    process.exit(1);
  });
