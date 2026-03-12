import { z } from 'zod';

const branches = ['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME'] as const;

const teamMemberSchema = z.object({
  name: z.string().min(2, 'Member name must be at least 2 characters'),

  email: z.string().email('Invalid member email'),

  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits')
    .regex(/^[0-9]+$/, 'Phone must contain only numbers'),
});

export const stakesAndBusinessSchema = z
  .object({
    teamName: z.string().min(2, 'Team name must be at least 2 characters'),

    branch: z.enum(branches),

    leaderName: z.string().min(2, 'Leader name must be at least 2 characters'),

    leaderEmail: z.string().email('Invalid leader email'),

    leaderPhone: z
      .string()
      .length(10, 'Phone must be exactly 10 digits')
      .regex(/^[0-9]+$/, 'Phone must contain only numbers'),

    members: z
      .array(teamMemberSchema)
      .min(1, 'At least one team member required')
      .max(4, 'Maximum 4 members allowed'),
  })
  .superRefine((data, ctx) => {
    const phones = new Set<string>();
    const emails = new Set<string>();

    data.members.forEach((member, index) => {
      if (phones.has(member.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', index, 'phone'],
          message: 'Duplicate phone number in team',
        });
      }

      if (emails.has(member.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', index, 'email'],
          message: 'Duplicate email in team',
        });
      }

      phones.add(member.phone);
      emails.add(member.email);
    });
  });
