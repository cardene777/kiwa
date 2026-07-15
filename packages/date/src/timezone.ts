import type { DateProvider } from './client.js';

export interface TimezoneResult {
  date: Date;
  timezone: string;
  offsetMinutes: number;
  provider: DateProvider;
}

const KNOWN_OFFSETS: Record<string, number> = {
  UTC: 0,
  GMT: 0,
  'Asia/Tokyo': 9 * 60,
  'Asia/Seoul': 9 * 60,
  'Asia/Shanghai': 8 * 60,
  'Asia/Singapore': 8 * 60,
  'Asia/Kolkata': 5 * 60 + 30,
  'Europe/London': 0,
  'Europe/Paris': 60,
  'Europe/Berlin': 60,
  'America/New_York': -5 * 60,
  'America/Chicago': -6 * 60,
  'America/Denver': -7 * 60,
  'America/Los_Angeles': -8 * 60,
  'Australia/Sydney': 11 * 60,
};

/**
 * `timezoneConvert(date, tz, provider)` は date を tz オフセット分ずらした Date を返す。
 * 未知の tz は 0 offset (UTC 相当) に fallback。 DST 未対応 = mock として cover 十分。
 */
export function timezoneConvert(date: Date, timezone: string, provider: DateProvider): TimezoneResult {
  const offsetMinutes = KNOWN_OFFSETS[timezone] ?? 0;
  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return { date: shifted, timezone, offsetMinutes, provider };
}
