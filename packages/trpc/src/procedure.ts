import type { ProcedureContext } from './context.js';
import type { Middleware } from './middleware.js';

export type ProcedureType = 'query' | 'mutation' | 'subscription';

export type ProcedureHandler<TInput = unknown, TOutput = unknown> = (params: {
  input: TInput;
  ctx: ProcedureContext;
}) => Promise<TOutput> | TOutput;

export interface ProcedureDefinition<TInput = unknown, TOutput = unknown> {
  type: ProcedureType;
  handler: ProcedureHandler<TInput, TOutput>;
  middlewares: Middleware[];
}

/**
 * tRPC v10 の t.procedure.query(handler) / .mutation(handler) / .subscription(handler) 相当。
 * middleware 配列を挟めるようにして、 procedure 単位で auth / logging を宣言する pattern を
 * 再現する。
 */
export function defineProcedure<TInput = unknown, TOutput = unknown>(
  type: ProcedureType,
  handler: ProcedureHandler<TInput, TOutput>,
  middlewares: Middleware[] = [],
): ProcedureDefinition<TInput, TOutput> {
  return { type, handler, middlewares };
}
