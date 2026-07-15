export type GoFramework = 'gin' | 'echo' | 'fiber' | 'chi';

export interface GoRequest {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface GoResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  framework: GoFramework;
}

export interface GoRouteDefinition {
  method: string;
  path: string;
  handlerName: string;
}

export interface GoMiddlewareTraceEntry {
  name: string;
  order: number;
  ranAt: number;
}

export interface GoAppEnv {
  framework: GoFramework;
  routes: GoRouteDefinition[];
  addRoute: (route: GoRouteDefinition) => void;
  listRoutes: () => GoRouteDefinition[];
  reset: () => void;
}

export interface CreateGoAppEnvOptions {
  framework: GoFramework;
  initialRoutes?: GoRouteDefinition[];
}

/**
 * gin/echo/fiber/chi の mock env を生成。 route 一覧の宣言 + reset で 4 framework 共通で
 * router state を扱えるようにする。
 */
export function createGoAppEnv(options: CreateGoAppEnvOptions): GoAppEnv {
  const framework = options.framework;
  const routes: GoRouteDefinition[] = options.initialRoutes ? [...options.initialRoutes] : [];
  return {
    framework,
    routes,
    addRoute(route: GoRouteDefinition) {
      routes.push(route);
    },
    listRoutes() {
      return [...routes];
    },
    reset() {
      routes.length = 0;
    },
  };
}
