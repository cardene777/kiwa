---
title: "@kiwa-lab/release-invariants types の API 契約"
---

# <code v-pre>@kiwa-lab/release-invariants</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>GateScriptPackageCoverageEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L67) <code v-pre>packages/release-invariants/src/types.ts</code>

Per-package result of the `checkGateScriptPackageCoverage` invariant. `test:mutation` (and its downstream `gate:mutation` reader) must include every publishable package the release publishes — otherwise the mutation baseline drifts from what actually ships.

```ts
export interface GateScriptPackageCoverageEntry {
    name: string;
    mutationFilterPresent: boolean;
}
```

#### <code v-pre>GateScriptPackageCoverageResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L72) <code v-pre>packages/release-invariants/src/types.ts</code>

```ts
export interface GateScriptPackageCoverageResult {
    ok: boolean;
    entries: GateScriptPackageCoverageEntry[];
    missingMutationFilter: string[];
}
```

#### <code v-pre>ProvenanceFlagAbsenceResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L51) <code v-pre>packages/release-invariants/src/types.ts</code>

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

#### <code v-pre>PublishablePackage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L12) <code v-pre>packages/release-invariants/src/types.ts</code>

A publishable npm package descriptor. `name` is the `@scope/pkg` string as it appears in `package.json`. `dir` is optional and only used for error messages; the invariants themselves operate on names.

```ts
export interface PublishablePackage {
    name: string;
    dir?: string;
}
```

#### <code v-pre>ReleaseInvariantsSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L82) <code v-pre>packages/release-invariants/src/types.ts</code>

Aggregate SSOT — the shape v1.29's `docs/concepts/release-invariants.md` pins as the 3-invariant release-gate ledger.

```ts
export interface ReleaseInvariantsSummary {
    releaseScriptFilter: ReleaseScriptFilterResult;
    provenanceFlagAbsence: ProvenanceFlagAbsenceResult;
    gateScriptPackageCoverage: GateScriptPackageCoverageResult;
    ok: boolean;
}
```

#### <code v-pre>ReleaseScriptFilterEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L20) <code v-pre>packages/release-invariants/src/types.ts</code>

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

#### <code v-pre>ReleaseScriptFilterResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/types.ts#L37) <code v-pre>packages/release-invariants/src/types.ts</code>

Aggregate result of the `checkReleaseScriptFilter` invariant.

```ts
export interface ReleaseScriptFilterResult {
    ok: boolean;
    entries: ReleaseScriptFilterEntry[];
    missingBuildFilter: string[];
    missingPublishFilter: string[];
}
```
