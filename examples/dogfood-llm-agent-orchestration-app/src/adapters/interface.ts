/**
 * Provider-neutral LLM agent orchestration adapter surface for the
 * agent-orchestration dogfood (v1.38-4).
 *
 * The app talks to the agent orchestration surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives the Vercel AI SDK + Anthropic
 *    Messages API when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` +
 *    `KIWA_LLM_BUDGET_USD` are set; otherwise every op reports
 *    `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/ai-llm` v0.4
 *    agent-orchestration semantics (startAgentSession / reactStep /
 *    expandToT / reflectAndCorrect / selectTool).
 *
 * Both must satisfy the same 12-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 4 axes v1.38-4
 * dogfoods —
 *  - ReAct (thought → action → observation trace)
 *  - Tree-of-Thought (root → branches → depth tree)
 *  - reflect-and-correct (critique rules → revised output)
 *  - tool selection (intent → ranked candidates → fallback ladder)
 *
 * The AC anchors this contract on the 4 domain surfaces the harness runs
 * against both adapters —
 *  - react-e2e (thought / action / observation ceremony)
 *  - tot-e2e (branching plan generation)
 *  - reflect-e2e (critique + self-correction cycle)
 *  - tool-select-e2e (intent-driven ranking + fallback)
 *  - pipeline-e2e (multi-stage plan → tool → act → reflect)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of appending one ReAct step to the trace. */
export interface ReactStepResult {
  sessionId: string;
  index: number;
  traceLength: number;
  tool: string;
  latencyMs: number;
}

/** Result of expanding a Tree-of-Thought plan. */
export interface TotExpandResult {
  sessionId: string;
  nodeCount: number;
  depth: number;
  branchFactor: number;
  rootScore: number;
  latencyMs: number;
}

/** Result of one reflect-and-correct cycle. */
export interface ReflectResult {
  sessionId: string;
  cycle: number;
  critique: string;
  revised: string;
  violationCount: number;
  latencyMs: number;
}

/** Result of running a tool selection ranker. */
export interface ToolSelectResult {
  sessionId: string;
  selectedName: string | null;
  topScore: number;
  candidateCount: number;
  ranking: Array<{ name: string; score: number }>;
  latencyMs: number;
}

/** Result of running the full agent pipeline (plan → tool → act → reflect). */
export interface AgentPipelineResult {
  sessionId: string;
  stage: 'completed' | 'blocked-no-tool' | 'blocked-reflection';
  blockedReason: string | null;
  plan: {
    nodeCount: number;
    topScore: number;
  };
  toolSelection: {
    selectedName: string | null;
    topScore: number;
  };
  reactTraceLength: number;
  reflection: {
    cycle: number;
    violationCount: number;
    revised: string;
  };
  fallbackDepth: number;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startAgent'
    | 'reactStep'
    | 'expandToT'
    | 'reflect'
    | 'selectTool'
    | 'closeAgent'
    | 'startPipeline'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Tool candidate input (aligned with @kiwa-lab/ai-llm ToolCandidate input). */
export interface ToolCandidateInput {
  name: string;
  description: string;
}

/** Tree-of-Thought input. */
export interface TotInput {
  root: { thought: string };
  branches: Array<{ thought: string; score: number }>;
  depth: number;
}

/** ReAct step input. */
export interface ReactInput {
  thought: string;
  action: { tool: string; input: string };
  observation: string;
}

/** Reflect input. */
export interface ReflectInput {
  output: string;
  critiqueRules: string[];
}

/** Pipeline input drives the full plan → tool → act → reflect ceremony. */
export interface PipelineInput {
  sessionId: string;
  intent: string;
  candidates: ToolCandidateInput[];
  plan: TotInput;
  reactSteps: ReactInput[];
  reflect: ReflectInput;
  /**
   * Fallback ladder — if the top-scoring tool has a score below the
   * threshold, the pipeline demotes to the next candidate until one
   * either satisfies the threshold or the ladder runs out.
   */
  toolScoreThreshold?: number;
}

/** The LLM agent orchestration adapter — 8 ops across 4 axes + pipeline. */
export interface LlmAgentAdapter {
  readonly mode: 'real' | 'mock';

  // agent session surface (ReAct + ToT + reflect + toolSelect axes share
  // one session).
  startAgent(input: { sessionId: string }): Promise<void>;
  reactStep(input: {
    sessionId: string;
    step: ReactInput;
  }): Promise<ReactStepResult>;
  expandToT(input: {
    sessionId: string;
    plan: TotInput;
  }): Promise<TotExpandResult>;
  reflect(input: {
    sessionId: string;
    reflect: ReflectInput;
  }): Promise<ReflectResult>;
  selectTool(input: {
    sessionId: string;
    intent: string;
    candidates: ToolCandidateInput[];
  }): Promise<ToolSelectResult>;
  closeAgent(input: { sessionId: string }): Promise<void>;

  // pipeline surface (pipeline-e2e axis)
  startPipeline(input: { sessionId: string }): Promise<void>;
  runPipeline(input: PipelineInput): Promise<AgentPipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
