import { z } from 'zod';

const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^[0-9]{10}$/),
  year: z.number().min(1).max(4),
});

export const campusCapitalistSchema = z
  .object({
    teamName: z.string().min(2),

    branch: z.enum(['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME']),

    leaderName: z.string().min(2),

    leaderEmail: z.string().email(),

    leaderPhone: z.string().regex(/^[0-9]{10}$/),

    members: z
      .array(memberSchema)
      .min(3, 'Team must have at least 3 members')
      .max(5, 'Team can have maximum 5 members'),
  })
  .superRefine((data, ctx) => {
    const seniorExists = data.members.some(m => m.year === 3 || m.year === 4);

    if (!seniorExists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one 3rd or 4th year member is required',
        path: ['members'],
      });
    }
  });
