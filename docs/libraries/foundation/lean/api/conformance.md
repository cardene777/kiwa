---
title: "@kiwa-lab/lean conformance の API 契約"
---

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>conformance</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkConformance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L75) <code v-pre>packages/lean/src/conformance.ts</code>

Compare an implementation against a spec. Every cell is asked about, including the ones the spec refuses: an implementation that quietly accepts an event the spec calls impossible is the more dangerous half of the disagreement, and it is the half a test written from the spec's happy path never reaches.

```ts
export declare function checkConformance(spec: OrchestratorSpec, observe: Observe): ConformanceReport;
```

#### <code v-pre>formatConformance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L187) <code v-pre>packages/lean/src/conformance.ts</code>

Render a report for a test failure message, one disagreement per line.

```ts
export declare function formatConformance(spec: OrchestratorSpec, report: ConformanceReport): string;
```

### 型

#### <code v-pre>ConformanceReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L56) <code v-pre>packages/lean/src/conformance.ts</code>

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

#### <code v-pre>Disagreement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L44) <code v-pre>packages/lean/src/conformance.ts</code>

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

#### <code v-pre>DisagreementKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L34) <code v-pre>packages/lean/src/conformance.ts</code>

```ts
export type DisagreementKind = 
/** The spec names a target; the implementation refused the event. */
'impl-rejects'
/** The spec refuses the event; the implementation took it somewhere. */
 | 'impl-accepts'
/** Both accept, and they land in different states. */
 | 'different-target'
/** The implementation landed somewhere the spec has never heard of. */
 | 'unknown-state';
```

#### <code v-pre>Observation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L20) <code v-pre>packages/lean/src/conformance.ts</code>

What an implementation did with one cell.

```ts
export type Observation = {
    kind: 'to';
    state: string;
} | {
    kind: 'rejected';
};
```

#### <code v-pre>Observe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/conformance.ts#L32) <code v-pre>packages/lean/src/conformance.ts</code>

Put the machine in `state`, feed it `event`, and say what happened. Return `{ kind: 'rejected' }` when the implementation refuses the event, by whatever means it refuses: throwing, returning a marker, leaving the state untouched and logging. Deciding what counts as a refusal is the caller's, since only they know what their code does when it disagrees with its input.

```ts
export type Observe = (state: string, event: string) => Observation;
```
