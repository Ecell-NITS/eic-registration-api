import { z } from 'zod';

const memberSchema = z.object({
  name: z.string().min(2, 'Member name must be at least 2 characters'),
  year: z
    .number()
    .int()
    .min(1, 'Year must be between 1 and 4')
    .max(4, 'Year must be between 1 and 4'),
  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits')
    .regex(/^[0-9]+$/, 'Phone must contain only numbers'),
});

export const chairmansConclaveSchema = z
  .object({
    branch: z.enum(['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME']),
    contactEmail: z.string().email('Invalid contact email'),
    members: z.array(memberSchema).length(2, 'Exactly 2 members are required'),
  })
  .superRefine((data, ctx) => {
    const phones = new Set<string>();

    data.members.forEach((member, index) => {
      if (phones.has(member.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', index, 'phone'],
          message: 'Duplicate phone number',
        });
      }
      phones.add(member.phone);
    });
  });
