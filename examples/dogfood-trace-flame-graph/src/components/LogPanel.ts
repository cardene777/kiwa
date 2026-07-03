import type { LogJoinEntry, LogLevel } from '../adapters/interface.js';

/**
 * LogPanel — pure logic model of a React `<LogPanel />` component. The
 * panel shows every log line joined to its parent span with a level
 * badge, a truncated message column, and a jump-to-span button. Tests
 * assert row order + filter behaviour without touching a DOM.
 */

export interface LogPanelRow {
  timestamp: number;
  level: LogLevel;
  message: string;
  spanName: string | null;
  spanId: string | null;
  correlated: boolean;
}

/**
 * Convert LogJoinEntry rows to LogPanelRow rows sorted by timestamp
 * ascending. `correlated` marks lines that carried at least one of
 * (spanId, traceId) — the panel would render uncorrelated rows in a
 * muted colour.
 */
export function buildLogPanelRows(entries: LogJoinEntry[]): LogPanelRow[] {
  return [...entries]
    .sort((a, b) => a.log.timestamp - b.log.timestamp)
    .map((e) => ({
      timestamp: e.log.timestamp,
      level: e.log.level,
      message: e.log.message,
      spanName: e.spanName,
      spanId: e.spanId,
      correlated: Boolean(e.spanId || e.traceId),
    }));
}

/**
 * Filter LogPanel rows by level threshold. `min='warn'` keeps warn +
 * error + fatal; `min='info'` keeps info + warn + error + fatal.
 */
export function filterByLevel(rows: LogPanelRow[], min: LogLevel): LogPanelRow[] {
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
  const threshold = order.indexOf(min);
  return rows.filter((r) => order.indexOf(r.level) >= threshold);
}

/**
 * Filter LogPanel rows to those joined to a specific span. The
 * component would use this when the user clicks a flame node to
 * scope the log tail to that node's logs.
 */
export function filterBySpan(rows: LogPanelRow[], spanId: string): LogPanelRow[] {
  return rows.filter((r) => r.spanId === spanId);
}
