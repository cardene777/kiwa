---
title: "@kiwa-lab/queue cloudflare-queues__wrangler-cloudflare-queues の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>cloudflare-queues&#95;&#95;wrangler-cloudflare-queues</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWranglerCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L109) <code v-pre>packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts</code>

Build a wrangler-backed Cloudflare Queues env. When `wrangler.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx wrangler@latest dev`. The env still runs consumer batch handlers in-process (matching v0.2 scope) via the miniflare simulation so retry / DLQ semantics stay deterministic; the wrangler process provides the live wire so consumers can verify their local `wrangler.toml` binds correctly.

```ts
export declare function createWranglerCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv<'live'>>;
```


