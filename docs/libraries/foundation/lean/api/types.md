---
title: "@kiwa-lab/lean types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>isInvalid</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L37) <code v-pre>packages/lean/src/types.ts</code>

```ts
export declare function isInvalid(t: Transition): t is InvalidTransition;
```

### 型

#### <code v-pre>InvalidTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L29) <code v-pre>packages/lean/src/types.ts</code>

A cell the machine rejects. This is distinct from a self-loop. `{ from: 'active', event: 'query', to: 'active' }` says the event is expected and changes nothing; `{ from: 'active', event: 'commit', invalid: true }` says the event must never arrive in this state. Collapsing the two hides the second one, which is the bug the machine exists to surface.

```ts
export interface InvalidTransition {
    from: string;
    event: string;
    invalid: true;
}
```

#### <code v-pre>LeanSpecOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L89) <code v-pre>packages/lean/src/types.ts</code>

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

#### <code v-pre>OrchestratorSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L53) <code v-pre>packages/lean/src/types.ts</code>

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

#### <code v-pre>Transition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L35) <code v-pre>packages/lean/src/types.ts</code>

```ts
export type Transition = ValidTransition | InvalidTransition;
```

#### <code v-pre>UnspecifiedPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L51) <code v-pre>packages/lean/src/types.ts</code>

What to do with a `(state, event)` cell the spec never mentions. `error` — refuse to generate, and name the cells. The default. An unmentioned cell is a cell nobody decided about, and the whole point of writing the table down is to have decided. `invalid` — treat it as rejected. Choose this when the table is large and most of it is rejection, and say so out loud by passing the option.

```ts
export type UnspecifiedPolicy = 'error' | 'invalid';
```

#### <code v-pre>ValidTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/types.ts#L14) <code v-pre>packages/lean/src/types.ts</code>

A cell that moves the machine from `from` to `to` when `event` arrives.

```ts
export interface ValidTransition {
    from: string;
    event: string;
    /** May equal `from`: a self-loop is a decision, not an omission. */
    to: string;
}
```
