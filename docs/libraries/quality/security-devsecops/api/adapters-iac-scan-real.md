---
title: "@kiwa-lab/security-devsecops adapters-iac-scan-real の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters-iac-scan-real</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-real.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>iacScanRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/iac-scan-real.ts</code>

IaC real adapter — tfsec CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TFSEC_URL` opt-in。

```ts
export declare const iacScanRealAdapter: IacAdapter;
```


