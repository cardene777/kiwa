---
title: "@kiwa-lab/security-devsecops adapters__sca-real の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters&#95;&#95;sca-real</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-real.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>scaRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/sca-real.ts</code>

SCA real adapter — Trivy CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TRIVY_URL` opt-in。

```ts
export declare const scaRealAdapter: ScaAdapter;
```


