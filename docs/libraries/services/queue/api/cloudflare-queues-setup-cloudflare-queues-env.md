---
title: "@kiwa-lab/queue cloudflare-queues-setup-cloudflare-queues-env の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>cloudflare-queues-setup-cloudflare-queues-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts#L20) <code v-pre>packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts</code>

Factory for Cloudflare Queues test environments. `mode: 'miniflare'` (default) returns a fast, in-process fake — no wrangler subprocess, no network. Deterministic enough to exercise send / consumer batch / retry / DLQ semantics without spinning up an external process. `mode: 'wrangler'` boots (or connects to) a real `wrangler dev --local` process and verifies it responds before returning the env. The env still runs consumer batch handlers in-process (v0.2 scope) so retry / DLQ assertions stay deterministic across backends.

```ts
export declare function setupCloudflareQueuesEnv(opts?: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv>;
```


