import { invokeProcedure, type Router } from './router.js';
import type { ProcedureContext } from './context.js';

export interface TypedClient {
  [path: string]: {
    query: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
    mutate: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
    subscribe: (input?: unknown, ctx?: ProcedureContext) => Promise<unknown>;
  };
}

/**
 * tRPC の createTRPCProxyClient 相当。 client.<path>.query(input) / .mutate(input) を呼ぶと
 * 内部で invokeProcedure に translate される。 real tRPC の typed client と同じ shape の
 * assertion が書ける。
 */
export function createClient(router: Router): TypedClient {
  return new Proxy({} as TypedClient, {
    get(_target, path: string) {
      return {
        query: (input?: unknown, ctx?: ProcedureContext) => invokeProcedure(router, path, input, ctx),
        mutate: (input?: unknown, ctx?: ProcedureContext) => invokeProcedure(router, path, input, ctx),
        subscribe: (input?: unknown, ctx?: ProcedureContext) => invokeProcedure(router, path, input, ctx),
      };
    },
  });
}
