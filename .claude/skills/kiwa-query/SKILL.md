---
name: kiwa-query
description: |
  @kiwa-lab/query (TanStack Query / SWR / urql / Apollo Client 統一 mock harness) を使った data fetching cache test 生成 skill。
  `createQueryClient` で provider mock を立て、 `fetchQuery` で cache-first fetch、 `mutate` で mutation + invalidate 連鎖、 `invalidateQuery` で明示 invalidate、 `subscribeToQuery` で state 変更 subscription を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-query — data fetching cache test 生成

`@kiwa-lab/query` の 4 provider (TanStack Query / SWR / urql / Apollo Client) 統一 mock を使った query test を Vitest 形式で生成する。

## 目的

data fetching layer を「provider を差し替えても同じ cache 挙動を担保する」 test で書く。 provider 別 API (TanStack useQuery / SWR useSWR / urql useQuery / Apollo useQuery) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/query` install 済
- Vitest 環境
- 対象 module に query cache 依存が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {tanstack|swr|urql|apollo}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: fetchQuery cache-first workflow test 生成

`createQueryClient({ provider })` で client、 `fetchQuery(client, ['user', 1], () => api.get('/user/1'))` で 1 回目 = network / 2 回目 = cache-hit の verify。 stale-time 経過後 refetch の verify も追加。

### Step 2: mutate + invalidate 連鎖 test 生成

`mutate(client, () => api.post('/user'), { invalidateKeys: [['users']] })` で mutation → 依存 query 自動 invalidate → 次 fetch で refetch の verify。

### Step 3: subscribeToQuery test 生成

`subscribeToQuery(client, ['user', 1], listener)` で state 変更 (loading → success / error) 通知 + unsubscribe 後の未発火 verify。

## 使用例

```bash
/kiwa-query --module users --output tests/integration/users.query.test.ts
/kiwa-query --module posts --provider tanstack
```
