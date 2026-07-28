---
title: "@kiwa-lab/lean verify の API 契約"
---

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>verify</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>verifyLeanSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L107) <code v-pre>packages/lean/src/verify.ts</code>

Verify one or more generated Lean specs by elaborating them with Lean. Behavior: - If Lean is not installed (or `leanBin` is not on PATH), returns `{ status: 'lean-not-installed' }` without throwing. - If `opts.skip === true` or `KIWA_LEAN_SKIP_VERIFY=1`, returns `{ status: 'skipped-by-env' }`. - Otherwise writes the specs into one file and runs `lean` over it once. A non-zero exit surfaces as `{ status: 'verification-failed', diagnostics }`, with positions named after the spec they came from, and a run that outlives `timeoutMs` as `{ status: 'timed-out' }`. Success returns `{ status: 'ok', verifiedFiles }`. Lean is invoked with the file as its only argument. It has no `--check` flag, and it refuses more than one file: elaborating a file *is* checking it, and a failed proof or a non-exhaustive match is a non-zero exit. Passing an unrecognized flag makes every file fail identically, which reads as "the spec is wrong" when it means "the command was wrong". No Lake project is written. Building one and then never calling `lake` is what this used to do, and the lakefile it wrote had no effect on anything. Generated specs import nothing, so they need no build system to be checked. The one file that would have an effect is `lean-toolchain`, and it is written only when `leanToolchain` asks for it. The scratch directory is always cleaned up (best effort) on return.

```ts
export declare function verifyLeanSpec(specs: readonly LeanSpecOutput[], opts?: VerifyOptions): VerifyResult;
```

#### <code v-pre>verifyLeanSpecAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L130) <code v-pre>packages/lean/src/verify.ts</code>

The same verification, awaited. `execFileSync` stops the event loop for as long as Lean works — a hundred and thirty-nine milliseconds on the smallest machine in this repository, during which a five-millisecond timer fires exactly zero times. A build plugin, a watch mode, or a server sharing the process freezes with it. Everything this decides is decided by `planVerify` and `interpretVerify`, which the synchronous function calls too. The only difference is which of the two runners does the waiting.

```ts
export declare function verifyLeanSpecAsync(specs: readonly LeanSpecOutput[], opts?: VerifyOptions): Promise<VerifyResult>;
```

### 型

#### <code v-pre>VerifyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L21) <code v-pre>packages/lean/src/verify.ts</code>

```ts
export interface VerifyOptions {
    /** Root namespace under which specs will be organized. Default: `KiwaSpecs`. */
    rootNamespace?: string;
    /**
     * Lean toolchain to pin, written to `lean-toolchain` beside the specs.
     *
     * `elan`, which is how Lean is normally installed, reads that file from the
     * working directory and runs the version it names — downloading it first if the
     * machine does not have it.
     *
     * Left unset, no such file is written and the machine's own Lean does the
     * checking. That is the default because pinning a version here makes a
     * contributor who already has a working Lean fetch a second one to check specs
     * that both would judge the same way. The generated source is verified against
     * v4.12.0 through v4.31.0, which all reject the same specs.
     *
     * Set it when a run has to be reproducible down to the compiler.
     */
    leanToolchain?: string;
    /**
     * When set to `true`, skips verification entirely and returns
     * `{ status: 'skipped-by-env' }`. Use in CI / offline environments where
     * Lean is unavailable but the caller wants a deterministic no-op result.
     * Also skipped when `process.env.KIWA_LEAN_SKIP_VERIFY === '1'`.
     */
    skip?: boolean;
    /**
     * Override for the Lean executable path. Default: `lean` on PATH.
     * Useful for testing / sandboxed environments.
     */
    leanBin?: string;
    /** Where the scratch directory is created. Default: the OS temp directory. */
    workDir?: string;
    /** Timeout for the Lean subprocess in ms. Default: 60_000. */
    timeoutMs?: number;
}
```

#### <code v-pre>VerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L58) <code v-pre>packages/lean/src/verify.ts</code>

```ts
export interface VerifyResult {
    status: VerifyStatus;
    /**
     * What Lean said when it refused. Non-empty only when
     * `status === 'verification-failed'`.
     *
     * Lean writes its diagnostics to stdout, not stderr, so a caller reading
     * `stderr` alone learns that verification failed and nothing about why. This
     * field carries whichever stream spoke.
     */
    diagnostics?: string;
    /** stderr captured from Lean. Usually empty; Lean reports on stdout. */
    stderr?: string;
    /** stdout captured from Lean. Carries the errors when a proof fails. */
    stdout?: string;
    /** Namespaced paths of files that were verified. */
    verifiedFiles: string[];
    /** Optional reason for skip / not-installed status. */
    reason?: string;
}
```

#### <code v-pre>VerifyStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L11) <code v-pre>packages/lean/src/verify.ts</code>

```ts
export type VerifyStatus = 'ok' | 'lean-not-installed' | 'skipped-by-env' | 'verification-failed'
/** Lean was still working when `timeoutMs` ran out. Nothing was established. */
 | 'timed-out'
/** Lean printed more than the buffer holds. Nothing was established. */
 | 'output-too-large';
```
