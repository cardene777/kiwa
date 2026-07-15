import type { PythonAppEnv } from './env.js';

export type PythonHeaders = Record<string, string>;

export interface PythonRequest {
  method: string;
  path: string;
  headers?: PythonHeaders;
  body?: string;
  query?: Record<string, string>;
}

export interface PythonResponse {
  status: number;
  headers: PythonHeaders;
  body: string;
}

/**
 * WSGI/ASGI request-response cycle を in-process で dispatch。 middleware chain を
 * 順次実行 → route handler にたどり着き response を返す。 route 未登録は 404。
 */
export async function dispatchRequest(env: PythonAppEnv, request: PythonRequest): Promise<PythonResponse> {
  const key = `${request.method.toUpperCase()} ${request.path}`;
  const handler = env.routes.get(key);

  const invoke = async (): Promise<PythonResponse> => {
    if (!handler) {
      return { status: 404, headers: { 'content-type': 'text/plain' }, body: 'Not Found' };
    }
    return handler(request);
  };

  if (env.middleware.length === 0) {
    return invoke();
  }

  let idx = 0;
  const runNext = async (): Promise<PythonResponse> => {
    if (idx >= env.middleware.length) return invoke();
    const entry = env.middleware[idx];
    if (!entry) return invoke();
    idx += 1;
    env.middlewareCalls.push({ name: entry.name, path: request.path, at: env.middlewareCalls.length });
    return entry.handler(request, runNext);
  };

  return runNext();
}
