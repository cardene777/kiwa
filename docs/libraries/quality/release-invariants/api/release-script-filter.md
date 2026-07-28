---
title: "@kiwa-lab/release-invariants release-script-filter の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/release-invariants</code> <code v-pre>release-script-filter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/release-script-filter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkReleaseScriptFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/release-script-filter.ts#L31) <code v-pre>packages/release-invariants/src/release-script-filter.ts</code>

Check that every publishable package appears in **both** halves (`-F {name}` build + `--filter {name}` publish) of the release script.

```ts
export declare function checkReleaseScriptFilter(releaseScript: string, publishable: PublishablePackage[]): ReleaseScriptFilterResult;
```


