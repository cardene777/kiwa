---
title: "@kiwa-lab/security-devsecops adapters-iac-scan-mock の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters-iac-scan-mock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-mock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>iacScanMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-mock.ts#L19) <code v-pre>packages/security-devsecops/src/adapters/iac-scan-mock.ts</code>

IaC mock adapter — tfsec-style deterministic replay。 1 misconfig + 1 pass + 1 fail compliance check。

```ts
export declare const iacScanMockAdapter: IacAdapter;
```


