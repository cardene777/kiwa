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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `buildReleaseInvariantsSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/summary.ts#L21) `packages/release-invariants/src/summary.ts`

Build the 3-invariant summary in one shot. `ok` is the AND of every invariant — a caller (usually a release-smoke suite) can short-circuit on this single boolean.

```ts
export declare function buildReleaseInvariantsSummary(input: BuildReleaseInvariantsSummaryInput): ReleaseInvariantsSummary;
```

#### `checkGateScriptPackageCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/gate-script-package-coverage.ts#L27) `packages/release-invariants/src/gate-script-package-coverage.ts`

Check that every publishable package appears in the mutation gate script (typically `scripts.test:mutation`).

```ts
export declare function checkGateScriptPackageCoverage(mutationGateScript: string, publishable: PublishablePackage[]): GateScriptPackageCoverageResult;
```

#### `checkProvenanceFlagAbsence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/provenance-flag-absence.ts#L23) `packages/release-invariants/src/provenance-flag-absence.ts`

Assert `--provenance` is absent from the release script. A match reports `ok: false` with up to 3 excerpts around the offending flag.

```ts
export declare function checkProvenanceFlagAbsence(releaseScript: string): ProvenanceFlagAbsenceResult;
```

#### `checkReleaseScriptFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/release-script-filter.ts#L31) `packages/release-invariants/src/release-script-filter.ts`

Check that every publishable package appears in **both** halves (`-F {name}` build + `--filter {name}` publish) of the release script.

```ts
export declare function checkReleaseScriptFilter(releaseScript: string, publishable: PublishablePackage[]): ReleaseScriptFilterResult;
```

### 型

#### `BuildReleaseInvariantsSummaryInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/summary.ts#L10) `packages/release-invariants/src/summary.ts`

```ts
export interface BuildReleaseInvariantsSummaryInput {
    releaseScript: string;
    mutationGateScript: string;
    publishable: PublishablePackage[];
}
```

#### `GateScriptPackageCoverageEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L67) `packages/release-invariants/src/types.ts`

Per-package result of the `checkGateScriptPackageCoverage` invariant. `test:mutation` (and its downstream `gate:mutation` reader) must include every publishable package the release publishes — otherwise the mutation baseline drifts from what actually ships.

```ts
export interface GateScriptPackageCoverageEntry {
    name: string;
    mutationFilterPresent: boolean;
}
```

#### `GateScriptPackageCoverageResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L72) `packages/release-invariants/src/types.ts`

```ts
export interface GateScriptPackageCoverageResult {
    ok: boolean;
    entries: GateScriptPackageCoverageEntry[];
    missingMutationFilter: string[];
}
```

#### `ProvenanceFlagAbsenceResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L51) `packages/release-invariants/src/types.ts`

Per-package result of the `checkProvenanceFlagAbsence` invariant. `provenanceFlagPresent = true` means the release script contains a `--provenance` flag next to a `pnpm publish`. `ok = true` means the flag is **absent** — v1.14 removed provenance because it required OIDC federation (npm CLI 10+) that is not stable inside pnpm monorepos.

```ts
export interface ProvenanceFlagAbsenceResult {
    ok: boolean;
    provenanceFlagPresent: boolean;
    /**
     * Offending code excerpts (up to 3 matches) for the failure message.
     * Empty when `ok = true`.
     */
    excerpts: string[];
}
```

#### `PublishablePackage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L12) `packages/release-invariants/src/types.ts`

A publishable npm package descriptor. `name` is the `@scope/pkg` string as it appears in `package.json`. `dir` is optional and only used for error messages; the invariants themselves operate on names.

```ts
export interface PublishablePackage {
    name: string;
    dir?: string;
}
```

#### `ReleaseInvariantsSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L82) `packages/release-invariants/src/types.ts`

Aggregate SSOT — the shape v1.29's `docs/concepts/release-invariants.md` pins as the 3-invariant release-gate ledger.

```ts
export interface ReleaseInvariantsSummary {
    releaseScriptFilter: ReleaseScriptFilterResult;
    provenanceFlagAbsence: ProvenanceFlagAbsenceResult;
    gateScriptPackageCoverage: GateScriptPackageCoverageResult;
    ok: boolean;
}
```

#### `ReleaseScriptFilterEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L20) `packages/release-invariants/src/types.ts`

Per-package result of the `checkReleaseScriptFilter` invariant.

```ts
export interface ReleaseScriptFilterEntry {
    name: string;
    buildFilterPresent: boolean;
    publishFilterPresent: boolean;
    /**
     * `true` iff **both** halves of the release script contain the package.
     * Half-only entries (`-F` without `--filter` or vice versa) are the exact
     * failure mode v1.14 payment + v1.25 perf-harness + v1.27 quality-metrics
     * + v1.28 realtime all hit; the SSOT calls it `partial: true`.
     */
    ok: boolean;
    partial: boolean;
}
```

#### `ReleaseScriptFilterResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L37) `packages/release-invariants/src/types.ts`

Aggregate result of the `checkReleaseScriptFilter` invariant.

```ts
export interface ReleaseScriptFilterResult {
    ok: boolean;
    entries: ReleaseScriptFilterEntry[];
    missingBuildFilter: string[];
    missingPublishFilter: string[];
}
```
<!-- kiwa-public-api:end -->
