import { z } from 'zod';

export const environmentEnum = z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']);
export const statusEnum = z.enum(['HEALTHY', 'DEGRADED', 'DOWN']);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = loginSchema;

export const createServiceSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(60),
  endpointUrl: z.string().trim().max(1000).pipe(z.url('Must be a valid URL')),
  environment: environmentEnum,
  status: statusEnum.default('HEALTHY'),
});

// PATCH accepts any subset of the fields, but at least one must be sent.
export const updateServiceSchema = createServiceSchema
  .extend({ status: statusEnum })
  .partial()
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'please add one messahe',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
