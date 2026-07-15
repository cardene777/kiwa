import type { ActiveRecordQuery } from './active-record.js';

export type RubyFramework = 'rails' | 'sinatra' | 'roda' | 'hanami';

export interface RubyRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
  session?: Record<string, unknown>;
}

export interface RubyResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  session: Record<string, unknown>;
}

export type RubyRouteHandler = (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;

export interface RubyRoute {
  method: RubyRequest['method'];
  path: string;
  handler: RubyRouteHandler;
}

export interface CreateRubyAppEnvOptions {
  framework?: RubyFramework;
  routes?: RubyRoute[];
  initialSession?: Record<string, unknown>;
  initialCookies?: Record<string, string>;
}

export interface RubyAppEnv {
  framework: RubyFramework;
  routes: RubyRoute[];
  session: Record<string, unknown>;
  cookies: Record<string, string>;
  activeRecordLog: ActiveRecordQuery[];
  addRoute: (route: RubyRoute) => void;
  matchRoute: (method: RubyRequest['method'], path: string) => RubyRoute | undefined;
  recordAR: (query: ActiveRecordQuery) => void;
  clear: () => void;
}

/**
 * Framework 別の request 転送先を返す minimal mock。 Rails は Sinatra 系より complex な
 * before_action chain を持つが、 統一 shape に落とせる範囲は同一 interface で扱う。
 */
export function createRubyAppEnv(options: CreateRubyAppEnvOptions = {}): RubyAppEnv {
  const framework = options.framework ?? 'rails';
  const routes: RubyRoute[] = [...(options.routes ?? [])];
  const session: Record<string, unknown> = { ...(options.initialSession ?? {}) };
  const cookies: Record<string, string> = { ...(options.initialCookies ?? {}) };
  const activeRecordLog: ActiveRecordQuery[] = [];

  return {
    framework,
    routes,
    session,
    cookies,
    activeRecordLog,
    addRoute(route) {
      routes.push(route);
    },
    matchRoute(method, path) {
      return routes.find((r) => r.method === method && matchPath(r.path, path));
    },
    recordAR(query) {
      activeRecordLog.push(query);
    },
    clear() {
      routes.length = 0;
      activeRecordLog.length = 0;
      for (const k of Object.keys(session)) delete session[k];
      for (const k of Object.keys(cookies)) delete cookies[k];
    },
  };
}

function matchPath(pattern: string, actual: string): boolean {
  if (pattern === actual) return true;
  // `/users/:id` → `/users/<num>` support
  const patternParts = pattern.split('/');
  const actualParts = actual.split('/');
  if (patternParts.length !== actualParts.length) return false;
  return patternParts.every((p, i) => p.startsWith(':') || p === actualParts[i]);
}
