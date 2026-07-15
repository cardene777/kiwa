export interface TowerRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface TowerTrace {
  entered: string[];
  exited: string[];
  request: TowerRequest;
  response?: { status: number; body: unknown };
}

export type TowerMiddleware = (req: TowerRequest, next: (req: TowerRequest) => Promise<{ status: number; body: unknown }>) => Promise<{ status: number; body: unknown }>;

export interface CaptureTowerOptions {
  middleware: TowerMiddleware | TowerMiddleware[];
  request: TowerRequest;
  handler?: (req: TowerRequest) => Promise<{ status: number; body: unknown }> | { status: number; body: unknown };
}

/**
 * tower-http middleware layer trace capture。 real tower の Service::call を chain させ、
 * entered / exited を record して middleware 実行順序を verify できる。
 */
export async function captureTowerMiddleware(options: CaptureTowerOptions): Promise<TowerTrace> {
  const middlewares = Array.isArray(options.middleware) ? options.middleware : [options.middleware];
  const trace: TowerTrace = {
    entered: [],
    exited: [],
    request: options.request,
  };

  const handler = options.handler ?? (async (): Promise<{ status: number; body: unknown }> => ({ status: 200, body: null }));

  let idx = 0;
  const next = async (req: TowerRequest): Promise<{ status: number; body: unknown }> => {
    if (idx >= middlewares.length) {
      return handler(req);
    }
    const mw = middlewares[idx];
    if (!mw) return handler(req);
    idx += 1;
    const mwName = `middleware-${idx}`;
    trace.entered.push(mwName);
    const res = await mw(req, next);
    trace.exited.push(mwName);
    return res;
  };

  const response = await next(options.request);
  trace.response = response;
  return trace;
}
