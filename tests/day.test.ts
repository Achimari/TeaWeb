import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_TIMEZONE, businessDate, previousDate } from '../src/lib/day.ts';

const at = (iso: string) => new Date(iso);

test('the business day defaults to Europe/Riga', () => {
  assert.equal(BUSINESS_TIMEZONE, 'Europe/Riga');
});

test('Riga midnight in summer time (UTC+3) starts the next day', () => {
  assert.equal(businessDate(at('2026-10-24T20:59:59Z')), '2026-10-24');
  assert.equal(businessDate(at('2026-10-24T21:00:00Z')), '2026-10-25');
});

test('after the clocks go back (UTC+2) midnight moves an hour later in UTC', () => {
  assert.equal(businessDate(at('2026-10-25T21:59:59Z')), '2026-10-25');
  assert.equal(businessDate(at('2026-10-25T22:00:00Z')), '2026-10-26');
});

test('the spring change is handled the same way', () => {
  assert.equal(businessDate(at('2027-03-27T21:59:59Z')), '2027-03-27');
  assert.equal(businessDate(at('2027-03-27T22:00:00Z')), '2027-03-28');
  assert.equal(businessDate(at('2027-03-28T20:59:59Z')), '2027-03-28');
});

test('another timezone can be configured', () => {
  assert.equal(businessDate(at('2026-10-24T21:30:00Z'), 'UTC'), '2026-10-24');
});

test('the previous day is calendar arithmetic, safe across months and DST', () => {
  assert.equal(previousDate('2026-10-26'), '2026-10-25');
  assert.equal(previousDate('2026-03-01'), '2026-02-28');
  assert.equal(previousDate('2027-01-01'), '2026-12-31');
});
