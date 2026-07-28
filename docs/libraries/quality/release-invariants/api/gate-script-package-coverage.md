---
title: "@kiwa-lab/release-invariants gate-script-package-coverage の API 契約"
---

# <code v-pre>@kiwa-lab/release-invariants</code> <code v-pre>gate-script-package-coverage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/gate-script-package-coverage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkGateScriptPackageCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/gate-script-package-coverage.ts#L27) <code v-pre>packages/release-invariants/src/gate-script-package-coverage.ts</code>

Check that every publishable package appears in the mutation gate script (typically `scripts.test:mutation`).

```ts
export declare function checkGateScriptPackageCoverage(mutationGateScript: string, publishable: PublishablePackage[]): GateScriptPackageCoverageResult;
```


