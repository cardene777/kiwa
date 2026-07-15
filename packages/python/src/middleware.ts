import type { PythonAppEnv } from './env.js';

export interface MiddlewareCall {
  name: string;
  path: string;
  at: number;
}

/**
 * dispatch 経由で invoke された middleware の呼出履歴を返す。
 * middleware chain の順序 / 呼出回数 / 対象 path を assertion するための API。
 */
export function captureMiddlewareCall(env: PythonAppEnv): MiddlewareCall[] {
  return [...env.middlewareCalls];
}
