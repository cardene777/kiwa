import { addDays, diffDays } from './arithmetic.js';
import { formatDate, parseDate } from './format.js';
import { timezoneConvert } from './timezone.js';

export type DateProvider = 'date-fns' | 'dayjs' | 'luxon' | 'temporal';

export interface CreateDateClientOptions {
  provider?: DateProvider;
  defaultTimezone?: string;
}

export interface DateClient {
  provider: DateProvider;
  addDays: (date: Date, days: number) => Date;
  diffDays: (a: Date, b: Date) => number;
  format: (date: Date, pattern: string) => string;
  parse: (str: string, pattern: string) => Date;
  toTimezone: (date: Date, tz: string) => Date;
}

/**
 * 4 provider (date-fns / dayjs / Luxon / Temporal) を統一 interface で叩ける mock client。
 * 実 provider (real deps) を差替えても同じ signature で呼べる想定。
 */
export function createDateClient(options: CreateDateClientOptions = {}): DateClient {
  const provider = options.provider ?? 'date-fns';
  const defaultTz = options.defaultTimezone;
  return {
    provider,
    addDays(date: Date, days: number): Date {
      return addDays(date, days, provider).result;
    },
    diffDays(a: Date, b: Date): number {
      return diffDays(a, b, provider).days;
    },
    format(date: Date, pattern: string): string {
      return formatDate(date, pattern, provider).formatted;
    },
    parse(str: string, pattern: string): Date {
      return parseDate(str, pattern, provider).date;
    },
    toTimezone(date: Date, tz: string): Date {
      const targetTz = tz || defaultTz || 'UTC';
      return timezoneConvert(date, targetTz, provider).date;
    },
  };
}
