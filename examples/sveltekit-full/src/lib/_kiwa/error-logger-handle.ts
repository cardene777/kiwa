// error-logger-handle.ts — handleError hook の PoC。
//
// SvelteKit `handleError` は server 上で投げられた error を logger に流すための
// hook。 戻り値は `{ message }` (client に露出する safe message) または void。
// この PoC では event.locals.user.id (admin の場合) を含む structured log を
// 出力し、 client には汎用 message のみ露出する。

import type { HandleErrorFunction } from '@kiwa-test/sveltekit';
import type { AuthLocals } from './auth-handle.js';

export interface ErrorLogEntry {
  readonly path: string;
  readonly status: number;
  readonly errorMessage: string;
  readonly userId: string | null;
}

const logs: ErrorLogEntry[] = [];

export function readErrorLogs(): readonly ErrorLogEntry[] {
  return logs;
}

export function clearErrorLogs(): void {
  logs.length = 0;
}

export const errorLoggerHandle: HandleErrorFunction<AuthLocals> = ({ error, event, status }) => {
  const user = event.locals.user;
  logs.push({
    path: event.url.pathname,
    status,
    errorMessage: error instanceof Error ? error.message : String(error),
    userId: user ? user.id : null,
  });
  return { message: 'Internal Server Error (see request id for support)' };
};
