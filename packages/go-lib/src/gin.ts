import type { GoRequest, GoResponse } from './env.js';

export interface GinContext {
  request: GoRequest;
  status: (code: number) => GinContext;
  JSON: (code: number, body: unknown) => void;
  String: (code: number, body: string) => void;
  Header: (key: string, value: string) => void;
  Param: (key: string) => string | undefined;
  Query: (key: string) => string | undefined;
  aborted: boolean;
  abort: () => void;
}

export type GinHandler = (c: GinContext) => void | Promise<void>;

export interface InvokeGinHandlerOptions {
  handler: GinHandler;
  req: GoRequest;
}

export interface InvokeGinHandlerResult extends GoResponse {
  aborted: boolean;
}

/**
 * gin.Context 相当を simulate。 JSON/String/Header/Param/Query の 5 primitive を capture し、
 * c.AbortWithStatus 相当の abort も expose。 gin の実 handler がそのまま渡せる signature。
 */
export async function invokeGinHandler(options: InvokeGinHandlerOptions): Promise<InvokeGinHandlerResult> {
  const req = options.req;
  const respHeaders: Record<string, string> = {};
  let respStatus = 200;
  let respBody: unknown = undefined;
  let aborted = false;
  const ctx: GinContext = {
    request: req,
    status(code: number) {
      respStatus = code;
      return ctx;
    },
    JSON(code: number, body: unknown) {
      respStatus = code;
      respBody = body;
      respHeaders['content-type'] = 'application/json';
    },
    String(code: number, body: string) {
      respStatus = code;
      respBody = body;
      respHeaders['content-type'] = 'text/plain';
    },
    Header(key: string, value: string) {
      respHeaders[key.toLowerCase()] = value;
    },
    Param(key: string) {
      return req.params?.[key];
    },
    Query(key: string) {
      return req.query?.[key];
    },
    aborted: false,
    abort() {
      aborted = true;
      ctx.aborted = true;
    },
  };
  await options.handler(ctx);
  const result: InvokeGinHandlerResult = {
    status: respStatus,
    framework: 'gin',
    aborted,
  };
  if (respBody !== undefined) result.body = respBody;
  if (Object.keys(respHeaders).length > 0) result.headers = respHeaders;
  return result;
}
