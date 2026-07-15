import type { DateProvider } from './client.js';

export interface FormatResult {
  formatted: string;
  pattern: string;
  provider: DateProvider;
}

export interface ParseResult {
  date: Date;
  pattern: string;
  provider: DateProvider;
}

/**
 * pattern token = `YYYY / MM / DD / HH / mm / ss` を UTC ベースで置換。
 * 全 provider (date-fns/dayjs/Luxon/Temporal) が最低限 support する共通 subset。
 */
export function formatDate(date: Date, pattern: string, provider: DateProvider): FormatResult {
  const pad = (n: number, w = 2): string => String(n).padStart(w, '0');
  const YYYY = String(date.getUTCFullYear());
  const MM = pad(date.getUTCMonth() + 1);
  const DD = pad(date.getUTCDate());
  const HH = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  const formatted = pattern
    .replace(/YYYY/g, YYYY)
    .replace(/MM/g, MM)
    .replace(/DD/g, DD)
    .replace(/HH/g, HH)
    .replace(/mm/g, mm)
    .replace(/ss/g, ss);
  return { formatted, pattern, provider };
}

/**
 * pattern に沿って date string を parse。 未対応 pattern は Date コンストラクタに fallback。
 */
export function parseDate(str: string, pattern: string, provider: DateProvider): ParseResult {
  const isoIshMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(str);
  if (pattern.startsWith('YYYY-MM-DD') && isoIshMatch) {
    const [, y, m, d, h, mi, s] = isoIshMatch;
    const date = new Date(
      Date.UTC(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(h ?? 0),
        Number(mi ?? 0),
        Number(s ?? 0),
      ),
    );
    if (Number.isNaN(date.getTime())) throw new Error(`parseDate: invalid input "${str}"`);
    return { date, pattern, provider };
  }
  const fallback = new Date(str);
  if (Number.isNaN(fallback.getTime())) throw new Error(`parseDate: invalid input "${str}"`);
  return { date: fallback, pattern, provider };
}
