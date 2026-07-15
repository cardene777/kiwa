import { invalidateQuery } from './invalidate.js';
import type { QueryClient, QueryKey } from './client.js';

export type MutationFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

export interface MutateOptions<TResult> {
  invalidateKeys?: QueryKey[];
  onSuccess?: (result: TResult) => void;
  onError?: (err: Error) => void;
}

export interface MutateResult<TResult> {
  result: TResult;
  invalidated: string[];
}

/**
 * mutationFn 実行 + 成功時に invalidateKeys を全 invalidate、 失敗時は onError 発火。
 * TanStack Query の useMutation.mutateAsync 相当。
 */
export async function mutate<TArgs, TResult>(
  client: QueryClient,
  mutationFn: MutationFn<TArgs, TResult>,
  args: TArgs,
  options: MutateOptions<TResult> = {},
): Promise<MutateResult<TResult>> {
  try {
    const result = await mutationFn(args);
    const invalidated: string[] = [];
    if (options.invalidateKeys) {
      for (const key of options.invalidateKeys) {
        const r = invalidateQuery(client, key);
        invalidated.push(r.key);
      }
    }
    options.onSuccess?.(result);
    return { result, invalidated };
  } catch (e) {
    const err = e as Error;
    options.onError?.(err);
    throw err;
  }
}
