---
title: "@kiwa-lab/auth oidc__discovery の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oidc&#95;&#95;discovery</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/discovery.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createDiscoveryEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/discovery.ts#L66) <code v-pre>packages/auth/src/oidc/discovery.ts</code>

Build the OIDC discovery endpoint. The mock keeps every field in-memory; `fetch()` returns a fresh object so callers cannot mutate the underlying metadata by reference. The document is intentionally read-only. Tests that need to simulate an OP changing metadata should rebuild the discovery endpoint rather than reach into the returned object.

```ts
export declare function createDiscoveryEndpoint(options: CreateDiscoveryEndpointOptions): DiscoveryEndpoint;
```


