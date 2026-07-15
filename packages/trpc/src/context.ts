export type ProcedureContext = Record<string, unknown>;

export interface CreateContextOptions {
  headers?: Record<string, string>;
  userId?: string;
  session?: Record<string, unknown>;
}

/**
 * tRPC 実 server の createContext 相当。 request 単位で context を組み立てる。 実運用では
 * cookie / auth header を読んで userId / session を注入する pattern を mock で再現。
 */
export function createContext(options: CreateContextOptions = {}): ProcedureContext {
  const ctx: ProcedureContext = {};
  if (options.headers !== undefined) ctx.headers = options.headers;
  if (options.userId !== undefined) ctx.userId = options.userId;
  if (options.session !== undefined) ctx.session = options.session;
  return ctx;
}
