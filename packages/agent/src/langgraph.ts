import {
  StateMachine,
  type RunOptions,
} from './state-machine.js';
import {
  END,
  START,
  type AgentState,
  type GraphStep,
  type NodeHandler,
} from './types.js';

/**
 * LangGraph 型 API wrapper — real LangGraph (langchain-ai/langgraphjs) の
 * `StateGraph` に整合した SSOT 語彙で kiwa mock を提供する。 内部は
 * state-machine.ts の `StateMachine` を使う (2 layer 責務分離、 実装 SSOT は
 * state-machine.ts、 語彙 SSOT は本 file)。
 *
 * ### real LangGraph との対応表
 *
 * | real LangGraph API | kiwa mock 対応 |
 * |---|---|
 * | `new StateGraph(channels)` | `new StateGraph<TState>()` (v0.1 は channels 不要、 shallow merge) |
 * | `graph.addNode(name, fn)` | `graph.addNode(name, handler)` |
 * | `graph.addEdge(from, to)` | `graph.addEdge(from, to)` (unconditional edge) |
 * | `graph.setEntryPoint(name)` | `graph.addEdge(START, name)` に統一 |
 * | `graph.setFinishPoint(name)` | `graph.addEdge(name, END)` に統一 |
 * | `graph.compile()` | `graph.compile()` → `CompiledGraph` を返す |
 * | `compiled.invoke(state)` | `compiled.invoke(state)` |
 * | `compiled.stream(state)` | `compiled.stream(state)` async generator |
 *
 * ### 未対応 (v0.2 以降)
 *
 * - `addConditionalEdges(from, router, mapping)` — conditional routing
 * - `channels` の reducer (LastValue / Topic / Ephemeral)、 v0.1 は shallow merge default
 * - `interrupt` / `checkpointer` — human-in-the-loop + persist
 */

/** START / END sentinel を re-export、 langgraph 使用側で 1 import で済むように。 */
export { END, START } from './types.js';

/**
 * StateGraph builder — node / edge を組んで compile() で `CompiledGraph` を得る。
 * real LangGraph の `StateGraph` に対応。
 */
export class StateGraph<TState extends AgentState = AgentState> {
  private readonly machine = new StateMachine<TState>();

  /** node を追加。 handler は現 state から partial state を返す (同期 / 非同期両対応)。 */
  addNode(name: string, handler: NodeHandler<TState>): this {
    this.machine.addNode(name, handler);
    return this;
  }

  /**
   * edge を追加。 `from` は node 名 or `START`、 `to` は node 名 or `END`。
   * v0.1 は unconditional edge のみ (conditional_edges は v0.2)。
   */
  addEdge(from: string | typeof START, to: string | typeof END): this {
    this.machine.addEdge(from, to);
    return this;
  }

  /** compile + validate、 CompiledGraph を返す。 */
  compile(): CompiledGraph<TState> {
    this.machine.compile();
    return new CompiledGraph<TState>(this.machine);
  }

  /** node 数 (test / debug 用)。 */
  get nodeCount(): number {
    return this.machine.nodeCount;
  }

  /** edge 数 (test / debug 用)。 */
  get edgeCount(): number {
    return this.machine.edgeCount;
  }
}

/**
 * CompiledGraph — StateGraph.compile() 後の実行可能 graph。 real LangGraph の
 * compiled graph に対応、 invoke + stream の 2 実行モード。
 */
export class CompiledGraph<TState extends AgentState = AgentState> {
  constructor(private readonly machine: StateMachine<TState>) {}

  /**
   * invoke — 初期 state から実行し END 到達時の final state を返す。 中間 step
   * を捨てて final だけ欲しい場合の shortcut。
   */
  async invoke(initialState: TState, options?: RunOptions): Promise<TState> {
    return this.machine.invoke(initialState, options);
  }

  /**
   * stream — 各 node 実行後の GraphStep (node 名 + patch + merge 後 state) を
   * 順次 yield。 END 到達時点で generator 終了。 real LangGraph の `stream()`
   * (default mode = "values") に整合。
   */
  async *stream(
    initialState: TState,
    options?: RunOptions,
  ): AsyncGenerator<GraphStep<TState>, void, void> {
    for await (const step of this.machine.stream(initialState, options)) {
      yield step;
    }
  }
}
