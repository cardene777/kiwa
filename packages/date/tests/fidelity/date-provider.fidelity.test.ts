/**
 * fidelity test — createDateClient (kiwa mock) が reference impl (native Date + timestamp 演算)
 * と同じ挙動を示すことを検証。 5 case で addDays / diffDays / format / parse / tz の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createDateClient,
  formatDate,
  parseDate,
  timezoneConvert,
  parseDuration,
  expandRecurrence,
  createHolidayCalendar,
  retryWithBackoff,
} from '../../src/index.js';

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

  // v2.1 追加 5 case
  it('v2.1 parseDuration = ISO 8601 P1Y2M3DT4H5M6S', () => {
    const r = parseDuration('P1Y2M3DT4H5M6S');
    expect(r.ok).toBe(true);
    expect(r.components?.years).toBe(1);
    expect(r.components?.months).toBe(2);
    expect(r.components?.days).toBe(3);
    expect(r.components?.hours).toBe(4);
    expect(r.components?.minutes).toBe(5);
    expect(r.components?.seconds).toBe(6);
  });

  it('v2.1 parseDuration = 不正 format で ok=false', () => {
    const r = parseDuration('invalid');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('invalid ISO 8601 duration');
  });

  it('v2.1 expandRecurrence DAILY 5 count', () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const dates = expandRecurrence({ freq: 'DAILY', interval: 1, count: 5 }, start);
    expect(dates.length).toBe(5);
    expect(dates[0]!.getUTCDate()).toBe(1);
    expect(dates[4]!.getUTCDate()).toBe(5);
  });

  it('v2.1 holiday calendar isHoliday + nextHoliday', () => {
    const cal = createHolidayCalendar([
      { name: 'New Year', date: '2026-01-01', country: 'JP' },
      { name: 'Golden Week', date: '2026-05-03', country: 'JP' },
    ]);
    expect(cal.isHoliday(new Date(Date.UTC(2026, 0, 1)))).toBe(true);
    expect(cal.isHoliday(new Date(Date.UTC(2026, 0, 2)))).toBe(false);
    const next = cal.nextHoliday(new Date(Date.UTC(2026, 1, 1)));
    expect(next?.name).toBe('Golden Week');
  });

  it('v2.1 retryWithBackoff で 3 attempt 成功', async () => {
    let n = 0;
    const r = await retryWithBackoff(async () => {
      n += 1;
      if (n < 3) throw new Error('r');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(3);
  });
});
