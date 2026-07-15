/**
 * fidelity test — createDateClient (kiwa mock) が reference impl (native Date + timestamp 演算)
 * と同じ挙動を示すことを検証。 5 case で addDays / diffDays / format / parse / tz の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createDateClient, formatDate, parseDate, timezoneConvert } from '../../src/index.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function referenceAddDays(iso: string, days: number): string {
  const t = new Date(iso).getTime() + days * MS_PER_DAY;
  return new Date(t).toISOString();
}

describe('date client fidelity vs reference impl', () => {
  it('addDays = reference impl (timestamp 演算) と一致', async () => {
    const mock = createDateClient({ provider: 'date-fns' });
    const result = await assertFidelity({
      mockFn: async (iso: string) => mock.addDays(new Date(iso), 7).toISOString(),
      realFn: async (iso: string) => referenceAddDays(iso, 7),
      cases: [{ name: 'add 7 days', args: ['2026-01-01T00:00:00.000Z'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('diffDays が過去 <-> 未来で対称に整数を返す', () => {
    const mock = createDateClient({ provider: 'dayjs' });
    const a = new Date(Date.UTC(2026, 0, 10));
    const b = new Date(Date.UTC(2026, 0, 3));
    expect(mock.diffDays(a, b)).toBe(7);
    expect(mock.diffDays(b, a)).toBe(-7);
  });

  it('formatDate が YYYY-MM-DD 形式で 0 padding する', () => {
    const date = new Date(Date.UTC(2026, 0, 5, 3, 4, 5));
    const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss', 'luxon');
    expect(result.formatted).toBe('2026-01-05 03:04:05');
    expect(result.provider).toBe('luxon');
  });

  it('parseDate + formatDate が round-trip する', () => {
    const iso = '2026-06-15 12:30:45';
    const parsed = parseDate(iso, 'YYYY-MM-DD HH:mm:ss', 'temporal');
    const back = formatDate(parsed.date, 'YYYY-MM-DD HH:mm:ss', 'temporal');
    expect(back.formatted).toBe(iso);
  });

  it('timezoneConvert が Asia/Tokyo で +9h shift する', () => {
    const utc = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const jp = timezoneConvert(utc, 'Asia/Tokyo', 'date-fns');
    expect(jp.offsetMinutes).toBe(540);
    expect(jp.date.getTime() - utc.getTime()).toBe(9 * 60 * 60 * 1000);
  });
});
