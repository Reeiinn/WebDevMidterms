import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';
import { validate } from './validation';
import { loginSchema, registerSchema, type LoginInput } from './schemas';
import type { AuthUser } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const signToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });

// Protects routes: requires "Authorization: Bearer <token>"
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const router = Router();

// POST /api/auth/login  (public)
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];

  // Same message for both cases so nobody can tell which part was wrong
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const payload = { id: user.id, email: user.email };
  res.json({ token: signToken(payload), user: payload });
});

// POST /api/auth/register  (public)
router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );
    const user: AuthUser = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

export default router;
