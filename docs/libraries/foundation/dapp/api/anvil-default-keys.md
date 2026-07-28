---
title: "@kiwa-lab/dapp anvil-default-keys の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>anvil-default-keys</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-default-keys.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>ANVIL&#95;DEFAULT&#95;PRIVATE&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-default-keys.ts#L11) <code v-pre>packages/dapp/src/anvil-default-keys.ts</code>

anvil default mnemonic から生成される 10 個の dev account private keys。 anvil は `--mnemonic "test test test test test test test test test test test junk"` を default に持ち、固定 10 account の private key を生成する。これらは public で安全な値。 `setActiveAccount(index)` で 0-9 のいずれかに切替えて test 内で account picker UI を検証する。

```ts
export declare const ANVIL_DEFAULT_PRIVATE_KEYS: readonly Hex[];
```


