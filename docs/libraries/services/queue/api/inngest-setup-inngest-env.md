---
title: "@kiwa-lab/queue inngest-setup-inngest-env の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>inngest-setup-inngest-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts#L18) <code v-pre>packages/queue/src/inngest/setup-inngest-env.ts</code>

Factory for Inngest test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no dev-server, no network. Suitable for unit tests that need to exercise retry / step / concurrency semantics deterministically. `mode: 'dev-server'` boots (or connects to) a real Inngest dev-server and routes every event through the wire before dispatching function handlers. Suitable for integration tests that need prod-shape parity.

```ts
export declare function setupInngestEnv(opts?: SetupInngestEnvOptions): Promise<InngestTestEnv>;
```


