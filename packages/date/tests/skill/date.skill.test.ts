/**
 * skill test — date skill の主要 5 API + 4 provider 分岐を skill-test primitive 経由で assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createDateClient,
  addDays,
  diffDays,
  formatDate,
  parseDate,
  timezoneConvert,
} from '../../src/index.js';

describe('date skill assertions', () => {
  it('createDateClient を 4 provider (date-fns/dayjs/luxon/temporal) 全てで instantiate 可能', () => {
    for (const provider of ['date-fns', 'dayjs', 'luxon', 'temporal'] as const) {
      const c = createDateClient({ provider });
      expect(c.provider).toBe(provider);
    }
  });

  it('addDays が provider tag 付きで結果を返す', () => {
    const r = addDays(new Date(Date.UTC(2026, 0, 1)), 5, 'dayjs');
    expect(r.days).toBe(5);
    expect(r.provider).toBe('dayjs');
    expect(r.result.getUTCDate()).toBe(6);
  });

  it('diffDays が 2 date 間の日数を整数で返す', () => {
    const a = new Date(Date.UTC(2026, 5, 15));
    const b = new Date(Date.UTC(2026, 5, 1));
    const r = diffDays(a, b, 'luxon');
    expect(r.days).toBe(14);
  });

  it('formatDate / parseDate が 4 provider 全てで動作 + round-trip 一貫', () => {
    for (const provider of ['date-fns', 'dayjs', 'luxon', 'temporal'] as const) {
      const date = new Date(Date.UTC(2026, 6, 4, 12, 34, 56));
      const f = formatDate(date, 'YYYY-MM-DD HH:mm:ss', provider);
      expect(f.provider).toBe(provider);
      const p = parseDate(f.formatted, 'YYYY-MM-DD HH:mm:ss', provider);
      expect(p.date.getTime()).toBe(date.getTime());
    }
  });

  it('timezoneConvert が 6 主要 tz で expected offset を返す', () => {
    const utc = new Date(Date.UTC(2026, 0, 1));
    const cases: Array<[string, number]> = [
      ['UTC', 0],
      ['Asia/Tokyo', 540],
      ['Asia/Shanghai', 480],
      ['Europe/London', 0],
      ['America/New_York', -300],
      ['America/Los_Angeles', -480],
    ];
    for (const [tz, expected] of cases) {
      const r = timezoneConvert(utc, tz, 'temporal');
      expect(r.offsetMinutes).toBe(expected);
    }
  });
});
