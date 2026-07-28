---
title: "@kiwa-lab/cache keydb-testcontainers-keydb の API 契約"
---

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>keydb-testcontainers-keydb</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createTestcontainersKeyDBEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L15) <code v-pre>packages/cache/src/keydb/testcontainers-keydb.ts</code>

Build a testcontainers-backed KeyDB env. When `opts.testcontainers?.url` is provided the helper connects directly to that URL and verifies TCP responsiveness. Otherwise the helper would spawn a real KeyDB container — kept behind an explicit `url` opt-in for the v0.2 scope so callers wanting fully-managed containers can layer their own testcontainers wrapper. KeyDB is Redis-compatible on the wire so callers can point their own `ioredis` / `redis` client at `env.keydbUrl`; assertion helpers stay deterministic by reusing the stub's replication simulation.

```ts
export declare function createTestcontainersKeyDBEnv(opts: SetupKeyDBEnvOptions): Promise<KeyDBTestEnv<'live'>>;
```


