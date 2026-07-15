# @kiwa-lab/trpc API reference

## Overview

`@kiwa-lab/trpc` は tRPC v10 の router / procedure / middleware / typed client を in-process mock で扱う test infra。 real HTTP transport 不要で query / mutation / subscription を type-safe に invoke できる。

## Supported patterns

| pattern | function | notes |
|---|---|---|
| query | `defineProcedure('query', ...)` | side-effect free |
| mutation | `defineProcedure('mutation', ...)` | side-effect あり |
| subscription | `defineProcedure('subscription', ...)` | async iterable |
| middleware | `middleware(fn)` | chain 可能 |
| context | `createContext(fn)` | request 別 context |

## Main API

### `createRouter(options: CreateRouterOptions): Router`

router を宣言、 `.procedures` に procedure map、 `.middlewares` に middleware chain。

### `defineProcedure<TInput, TOutput>(type, handler): ProcedureDefinition`

procedure 定義、 `type = 'query' | 'mutation' | 'subscription'` + `handler({input, ctx})`。

### `invokeProcedure(router, path, input?, ctx?): Promise<any>`

path (`user.get` / `post.create`) 指定で procedure invoke、 middleware chain を通過 + result 返却。

### `createClient(router, options?): TypedClient`

router から typed client を生成、 `.user.get.query(input)` / `.post.create.mutate(input)` を提供 (proxy 経由の型付き dispatch)。

### `middleware(fn: (params: MiddlewareParams) => MiddlewareResult): Middleware`

middleware factory、 `params = { ctx, next }` を受け取り `next()` で downstream call。 auth chk / logging / tracing に使う。

## Types

- `ProcedureType = 'query' | 'mutation' | 'subscription'`
- `ProcedureHandler<TInput, TOutput, TCtx>` = `(opts: { input: TInput, ctx: TCtx }) => TOutput | Promise<TOutput>`
- `MiddlewareParams` = `{ ctx, path, type, next }`
- `TRPCErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR'`
- `TRPCError extends Error` = `{ code, message, cause? }`

## Usage examples

### Router + client 経路

```typescript
import { createRouter, defineProcedure, createClient } from '@kiwa-lab/trpc';
import { describe, expect, it } from 'vitest';

describe('user router', () => {
  it('user.get で id 指定で user を返す', async () => {
    const router = createRouter({
      procedures: {
        'user.get': defineProcedure('query', async ({ input }) => {
          return { id: input.id, name: `user-${input.id}` };
        }),
      },
    });
    const client = createClient(router);
    const user = await client['user.get'].query({ id: '1' });
    expect(user).toEqual({ id: '1', name: 'user-1' });
  });
});
```

### Middleware chain (auth)

```typescript
import { createRouter, defineProcedure, middleware, TRPCError, invokeProcedure } from '@kiwa-lab/trpc';

const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in required' });
  return next();
});

const router = createRouter({
  middlewares: [authMiddleware],
  procedures: {
    'post.create': defineProcedure('mutation', async ({ input, ctx }) => ({ id: '1', authorId: ctx.user.id, body: input.body })),
  },
});

await expect(invokeProcedure(router, 'post.create', { body: 'hi' }, { user: null }))
  .rejects.toThrow('sign in required');
```

## Related skills

- [`/kiwa-trpc`](../skills/kiwa-trpc) — tRPC test 生成 skill
