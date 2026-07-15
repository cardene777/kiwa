# @kiwa-lab/trpc

tRPC v10 endpoint mock harness for kiwa — router / procedure / query / mutation / subscription / middleware / context を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/trpc
# or
npm install -D @kiwa-lab/trpc
# or
yarn add -D @kiwa-lab/trpc
```

## Supported patterns

| Feature | Status |
|---|---|
| query procedure | ✅ |
| mutation procedure | ✅ |
| subscription | ✅ |
| middleware chain (global + per-proc) | ✅ |
| context injection | ✅ |
| TRPCError with code | ✅ |

## Quick start

```ts
import { createRouter, defineProcedure, invokeProcedure, createClient, middleware } from '@kiwa-lab/trpc';

const logging = middleware(async ({ next, path }) => {
  const r = await next();
  console.log(`[${path}]`, r);
  return r;
});

const router = createRouter({
  procedures: {
    'user.get': defineProcedure({
      type: 'query',
      handler: async ({ input }) => ({ id: input, name: 'kiwa' }),
    }),
  },
  middlewares: [logging],
});

const result = await invokeProcedure(router, 'user.get', 'u1');
// result = { id: 'u1', name: 'kiwa' }

const client = createClient(router);
const r2 = await (client as any).user.get.query('u1');
```

## API reference

- `createRouter(options: CreateRouterOptions): Router` — procedures map + global middlewares
- `defineProcedure(def: ProcedureDefinition): ProcedureDefinition` — type (query/mutation/subscription) + handler
- `invokeProcedure(router, path, input, ctx?): Promise<unknown>` — path 経由で server 側実行
- `createClient(router): TypedClient` — client proxy (typed .query() / .mutate())
- `middleware(fn): Middleware` — middleware chain 定義
- `TRPCError` — code (NOT_FOUND / UNAUTHORIZED / BAD_REQUEST 等) 付き error class
- `createContext(options?): ProcedureContext` — per-request context

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createRouter, defineProcedure, invokeProcedure, TRPCError } from '@kiwa-lab/trpc';

describe('user router', () => {
  it('unknown path で NOT_FOUND', async () => {
    const r = createRouter({ procedures: {} });
    await expect(invokeProcedure(r, 'missing', null)).rejects.toBeInstanceOf(TRPCError);
  });
});
```

`/kiwa-trpc` skill を起動すると query / mutation / middleware chain / error 4 経路の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
