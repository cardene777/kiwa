import { createRpcClient } from '@kiwa-test/hono';
import type { HonoAppLike } from '@kiwa-test/hono';
import type { DogfoodEnv } from '../routes/app.js';

/**
 * Shape of the typed hc-style RPC client the dogfood tests use.
 *
 * Real Hono's `hc<AppType>(baseUrl)` walks the app type at compile time so
 * `client.greet[':name'].$get({ param: { name: 'x' } })` is fully typed.
 * kiwa's mock version is untyped at runtime (a Proxy tree) so tests cast
 * the return of `createRpcClient` into this shape.
 *
 * The shape here mirrors the runtime path segments the dogfood serves —
 * `/health`, `/greet/:name`, `/kv-counter`, `/d1-list`, `/r2-upload`.
 */

export interface RpcRequestBase {
  headers?: Record<string, string>;
  env?: DogfoodEnv;
}

export interface RpcParamRequest<TParam extends Record<string, string>>
  extends RpcRequestBase {
  param: TParam;
}

export interface RpcJsonBodyRequest<TJson> extends RpcRequestBase {
  json: TJson;
}

export interface RpcResponse<T> {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  json(): Promise<T>;
  text(): Promise<string>;
}

export interface DogfoodHcClient {
  readonly health: {
    $get(opts?: RpcRequestBase): Promise<RpcResponse<{ ok: boolean; route: string }>>;
  };
  readonly greet: Record<
    string,
    {
      $get(
        opts: RpcParamRequest<{ name: string }>,
      ): Promise<RpcResponse<{ ok: boolean; message: string }>>;
    }
  >;
  readonly 'kv-counter': {
    $post(
      opts: RpcJsonBodyRequest<{ note?: string }>,
    ): Promise<RpcResponse<{ ok: boolean; previous: number; next: number }>>;
  };
  readonly 'd1-list': {
    $get(
      opts?: RpcRequestBase,
    ): Promise<
      RpcResponse<{ ok: boolean; notes: Array<{ id: number; title: string }> }>
    >;
  };
  readonly 'r2-upload': {
    $post(
      opts: RpcJsonBodyRequest<{ key: string; contents: string }>,
    ): Promise<RpcResponse<{ ok: boolean; key: string; etag: string }>>;
  };
}

/**
 * Build a typed hc client wrapping the dogfood app. The cast into
 * `DogfoodHcClient` is intentional: the runtime is untyped Proxy, the
 * type contract lives here at the call site.
 */
export function createDogfoodRpc(app: HonoAppLike<DogfoodEnv>): DogfoodHcClient {
  return createRpcClient<DogfoodEnv>(app) as DogfoodHcClient;
}
