# @kiwa-lab/query

Data fetching cache mock harness for kiwa — TanStack Query / SWR / urql / Apollo Client を統一 interface で invoke する in-process mock。

## API

- `createQueryClient(options)` = provider mock client (fetch / mutate / invalidate / subscribe)
- `fetchQuery(client, key, queryFn)` = cache-first fetch
- `mutate(client, mutationFn, options)` = mutation + invalidate 連鎖
- `invalidateQuery(client, key)` = 明示 cache invalidate
- `subscribeToQuery(client, key, listener)` = state 変更 subscription
