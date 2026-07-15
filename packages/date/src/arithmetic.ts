import type { DateProvider } from './client.js';

export interface ArithmeticResult {
  result: Date;
  days: number;
  provider: DateProvider;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `addDays(date, N, provider)` は date から N 日進めた Date を返す。
 * 全 provider で同一挙動 (UTC ベース、 DST 影響回避のため timestamp 演算)。
 */
export function addDays(date: Date, days: number, provider: DateProvider): ArithmeticResult {
  const result = new Date(date.getTime() + days * MS_PER_DAY);
  return { result, days, provider };
}

/**
 * `diffDays(a, b, provider)` は (a - b) の日数差を整数で返す。 fractional は切捨て。
 */
export function diffDays(a: Date, b: Date, provider: DateProvider): ArithmeticResult {
  const diff = Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
  return { result: a, days: diff, provider };
}
