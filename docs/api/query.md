# @kiwa-lab/query API reference

## Overview

`@kiwa-lab/query` は TanStack Query / SWR / urql / Apollo Client 4 provider を統一 interface で mock する data fetching cache test infra。 fetch + mutation + invalidate + subscription を統一 shape で叩ける。

## Supported providers

| provider | cache key | stale time (default) | invalidate |
|---|---|---|---|
| tanstack-query | array key | 0 (immediate stale) | invalidateQueries |
| swr | string key | 2s (dedupe) | mutate |
| urql | operation + variables | manual | executeQuery force |
| apollo-client | typename + id | Infinity | refetchQueries |

## Main API

### `createQueryClient(options: CreateQueryClientOptions): QueryClient`

provider 別 mock client、 `defaultOptions` (`staleTime` / `cacheTime` / `retry`) config。

### `fetchQuery<T>(client, key: QueryKey, fn: QueryFn<T>, options?): Promise<FetchQueryResult<T>>`

key 指定で fetch、 cache 経由で dedupe、 `{ data, status, dataUpdatedAt, cached }` を返す。 status = `pending | success | error`。

### `mutate<T>(client, fn: MutationFn<T>, options: MutateOptions): Promise<MutateResult<T>>`

mutation 実行、 `onSuccess / onError / invalidates` で cache 副作用制御、 `{ data, status, invalidatedKeys }`。

### `invalidateQuery(client, key: QueryKey): InvalidateResult`

cache key を invalidate、 次 fetch で refetch、 `{ invalidated, refetchTriggered }`。

### `subscribeToQuery(client, key, listener: QueryListener): Subscription`

query state 変更を subscribe、 background refetch や polling を verify。

## Types

- `QueryProvider = 'tanstack-query' | 'swr' | 'urql' | 'apollo-client'`
- `QueryKey = string | (string | number | object)[]`
- `QueryStatus = 'pending' | 'success' | 'error'`
- `QueryState<T>` = `{ data?: T, error?, status, dataUpdatedAt, fetchStatus }`
- `MutationFn<TVar, TData>` = `(vars: TVar) => Promise<TData>`

## Usage examples

### fetchQuery + cache

```typescript
import { createQueryClient, fetchQuery } from '@kiwa-lab/query';
import { describe, expect, it, vi } from 'vitest';

describe('users list (tanstack)', () => {
  it('2 回目 fetch は cache hit', async () => {
    const client = createQueryClient({ provider: 'tanstack-query', defaultOptions: { staleTime: 60_000 } });
    const fn = vi.fn(async () => [{ id: '1', name: 'kiwa' }]);
    const first = await fetchQuery(client, ['users'], fn);
    const second = await fetchQuery(client, ['users'], fn);
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### Mutate + invalidate

```typescript
import { createQueryClient, fetchQuery, mutate, invalidateQuery } from '@kiwa-lab/query';

const client = createQueryClient({ provider: 'tanstack-query' });
await fetchQuery(client, ['posts'], async () => [{ id: '1', title: 'a' }]);
await mutate(client, async () => ({ id: '2', title: 'b' }), {
  invalidates: [['posts']],
});
// cache invalidated, next fetch will refetch
```

## Related skills

- [`/kiwa-query`](../skills/kiwa-query) — data fetching test 生成 skill
