import {
  END,
  START,
  type AgentState,
  type GraphEdge,
  type NodeHandler,
} from './types.js';

/**
 * Low-level state machine primitives — LangGraph 型 API (langgraph.ts) の
 * backing store。 `StateMachine` は node registry + edge registry + validation
 * + execution runner に責務分離、 langgraph.ts は SSOT 語彙 (StateGraph +
 * addNode + addEdge + compile) を wrapping する。
 *
 * ### 責務分離
 *
 * - `StateMachine` — node / edge の登録 + validate + 実行 (invoke / stream)
 * - `StateGraph` (langgraph.ts) — real LangGraph に整合した API + compile 語彙
 *
 * ### validate 項目 (compile 時 fail-fast)
 *
 * 1. START edge が最低 1 本存在する
 * 2. START edge の to が存在する node (or END)
 * 3. 全 edge の to が存在する node (or END)
 * 4. 全 edge の from が存在する node (or START)
 * 5. 全 node に out-edge が最低 1 本存在する (isolated node 検出)
 * 6. START edge は 1 本のみ (v0.1 は multi-entry 未対応)
 */

/**
 * runtime cycle 検出 — 同一 node が 2 回以上 visit されたら循環と判定する。 real
 * LangGraph は cycle 許容だが (agent loop の中核)、 v0.1 mock は simplicity 優先で
 * 「visit 上限を突破したら halt + throw」 に倒す。 default 上限は 100 step。
 */
export const DEFAULT_MAX_STEPS = 100;

/** invoke / stream 実行時 config。 */
export interface RunOptions {
  /** 最大 step 数、 突破したら `MaxStepsExceededError` を throw。 default 100。 */
  maxSteps?: number;
}

/** compile 失敗 error — validate 時に投げる。 */
export class GraphCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphCompileError';
  }
}

/** runtime 最大 step 突破 error。 */
export class MaxStepsExceededError extends Error {
  readonly steps: number;
  constructor(steps: number) {
    super(`state machine exceeded max steps: ${steps}`);
    this.name = 'MaxStepsExceededError';
    this.steps = steps;
  }
}

/**
 * StateMachine — pure state graph 実行 engine。 langgraph.ts の StateGraph が
 * 内部で使う。 直接叩くのも可 (低水準 API として export)。
 */
export class StateMachine<TState extends AgentState = AgentState> {
  private readonly nodes = new Map<string, NodeHandler<TState>>();
  private readonly edges: GraphEdge[] = [];
  private compiled = false;

  /** node を登録。 同名 node は上書きする。 */
  addNode(name: string, handler: NodeHandler<TState>): this {
    if (!name || name.trim() === '') {
      throw new GraphCompileError('node name must be a non-empty string');
    }
    if (name === START || name === END) {
      throw new GraphCompileError(`node name "${name}" is reserved`);
    }
    this.nodes.set(name, handler);
    this.compiled = false;
    return this;
  }

  /** edge を追加。 from / to は node 名 or START / END sentinel。 */
  addEdge(from: string, to: string): this {
    if (!from || !to) {
      throw new GraphCompileError('edge from/to must be non-empty strings');
    }
    this.edges.push({ from, to });
    this.compiled = false;
    return this;
  }

  /** node 数 (test / debug 用)。 */
  get nodeCount(): number {
    return this.nodes.size;
  }

  /** edge 数 (test / debug 用)。 */
  get edgeCount(): number {
    return this.edges.length;
  }

  /** compile 済かどうか (test / debug 用)。 */
  get isCompiled(): boolean {
    return this.compiled;
  }

  /**
   * validate + compile — validate 6 項目を fail-fast で確認、 pass なら
   * `compiled = true` を立てて invoke / stream 可能状態にする。
   */
  compile(): this {
    // (1) START edge の存在
    const startEdges = this.edges.filter((e) => e.from === START);
    if (startEdges.length === 0) {
      throw new GraphCompileError(
        'graph has no START edge — addEdge(START, "first_node") is required',
      );
    }
    // (6) START edge は 1 本のみ
    if (startEdges.length > 1) {
      throw new GraphCompileError(
        `graph has ${startEdges.length} START edges — v0.1 supports only 1 entry`,
      );
    }
    // (2) START edge の to が存在する node (or END)
    const startTo = startEdges[0]!.to;
    if (startTo !== END && !this.nodes.has(startTo)) {
      throw new GraphCompileError(`START edge targets unknown node: ${startTo}`);
    }
    // (3) (4) (5) edge の endpoints validate + isolated node 検出
    const nodesWithOutEdge = new Set<string>();
    for (const edge of this.edges) {
      if (edge.from !== START && !this.nodes.has(edge.from)) {
        throw new GraphCompileError(`edge.from references unknown node: ${edge.from}`);
      }
      if (edge.to !== END && !this.nodes.has(edge.to)) {
        throw new GraphCompileError(`edge.to references unknown node: ${edge.to}`);
      }
      if (edge.from !== START) {
        nodesWithOutEdge.add(edge.from);
      }
    }
    for (const nodeName of this.nodes.keys()) {
      if (!nodesWithOutEdge.has(nodeName)) {
        throw new GraphCompileError(
          `node "${nodeName}" has no outgoing edge — every node must connect to at least END`,
        );
      }
    }
    this.compiled = true;
    return this;
  }

  /**
   * invoke — 初期 state から実行、 END に到達した final state を返す。 compile
   * 未実施なら throw。
   */
  async invoke(initialState: TState, options: RunOptions = {}): Promise<TState> {
    let last: TState = initialState;
    for await (const step of this.stream(initialState, options)) {
      last = step.state;
    }
    return last;
  }

  /**
   * stream — 各 node 実行後の {node, patch, state} を順次 yield。 END に到達した
   * 時点で generator は終了する。
   */
  async *stream(
    initialState: TState,
    options: RunOptions = {},
  ): AsyncGenerator<{ node: string; patch: Partial<TState>; state: TState }, void, void> {
    if (!this.compiled) {
      throw new GraphCompileError('state machine not compiled — call compile() before invoke/stream');
    }
    const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
    let currentState: TState = { ...initialState };
    let currentNode: string | typeof END = this.startNode();
    let stepCount = 0;

    while (currentNode !== END) {
      stepCount += 1;
      if (stepCount > maxSteps) {
        throw new MaxStepsExceededError(stepCount);
      }
      const handler = this.nodes.get(currentNode);
      if (!handler) {
        // compile 済なら現実的には到達不可、 defensive。
        throw new GraphCompileError(`runtime: node not found: ${currentNode}`);
      }
      const patch = await handler(currentState);
      currentState = { ...currentState, ...patch };
      yield { node: currentNode, patch, state: currentState };

      const next = this.nextNode(currentNode);
      if (next === undefined) {
        throw new GraphCompileError(`runtime: no outgoing edge from node: ${currentNode}`);
      }
      currentNode = next;
    }
  }

  private startNode(): string | typeof END {
    const startEdge = this.edges.find((e) => e.from === START);
    // compile validate 済なら常に存在
    return startEdge!.to as string | typeof END;
  }

  private nextNode(from: string): string | typeof END | undefined {
    // v0.1 は unconditional edge のみ、 1 node = 1 out-edge を仮定する。
    // 複数 out-edge がある場合は最初の 1 本を採用 (v0.2 の conditional_edges で
    // proper 対応する)。
    const edge = this.edges.find((e) => e.from === from);
    return edge?.to as string | typeof END | undefined;
  }
}
