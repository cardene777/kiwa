export type AxumHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;

export interface InvokeAxumOptions<TReq = unknown> {
  handler: AxumHandler<TReq, unknown>;
  method: string;
  path: string;
  body?: TReq;
  headers?: Record<string, string>;
}

export interface InvokeAxumResult {
  status: number;
  body: unknown;
  method: string;
  path: string;
  headers: Record<string, string>;
  durationMs: number;
  reason?: string;
}

/**
 * axum handler mock invoke。 real axum の `async fn handler(...) -> impl IntoResponse` を
 * TypeScript 側で模倣、 body / headers / method / path を snapshot して結果を wrap。
 */
export async function invokeAxumHandler<TReq = unknown>(
  options: InvokeAxumOptions<TReq>,
): Promise<InvokeAxumResult> {
  const start = performance.now();
  const req = options.body as TReq;
  try {
    const body = await options.handler(req);
    const durationMs = performance.now() - start;
    const result: InvokeAxumResult = {
      status: 200,
      body,
      method: options.method,
      path: options.path,
      headers: options.headers ?? {},
      durationMs,
    };
    return result;
  } catch (e) {
    const durationMs = performance.now() - start;
    return {
      status: 500,
      body: null,
      method: options.method,
      path: options.path,
      headers: options.headers ?? {},
      durationMs,
      reason: (e as Error).message,
    };
  }
}
