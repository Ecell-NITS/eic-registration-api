import { z } from 'zod';

export const adoShuffleSchema = z.object({
  leaderName: z.string().min(2, 'Leader name must be at least 2 characters'),

  leaderEmail: z.string().email('Invalid email'),

  leaderPhone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),

  branch: z.enum(['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME']),
});
