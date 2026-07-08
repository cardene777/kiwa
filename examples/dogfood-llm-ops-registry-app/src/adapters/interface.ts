/**
 * Provider-neutral LLM ops adapter surface for the ops-registry dogfood
 * (v1.40-4).
 *
 * The app talks to the LLM ops surface only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} — drives the Vercel AI SDK + Anthropic
 *    Messages API + a real deployment control plane (e.g. LaunchDarkly /
 *    Statsig / GitHub Deployments) when `KIWA_MODE=real` +
 *    `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set; otherwise
 *    every op reports `KIWA_LLM_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/ai-llm` v0.5 ops
 *    semantics (startOpsSession / updateRegistry / advanceRollout /
 *    evaluateAb / promoteCanary / compareShadow).
 *
 * Both must satisfy the same 8-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 1 axis
 * v1.40-4 dogfoods —
 *  - LLM ops (model registry + rollout percentage advancement + A/B
 *    variant scoring + canary error-rate gate + shadow-vs-production
 *    score delta; state machine emits 5 neutral events per op).
 *
 * The AC anchors this contract on the 3 domain surfaces the harness
 * runs against both adapters —
 *  - registry-e2e (session start + register new model versions + activate
 *    exactly one active version + refuse duplicates)
 *  - rollout-ab-e2e (advance rollout percentage toward a target + evaluate
 *    A/B variant scores + pick winner by mean score + minimum-sample gate)
 *  - canary-shadow-e2e (promote canary when error rate is under a threshold
 *    + compare shadow-vs-production averaged scores)
 *  - pipeline-e2e (registry → rollout → A/B → canary → shadow → tolerance
 *    gate; the full ops decision envelope)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */
import type { OpsAbResult } from '@kiwa/ai-llm';

/** Result of registering a new version in the model registry. */
export interface UpdateRegistryResult {
  sessionId: string;
  version: string;
  activated: boolean;
  registrySize: number;
  activeVersion: string | null;
  latencyMs: number;
}

/** Result of one advance-rollout round. */
export interface AdvanceRolloutResult {
  sessionId: string;
  currentPercent: number;
  targetPercent: number;
  incrementPercent: number;
  reachedTarget: boolean;
  latencyMs: number;
}

/** Result of one evaluate-A/B round. */
export interface EvaluateAbResult {
  sessionId: string;
  variantCount: number;
  qualifiedCount: number;
  winner: string | null;
  delta: number;
  latencyMs: number;
}

/** Result of one promote-canary op. */
export interface PromoteCanaryResult {
  sessionId: string;
  canaryVersion: string;
  errorRate: number;
  threshold: number;
  promoted: boolean;
  activeVersion: string | null;
  latencyMs: number;
}

/** Result of one compare-shadow op. */
export interface CompareShadowResult {
  sessionId: string;
  productionCount: number;
  shadowCount: number;
  prodAvg: number;
  shadowAvg: number;
  delta: number;
  better: boolean;
  latencyMs: number;
}

/** Result of running the full registry → rollout → A/B → canary → shadow pipeline. */
export interface OpsPipelineResult {
  sessionId: string;
  stage:
    | 'completed'
    | 'blocked-no-versions'
    | 'blocked-ab-underpowered'
    | 'blocked-canary-error-rate'
    | 'blocked-shadow-regression';
  blockedReason: string | null;
  registry: {
    versionCount: number;
    activeVersion: string | null;
  };
  rollout: {
    currentPercent: number;
    reachedTarget: boolean;
  };
  ab: {
    winner: string | null;
    delta: number;
    qualifiedCount: number;
  };
  canary: {
    canaryVersion: string;
    promoted: boolean;
    errorRate: number;
    threshold: number;
  };
  shadow: {
    prodAvg: number;
    shadowAvg: number;
    delta: number;
    better: boolean;
  };
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startOps'
    | 'updateRegistry'
    | 'advanceRollout'
    | 'evaluateAb'
    | 'promoteCanary'
    | 'compareShadow'
    | 'closeOps'
    | 'runPipeline';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Registry input passed through the registry surface. */
export interface RegistryInput {
  version: string;
  activate: boolean;
}

/** Rollout input passed through the rollout surface. */
export interface RolloutInput {
  targetPercent: number;
  incrementPercent: number;
}

/** A/B input passed through the A/B surface. */
export interface AbInput {
  results: OpsAbResult[];
  minSamples: number;
}

/** Canary input passed through the canary surface. */
export interface CanaryInput {
  canaryVersion: string;
  errorRate: number;
  threshold: number;
}

/** Shadow input passed through the shadow surface. */
export interface ShadowInput {
  productionScores: number[];
  shadowScores: number[];
}

/** Pipeline input drives the full registry → rollout → A/B → canary → shadow ceremony. */
export interface PipelineInput {
  sessionId: string;
  registry: RegistryInput[];
  rollout: RolloutInput;
  ab: AbInput;
  canary: CanaryInput;
  shadow: ShadowInput;
  /** Shadow regression tolerance — delta below this blocks the pipeline. */
  shadowMinDelta: number;
}

/** Recorded registry entry — used by pipeline tests to introspect state. */
export interface RecordedRegistryEntry {
  version: string;
  active: boolean;
}

/** The LLM ops adapter — 8 ops across 5 surfaces + pipeline. */
export interface LlmOpsAdapter {
  readonly mode: 'real' | 'mock';

  // session lifecycle.
  startOps(input: { sessionId: string }): Promise<void>;
  closeOps(input: { sessionId: string }): Promise<void>;

  // registry surface (registry-e2e axis).
  updateRegistry(input: {
    sessionId: string;
    entry: RegistryInput;
  }): Promise<UpdateRegistryResult>;

  // rollout surface (rollout-ab-e2e axis).
  advanceRollout(input: {
    sessionId: string;
    rollout: RolloutInput;
  }): Promise<AdvanceRolloutResult>;

  // A/B surface (rollout-ab-e2e axis).
  evaluateAb(input: {
    sessionId: string;
    ab: AbInput;
  }): Promise<EvaluateAbResult>;

  // canary surface (canary-shadow-e2e axis).
  promoteCanary(input: {
    sessionId: string;
    canary: CanaryInput;
  }): Promise<PromoteCanaryResult>;

  // shadow surface (canary-shadow-e2e axis).
  compareShadow(input: {
    sessionId: string;
    shadow: ShadowInput;
  }): Promise<CompareShadowResult>;

  // pipeline surface (pipeline-e2e axis).
  runPipeline(input: PipelineInput): Promise<OpsPipelineResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;

  /** registry snapshot — used by pipeline tests to introspect state. */
  registry(sessionId: string): readonly RecordedRegistryEntry[];
}
