---
title: "@kiwa-lab/queue inngest-stub-inngest の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>inngest-stub-inngest</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createStubInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L48) <code v-pre>packages/queue/src/inngest/stub-inngest.ts</code>

Build a stub (offline, in-process) Inngest env. Deterministic enough to exercise the retry / step / concurrency semantics needed by unit tests without spinning up a real dev-server.

```ts
export declare function createStubInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): InngestTestEnv<'mock'>;
```


