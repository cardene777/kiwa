import type { ProcedureContext } from './context.js';
import type { ProcedureDefinition } from './procedure.js';
import {
  TRPCError,
  type Middleware,
  type MiddlewareParams,
  type MiddlewareResult,
} from './middleware.js';

export interface Router {
  procedures: Record<string, ProcedureDefinition>;
  globalMiddlewares: Middleware[];
}

export interface CreateRouterOptions {
  procedures: Record<string, ProcedureDefinition>;
  middlewares?: Middleware[];
}

/**
 * tRPC v10 の router() 相当。 path (dot-notation もフラット key もサポート) と procedure の
 * map を保持する。 globalMiddlewares は全 procedure 呼出前に走らせる。
 */
export function createRouter(options: CreateRouterOptions): Router {
  return {
    procedures: { ...options.procedures },
    globalMiddlewares: options.middlewares ?? [],
  };
}

/**
 * router に対して procedure を実行。 middleware chain (global → per-procedure) を順に走らせ、
 * 全 middleware 通過後に handler を呼び出す。 途中 throw で TRPCError を包んで返す。
 */
export async function invokeProcedure(
  router: Router,
  path: string,
  input: unknown,
  ctx: ProcedureContext = {},
): Promise<unknown> {
  const proc = router.procedures[path];
  if (!proc) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `procedure not found: ${path}` });
  }

  const chain: Middleware[] = [...router.globalMiddlewares, ...proc.middlewares];

  let currentCtx = ctx;
  let index = 0;

  const runNext = async (params?: { ctx?: ProcedureContext }): Promise<MiddlewareResult> => {
    if (params?.ctx !== undefined) currentCtx = params.ctx;
    const next = chain[index];
    index += 1;
    if (next === undefined) {
      const data = await proc.handler({ input, ctx: currentCtx });
      return { ok: true, data };
    }
    const p: MiddlewareParams = { ctx: currentCtx, input, path, next: runNext };
    return next(p);
  };

  const result = await runNext();
  if (!result.ok || result.error) {
    throw result.error ?? new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }
  return result.data;
}
