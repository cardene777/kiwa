/**
 * integration test — date domain の end-to-end workflow (client 作成 → 計算 → 書式化 →
 * 別 provider で parse → tz 変換) を 5 case で cover。
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

describe('date integration — arithmetic + format + tz workflow', () => {
  it('T-INT-D-001 addDays → formatDate → parseDate の round-trip', () => {
    const base = new Date(Date.UTC(2026, 2, 15));
    const shifted = addDays(base, 10, 'date-fns').result;
    const formatted = formatDate(shifted, 'YYYY-MM-DD', 'date-fns').formatted;
    const parsed = parseDate(formatted, 'YYYY-MM-DD', 'date-fns').date;
    expect(diffDays(parsed, base, 'date-fns').days).toBe(10);
  });

  it('T-INT-D-002 4 provider 全てで同じ日数計算結果を返す (fidelity 保証)', () => {
    const a = new Date(Date.UTC(2026, 0, 20));
    const b = new Date(Date.UTC(2026, 0, 5));
    for (const provider of ['date-fns', 'dayjs', 'luxon', 'temporal'] as const) {
      expect(diffDays(a, b, provider).days).toBe(15);
    }
  });

  it('T-INT-D-003 createDateClient 経由で tz 変換 chain が動作', () => {
    const client = createDateClient({ provider: 'luxon' });
    const utc = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const jp = client.toTimezone(utc, 'Asia/Tokyo');
    expect(jp.getTime() - utc.getTime()).toBe(9 * 60 * 60 * 1000);
    // 逆方向 = LA (UTC-8)
    const la = client.toTimezone(utc, 'America/Los_Angeles');
    expect(la.getTime() - utc.getTime()).toBe(-8 * 60 * 60 * 1000);
  });

  it('T-INT-D-004 defaultTimezone option が toTimezone に効く', () => {
    const client = createDateClient({ provider: 'temporal', defaultTimezone: 'Asia/Tokyo' });
    const utc = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    // 空文字を渡すと defaultTimezone が採用される
    const result = client.toTimezone(utc, '');
    expect(result.getTime() - utc.getTime()).toBe(9 * 60 * 60 * 1000);
  });

  it('T-INT-D-005 parseDate が invalid input で throw する', () => {
    expect(() => parseDate('completely-not-a-date-string!!!', 'YYYY-MM-DD', 'dayjs')).toThrow(/invalid input/);
    // 未知 tz は throw せず 0 offset にfallback
    const r = timezoneConvert(new Date(0), 'Unknown/Zone', 'date-fns');
    expect(r.offsetMinutes).toBe(0);
  });
});
