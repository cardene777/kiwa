/**
 * Provider-neutral LLM observability surface for the LLM ops dogfood.
 *
 * The app talks to the token + prompt + budget surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real OpenAI + Anthropic +
 *    Bedrock style completion API + metrics API + budget API stack
 *    (KIWA_LLM_PROVIDER_URL + KIWA_LLM_METRICS_URL +
 *    KIWA_LLM_BUDGET_API_URL) when `KIWA_MODE=real` +
 *    `LLM_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/observability` v2.2
 *    LLM-obs semantics (countTokens / logPrompt / flagHallucination /
 *    checkBudget).
 *
 * Both must satisfy the same 10-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.42-3
 * dogfoods —
 *  - token (session start + count tokens + close)
 *  - prompt (log prompt + flag hallucination + close)
 *  - budget (budget check + close)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - token-e2e (startToken + countTokens + closeToken)
 *  - prompt-e2e (startPrompt + logPrompt + flagHallucination + closePrompt)
 *  - budget-e2e (startBudget + checkBudget + closeBudget)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

import type { semantics } from '@kiwa-test/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** OTel GenAI stable semantic conventions token usage record. */
export interface TokenUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
}

/** OTel GenAI stable prompt log record with PII redaction flag. */
export interface PromptRecord {
  requestId: string;
  system: string;
  user: string;
  redacted: boolean;
}

/** LLM hallucination / quality signal for a single metric. */
export interface HallucinationSignal {
  metric: 'faithfulness' | 'relevance' | 'toxicity';
  score: number;
  threshold: number;
}

/** Result of counting tokens across a completion round. */
export interface TokenCountResult {
  sessionId: string;
  serviceName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

/** Result of logging a prompt to the observability store. */
export interface PromptLogResult {
  sessionId: string;
  serviceName: string;
  requestId: string;
  systemLength: number;
  userLength: number;
  redacted: boolean;
  latencyMs: number;
}

/** Result of flagging a set of hallucination signals. */
export interface HallucinationFlagResult {
  sessionId: string;
  serviceName: string;
  signalCount: number;
  flaggedCount: number;
  anyFlagged: boolean;
  latencyMs: number;
}

/** Result of checking a budget spend against a monthly limit. */
export interface BudgetCheckResult {
  sessionId: string;
  serviceName: string;
  spentUsd: number;
  limitUsd: number;
  ratio: number;
  exhausted: boolean;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startToken'
    | 'countTokens'
    | 'closeToken'
    | 'startPrompt'
    | 'logPrompt'
    | 'flagHallucination'
    | 'closePrompt'
    | 'startBudget'
    | 'checkBudget'
    | 'closeBudget';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a token-counting session. */
export interface TokenSessionInput {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
}

/** Input for opening a prompt-log + hallucination-flag session. */
export interface PromptSessionInput {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
}

/** Input for opening a budget-check session. */
export interface BudgetSessionInput {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
}

/** The LLM-obs Adapter — 10 ops across 3 domain surfaces + 4 LLM lifecycle stages. */
export interface LlmOpsAdapter {
  readonly mode: 'real' | 'mock';

  // token surface (token-e2e axis: session + count + close)
  startToken(input: TokenSessionInput): Promise<void>;
  countTokens(input: {
    sessionId: string;
    usage: TokenUsage;
  }): Promise<TokenCountResult>;
  closeToken(input: { sessionId: string }): Promise<void>;

  // prompt surface (prompt-e2e axis: session + log + flag + close)
  startPrompt(input: PromptSessionInput): Promise<void>;
  logPrompt(input: {
    sessionId: string;
    prompt: PromptRecord;
  }): Promise<PromptLogResult>;
  flagHallucination(input: {
    sessionId: string;
    signals: HallucinationSignal[];
  }): Promise<HallucinationFlagResult>;
  closePrompt(input: { sessionId: string }): Promise<void>;

  // budget surface (budget-e2e axis: session + check + close)
  startBudget(input: BudgetSessionInput): Promise<void>;
  checkBudget(input: {
    sessionId: string;
    spentUsd: number;
    limitUsd: number;
  }): Promise<BudgetCheckResult>;
  closeBudget(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_LLM_ENV_MISSING = 'KIWA_LLM_ENV_MISSING';

/**
 * The 10 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 */
export const LLM_OPS_HARNESS_OPS = [
  'startToken',
  'countTokens',
  'closeToken',
  'startPrompt',
  'logPrompt',
  'flagHallucination',
  'closePrompt',
  'startBudget',
  'checkBudget',
  'closeBudget',
] as const;

export type LlmOpsHarnessOp = (typeof LLM_OPS_HARNESS_OPS)[number];
