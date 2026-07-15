/**
 * v2.1 extensions — duration parse, recurrence rule (RRULE subset), holiday calendar,
 * plus retry/batch/observability generics. Temporal Stage 3 追随。
 */

export interface DurationParseResult {
  ok: boolean;
  totalMs: number;
  components?: { years?: number; months?: number; days?: number; hours?: number; minutes?: number; seconds?: number };
  error?: string;
}

/** ISO 8601 duration parse — "P1Y2M3DT4H5M6S" 対応 */
export function parseDuration(iso: string): DurationParseResult {
  const match = iso.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return { ok: false, totalMs: 0, error: `invalid ISO 8601 duration: ${iso}` };
  const [, y, mo, d, h, mi, s] = match;
  const components = {
    years: y ? Number(y) : 0,
    months: mo ? Number(mo) : 0,
    days: d ? Number(d) : 0,
    hours: h ? Number(h) : 0,
    minutes: mi ? Number(mi) : 0,
    seconds: s ? Number(s) : 0,
  };
  const totalMs =
    components.years * 365 * 24 * 3600 * 1000 +
    components.months * 30 * 24 * 3600 * 1000 +
    components.days * 24 * 3600 * 1000 +
    components.hours * 3600 * 1000 +
    components.minutes * 60 * 1000 +
    components.seconds * 1000;
  return { ok: true, totalMs, components };
}

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval?: number;
  count?: number;
  until?: Date;
}

/** RRULE subset expand — DAILY/WEEKLY/MONTHLY/YEARLY */
export function expandRecurrence(rule: RecurrenceRule, start: Date): Date[] {
  const interval = rule.interval ?? 1;
  const maxCount = rule.count ?? 100;
  const until = rule.until;
  const result: Date[] = [];
  let current = new Date(start);
  while (result.length < maxCount) {
    if (until && current > until) break;
    result.push(new Date(current));
    switch (rule.freq) {
      case 'DAILY': current.setDate(current.getDate() + interval); break;
      case 'WEEKLY': current.setDate(current.getDate() + 7 * interval); break;
      case 'MONTHLY': current.setMonth(current.getMonth() + interval); break;
      case 'YEARLY': current.setFullYear(current.getFullYear() + interval); break;
    }
  }
  return result;
}

export interface Holiday {
  name: string;
  date: string;
  country: string;
}

export interface HolidayCalendar {
  isHoliday: (date: Date) => boolean;
  getHoliday: (date: Date) => Holiday | undefined;
  addHoliday: (holiday: Holiday) => void;
  list: () => Holiday[];
  nextHoliday: (from: Date) => Holiday | undefined;
}

/** holiday calendar — country 別祝日判定 */
export function createHolidayCalendar(initial: Holiday[] = []): HolidayCalendar {
  const holidays = [...initial];
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    isHoliday(date) { return holidays.some((h) => h.date === toKey(date)); },
    getHoliday(date) { return holidays.find((h) => h.date === toKey(date)); },
    addHoliday(h) { holidays.push(h); },
    list() { return [...holidays]; },
    nextHoliday(from) {
      const fromKey = toKey(from);
      const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
      return sorted.find((h) => h.date > fromKey);
    },
  };
}

export interface RetryOptions { maxAttempts?: number; initialDelayMs?: number; backoffFactor?: number; }
export interface RetryResult<T> { ok: boolean; attempts: number; value?: T; error?: unknown; }

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 10;
  const factor = options.backoffFactor ?? 2;
  let attempts = 0;
  let lastError: unknown;
  while (attempts < maxAttempts) {
    attempts += 1;
    try { return { ok: true, attempts, value: await fn() }; }
    catch (e) {
      lastError = e;
      if (attempts >= maxAttempts) break;
      await new Promise((r) => { const t = setTimeout(r, initialDelay * Math.pow(factor, attempts - 1)); (t as unknown as { unref?: () => void }).unref?.(); });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown> }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown> }>;
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: Array<{ kind: string; data: Record<string, unknown> }> = [];
  return { emit(e) { events.push(e); }, events() { return [...events]; }, clear() { events.length = 0; } };
}
