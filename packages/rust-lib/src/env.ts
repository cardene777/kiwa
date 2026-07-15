export type RustFramework = 'axum' | 'actix-web' | 'tower-http' | 'rocket';

export interface RustRoute {
  method: string;
  path: string;
  handler: (req: unknown) => Promise<unknown> | unknown;
}

export interface RustResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export interface RustAppEnv {
  framework: RustFramework;
  routes: RustRoute[];
  addRoute: (route: RustRoute) => void;
  matchRoute: (method: string, path: string) => RustRoute | undefined;
  listRoutes: () => RustRoute[];
  clear: () => void;
}

export interface CreateRustAppEnvOptions {
  framework?: RustFramework;
  initialRoutes?: RustRoute[];
}

/**
 * framework 別 route registry を持つ mock env。 real axum / actix / tower / rocket の
 * router 相当を in-process で保持し、 method + path match で handler を dispatch する。
 */
export function createRustAppEnv(options: CreateRustAppEnvOptions = {}): RustAppEnv {
  const framework = options.framework ?? 'axum';
  const routes: RustRoute[] = [...(options.initialRoutes ?? [])];
  return {
    framework,
    get routes() {
      return routes;
    },
    addRoute(route: RustRoute) {
      routes.push(route);
    },
    matchRoute(method: string, path: string) {
      return routes.find((r) => r.method === method && r.path === path);
    },
    listRoutes() {
      return [...routes];
    },
    clear() {
      routes.length = 0;
    },
  };
}
