import type { PythonRequest, PythonResponse } from './dispatch.js';

export type PythonFramework = 'django' | 'flask' | 'fastapi' | 'starlette';

export type PythonMode = 'wsgi' | 'asgi';

export interface MiddlewareEntry {
  name: string;
  handler: (req: PythonRequest, next: () => Promise<PythonResponse>) => Promise<PythonResponse>;
}

export interface PythonAppEnv {
  framework: PythonFramework;
  mode: PythonMode;
  routes: Map<string, (req: PythonRequest) => Promise<PythonResponse>>;
  middleware: MiddlewareEntry[];
  templates: Map<string, string>;
  middlewareCalls: Array<{ name: string; path: string; at: number }>;
  registerRoute: (method: string, path: string, handler: (req: PythonRequest) => Promise<PythonResponse>) => void;
  registerMiddleware: (entry: MiddlewareEntry) => void;
  registerTemplate: (name: string, tmpl: string) => void;
}

export interface CreatePythonAppEnvOptions {
  framework?: PythonFramework;
  mode?: PythonMode;
  now?: () => number;
}

/**
 * framework 別 mock env を返す。 real Django/Flask/FastAPI/Starlette の request
 * pipeline を再現する in-process env。 django/flask = WSGI default、
 * fastapi/starlette = ASGI default (option で override 可能)。
 */
export function createPythonAppEnv(options: CreatePythonAppEnvOptions = {}): PythonAppEnv {
  const framework = options.framework ?? 'flask';
  const mode = options.mode ?? (framework === 'fastapi' || framework === 'starlette' ? 'asgi' : 'wsgi');
  const now = options.now ?? (() => 0);

  const routes = new Map<string, (req: PythonRequest) => Promise<PythonResponse>>();
  const middleware: MiddlewareEntry[] = [];
  const templates = new Map<string, string>();
  const middlewareCalls: Array<{ name: string; path: string; at: number }> = [];

  return {
    framework,
    mode,
    routes,
    middleware,
    templates,
    middlewareCalls,
    registerRoute(method: string, path: string, handler) {
      routes.set(`${method.toUpperCase()} ${path}`, handler);
    },
    registerMiddleware(entry: MiddlewareEntry) {
      middleware.push(entry);
    },
    registerTemplate(name: string, tmpl: string) {
      templates.set(name, tmpl);
    },
    get _now() {
      return now;
    },
  } as PythonAppEnv & { _now: () => number };
}
