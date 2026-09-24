import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         TEXT NOT NULL,
      endpoint_url TEXT NOT NULL,
      environment  TEXT NOT NULL CHECK (environment IN ('DEVELOPMENT','STAGING','PRODUCTION')),
      status       TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY','DEGRADED','DOWN')),
      created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const email = 'admin@pulsedesk.com';
  const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount === 0) {
    const hash = await bcrypt.hash('password123', 10);
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
    console.log(`Seeded demo user: ${email} / password123`);
  }
}
