import type { GoRequest, GoResponse } from './env.js';

export interface FiberContext {
  request: GoRequest;
  Status: (code: number) => FiberContext;
  JSON: (body: unknown) => Error | null;
  SendString: (body: string) => Error | null;
  SendStatus: (code: number) => Error | null;
  Set: (key: string, value: string) => void;
  Params: (key: string) => string;
  Query: (key: string) => string;
  Body: () => unknown;
}

export type FiberHandler = (c: FiberContext) => Error | null | Promise<Error | null>;

export interface InvokeFiberHandlerOptions {
  handler: FiberHandler;
  req: GoRequest;
}

export interface InvokeFiberHandlerResult extends GoResponse {
  handlerError?: string;
}

/**
 * fiber.Ctx 相当を simulate。 Status chain + JSON/SendString/SendStatus + Set/Params/Query/Body を
 * fiber 慣例通り expose、 handler の Error return を結果に反映する。
 */
export async function invokeFiberHandler(options: InvokeFiberHandlerOptions): Promise<InvokeFiberHandlerResult> {
  const req = options.req;
  const respHeaders: Record<string, string> = {};
  let respStatus = 200;
  let respBody: unknown = undefined;
  const ctx: FiberContext = {
    request: req,
    Status(code: number) {
      respStatus = code;
      return ctx;
    },
    JSON(body: unknown) {
      respBody = body;
      respHeaders['content-type'] = 'application/json';
      return null;
    },
    SendString(body: string) {
      respBody = body;
      respHeaders['content-type'] = 'text/plain';
      return null;
    },
    SendStatus(code: number) {
      respStatus = code;
      respBody = undefined;
      return null;
    },
    Set(key: string, value: string) {
      respHeaders[key.toLowerCase()] = value;
    },
    Params(key: string) {
      return req.params?.[key] ?? '';
    },
    Query(key: string) {
      return req.query?.[key] ?? '';
    },
    Body() {
      return req.body;
    },
  };
  const err = await options.handler(ctx);
  const result: InvokeFiberHandlerResult = {
    status: respStatus,
    framework: 'fiber',
  };
  if (respBody !== undefined) result.body = respBody;
  if (Object.keys(respHeaders).length > 0) result.headers = respHeaders;
  if (err) result.handlerError = err.message;
  return result;
}
