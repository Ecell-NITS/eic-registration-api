import { z } from 'zod';

const branches = ['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME'] as const;

export const chairmansConclaveSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),

  email: z.string().email('Invalid email address'),

  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits')
    .regex(/^[0-9]+$/, 'Phone must contain only numbers'),

  branch: z.string().refine(val => branches.includes(val as any), {
    message: 'Invalid branch selected',
  }),
});
