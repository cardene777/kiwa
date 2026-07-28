---
title: "@kiwa-lab/security-devsecops adapters__sast-mock の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>adapters&#95;&#95;sast-mock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-mock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>sastMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-mock.ts#L18) <code v-pre>packages/security-devsecops/src/adapters/sast-mock.ts</code>

SAST mock adapter — Semgrep-neutral pattern を semantics 経路で deterministic に再生する。 `input.metadata.presetFindings` に JSON 文字列で 事前 finding を渡す経路も持つ (test fixture 用)。

```ts
export declare const sastMockAdapter: SastAdapter;
```


