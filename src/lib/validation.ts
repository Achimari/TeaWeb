import { z } from 'zod';
import { PRESETS } from './timer.ts';
// A display name only: letters in any script, numbers, spaces and a little punctuation. No markup, no control characters.
const NAME = /^[\p{L}\p{M}\p{N} .'’_-]+$/u;
export const displayNameSchema = z.string()
  .refine((value) => !/[\p{Cc}\p{Cf}]/u.test(value), 'Use letters, numbers and spaces.')
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(2, 'Use at least 2 characters.').max(24, 'Use 24 characters or fewer.').regex(NAME, 'Use letters, numbers and spaces.'));

// Starting the shared timer: a preset tea (its time is fixed) or a custom time from 1 second to 60 minutes.
// The label every visitor sees comes from this list, never from free text.
const TEAS = PRESETS.map((p) => p.label) as [string, ...string[]];
export const timerStartSchema = z.union([
  z.object({ tea: z.enum(TEAS) }).strict().transform(({ tea }) => ({ label: tea, durationMs: PRESETS.find((p) => p.label === tea)!.minutes * 60_000 })),
  z.object({ tea: z.literal('Custom'), durationMs: z.number().int().min(1_000).max(3_600_000) }).strict().transform(({ durationMs }) => ({ label: 'Custom', durationMs })),
]);
export const timerStopSchema = z.object({ version: z.number().int().min(0) }).strict();
