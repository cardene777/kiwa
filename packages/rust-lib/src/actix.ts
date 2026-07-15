export type ActixHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;

export interface InvokeActixOptions<TReq = unknown> {
  handler: ActixHandler<TReq, unknown>;
  method: string;
  path: string;
  body?: TReq;
  extractors?: Record<string, unknown>;
}

export interface InvokeActixResult {
  status: number;
  body: unknown;
  method: string;
  path: string;
  extractors: Record<string, unknown>;
  durationMs: number;
  reason?: string;
}

/**
 * actix-web handler mock invoke。 real actix の `async fn handler(...) -> impl Responder` を
 * TypeScript 側で模倣、 extractor 群 (web::Path / web::Json / web::Data) を Record として保持。
 */
export async function invokeActixHandler<TReq = unknown>(
  options: InvokeActixOptions<TReq>,
): Promise<InvokeActixResult> {
  const start = performance.now();
  const req = options.body as TReq;
  try {
    const body = await options.handler(req);
    const durationMs = performance.now() - start;
    return {
      status: 200,
      body,
      method: options.method,
      path: options.path,
      extractors: options.extractors ?? {},
      durationMs,
    };
  } catch (e) {
    const durationMs = performance.now() - start;
    return {
      status: 500,
      body: null,
      method: options.method,
      path: options.path,
      extractors: options.extractors ?? {},
      durationMs,
      reason: (e as Error).message,
    };
  }
}
