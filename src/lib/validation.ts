import { z } from 'zod';
// A display name only: letters in any script, numbers, spaces and a little punctuation. No markup, no control characters.
const NAME = /^[\p{L}\p{M}\p{N} .'’_-]+$/u;
export const displayNameSchema = z.string()
  .refine((value) => !/[\p{Cc}\p{Cf}]/u.test(value), 'Use letters, numbers and spaces.')
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(2, 'Use at least 2 characters.').max(24, 'Use 24 characters or fewer.').regex(NAME, 'Use letters, numbers and spaces.'));
