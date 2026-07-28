---
title: "@kiwa-lab/agent langgraph の API 契約"
---

# <code v-pre>@kiwa-lab/agent</code> <code v-pre>langgraph</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>CompiledGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts#L85) <code v-pre>packages/agent/src/langgraph.ts</code>

CompiledGraph — StateGraph.compile() 後の実行可能 graph。 real LangGraph の compiled graph に対応、 invoke + stream の 2 実行モード。

```ts
/**
 * CompiledGraph — StateGraph.compile() 後の実行可能 graph。 real LangGraph の
 * compiled graph に対応、 invoke + stream の 2 実行モード。
 */
export declare class CompiledGraph<TState extends AgentState = AgentState> {
    constructor(machine: StateMachine<TState>);
    /**
     * invoke — 初期 state から実行し END 到達時の final state を返す。 中間 step
     * を捨てて final だけ欲しい場合の shortcut。
     */
    invoke(initialState: TState, options?: RunOptions): Promise<TState>;
    /**
     * stream — 各 node 実行後の GraphStep (node 名 + patch + merge 後 state) を
     * 順次 yield。 END 到達時点で generator 終了。 real LangGraph の `stream()`
     * (default mode = "values") に整合。
     */
    stream(initialState: TState, options?: RunOptions): AsyncGenerator<GraphStep<TState>, void, void>;
}
```

#### <code v-pre>StateGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts#L46) <code v-pre>packages/agent/src/langgraph.ts</code>

StateGraph builder — node / edge を組んで compile() で `CompiledGraph` を得る。 real LangGraph の `StateGraph` に対応。

```ts
/**
 * StateGraph builder — node / edge を組んで compile() で `CompiledGraph` を得る。
 * real LangGraph の `StateGraph` に対応。
 */
export declare class StateGraph<TState extends AgentState = AgentState> {
    /** node を追加。 handler は現 state から partial state を返す (同期 / 非同期両対応)。 */
    addNode(name: string, handler: NodeHandler<TState>): this;
    /**
     * edge を追加。 `from` は node 名 or `START`、 `to` は node 名 or `END`。
     * v0.1 は unconditional edge のみ (conditional_edges は v0.2)。
     */
    addEdge(from: string | typeof START, to: string | typeof END): this;
    /** compile + validate、 CompiledGraph を返す。 */
    compile(): CompiledGraph<TState>;
    /** node 数 (test / debug 用)。 */
    get nodeCount(): number;
    /** edge 数 (test / debug 用)。 */
    get edgeCount(): number;
}
```


