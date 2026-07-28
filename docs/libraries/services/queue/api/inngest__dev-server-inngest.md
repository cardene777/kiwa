---
title: "@kiwa-lab/queue inngest__dev-server-inngest の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>inngest&#95;&#95;dev-server-inngest</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createDevServerInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L103) <code v-pre>packages/queue/src/inngest/dev-server-inngest.ts</code>

Build a dev-server-backed Inngest env. When `devServer.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx inngest-cli@latest dev`. The env still runs function handlers in-process (matching v0.1 scope) but every event goes through the real dev-server HTTP round-trip, so the wire shape is prod-parity.

```ts
export declare function createDevServerInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): Promise<InngestTestEnv<'live'>>;
```


