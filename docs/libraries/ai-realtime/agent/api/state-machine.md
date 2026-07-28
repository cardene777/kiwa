---
title: "@kiwa-lab/agent state-machine の API 契約"
---

# <code v-pre>@kiwa-lab/agent</code> <code v-pre>state-machine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>DEFAULT&#95;MAX&#95;STEPS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L35) <code v-pre>packages/agent/src/state-machine.ts</code>

runtime cycle 検出 — 同一 node が 2 回以上 visit されたら循環と判定する。 real LangGraph は cycle 許容だが (agent loop の中核)、 v0.1 mock は simplicity 優先で 「visit 上限を突破したら halt + throw」 に倒す。 default 上限は 100 step。

```ts
export declare const DEFAULT_MAX_STEPS = 100;
```

#### <code v-pre>GraphCompileError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L44) <code v-pre>packages/agent/src/state-machine.ts</code>

compile 失敗 error — validate 時に投げる。

```ts
export declare class GraphCompileError extends Error {
    constructor(message: string);
}
```

#### <code v-pre>MaxStepsExceededError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L52) <code v-pre>packages/agent/src/state-machine.ts</code>

runtime 最大 step 突破 error。

```ts
export declare class MaxStepsExceededError extends Error {
    readonly steps: number;
    constructor(steps: number);
}
```

#### <code v-pre>StateMachine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L65) <code v-pre>packages/agent/src/state-machine.ts</code>

StateMachine — pure state graph 実行 engine。 langgraph.ts の StateGraph が 内部で使う。 直接叩くのも可 (低水準 API として export)。

```ts
/**
 * StateMachine — pure state graph 実行 engine。 langgraph.ts の StateGraph が
 * 内部で使う。 直接叩くのも可 (低水準 API として export)。
 */
export declare class StateMachine<TState extends AgentState = AgentState> {
    /** node を登録。 同名 node は上書きする。 */
    addNode(name: string, handler: NodeHandler<TState>): this;
    /** edge を追加。 from / to は node 名 or START / END sentinel。 */
    addEdge(from: string, to: string): this;
    /** node 数 (test / debug 用)。 */
    get nodeCount(): number;
    /** edge 数 (test / debug 用)。 */
    get edgeCount(): number;
    /** compile 済かどうか (test / debug 用)。 */
    get isCompiled(): boolean;
    /**
     * validate + compile — validate 6 項目を fail-fast で確認、 pass なら
     * `compiled = true` を立てて invoke / stream 可能状態にする。
     */
    compile(): this;
    /**
     * invoke — 初期 state から実行、 END に到達した final state を返す。 compile
     * 未実施なら throw。
     */
    invoke(initialState: TState, options?: RunOptions): Promise<TState>;
    /**
     * stream — 各 node 実行後の {node, patch, state} を順次 yield。 END に到達した
     * 時点で generator は終了する。
     */
    stream(initialState: TState, options?: RunOptions): AsyncGenerator<{
        node: string;
        patch: Partial<TState>;
        state: TState;
    }, void, void>;
}
```

### 型

#### <code v-pre>RunOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L38) <code v-pre>packages/agent/src/state-machine.ts</code>

invoke / stream 実行時 config。

```ts
export interface RunOptions {
    /** 最大 step 数、 突破したら `MaxStepsExceededError` を throw。 default 100。 */
    maxSteps?: number;
}
```
