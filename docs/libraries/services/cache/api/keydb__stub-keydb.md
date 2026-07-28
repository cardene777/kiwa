---
title: "@kiwa-lab/cache keydb__stub-keydb の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>keydb&#95;&#95;stub-keydb</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStubKeyDBEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L29) <code v-pre>packages/cache/src/keydb/stub-keydb.ts</code>

Build an in-process stub of KeyDB covering the Redis-compatible surface (get / set / delete / TTL / Pub/Sub) plus KeyDB-specific multi-master replication — writes on one master replicate to every other master after an optional simulated lag.

```ts
export declare function createStubKeyDBEnv(opts: SetupKeyDBEnvOptions): KeyDBTestEnv<'mock'>;
```


