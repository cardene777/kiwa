/**
 * Provider-neutral LLM code interpreter adapter surface for the
 * code-interpreter dogfood (v1.40-3).
 *
 * The app talks to the sandboxed code interpreter surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives the Vercel AI SDK + Anthropic
 *    Messages API + a sandboxed Python REPL executor (e.g. E2B /
 *    Modal / Deno subprocess sandbox) when `KIWA_MODE=real` +
 *    `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set; otherwise
 *    every op reports `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/ai-llm` v0.5
 *    code-interpreter semantics (startCiSession / startSandbox /
 *    executeCode / useTool / rollback).
 *
 * Both must satisfy the same 7-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 1 axis
 * v1.40-3 dogfoods —
 *  - Code interpretation / execution (sandboxed Python REPL + tool use
 *    + rollback state machine; E2B / Modal / Anthropic tool use pattern)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness
 * runs against both adapters —
 *  - sandbox-e2e (sandbox start / code execution / execution history /
 *    memory update)
 *  - tool-e2e (tool use / tool call ledger / unknown-tool refuse)
 *  - pipeline-e2e (sandbox → multi-execution → tool-use → rollback →
 *    tolerance gate; the full interpreter session envelope)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of starting a sandbox for the code interpreter surface. */
export interface StartSandboxResult {
  sessionId: string;
  sandboxId: string;
  timeoutMs: number;
  latencyMs: number;
}

/** Result of one execute-code round. */
export interface ExecuteCodeResult {
  sessionId: string;
  executionIndex: number;
  ok: boolean;
  stdout: string;
  codeLength: number;
  memoryKeys: number;
  latencyMs: number;
}

/** Result of one tool-use round. */
export interface UseToolResult {
  sessionId: string;
  toolName: string;
  ok: boolean;
  toolCallCount: number;
  argCount: number;
  latencyMs: number;
}

/** Result of a rollback op. */
export interface RollbackResult {
  sessionId: string;
  requestedSteps: number;
  poppedCount: number;
  remainingExecutions: number;
  latencyMs: number;
}

/** Result of running the full sandbox → execute → tool → rollback pipeline. */
export interface CodeInterpreterPipelineResult {
  sessionId: string;
  stage:
    | 'completed'
    | 'blocked-no-executions'
    | 'blocked-rollback-exceeds-history'
    | 'blocked-unknown-tool';
  blockedReason: string | null;
  sandbox: {
    sandboxId: string;
    timeoutMs: number;
  };
  executions: {
    total: number;
    okCount: number;
    failCount: number;
    memoryKeys: number;
  };
  tools: {
    total: number;
    okCount: number;
    failCount: number;
  };
  rollback: {
    requestedSteps: number;
    poppedCount: number;
    remainingExecutions: number;
  };
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startCi'
    | 'startSandbox'
    | 'executeCode'
    | 'useTool'
    | 'rollback'
    | 'closeCi'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Execution input passed through the sandbox surface. */
export interface ExecuteInput {
  code: string;
  assigns?: Record<string, string>;
}

/** Tool-call input passed through the tool surface. */
export interface ToolInput {
  name: string;
  args: Record<string, string | number | boolean>;
}

/** Pipeline input drives the full sandbox → execute → tool → rollback ceremony. */
export interface PipelineInput {
  sessionId: string;
  sandboxId: string;
  timeoutMs: number;
  executions: ExecuteInput[];
  tools: ToolInput[];
  rollbackSteps: number;
}

/** Recorded execution — used by pipeline tests to introspect history. */
export interface RecordedExecution {
  index: number;
  code: string;
  stdout: string;
  ok: boolean;
}

/** The LLM code interpreter adapter — 7 ops across 3 surfaces + pipeline. */
export interface LlmCodeInterpreterAdapter {
  readonly mode: 'real' | 'mock';

  // sandbox lifecycle surface (sandbox-e2e axis).
  startCi(input: { sessionId: string }): Promise<void>;
  startSandbox(input: {
    sessionId: string;
    sandboxId: string;
    timeoutMs: number;
  }): Promise<StartSandboxResult>;
  executeCode(input: {
    sessionId: string;
    execution: ExecuteInput;
  }): Promise<ExecuteCodeResult>;
  closeCi(input: { sessionId: string }): Promise<void>;

  // tool surface (tool-e2e axis).
  useTool(input: {
    sessionId: string;
    tool: ToolInput;
  }): Promise<UseToolResult>;

  // rollback surface (sandbox-e2e axis — memory snapshot rewind).
  rollback(input: {
    sessionId: string;
    steps: number;
  }): Promise<RollbackResult>;

  // pipeline surface (pipeline-e2e axis).
  runPipeline(input: PipelineInput): Promise<CodeInterpreterPipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;

  /** execution history — used by pipeline tests to introspect stdout. */
  executions(sessionId: string): readonly RecordedExecution[];
}
