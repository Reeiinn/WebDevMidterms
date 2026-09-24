import { Router } from 'express';
import { pool } from './db';
import { authenticate } from './authRoute';
import { validate } from './validation';
import { createServiceSchema, updateServiceSchema, type CreateServiceInput, type UpdateServiceInput } from './schemas';

const router = Router();
router.use(authenticate); // every route below is JWT protected

const COLUMNS = `id, name, endpoint_url AS "endpointUrl", environment, status, created_at AS "createdAt"`;

// CREATE
router.post('/', validate(createServiceSchema), async (req, res) => {
  const { name, endpointUrl, environment, status } = req.body as CreateServiceInput;
  const { rows } = await pool.query(
    `INSERT INTO services (name, endpoint_url, environment, status, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
    [name, endpointUrl, environment, status, req.user!.id]
  );
  res.status(201).json(rows[0]);
});

// READ all (optional ?environment=STAGING filter)
router.get('/', async (req, res) => {
  const env = typeof req.query.environment === 'string' ? req.query.environment : null;
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM services
      WHERE $1::text IS NULL OR environment = $1
      ORDER BY created_at DESC`,
    [env]
  );
  res.json(rows);
});

// UPDATE any subset of fields
router.patch('/:id', validate(updateServiceSchema), async (req, res) => {
  const { name, endpointUrl, environment, status } = req.body as UpdateServiceInput;
  const { rows } = await pool.query(
    `UPDATE services
        SET name         = COALESCE($1, name),
            endpoint_url = COALESCE($2, endpoint_url),
            environment  = COALESCE($3, environment),
            status       = COALESCE($4, status)
      WHERE id = $5
      RETURNING ${COLUMNS}`,
    [name ?? null, endpointUrl ?? null, environment ?? null, status ?? null, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Service not found' });
  res.json(rows[0]);
});

// DELETE
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
  res.status(204).send();
});

export default router;
