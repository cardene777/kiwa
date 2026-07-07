/**
 * Mock adapter — drives `@kiwa-test/observability` v2.2 advanced III
 * LLM-obs semantics (startLlmObsSession / countTokens / logPrompt /
 * flagHallucination / checkBudget) so the same app code exercises a
 * deterministic OTel GenAI stable ceremony without a real OpenAI /
 * Anthropic / Bedrock provider or metrics API endpoint. Both mock and
 * real adapters satisfy {@link LlmOpsAdapter}, so the fidelity harness
 * can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * token surface owns the OTel prompt / completion token accounting; the
 * prompt surface owns the request-id + PII-redacted prompt log +
 * faithfulness / relevance / toxicity signal fan-out; the budget surface
 * owns the monthly spend vs limit envelope.
 *
 * The mock intentionally piggy-backs on the v2.2 LLM-obs semantics
 * LlmObsSession — every op appends the matching neutral event into the
 * trace so the fidelity harness can assert the mock and real adapters
 * produce identical event orderings. Because the v2.2 LlmObsSession is
 * a strict 4-step state machine (idle → tokens-counted → prompt-logged
 * → hallucination-flagged → budget-checked), the mock adapter maintains
 * a separate session per surface so each surface can drive the
 * semantics lifecycle independently and the fidelity harness can point
 * at the exact op that diverged.
 */

import { semantics } from '@kiwa-test/observability';
import {
  type BudgetCheckResult,
  type BudgetSessionInput,
  type HallucinationFlagResult,
  type HallucinationSignal,
  type LlmOpsAdapter,
  type ObservabilityTarget,
  type PromptLogResult,
  type PromptRecord,
  type PromptSessionInput,
  type TokenCountResult,
  type TokenSessionInput,
  type TokenUsage,
  type TraceEvent,
} from './interface.js';

const {
  checkBudget: obsCheckBudget,
  countTokens: obsCountTokens,
  flagHallucination: obsFlagHallucination,
  logPrompt: obsLogPrompt,
  startLlmObsSession,
} = semantics;

type LlmObsSession = ReturnType<typeof startLlmObsSession>;

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms, default 1). */
  latencyMs?: number;
}

interface TokenSessionState {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
  llm: LlmObsSession;
  closed: boolean;
}

interface PromptSessionState {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
  llm: LlmObsSession;
  /** whether the countTokens bootstrap has been driven yet. */
  tokensCounted: boolean;
  /** whether the logPrompt step has been driven yet. */
  promptLogged: boolean;
  closed: boolean;
}

interface BudgetSessionState {
  sessionId: string;
  serviceName: string;
  target: ObservabilityTarget;
  llm: LlmObsSession;
  /** whether the countTokens bootstrap has been driven yet. */
  tokensCounted: boolean;
  /** whether the logPrompt bootstrap has been driven yet. */
  promptLogged: boolean;
  /** whether the flagHallucination bootstrap has been driven yet. */
  hallucinationFlagged: boolean;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): LlmOpsAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const tokens = new Map<string, TokenSessionState>();
  const prompts = new Map<string, PromptSessionState>();
  const budgets = new Map<string, BudgetSessionState>();

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  /**
   * Bootstrap prior semantics steps synthetically. The v2.2 LlmObsSession
   * is a strict linear state machine — later ops require earlier ones to
   * have run, so the mock plays the missing steps behind the scenes to
   * keep semantics honest without forcing every surface to drive the full
   * ceremony.
   */
  function bootstrapForPrompt(session: LlmObsSession, serviceName: string): void {
    obsCountTokens(session, {
      model: `${serviceName}-bootstrap-model`,
      promptTokens: 0,
      completionTokens: 0,
    });
  }

  function bootstrapForHallucination(
    session: LlmObsSession,
    serviceName: string,
  ): void {
    obsCountTokens(session, {
      model: `${serviceName}-bootstrap-model`,
      promptTokens: 0,
      completionTokens: 0,
    });
    obsLogPrompt(session, {
      requestId: `${serviceName}-bootstrap-req`,
      system: '',
      user: '',
      redacted: false,
    });
  }

  function bootstrapForBudget(session: LlmObsSession, serviceName: string): void {
    obsCountTokens(session, {
      model: `${serviceName}-bootstrap-model`,
      promptTokens: 0,
      completionTokens: 0,
    });
    obsLogPrompt(session, {
      requestId: `${serviceName}-bootstrap-req`,
      system: '',
      user: '',
      redacted: false,
    });
    obsFlagHallucination(session, {
      signals: [
        { metric: 'faithfulness', score: 1, threshold: 0.5 },
      ],
    });
  }

  return {
    mode: 'mock',

    async startToken(input) {
      if (tokens.has(input.sessionId)) {
        record('startToken', false, { errorKind: 'token_session_exists' });
        throw new Error('token_session_exists');
      }
      const llm = startLlmObsSession({
        target: input.target,
        serviceName: input.serviceName,
      });
      tokens.set(input.sessionId, {
        sessionId: input.sessionId,
        serviceName: input.serviceName,
        target: input.target,
        llm,
        closed: false,
      });
      record('startToken', true, {
        detail: {
          sessionId: input.sessionId,
          serviceName: input.serviceName,
          target: input.target,
        },
      });
    },

    async countTokens(input) {
      const session = tokens.get(input.sessionId);
      if (!session) {
        record('countTokens', false, { errorKind: 'token_session_not_found' });
        throw new Error('token_session_not_found');
      }
      if (session.closed) {
        record('countTokens', false, { errorKind: 'token_session_closed' });
        throw new Error('token_session_closed');
      }
      if (input.usage.model.length === 0) {
        record('countTokens', false, { errorKind: 'model_must_not_be_empty' });
        throw new Error('model_must_not_be_empty');
      }
      if (
        input.usage.promptTokens < 0 ||
        input.usage.completionTokens < 0
      ) {
        record('countTokens', false, {
          errorKind: 'token_counts_must_be_non_negative',
        });
        throw new Error('token_counts_must_be_non_negative');
      }
      try {
        const step = obsCountTokens(session.llm, input.usage);
        const result: TokenCountResult = {
          sessionId: input.sessionId,
          serviceName: session.serviceName,
          model: input.usage.model,
          promptTokens: Number(step.metadata.promptTokens),
          completionTokens: Number(step.metadata.completionTokens),
          totalTokens: Number(step.metadata.totalTokens),
          latencyMs,
        };
        record('countTokens', true, { detail: result });
        return result;
      } catch (err) {
        record('countTokens', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeToken(input) {
      const session = tokens.get(input.sessionId);
      if (!session) {
        record('closeToken', false, { errorKind: 'token_session_not_found' });
        throw new Error('token_session_not_found');
      }
      session.closed = true;
      tokens.delete(input.sessionId);
      record('closeToken', true, { detail: { sessionId: input.sessionId } });
    },

    async startPrompt(input) {
      if (prompts.has(input.sessionId)) {
        record('startPrompt', false, { errorKind: 'prompt_session_exists' });
        throw new Error('prompt_session_exists');
      }
      const llm = startLlmObsSession({
        target: input.target,
        serviceName: input.serviceName,
      });
      prompts.set(input.sessionId, {
        sessionId: input.sessionId,
        serviceName: input.serviceName,
        target: input.target,
        llm,
        tokensCounted: false,
        promptLogged: false,
        closed: false,
      });
      record('startPrompt', true, {
        detail: {
          sessionId: input.sessionId,
          serviceName: input.serviceName,
          target: input.target,
        },
      });
    },

    async logPrompt(input) {
      const session = prompts.get(input.sessionId);
      if (!session) {
        record('logPrompt', false, { errorKind: 'prompt_session_not_found' });
        throw new Error('prompt_session_not_found');
      }
      if (session.closed) {
        record('logPrompt', false, { errorKind: 'prompt_session_closed' });
        throw new Error('prompt_session_closed');
      }
      if (input.prompt.requestId.length === 0) {
        record('logPrompt', false, { errorKind: 'requestId_must_not_be_empty' });
        throw new Error('requestId_must_not_be_empty');
      }
      try {
        // The v2.2 LLM-obs state machine requires a tokens-counted state
        // before prompts can be logged. The prompt surface bootstraps
        // that state with a synthetic zero-token count so the semantics
        // remain the source of truth for state-transition ordering.
        if (!session.tokensCounted) {
          bootstrapForPrompt(session.llm, session.serviceName);
          session.tokensCounted = true;
        }
        const step = obsLogPrompt(session.llm, input.prompt);
        session.promptLogged = true;
        const result: PromptLogResult = {
          sessionId: input.sessionId,
          serviceName: session.serviceName,
          requestId: input.prompt.requestId,
          systemLength: Number(step.metadata.systemLength),
          userLength: Number(step.metadata.userLength),
          redacted: Boolean(step.metadata.redacted),
          latencyMs,
        };
        record('logPrompt', true, { detail: result });
        return result;
      } catch (err) {
        record('logPrompt', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async flagHallucination(input) {
      const session = prompts.get(input.sessionId);
      if (!session) {
        record('flagHallucination', false, {
          errorKind: 'prompt_session_not_found',
        });
        throw new Error('prompt_session_not_found');
      }
      if (session.closed) {
        record('flagHallucination', false, {
          errorKind: 'prompt_session_closed',
        });
        throw new Error('prompt_session_closed');
      }
      if (input.signals.length === 0) {
        record('flagHallucination', false, {
          errorKind: 'signals_must_not_be_empty',
        });
        throw new Error('signals_must_not_be_empty');
      }
      for (const s of input.signals) {
        if (s.score < 0 || s.score > 1) {
          record('flagHallucination', false, {
            errorKind: 'score_must_be_within_zero_and_one',
          });
          throw new Error('score_must_be_within_zero_and_one');
        }
      }
      try {
        // flagHallucination is the third step in the semantics lifecycle
        // and requires prompt-logged state. Bootstrap prior steps with
        // synthetic inputs if the caller has not driven them explicitly.
        if (!session.promptLogged) {
          if (!session.tokensCounted) {
            bootstrapForPrompt(session.llm, session.serviceName);
            session.tokensCounted = true;
          }
          obsLogPrompt(session.llm, {
            requestId: `${session.serviceName}-bootstrap-req`,
            system: '',
            user: '',
            redacted: false,
          });
          session.promptLogged = true;
        }
        const step = obsFlagHallucination(session.llm, {
          signals: input.signals,
        });
        const result: HallucinationFlagResult = {
          sessionId: input.sessionId,
          serviceName: session.serviceName,
          signalCount: Number(step.metadata.signalCount),
          flaggedCount: Number(step.metadata.flaggedCount),
          anyFlagged: Boolean(step.metadata.anyFlagged),
          latencyMs,
        };
        record('flagHallucination', true, { detail: result });
        return result;
      } catch (err) {
        record('flagHallucination', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closePrompt(input) {
      const session = prompts.get(input.sessionId);
      if (!session) {
        record('closePrompt', false, { errorKind: 'prompt_session_not_found' });
        throw new Error('prompt_session_not_found');
      }
      session.closed = true;
      prompts.delete(input.sessionId);
      record('closePrompt', true, { detail: { sessionId: input.sessionId } });
    },

    async startBudget(input) {
      if (budgets.has(input.sessionId)) {
        record('startBudget', false, { errorKind: 'budget_session_exists' });
        throw new Error('budget_session_exists');
      }
      const llm = startLlmObsSession({
        target: input.target,
        serviceName: input.serviceName,
      });
      budgets.set(input.sessionId, {
        sessionId: input.sessionId,
        serviceName: input.serviceName,
        target: input.target,
        llm,
        tokensCounted: false,
        promptLogged: false,
        hallucinationFlagged: false,
        closed: false,
      });
      record('startBudget', true, {
        detail: {
          sessionId: input.sessionId,
          serviceName: input.serviceName,
          target: input.target,
        },
      });
    },

    async checkBudget(input) {
      const session = budgets.get(input.sessionId);
      if (!session) {
        record('checkBudget', false, { errorKind: 'budget_session_not_found' });
        throw new Error('budget_session_not_found');
      }
      if (session.closed) {
        record('checkBudget', false, { errorKind: 'budget_session_closed' });
        throw new Error('budget_session_closed');
      }
      if (input.spentUsd < 0) {
        record('checkBudget', false, {
          errorKind: 'spentUsd_must_be_non_negative',
        });
        throw new Error('spentUsd_must_be_non_negative');
      }
      if (input.limitUsd <= 0) {
        record('checkBudget', false, {
          errorKind: 'limitUsd_must_be_positive',
        });
        throw new Error('limitUsd_must_be_positive');
      }
      try {
        // checkBudget is the final step in the semantics lifecycle and
        // requires hallucination-flagged state. Bootstrap all prior
        // steps with synthetic inputs if the caller has not driven them
        // explicitly.
        if (!session.hallucinationFlagged) {
          bootstrapForBudget(session.llm, session.serviceName);
          session.tokensCounted = true;
          session.promptLogged = true;
          session.hallucinationFlagged = true;
        }
        const step = obsCheckBudget(session.llm, {
          spentUsd: input.spentUsd,
          limitUsd: input.limitUsd,
        });
        const result: BudgetCheckResult = {
          sessionId: input.sessionId,
          serviceName: session.serviceName,
          spentUsd: Number(step.metadata.spentUsd),
          limitUsd: Number(step.metadata.limitUsd),
          ratio: Number(step.metadata.ratio),
          exhausted: Boolean(step.metadata.exhausted),
          latencyMs,
        };
        record('checkBudget', true, { detail: result });
        return result;
      } catch (err) {
        record('checkBudget', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeBudget(input) {
      const session = budgets.get(input.sessionId);
      if (!session) {
        record('closeBudget', false, { errorKind: 'budget_session_not_found' });
        throw new Error('budget_session_not_found');
      }
      session.closed = true;
      budgets.delete(input.sessionId);
      record('closeBudget', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      tokens.clear();
      prompts.clear();
      budgets.clear();
    },
  };
}

/** Re-export for convenience — types cross to route + fidelity modules. */
export type {
  BudgetCheckResult,
  BudgetSessionInput,
  HallucinationFlagResult,
  HallucinationSignal,
  PromptLogResult,
  PromptRecord,
  PromptSessionInput,
  TokenCountResult,
  TokenSessionInput,
  TokenUsage,
} from './interface.js';
