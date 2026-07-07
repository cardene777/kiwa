/**
 * Real adapter — drives the Vercel AI SDK + Anthropic Messages API +
 * a real deployment control plane (LaunchDarkly / Statsig / GitHub
 * Deployments) when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` +
 * `KIWA_LLM_BUDGET_USD` are set. On any system without those, the
 * adapter refuses to run and every method reports `KIWA_LLM_ENV_MISSING`.
 * Downstream tests inspect {@link LlmOpsAdapter.mode} + the trace to
 * skip real assertions on those systems.
 *
 * The full Vercel AI SDK + Anthropic Messages ceremony (model registry
 * write + rollout advancement + A/B evaluation + canary promotion +
 * shadow comparison) is deferred to a follow-up milestone once the
 * driver + budget guard + deployment control plane client are wired
 * into the CI worker image. This milestone (v1.40-4) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly
 * drive both adapters even when only the mock has an actual body. The
 * pattern follows `dogfood-llm-code-interpreter-app/src/adapters/real.ts`
 * (v1.40-3).
 *
 * Budget guard — the real adapter enforces `KIWA_LLM_BUDGET_USD` (a
 * dollar cap) before every op that would touch the Anthropic API via
 * the Vercel AI SDK or the deployment control plane. Once the driver
 * binary lands, the cap is compared against the running per-session
 * cost; if breached, the op refuses with `KIWA_LLM_BUDGET_EXCEEDED`.
 * Until then, the presence of the env is required so tests can prove
 * the gate is wired.
 */

import type {
  AdvanceRolloutResult,
  CompareShadowResult,
  EvaluateAbResult,
  LlmOpsAdapter,
  OpsPipelineResult,
  PromoteCanaryResult,
  RecordedRegistryEntry,
  TraceEvent,
  UpdateRegistryResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_LLM_ENV_MISSING';

/**
 * Report whether the current process can talk to the Vercel AI SDK +
 * Anthropic Messages API + real deployment control plane. Returns
 * `null` on capable systems, or a short reason string when the env is
 * missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — the Anthropic Messages API + a
 * real deployment control plane both cost real money per token / per
 * write, all of which cost budget to burn. The default answer is "skip
 * real" so unit test workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up a real driver.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // KIWA_MODE=real opts in to real ceremonies once the driver is
  // available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the driver.
  if (process.env['KIWA_MODE'] === 'real') {
    if (!process.env['ANTHROPIC_API_KEY']) {
      return 'ANTHROPIC_API_KEY_MISSING';
    }
    if (!process.env['KIWA_LLM_BUDGET_USD']) {
      return 'KIWA_LLM_BUDGET_USD_MISSING';
    }
    // Validate budget is a positive number so the gate can compare against
    // a running per-session cost once the driver lands.
    const raw = process.env['KIWA_LLM_BUDGET_USD'];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 'KIWA_LLM_BUDGET_USD_INVALID';
    }
    return null;
  }
  return MISSING_ENV_ERROR;
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

  function refuse(op: TraceEvent['op']): void {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
  }

  return {
    mode: 'real',

    async startOps(_input) {
      refuse('startOps');
    },
    async closeOps(_input) {
      refuse('closeOps');
    },
    async updateRegistry(_input): Promise<UpdateRegistryResult> {
      refuse('updateRegistry');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async advanceRollout(_input): Promise<AdvanceRolloutResult> {
      refuse('advanceRollout');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async evaluateAb(_input): Promise<EvaluateAbResult> {
      refuse('evaluateAb');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async promoteCanary(_input): Promise<PromoteCanaryResult> {
      refuse('promoteCanary');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async compareShadow(_input): Promise<CompareShadowResult> {
      refuse('compareShadow');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },
    async runPipeline(_input): Promise<OpsPipelineResult> {
      refuse('runPipeline');
      throw new Error(detectRealEnvMissing() ?? MISSING_ENV_ERROR);
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
    },

    registry(_sessionId: string): readonly RecordedRegistryEntry[] {
      return [];
    },
  };
}
