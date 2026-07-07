/**
 * Real adapter — drives the OpenAI Chat Completions API when
 * `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` are set.
 * On any system without those, the adapter refuses to run and every
 * method reports `KIWA_LLM_ENV_MISSING`. Downstream tests inspect
 * {@link LlmQualityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full OpenAI Chat Completions ceremony is deferred to a follow-up
 * milestone once the driver + budget guard binary are wired into the CI
 * worker image. This milestone (v1.38-3) lands the env-detect skeleton +
 * trace so the fidelity harness can uniformly drive both adapters even
 * when only the mock has an actual body. The pattern follows
 * `dogfood-llm-prompt-injection-defense-app/src/adapters/real.ts` (v1.38-2)
 * — env detection reports which key is missing so the downstream
 * release-gate row can distinguish "not configured" from "ran and
 * diverged".
 *
 * Budget guard — the real adapter enforces `KIWA_LLM_BUDGET_USD` (a
 * dollar cap) before every op that would touch the OpenAI API. Once the
 * driver binary lands, the cap is compared against the running per-
 * session cost; if breached, the op refuses with
 * `KIWA_LLM_BUDGET_EXCEEDED`. Until then, the presence of the env is
 * required so tests can prove the gate is wired.
 */

import type {
  CitationResult,
  ConfidenceResult,
  EloResult,
  FactualityResult,
  JudgeResult,
  LlmQualityAdapter,
  PreferenceResult,
  QualityPipelineResult,
  RubricResult,
  SelfConsistencyResult,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_LLM_ENV_MISSING';

/**
 * Report whether the current process can talk to the OpenAI Chat
 * Completions API. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — the OpenAI Chat Completions API
 * costs real money per token, all of which cost budget to burn. The
 * default answer is "skip real" so unit test workflows stay fast and
 * hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up a real driver.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // KIWA_MODE=real opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['KIWA_MODE'] === 'real') {
    if (!process.env['OPENAI_API_KEY']) {
      return 'OPENAI_API_KEY_MISSING';
    }
    if (!process.env['KIWA_LLM_BUDGET_USD']) {
      return 'KIWA_LLM_BUDGET_USD_MISSING';
    }
    // Validate budget is a positive number so the gate can compare
    // against a running per-session cost once the driver lands.
    const raw = process.env['KIWA_LLM_BUDGET_USD'];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 'KIWA_LLM_BUDGET_USD_INVALID';
    }
    return null;
  }
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): LlmQualityAdapter {
  const trace: TraceEvent[] = [];

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

  function refuse(op: TraceEvent['op']): void {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
  }

  return {
    mode: 'real',

    async startHallucination(_input) {
      refuse('startHallucination');
    },
    async scoreSelfConsistency(_input): Promise<SelfConsistencyResult> {
      refuse('scoreSelfConsistency');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async checkFactuality(_input): Promise<FactualityResult> {
      refuse('checkFactuality');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async verifyCitation(_input): Promise<CitationResult> {
      refuse('verifyCitation');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async scoreConfidence(_input): Promise<ConfidenceResult> {
      refuse('scoreConfidence');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async closeHallucination(_input) {
      refuse('closeHallucination');
    },

    async startEval(_input) {
      refuse('startEval');
    },
    async judgeCandidates(_input): Promise<JudgeResult> {
      refuse('judgeCandidates');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async applyRubric(_input): Promise<RubricResult> {
      refuse('applyRubric');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async rankPreference(_input): Promise<PreferenceResult> {
      refuse('rankPreference');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async updateElo(_input): Promise<EloResult> {
      refuse('updateElo');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async closeEval(_input) {
      refuse('closeEval');
    },

    async startPipeline(_input) {
      refuse('startPipeline');
    },
    async runPipeline(_input): Promise<QualityPipelineResult> {
      refuse('runPipeline');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
