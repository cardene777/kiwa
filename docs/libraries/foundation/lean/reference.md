# Lean リファレンス

`@kiwa-lab/lean` は遷移表の生成と Lean 4 による検証を提供します。

## 公開 API

`generateLeanSpec` は状態表から Lean source を生成します。`checkConformance` は observer で実装を全 cell 観測します。生成済み source を検証するには `checkLeanTable` と `extractLeanTable` を、Lean で elaboration を行うには `verifyLeanSpec` を使います。Lake project のファイルだけが必要な場合は `generateLakeProject` を使います。各引数と戻り値はこのページ後半の API 契約を参照してください。

## 設定

`OrchestratorSpec` はmodule名、namespace、states、events、transitionsを持ちます。未指定遷移は `unspecified` で扱います。`invalid` は表にないcellを拒否として埋め、`error` は未指定cellが一つでもあればspec errorにします。

## 後始末

Leanを実行するAPIはproject fileを作る場合があります。出力先をテストごとに分けます。`verifyLeanSpec` とtable extractionはLean binary、timeout、skip、output上限をstatusとして返すため、結果の種類を確認してください。

## 検証結果

`generateLeanSpec` はsource、推奨path、transition数、invalid transition数、terminal state、sink stateを返します。`checkLeanTable` はLean sourceの表とspecを全cellで比較し、sourceが検証できない場合も `ok: false` にします。実行を伴う非同期版は `verifyLeanSpecAsync`、`checkLeanTableAsync`、`extractLeanTableAsync` を使います。

`checkConformance` はspecの全状態×全eventをobserverへ渡し、実装が拒否した、specが拒否するeventを実装が受理した、異なるstateへ遷移した、未知stateへ遷移した、の4種類をreportします。observerの不正な戻り値は `UsageError` をthrowします。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `checkConformance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L75) `packages/lean/src/conformance.ts`

Compare an implementation against a spec. Every cell is asked about, including the ones the spec refuses: an implementation that quietly accepts an event the spec calls impossible is the more dangerous half of the disagreement, and it is the half a test written from the spec's happy path never reaches.

```ts
export function checkConformance(spec: OrchestratorSpec, observe: Observe): ConformanceReport;
```

#### `checkLeanTable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L283) `packages/lean/src/extract.ts`

Ask Lean what table a source holds, and compare it with the spec. `ok` is false when Lean could not be run, since a check that did not happen has established nothing. `status` says which it was.

```ts
export function checkLeanTable(
  spec: OrchestratorSpec,
  opts: CheckLeanTableOptions = {},
): LeanTableReport;
```

#### `checkLeanTableAsync`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L299) `packages/lean/src/extract.ts`

The same comparison, awaited. A caller with five machines runs Lean five times. Through `checkLeanTable` they run one after another, because a synchronous call gives no other option: five of them took 1462ms, and the same five Lean processes started at once finished in 169ms. Awaiting these, a `Promise.all` is the caller's to write.

```ts
export async function checkLeanTableAsync(
  spec: OrchestratorSpec,
  opts: CheckLeanTableOptions = {},
): Promise<LeanTableReport>;
```

#### `extractLeanTable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L140) `packages/lean/src/extract.ts`

Run a generated Lean source and read back the table it computes. `source` is taken rather than generated so that a test can hand in a file with one cell moved, which is the only way to know this function can fail.

```ts
export function extractLeanTable(
  source: string,
  spec: OrchestratorSpec,
  opts: ExtractOptions = {},
): ExtractResult;
```

#### `extractLeanTableAsync`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L159) `packages/lean/src/extract.ts`

The same extraction, awaited. `execFileSync` stops the event loop while Lean works. This does not. Every decision below the run belongs to `interpretExtract`, which both call, so a rule learned by one path cannot be missed by the other.

```ts
export async function extractLeanTableAsync(
  source: string,
  spec: OrchestratorSpec,
  opts: ExtractOptions = {},
): Promise<ExtractResult>;
```

#### `formatConformance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L187) `packages/lean/src/conformance.ts`

Render a report for a test failure message, one disagreement per line.

```ts
export function formatConformance(spec: OrchestratorSpec, report: ConformanceReport): string;
```

#### `generateLakeProject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L48) `packages/lean/src/lake.ts`

```ts
export function generateLakeProject(config: LakeProjectConfig): LakeProjectFiles;
```

#### `generateLeanSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/generator.ts#L57) `packages/lean/src/generator.ts`

Generate a Lean 4 spec for a lifecycle-orchestrator state machine. The generated file lists every `(state, event)` cell and has no catch-all. That is deliberate: Lean refuses a non-exhaustive match, so the exhaustiveness of the table is checked by Lean rather than asserted by a theorem that cannot fail. ```lean inductive Step where | to : State → Step | invalid : Step def dispatch : State → Event → Step | .Beginning, .BeginCompleted =&gt; .to .Active | .Beginning, .QueryExecuted =&gt; .invalid ... theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by intro e; cases e &lt;;&gt; rfl theorem beginning_can_leave : ∃ e, escapes .Beginning e = true := ⟨.BeginCompleted, rfl⟩ ``` The theorems say things a reader could otherwise get wrong: which states are terminal, which can actually be left, which accept events and go nowhere, and which paths reach which states. Their proofs are mechanical because the generator already knows the table, and they fail to compile if it is misread.

```ts
export function generateLeanSpec(spec: OrchestratorSpec): LeanSpecOutput;
```

#### `isInvalid`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L37) `packages/lean/src/types.ts`

```ts
export function isInvalid(t: Transition): t is InvalidTransition;
```

#### `LeanError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L11) `packages/lean/src/errors.ts`

Base class, so `catch (e) { if (e instanceof LeanError) ... }` works.

```ts
export declare class LeanError extends Error {
  constructor(message: string);
}
```

#### `SpecError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L26) `packages/lean/src/errors.ts`

The spec cannot be turned into a machine: a name that is not usable, a cell nobody declared, a state nothing reaches, a table that contradicts what the author said about it.

```ts
export declare class SpecError extends LeanError {}
```

#### `UsageError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L32) `packages/lean/src/errors.ts`

The call itself is wrong, whatever the spec says: no specs to verify, two specs that would land on one path.

```ts
export declare class UsageError extends LeanError {}
```

#### `verifyLeanSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L107) `packages/lean/src/verify.ts`

Verify one or more generated Lean specs by elaborating them with Lean. Behavior: - If Lean is not installed (or `leanBin` is not on PATH), returns `{ status: 'lean-not-installed' }` without throwing. - If `opts.skip === true` or `KIWA_LEAN_SKIP_VERIFY=1`, returns `{ status: 'skipped-by-env' }`. - Otherwise writes the specs into one file and runs `lean` over it once. A non-zero exit surfaces as `{ status: 'verification-failed', diagnostics }`, with positions named after the spec they came from, and a run that outlives `timeoutMs` as `{ status: 'timed-out' }`. Success returns `{ status: 'ok', verifiedFiles }`. Lean is invoked with the file as its only argument. It has no `--check` flag, and it refuses more than one file: elaborating a file *is* checking it, and a failed proof or a non-exhaustive match is a non-zero exit. Passing an unrecognized flag makes every file fail identically, which reads as "the spec is wrong" when it means "the command was wrong". No Lake project is written. Building one and then never calling `lake` is what this used to do, and the lakefile it wrote had no effect on anything. Generated specs import nothing, so they need no build system to be checked. The one file that would have an effect is `lean-toolchain`, and it is written only when `leanToolchain` asks for it. The scratch directory is always cleaned up (best effort) on return.

```ts
export function verifyLeanSpec(
  specs: readonly LeanSpecOutput[],
  opts: VerifyOptions = {},
): VerifyResult;
```

#### `verifyLeanSpecAsync`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L130) `packages/lean/src/verify.ts`

The same verification, awaited. `execFileSync` stops the event loop for as long as Lean works — a hundred and thirty-nine milliseconds on the smallest machine in this repository, during which a five-millisecond timer fires exactly zero times. A build plugin, a watch mode, or a server sharing the process freezes with it. Everything this decides is decided by `planVerify` and `interpretVerify`, which the synchronous function calls too. The only difference is which of the two runners does the waiting.

```ts
export async function verifyLeanSpecAsync(
  specs: readonly LeanSpecOutput[],
  opts: VerifyOptions = {},
): Promise<VerifyResult>;
```

### 型

#### `CheckLeanTableOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L264) `packages/lean/src/extract.ts`

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

#### `ConformanceReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L56) `packages/lean/src/conformance.ts`

```ts
export interface ConformanceReport {
  ok: boolean;
  /** Cells examined: `states × events`. */
  checked: number;
  /** Cells where both move the machine to the same state. */
  agreedTransitions: number;
  /** Cells both refuse. */
  agreedRejections: number;
  disagreements: readonly Disagreement[];
}
```

#### `Disagreement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L44) `packages/lean/src/conformance.ts`

```ts
export interface Disagreement {
  state: string;
  event: string;
  kind: DisagreementKind;
  /** The target the spec names, or `null` when it refuses the cell. */
  spec: string | null;
  /** Where the implementation landed, or `null` when it refused. */
  impl: string | null;
  /** One sentence, in the terms the caller uses. */
  message: string;
}
```

#### `DisagreementKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L34) `packages/lean/src/conformance.ts`

```ts
export type DisagreementKind =
  /** The spec names a target; the implementation refused the event. */
  | 'impl-rejects'
  /** The spec refuses the event; the implementation took it somewhere. */
  | 'impl-accepts'
  /** Both accept, and they land in different states. */
  | 'different-target'
  /** The implementation landed somewhere the spec has never heard of. */
  | 'unknown-state';
```

#### `ExtractOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L123) `packages/lean/src/extract.ts`

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

#### `ExtractResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L115) `packages/lean/src/extract.ts`

```ts
export interface ExtractResult {
  status: ExtractStatus;
  /** `null` marks a rejected cell. Present only when `status === 'ok'`. */
  table?: Table;
  /** What Lean said, when it refused or printed something unreadable. */
  diagnostics?: string;
}
```

#### `ExtractStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L90) `packages/lean/src/extract.ts`

```ts
export type ExtractStatus =
  | 'ok'
  | 'lean-not-installed'
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

#### `InvalidTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L29) `packages/lean/src/types.ts`

A cell the machine rejects. This is distinct from a self-loop. `{ from: 'active', event: 'query', to: 'active' }` says the event is expected and changes nothing; `{ from: 'active', event: 'commit', invalid: true }` says the event must never arrive in this state. Collapsing the two hides the second one, which is the bug the machine exists to surface.

```ts
export interface InvalidTransition {
  from: string;
  event: string;
  invalid: true;
}
```

#### `LakeProjectConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L16) `packages/lean/src/lake.ts`

```ts
export interface LakeProjectConfig {
  /** Package name (kebab-case), becomes the Lake package name. */
  packageName: string;
  /** Root Lean namespace (PascalCase), becomes the library and its directory. */
  rootNamespace: string;
  /** Lean toolchain version — pinned so specs are reproducible. */
  leanToolchain?: string;
  /**
   * Module basenames placed under `<rootNamespace>/`, without the extension.
   *
   * The glob already brings them into the build, so this only decides whether
   * `import <rootNamespace>` alone reaches them. Naming them makes the root
   * module a table of contents rather than an empty file.
   */
  modules?: readonly string[];
}
```

#### `LakeProjectFiles`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L33) `packages/lean/src/lake.ts`

```ts
export interface LakeProjectFiles {
  files: Record<string, string>;
}
```

#### `LeanRunOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lean-runner.ts#L35) `packages/lean/src/lean-runner.ts`

```ts
export interface LeanRunOptions {
  /**
   * Lean toolchain to pin, written to `lean-toolchain` beside the source.
   *
   * `elan` reads that file from the working directory and runs the version it
   * names, downloading it first if the machine does not have it. Left unset, the
   * machine's own Lean does the work.
   */
  leanToolchain?: string;
  /** Override for the Lean executable. Default: `lean` on PATH. */
  leanBin?: string;
  /** Where the scratch directory is created. Default: the OS temp directory. */
  workDir?: string;
  /** Timeout for the Lean subprocess in ms. Default: 60_000. */
  timeoutMs?: number;
  /**
   * How many bytes Lean may print before the rest is thrown away.
   *
   * Default: 64 MiB, about a million cells. A run that exceeds it reports
   * `output-too-large` rather than a verdict, since the answer existed and was
   * lost.
   */
  maxOutputBytes?: number;
}
```

#### `LeanSpecOutput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L89) `packages/lean/src/types.ts`

```ts
export interface LeanSpecOutput {
  /** Lean 4 source content (single file). */
  source: string;
  /** Suggested file path relative to the Lake project root. */
  path: string;
  /** Metadata for downstream tooling. */
  meta: {
    stateCount: number;
    eventCount: number;
    cellCount: number;
    validTransitionCount: number;
    invalidTransitionCount: number;
    /** States from which no event leads anywhere. Each gets an absorbing theorem. */
    terminalStates: readonly string[];
    /**
     * States that accept events and never leave, because every valid cell loops
     * back to themselves. Not terminal, and not escapable: a machine that enters
     * one stays there while still answering events. Each gets a `no_escape`
     * theorem, and each is worth a second look at the table.
     */
    sinkStates: readonly string[];
    /**
     * A shortest path of events from `initial` to each other state, present only
     * when `initial` was given. Each becomes a reachability theorem.
     */
    reachablePaths?: Readonly<Record<string, readonly string[]>>;
  };
}
```

#### `LeanTableReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L256) `packages/lean/src/extract.ts`

```ts
export interface LeanTableReport {
  status: ExtractStatus;
  ok: boolean;
  checked: number;
  disagreements: readonly TableDisagreement[];
  diagnostics?: string;
}
```

#### `Observation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L20) `packages/lean/src/conformance.ts`

What an implementation did with one cell.

```ts
export type Observation =
  | { kind: 'to'; state: string }
  | { kind: 'rejected' };
```

#### `Observe`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L32) `packages/lean/src/conformance.ts`

Put the machine in `state`, feed it `event`, and say what happened. Return `{ kind: 'rejected' }` when the implementation refuses the event, by whatever means it refuses: throwing, returning a marker, leaving the state untouched and logging. Deciding what counts as a refusal is the caller's, since only they know what their code does when it disagrees with its input.

```ts
export type Observe = (state: string, event: string) => Observation;
```

#### `OrchestratorSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L53) `packages/lean/src/types.ts`

```ts
export interface OrchestratorSpec {
  /** Snake-case module name, becomes the Lean file basename. */
  moduleName: string;
  /** Human-readable orchestrator name for the Lean namespace. */
  namespace: string;
  /** Each state maps to a Lean inductive constructor. */
  states: readonly string[];
  /** Each event maps to a Lean inductive constructor. */
  events: readonly string[];
  /**
   * The transition table. Every `(state, event)` cell must appear, either as a
   * target or as an explicit rejection, unless `unspecified` says otherwise.
   */
  transitions: readonly Transition[];
  /** How to treat cells the table never mentions. Default: `error`. */
  unspecified?: UnspecifiedPolicy;
  /**
   * The state the machine starts in.
   *
   * Naming it turns on reachability. Every other state gets a theorem carrying a
   * path of events from here to there, which Lean checks. A state with no such
   * path cannot be given one, so generation stops and names it: a state nothing
   * can reach is a state that exists only in the type.
   */
  initial?: string;
  /**
   * The states the author believes are terminal.
   *
   * Naming them checks the belief against the table. A state listed here that
   * has a way out, or a state left out that has none, stops generation. Both are
   * disagreements between what the author meant and what the table says, and the
   * table is not always the one that is wrong.
   */
  terminal?: readonly string[];
}
```

#### `Table`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/table.ts#L15) `packages/lean/src/table.ts`

`null` marks a rejected cell; a string is the target state.

```ts
export type Table = ReadonlyMap<string, string | null>;
```

#### `TableDisagreement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/extract.ts#L246) `packages/lean/src/extract.ts`

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

#### `Transition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L35) `packages/lean/src/types.ts`

```ts
export type Transition = ValidTransition | InvalidTransition;
```

#### `UnspecifiedPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L51) `packages/lean/src/types.ts`

What to do with a `(state, event)` cell the spec never mentions. `error` — refuse to generate, and name the cells. The default. An unmentioned cell is a cell nobody decided about, and the whole point of writing the table down is to have decided. `invalid` — treat it as rejected. Choose this when the table is large and most of it is rejection, and say so out loud by passing the option.

```ts
export type UnspecifiedPolicy = 'error' | 'invalid';
```

#### `ValidTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L14) `packages/lean/src/types.ts`

A cell that moves the machine from `from` to `to` when `event` arrives.

```ts
export interface ValidTransition {
  from: string;
  event: string;
  /** May equal `from`: a self-loop is a decision, not an omission. */
  to: string;
}
```

#### `VerifyOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L21) `packages/lean/src/verify.ts`

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

#### `VerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L58) `packages/lean/src/verify.ts`

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

#### `VerifyStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/verify.ts#L11) `packages/lean/src/verify.ts`

```ts
export type VerifyStatus =
  | 'ok'
  | 'lean-not-installed'
  | 'skipped-by-env'
  | 'verification-failed'
  /** Lean was still working when `timeoutMs` ran out. Nothing was established. */
  | 'timed-out'
  /** Lean printed more than the buffer holds. Nothing was established. */
  | 'output-too-large';
```
<!-- kiwa-public-api:end -->
