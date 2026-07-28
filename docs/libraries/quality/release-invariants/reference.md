# Release Invariants リファレンス

`@kiwa-lab/release-invariants` は文字列として渡した release script を副作用なしで検査します。

## Filter の対称性

`checkReleaseScriptFilter(releaseScript, publishable)` はpackageごとに `-F <name>` と `--filter <name>` の部分文字列を確認します。戻り値の `entries` にはbuildとpublishの存在、`partial`、`ok` が入ります。`missingBuildFilter` と `missingPublishFilter` は修正対象のpackage名です。文字列がbuildまたはpublish commandに属することまでは確認しません。

## Provenance と gate coverage

`checkProvenanceFlagAbsence(releaseScript)` は `--provenance` の有無と最大3件の `excerpts` を返します。すべての出現を数えるのではなく、3件に達した時点で止まります。`checkGateScriptPackageCoverage(gateScript, publishable)` はpublish対象がmutation gateの `-F` filterに含まれるか確認します。

`buildReleaseInvariantsSummary` は3検査の結果をまとめ、全体の `ok` を返します。publishableが空の場合はすべてのpackage coverage検査がtrueになるため、公開対象の列挙自体は呼び出し側の責務です。

## 制約

検査対象は実行済みのshellではなく入力文字列です。`PublishablePackage.name` はrelease scriptに現れる完全なscoped package名を渡します。file、registry、processは変更しません。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [gate-script-package-coverage.ts](./api/gate-script-package-coverage) | 1 | 0 |
| [provenance-flag-absence.ts](./api/provenance-flag-absence) | 1 | 0 |
| [release-script-filter.ts](./api/release-script-filter) | 1 | 0 |
| [summary.ts](./api/summary) | 1 | 1 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
