import type { GoRequest, GoResponse } from './env.js';

export interface EchoContext {
  request: GoRequest;
  JSON: (code: number, body: unknown) => Error | null;
  String: (code: number, body: string) => Error | null;
  NoContent: (code: number) => Error | null;
  Response: () => { status: number; header: Record<string, string> };
  Param: (key: string) => string;
  QueryParam: (key: string) => string;
}

export type EchoHandler = (c: EchoContext) => Error | null | Promise<Error | null>;

export interface InvokeEchoHandlerOptions {
  handler: EchoHandler;
  req: GoRequest;
}

export interface InvokeEchoHandlerResult extends GoResponse {
  handlerError?: string;
}

/**
 * echo.Context 相当を simulate。 JSON/String/NoContent/Response/Param/QueryParam を capture、
 * echo 慣例通り Error return を尊重 (nil = 成功 / err = handler error) して結果に含める。
 */
export async function invokeEchoHandler(options: InvokeEchoHandlerOptions): Promise<InvokeEchoHandlerResult> {
  const req = options.req;
  const respHeaders: Record<string, string> = {};
  let respStatus = 200;
  let respBody: unknown = undefined;
  const ctx: EchoContext = {
    request: req,
    JSON(code: number, body: unknown) {
      respStatus = code;
      respBody = body;
      respHeaders['content-type'] = 'application/json';
      return null;
    },
    String(code: number, body: string) {
      respStatus = code;
      respBody = body;
      respHeaders['content-type'] = 'text/plain';
      return null;
    },
    NoContent(code: number) {
      respStatus = code;
      respBody = undefined;
      return null;
    },
    Response() {
      return { status: respStatus, header: respHeaders };
    },
    Param(key: string) {
      return req.params?.[key] ?? '';
    },
    QueryParam(key: string) {
      return req.query?.[key] ?? '';
    },
  };
  const err = await options.handler(ctx);
  const result: InvokeEchoHandlerResult = {
    status: respStatus,
    framework: 'echo',
  };
  if (respBody !== undefined) result.body = respBody;
  if (Object.keys(respHeaders).length > 0) result.headers = respHeaders;
  if (err) result.handlerError = err.message;
  return result;
}
