---
title: "@kiwa-lab/release-invariants provenance-flag-absence の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/release-invariants</code> <code v-pre>provenance-flag-absence</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/provenance-flag-absence.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkProvenanceFlagAbsence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/provenance-flag-absence.ts#L23) <code v-pre>packages/release-invariants/src/provenance-flag-absence.ts</code>

Assert `--provenance` is absent from the release script. A match reports `ok: false` with up to 3 excerpts around the offending flag.

```ts
export declare function checkProvenanceFlagAbsence(releaseScript: string): ProvenanceFlagAbsenceResult;
```


