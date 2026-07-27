import { expect, it } from 'vitest';
import {
  addDays,
  createDateClient,
  expandRecurrence,
  formatDate,
  parseDate,
  timezoneConvert,
} from '../src/index.js';

it('documents UTC due-date persistence through arithmetic, format, and parse', () => {
  const startedAt = new Date('2026-07-15T13:04:05.000Z');
  const due = addDays(startedAt, 7, 'date-fns');
  const stored = formatDate(due.result, 'YYYY-MM-DD HH:mm:ss', 'date-fns');
  const restored = parseDate(stored.formatted, 'YYYY-MM-DD HH:mm:ss', 'date-fns');
  expect(stored.formatted).toBe('2026-07-22 13:04:05');
  expect(restored.date.toISOString()).toBe('2026-07-22T13:04:05.000Z');
  expect(createDateClient({ provider: 'date-fns' }).diffDays(due.result, startedAt)).toBe(7);
});

it('documents display conversion and a limited recurrence schedule', () => {
  const storedAt = parseDate('2026-01-01 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'luxon').date;
  expect(timezoneConvert(storedAt, 'Asia/Tokyo', 'luxon')).toMatchObject({
    timezone: 'Asia/Tokyo', offsetMinutes: 540, provider: 'luxon',
    date: new Date('2026-01-01T09:00:00.000Z'),
  });
  expect(expandRecurrence({ freq: 'WEEKLY', interval: 2, count: 3 }, storedAt)
    .map(date => date.toISOString().slice(0, 10))).toEqual([
      '2026-01-01', '2026-01-15', '2026-01-29',
    ]);
});

it('documents rejection of an invalid persisted date', () => {
  expect(() => parseDate('not-a-date', 'YYYY-MM-DD', 'dayjs')).toThrow(
    'parseDate: invalid input "not-a-date"',
  );
});
