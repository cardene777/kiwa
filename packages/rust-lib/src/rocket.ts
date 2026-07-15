export type RocketRoute<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;

export interface InvokeRocketOptions<TReq = unknown> {
  route: RocketRoute<TReq, unknown>;
  method: string;
  path: string;
  body?: TReq;
  guards?: string[];
}

export interface InvokeRocketResult {
  status: number;
  body: unknown;
  method: string;
  path: string;
  guardsPassed: string[];
  durationMs: number;
  reason?: string;
}

/**
 * rocket route mock invoke。 real rocket の `#[get("/x")] fn route(...) -> impl Responder` を
 * TypeScript 側で模倣、 request guard 群を name 配列で保持して guard 通過を record。
 */
export async function invokeRocketRoute<TReq = unknown>(
  options: InvokeRocketOptions<TReq>,
): Promise<InvokeRocketResult> {
  const start = performance.now();
  const guards = options.guards ?? [];
  const req = options.body as TReq;
  try {
    const body = await options.route(req);
    const durationMs = performance.now() - start;
    return {
      status: 200,
      body,
      method: options.method,
      path: options.path,
      guardsPassed: [...guards],
      durationMs,
    };
  } catch (e) {
    const durationMs = performance.now() - start;
    return {
      status: 500,
      body: null,
      method: options.method,
      path: options.path,
      guardsPassed: [...guards],
      durationMs,
      reason: (e as Error).message,
    };
  }
}
