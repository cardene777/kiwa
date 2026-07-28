---
title: "@kiwa-lab/queue cloudflare-queues-miniflare-cloudflare-queues の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>cloudflare-queues-miniflare-cloudflare-queues</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMiniflareCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L54) <code v-pre>packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts</code>

Build a miniflare-shaped (offline, in-process) Cloudflare Queues env. The simulation covers the message lifecycle observed by production Workers — `send` / consumer batch / retry / DLQ — deterministically, without spinning up a wrangler dev-server. When `opts.miniflare?.miniflare` is supplied the helper leaves lifecycle to the caller and only consumes the injected instance for structural parity; the internal simulation still drives message state so tests stay deterministic.

```ts
export declare function createMiniflareCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): CloudflareQueuesTestEnv<'mock'>;
```


