import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * LLM observability axis — token counting + prompt log + hallucination detection +
 * budget check state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: count-tokens → log-prompt → flag-hallucination → check-budget.
 * OTel GenAI semantic conventions (2026-06 stable) 準拠、 model-name + prompt-tokens +
 * completion-tokens を metadata key として揃える。
 */

export type LlmObsState =
  | 'idle'
  | 'tokens-counted'
  | 'prompt-logged'
  | 'hallucination-flagged'
  | 'budget-checked';

export interface LlmTokenUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface LlmPromptRecord {
  requestId: string;
  system: string;
  user: string;
  redacted: boolean;
}

export interface LlmHallucinationSignal {
  metric: 'faithfulness' | 'relevance' | 'toxicity';
  score: number;
  threshold: number;
}

export interface LlmObsSession {
  target: ObservabilityTarget;
  serviceName: string;
  state: LlmObsState;
  history: AxisStep<LlmObsState>[];
  usage: LlmTokenUsage | null;
  prompt: LlmPromptRecord | null;
  hallucinationSignals: LlmHallucinationSignal[];
  budgetUsdSpent: number;
  budgetUsdLimit: number;
}

export function startLlmObsSession(input: {
  target: ObservabilityTarget;
  serviceName: string;
}): LlmObsSession {
  if (input.serviceName.length === 0) {
    throw new Error('startLlmObsSession: serviceName must not be empty');
  }
  return {
    target: input.target,
    serviceName: input.serviceName,
    state: 'idle',
    history: [],
    usage: null,
    prompt: null,
    hallucinationSignals: [],
    budgetUsdSpent: 0,
    budgetUsdLimit: 0,
  };
}

export function countTokens(
  session: LlmObsSession,
  input: LlmTokenUsage,
): AxisStep<LlmObsState> {
  if (session.state !== 'idle') {
    throw new Error(`countTokens: session is ${session.state}, not idle`);
  }
  if (input.model.length === 0) {
    throw new Error('countTokens: model must not be empty');
  }
  if (input.promptTokens < 0 || input.completionTokens < 0) {
    throw new Error('countTokens: token counts must be non-negative');
  }
  session.usage = { ...input };
  const totalTokens = input.promptTokens + input.completionTokens;
  session.state = 'tokens-counted';
  return emit(session, 'llmobs.token_counted', {
    model: input.model,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    totalTokens,
  });
}

export function logPrompt(
  session: LlmObsSession,
  input: LlmPromptRecord,
): AxisStep<LlmObsState> {
  if (session.state !== 'tokens-counted') {
    throw new Error(`logPrompt: session is ${session.state}, not tokens-counted`);
  }
  if (input.requestId.length === 0) {
    throw new Error('logPrompt: requestId must not be empty');
  }
  session.prompt = { ...input };
  session.state = 'prompt-logged';
  return emit(session, 'llmobs.prompt_logged', {
    requestId: input.requestId,
    systemLength: input.system.length,
    userLength: input.user.length,
    redacted: input.redacted,
  });
}

export function flagHallucination(
  session: LlmObsSession,
  input: { signals: LlmHallucinationSignal[] },
): AxisStep<LlmObsState> {
  if (session.state !== 'prompt-logged') {
    throw new Error(`flagHallucination: session is ${session.state}, not prompt-logged`);
  }
  if (input.signals.length === 0) {
    throw new Error('flagHallucination: signals must not be empty');
  }
  for (const s of input.signals) {
    if (s.score < 0 || s.score > 1) {
      throw new Error(`flagHallucination: score for ${s.metric} must be within [0, 1]`);
    }
  }
  session.hallucinationSignals = [...input.signals];
  const flagged = input.signals.filter((s) => {
    if (s.metric === 'toxicity') return s.score >= s.threshold;
    return s.score < s.threshold;
  });
  session.state = 'hallucination-flagged';
  return emit(session, 'llmobs.hallucination_flagged', {
    signalCount: input.signals.length,
    flaggedCount: flagged.length,
    anyFlagged: flagged.length > 0,
  });
}

export function checkBudget(
  session: LlmObsSession,
  input: { spentUsd: number; limitUsd: number },
): AxisStep<LlmObsState> {
  if (session.state !== 'hallucination-flagged') {
    throw new Error(`checkBudget: session is ${session.state}, not hallucination-flagged`);
  }
  if (input.spentUsd < 0) {
    throw new Error('checkBudget: spentUsd must be non-negative');
  }
  if (input.limitUsd <= 0) {
    throw new Error('checkBudget: limitUsd must be positive');
  }
  session.budgetUsdSpent = input.spentUsd;
  session.budgetUsdLimit = input.limitUsd;
  const ratio = input.spentUsd / input.limitUsd;
  const exhausted = input.spentUsd >= input.limitUsd;
  session.state = 'budget-checked';
  return emit(session, 'llmobs.budget_checked', {
    spentUsd: input.spentUsd,
    limitUsd: input.limitUsd,
    ratio,
    exhausted,
  });
}

function emit(
  session: LlmObsSession,
  neutralEvent: AxisStep<LlmObsState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<LlmObsState> {
  const step: AxisStep<LlmObsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, serviceName: session.serviceName, ...metadata },
  };
  session.history.push(step);
  return step;
}
