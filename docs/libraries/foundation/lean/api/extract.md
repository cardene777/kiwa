---
title: "@kiwa-lab/lean extract の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>extract</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkLeanTable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L283) <code v-pre>packages/lean/src/extract.ts</code>

Ask Lean what table a source holds, and compare it with the spec. `ok` is false when Lean could not be run, since a check that did not happen has established nothing. `status` says which it was.

```ts
export declare function checkLeanTable(spec: OrchestratorSpec, opts?: CheckLeanTableOptions): LeanTableReport;
```

#### <code v-pre>checkLeanTableAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L299) <code v-pre>packages/lean/src/extract.ts</code>

The same comparison, awaited. A caller with five machines runs Lean five times. Through `checkLeanTable` they run one after another, because a synchronous call gives no other option: five of them took 1462ms, and the same five Lean processes started at once finished in 169ms. Awaiting these, a `Promise.all` is the caller's to write.

```ts
export declare function checkLeanTableAsync(spec: OrchestratorSpec, opts?: CheckLeanTableOptions): Promise<LeanTableReport>;
```

#### <code v-pre>extractLeanTable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L140) <code v-pre>packages/lean/src/extract.ts</code>

Run a generated Lean source and read back the table it computes. `source` is taken rather than generated so that a test can hand in a file with one cell moved, which is the only way to know this function can fail.

```ts
export declare function extractLeanTable(source: string, spec: OrchestratorSpec, opts?: ExtractOptions): ExtractResult;
```

#### <code v-pre>extractLeanTableAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L159) <code v-pre>packages/lean/src/extract.ts</code>

The same extraction, awaited. `execFileSync` stops the event loop while Lean works. This does not. Every decision below the run belongs to `interpretExtract`, which both call, so a rule learned by one path cannot be missed by the other.

```ts
export declare function extractLeanTableAsync(source: string, spec: OrchestratorSpec, opts?: ExtractOptions): Promise<ExtractResult>;
```

### 型

#### <code v-pre>CheckLeanTableOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L264) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export interface CheckLeanTableOptions extends ExtractOptions {
    /**
     * The Lean source to check. Defaults to what the generator produces for this
     * spec.
     *
     * Pass a file you have on disk to check that it still holds the table the spec
     * describes — a generated file, checked in, drifts the moment either side
     * moves. Passing one is also the only way to see this function disagree, since
     * a source it generated itself always agrees with the spec it came from.
     */
    source?: string;
}
```

#### <code v-pre>ExtractOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L123) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export interface ExtractOptions extends LeanRunOptions {
    /**
     * Do not run Lean; report `skipped-by-env`.
     *
     * `verifyLeanSpec` has always read `KIWA_LEAN_SKIP_VERIFY`. This did not, so a
     * caller who turned Lean off for a run turned it off for one of the two things
     * that use it, and the other one went and ran Lean anyway.
     */
    skip?: boolean;
}
```

#### <code v-pre>ExtractResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L115) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export interface ExtractResult {
    status: ExtractStatus;
    /** `null` marks a rejected cell. Present only when `status === 'ok'`. */
    table?: Table;
    /** What Lean said, when it refused or printed something unreadable. */
    diagnostics?: string;
}
```

#### <code v-pre>ExtractStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L90) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export type ExtractStatus = 'ok' | 'lean-not-installed'
/**
 * Lean refused the source: it does not parse, does not elaborate, or one of its
 * theorems is false. No table was printed, because Lean never ran the program.
 *
 * This is the status a checked-in `.lean` file earns when it stops being true,
 * and it is the same word `VerifyStatus` uses for it.
 */
 | 'verification-failed'
/**
 * Lean accepted the source and ran it, and what came back is not this machine's
 * table: a cell short, a cell twice, a line that does not parse.
 *
 * The source is sound; its table is not the one the spec describes.
 */
 | 'extraction-failed'
/** Lean was still working when `timeoutMs` ran out. Nothing was established. */
 | 'timed-out'
/** `opts.skip` or `KIWA_LEAN_SKIP_VERIFY=1`. Nothing was established. */
 | 'skipped-by-env'
/** Lean printed more cells than the buffer holds. Nothing was established. */
 | 'output-too-large';
```

#### <code v-pre>LeanTableReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L256) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export interface LeanTableReport {
    status: ExtractStatus;
    ok: boolean;
    checked: number;
    disagreements: readonly TableDisagreement[];
    diagnostics?: string;
}
```

#### <code v-pre>TableDisagreement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L246) <code v-pre>packages/lean/src/extract.ts</code>

```ts
export interface TableDisagreement {
    state: string;
    event: string;
    /** The target the spec names, or `null` when it refuses the cell. */
    spec: string | null;
    /** The target Lean computes, or `null` when it refuses the cell. */
    lean: string | null;
    message: string;
}
```
