import type { ProcedureContext } from './context.js';

export interface MiddlewareParams {
  ctx: ProcedureContext;
  input: unknown;
  path: string;
  next: (params?: { ctx?: ProcedureContext }) => Promise<MiddlewareResult>;
}

export interface MiddlewareResult {
  ok: boolean;
  data?: unknown;
  error?: TRPCError;
}

export type Middleware = (params: MiddlewareParams) => Promise<MiddlewareResult>;

export type TRPCErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export class TRPCError extends Error {
  code: TRPCErrorCode;
  constructor(params: { code: TRPCErrorCode; message?: string }) {
    super(params.message ?? params.code);
    this.name = 'TRPCError';
    this.code = params.code;
  }
}

/**
 * middleware wrapper。 実 tRPC の t.middleware(async ({ ctx, next }) => ...) と同じ形。 内部で
 * next() を呼ぶことで chain 継続、 呼ばずに throw で早期 abort を表現する。
 */
export function middleware(fn: Middleware): Middleware {
  return fn;
}
