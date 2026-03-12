import { z } from 'zod';

export const dealroomEscapeSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),

  branch: z.enum(['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME']),

  leaderName: z.string().min(2, 'Leader name must be at least 2 characters'),

  leaderEmail: z.string().email('Invalid email'),

  leaderPhone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),

  members: z
    .array(
      z.object({
        name: z.string().min(2, 'Member name required'),
        email: z.string().email('Invalid member email'),
        phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
      }),
    )
    .length(3, 'Team must have exactly 3 members besides the leader'),
});
