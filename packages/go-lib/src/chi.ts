import type { GoRequest, GoResponse, GoMiddlewareTraceEntry } from './env.js';

export type ChiHandler = (req: GoRequest) => { status: number; body?: unknown; headers?: Record<string, string> } | Promise<{ status: number; body?: unknown; headers?: Record<string, string> }>;
export type ChiMiddleware = (name: string, next: () => void | Promise<void>) => void | Promise<void>;

export interface ChiApp {
  routes: Map<string, { method: string; pattern: string; handler: ChiHandler }>;
  middlewares: Array<{ name: string; fn: ChiMiddleware }>;
  addRoute: (method: string, pattern: string, handler: ChiHandler) => void;
  use: (name: string, fn: ChiMiddleware) => void;
  match: (method: string, path: string) => { pattern: string; handler: ChiHandler; params: Record<string, string> } | null;
}

export interface CaptureChiRouteOptions {
  app: ChiApp;
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface CaptureChiRouteResult extends GoResponse {
  matched: boolean;
  middlewareTrace: GoMiddlewareTraceEntry[];
  matchedPattern?: string;
}

/**
 * chi router 相当。 pattern (`/users/{id}` 等) matching + middleware chain trace + handler dispatch を
 * capture、 unmatched は 404 で返す。 chi の実 http.HandlerFunc signature を JS に落とし込んだ shape。
 */
export function createChiApp(): ChiApp {
  const routes = new Map<string, { method: string; pattern: string; handler: ChiHandler }>();
  const middlewares: Array<{ name: string; fn: ChiMiddleware }> = [];
  return {
    routes,
    middlewares,
    addRoute(method, pattern, handler) {
      routes.set(`${method.toUpperCase()} ${pattern}`, { method: method.toUpperCase(), pattern, handler });
    },
    use(name, fn) {
      middlewares.push({ name, fn });
    },
    match(method, path) {
      for (const { pattern, handler } of routes.values()) {
        const params = matchPattern(pattern, path);
        if (params !== null && routes.get(`${method.toUpperCase()} ${pattern}`)) return { pattern, handler, params };
      }
      return null;
    },
  };
}

function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const pat = patternParts[i]!;
    const val = pathParts[i]!;
    if (pat.startsWith('{') && pat.endsWith('}')) {
      params[pat.slice(1, -1)] = val;
    } else if (pat !== val) {
      return null;
    }
  }
  return params;
}

export async function captureChiRoute(options: CaptureChiRouteOptions): Promise<CaptureChiRouteResult> {
  const app = options.app;
  const matched = app.match(options.method, options.path);
  const middlewareTrace: GoMiddlewareTraceEntry[] = [];
  const startBase = 0;
  if (!matched) {
    return {
      status: 404,
      framework: 'chi',
      matched: false,
      middlewareTrace,
    };
  }
  const req: GoRequest = {
    method: options.method,
    path: options.path,
    params: matched.params,
  };
  if (options.body !== undefined) req.body = options.body;
  if (options.headers) req.headers = options.headers;
  if (options.query) req.query = options.query;

  let idx = 0;
  const runNext = async (): Promise<void> => {
    if (idx >= app.middlewares.length) return;
    const { name, fn } = app.middlewares[idx++]!;
    middlewareTrace.push({ name, order: middlewareTrace.length + 1, ranAt: startBase + middlewareTrace.length });
    await fn(name, runNext);
  };
  await runNext();
  const resp = await matched.handler(req);
  const result: CaptureChiRouteResult = {
    status: resp.status,
    framework: 'chi',
    matched: true,
    middlewareTrace,
    matchedPattern: matched.pattern,
  };
  if (resp.body !== undefined) result.body = resp.body;
  if (resp.headers) result.headers = resp.headers;
  return result;
}
