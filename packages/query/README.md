# @kiwa-lab/query

Data fetching cache mock harness for kiwa — TanStack Query / SWR / urql / Apollo Client を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/query
# or
npm install -D @kiwa-lab/query
# or
yarn add -D @kiwa-lab/query
```

## Supported providers

| Provider | Status | Cache model |
|---|---|---|
| TanStack Query | ✅ Ready | query key + gcTime |
| SWR | ✅ Ready | key + dedupe |
| urql | ✅ Ready | document + variables |
| Apollo Client | ✅ Ready | normalized cache |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createQueryClient,
  fetchQuery,
  mutate,
  invalidateQuery,
} from '@kiwa-lab/query';

describe('user cache flow', () => {
  it('fetch → mutate → invalidate で refetch される', async () => {
    const client = createQueryClient({ provider: 'tanstack-query' });
    const first = await fetchQuery(client, {
      key: ['user', 1],
      queryFn: async () => ({ id: 1, name: 'a' }),
    });
    await mutate(client, { key: ['user', 1], mutationFn: async () => ({ id: 1, name: 'b' }) });
    await invalidateQuery(client, ['user', 1]);
    expect(first.status).toBe('success');
  });
});
```

## API reference

- `createQueryClient({ provider: QueryProvider }): QueryClient` — provider 別 client
- `fetchQuery(client, options: FetchQueryOptions): Promise<FetchQueryResult>` — cache-first fetch
- `mutate(client, options: MutateOptions): Promise<MutateResult>` — mutation + optimistic update
- `invalidateQuery(client, key: QueryKey): InvalidateResult` — 明示 invalidate + refetch trigger
- `subscribeToQuery(client, key, listener: QueryListener): Subscription` — state 変更 subscription

## Test integration

vitest + `/kiwa-query` skill で React component render なしで cache 動作を高速に verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/application/query/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/application/query/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/application/query/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/application/query/reference)

編集元は [docs/libraries/application/query](../../docs/libraries/application/query/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
