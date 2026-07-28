---
title: "@kiwa-lab/auth passkey__sync-fabric の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;sync-fabric</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/sync-fabric.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSyncFabric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/sync-fabric.ts#L11) <code v-pre>packages/auth/src/passkey/sync-fabric.ts</code>

Build a sync fabric — the in-memory analogue of iCloud Keychain or Google Password Manager. Real fabrics wrap end-to-end-encrypted blobs indexed by credential id; the mock keeps a plain `Map&lt;credentialId, PasskeyCredential&gt;` so tests can inspect the blob shape at will. Every backup produces a shallow clone — mutating the returned credential must not race with a concurrent backup of the same credential on a sibling device.

```ts
export declare function createSyncFabric(vendor: SyncFabricVendor): SyncFabric;
```


