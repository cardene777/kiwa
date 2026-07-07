/**
 * Real adapter — drives an OpenAI + Anthropic + Bedrock style completion
 * + metrics + budget API stack when all env keys are set (`KIWA_MODE=real`
 * + `LLM_STACK_READY=1` + `KIWA_LLM_PROVIDER_URL` +
 * `KIWA_LLM_METRICS_URL` + `KIWA_LLM_BUDGET_API_URL`). On any system
 * without those, the adapter refuses to run and every method reports
 * `KIWA_LLM_ENV_MISSING`. Downstream tests inspect
 * {@link LlmOpsAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full completion + prompt log + hallucination detection + budget
 * ceremony is deferred to a follow-up milestone once the completion API
 * mocks + evaluation framework bundles are available in the CI worker
 * image. This milestone (v1.42-3, Issue CAR-1048) lands the env-detect
 * skeleton + trace so the fidelity harness can uniformly drive both
 * adapters even when only the mock has an actual body. The pattern
 * follows `dogfood-observability-iac-drift-app/src/adapters/real.ts`
 * (v1.42-2) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from
 * "ran and diverged".
 */

import {
  KIWA_LLM_ENV_MISSING,
  type BudgetCheckResult,
  type HallucinationFlagResult,
  type LlmOpsAdapter,
  type PromptLogResult,
  type TokenCountResult,
  type TraceEvent,
} from './interface.js';

/**
 * Report whether the current process can talk to a real completion +
 * metrics + budget API stack. Returns `null` on capable systems, or a
 * short reason string when the env is missing (used to populate
 * `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — a completion API URL + metrics API
 * URL + budget API URL are all needed, all of which cost real money to
 * provision. The default answer is "skip real" so unit test workflows
 * stay fast, hermetic, and free.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up the stack.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // LLM_STACK_READY=1 opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // KIWA_LLM_ENV_MISSING — a follow-up milestone ships the driver.
  if (process.env['LLM_STACK_READY'] === '1') {
    if (!process.env['KIWA_LLM_PROVIDER_URL']) return 'KIWA_LLM_PROVIDER_URL_MISSING';
    if (!process.env['KIWA_LLM_METRICS_URL']) return 'KIWA_LLM_METRICS_URL_MISSING';
    if (!process.env['KIWA_LLM_BUDGET_API_URL']) return 'KIWA_LLM_BUDGET_API_URL_MISSING';
    return null;
  }
  return KIWA_LLM_ENV_MISSING;
}

export function makeRealAdapter(): LlmOpsAdapter {
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

  function refuse(op: TraceEvent['op']): never {
    const missing = detectRealEnvMissing() ?? KIWA_LLM_ENV_MISSING;
    record(op, false, { errorKind: missing });
    throw new Error(missing);
  }

  return {
    mode: 'real',

    async startToken(_input) {
      refuse('startToken');
    },
    async countTokens(_input): Promise<TokenCountResult> {
      refuse('countTokens');
    },
    async closeToken(_input) {
      refuse('closeToken');
    },

    async startPrompt(_input) {
      refuse('startPrompt');
    },
    async logPrompt(_input): Promise<PromptLogResult> {
      refuse('logPrompt');
    },
    async flagHallucination(_input): Promise<HallucinationFlagResult> {
      refuse('flagHallucination');
    },
    async closePrompt(_input) {
      refuse('closePrompt');
    },

    async startBudget(_input) {
      refuse('startBudget');
    },
    async checkBudget(_input): Promise<BudgetCheckResult> {
      refuse('checkBudget');
    },
    async closeBudget(_input) {
      refuse('closeBudget');
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },
  };
}
