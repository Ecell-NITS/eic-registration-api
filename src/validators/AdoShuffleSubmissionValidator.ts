import { z } from 'zod';

export const adoShuffleSubmissionSchema = z.object({
  branch: z.enum(['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME']),
  contactEmail: z.string().email('Invalid contact email'),
  videoLink: z.string().url('Video link must be a valid URL'),
  posterLink: z.string().url('Poster link must be a valid URL'),
});
