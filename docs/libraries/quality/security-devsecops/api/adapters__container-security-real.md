---
title: "@kiwa-lab/security-devsecops adapters__container-security-real の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters&#95;&#95;container-security-real</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-real.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>containerSecurityRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/container-security-real.ts</code>

Container real adapter — Grype CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_GRYPE_URL` opt-in。

```ts
export declare const containerSecurityRealAdapter: ContainerAdapter;
```


