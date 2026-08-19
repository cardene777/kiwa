import { afterEach, describe, expect, it, vi } from 'vitest';

import { isExpired, nextBackoffMs, normalizeTag } from '../../src/token.js';

// spec = tests/spec/unit/test-spec-token.md

describe('normalizeTag (mode: pure)', () => {
  it('T-UNIT-001 空白区切りを - に潰して小文字化する', () => {
    expect(normalizeTag('Hello World')).toBe('hello-world');
  });

  it('T-UNIT-002 連続する区切りを 1 つにまとめる', () => {
    expect(normalizeTag('a  --  b')).toBe('a-b');
  });

  it('T-UNIT-003 両端の区切りを落とす', () => {
    expect(normalizeTag('__abc__')).toBe('abc');
  });

  it('T-UNIT-004 英数字が 1 文字も無ければ空を返す', () => {
    expect(normalizeTag('！？')).toBe('');
  });

  it('T-UNIT-005 maxLength で切り詰める', () => {
    expect(normalizeTag('abcdefghij', { maxLength: 4 })).toBe('abcd');
  });

  it('T-UNIT-006 切り口が区切りになる時は落として返す', () => {
    // `ab cdef` は `ab-cdef` に正規化され、 3 文字で切ると `ab-` になる。
    // 末尾に区切りだけが残るのを避ける。
    expect(normalizeTag('ab cdef', { maxLength: 3 })).toBe('ab');
  });

  it('T-UNIT-007 maxLength=0 は空を返す', () => {
    expect(normalizeTag('abc', { maxLength: 0 })).toBe('');
  });
});

describe('isExpired (mode: fake-timer)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** 現在時刻を固定する。 実時刻のままだと境界の判定が実行タイミングで揺れる。 */
  function freezeAt(now: number): void {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  }

  it('T-UNIT-008 TTL 内は有効', () => {
    freezeAt(1400);
    expect(isExpired(1000, 500)).toBe(false);
  });

  it('T-UNIT-009 境界ちょうどは失効', () => {
    // 有効な間を半開区間 [issuedAt, issuedAt + ttlMs) に取るため、
    // 1000 + 500 = 1500 は失効側に入る。
    freezeAt(1500);
    expect(isExpired(1000, 500)).toBe(true);
  });

  it('T-UNIT-010 TTL 0 は発行直後から失効', () => {
    freezeAt(1000);
    expect(isExpired(1000, 0)).toBe(true);
  });

  it('T-UNIT-011 負の TTL は失効扱い', () => {
    freezeAt(1000);
    expect(isExpired(1000, -1)).toBe(true);
  });

  it('T-UNIT-012 有限でない入力は失効扱い', () => {
    freezeAt(1000);
    expect(isExpired(Number.NaN, 500)).toBe(true);
    expect(isExpired(1000, Number.POSITIVE_INFINITY)).toBe(true);
  });
});

describe('nextBackoffMs (mode: pure)', () => {
  it('T-UNIT-013 attempt ごとに倍々に伸びる', () => {
    expect(nextBackoffMs(0)).toBe(100);
    expect(nextBackoffMs(1)).toBe(200);
    expect(nextBackoffMs(2)).toBe(400);
  });

  it('T-UNIT-014 cap で頭打ちになる', () => {
    expect(nextBackoffMs(20)).toBe(10_000);
  });

  it('T-UNIT-015 負の attempt は 0 として扱う', () => {
    expect(nextBackoffMs(-3)).toBe(100);
  });
});
