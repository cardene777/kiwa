---
title: "@kiwa-lab/cache keydb__setup-keydb-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>keydb&#95;&#95;setup-keydb-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/setup-keydb-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupKeyDBEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/setup-keydb-env.ts#L18) <code v-pre>packages/cache/src/keydb/setup-keydb-env.ts</code>

Factory for KeyDB test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise Redis-compatible GET / SET / DELETE / TTL / Pub/Sub plus KeyDB-specific multi-master replication semantics. `mode: 'testcontainers'` connects to a running KeyDB endpoint (URL provided via `testcontainers.url`) and verifies TCP responsiveness. The env still drives entry state in-process (v0.2 scope) so assertions stay deterministic across backends.

```ts
export declare function setupKeyDBEnv(opts?: SetupKeyDBEnvOptions): Promise<KeyDBTestEnv>;
```


