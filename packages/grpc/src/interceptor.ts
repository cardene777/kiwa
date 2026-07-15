import type { GrpcMetadata } from './server.js';
import type { GrpcStatus } from './status.js';

export interface InterceptorContext {
  service: string;
  method: string;
  metadata: GrpcMetadata;
  request: unknown;
}

export type Interceptor = (
  ctx: InterceptorContext,
  next: () => Promise<{ response?: unknown; status: GrpcStatus }>,
) => Promise<{ response?: unknown; status: GrpcStatus }>;

/**
 * interceptor chain builder。 real gRPC (grpc-js / nice-grpc) の interceptor
 * middleware 相当。 順序どおり呼び、 各 interceptor が before/after で ctx を操作。
 */
export function composeInterceptors(interceptors: readonly Interceptor[]): (
  ctx: InterceptorContext,
  final: () => Promise<{ response?: unknown; status: GrpcStatus }>,
) => Promise<{ response?: unknown; status: GrpcStatus }> {
  return async (ctx, final) => {
    let index = -1;
    async function dispatch(i: number): Promise<{ response?: unknown; status: GrpcStatus }> {
      if (i <= index) throw new Error('next() called multiple times in same interceptor');
      index = i;
      const layer = interceptors[i];
      if (!layer) return final();
      return layer(ctx, () => dispatch(i + 1));
    }
    return dispatch(0);
  };
}
