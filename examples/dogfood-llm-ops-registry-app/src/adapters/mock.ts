/**
 * Mock adapter — drives `@kiwa/ai-llm` v0.5 llm-ops semantics so the
 * same app code exercises a deterministic registry + rollout + A/B +
 * canary + shadow ceremony without a real Anthropic / deployment control
 * plane call. Both mock and real adapters satisfy {@link LlmOpsAdapter},
 * so the fidelity harness can diff them side-by-side.
 *
 * State model — one ops session per sessionId (registry updates + rollout
 * advancement + A/B evaluation + canary promotion + shadow comparison
 * advance the same state machine). The pipeline surface allocates a
 * fresh sub-session per {@link runPipeline} call so multi-stage flows do
 * not interfere with outer sessions.
 *
 * The mock piggy-backs on the same neutral event vocabulary that the
 * v1.40-1 semantics package emits — every op appends the matching
 * neutral event into the trace so the fidelity harness can assert the
 * mock and real adapters produce identical event orderings.
 */

import {
  advanceRollout,
  compareShadow,
  evaluateAb,
  promoteCanary,
  startOpsSession,
  updateRegistry,
  type OpsSession,
} from '@kiwa/ai-llm';
import type {
  AdvanceRolloutResult,
  CompareShadowResult,
  EvaluateAbResult,
  LlmOpsAdapter,
  OpsPipelineResult,
  PipelineInput,
  PromoteCanaryResult,
  RecordedRegistryEntry,
  TraceEvent,
  UpdateRegistryResult,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface OpsRoom {
  session: OpsSession;
  closed: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): LlmOpsAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const rooms = new Map<string, OpsRoom>();
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

  async function sleep(): Promise<void> {
    if (latencyMs <= 0) return;
    await new Promise((r) => setTimeout(r, latencyMs));
  }

  function activeVersion(session: OpsSession): string | null {
    const active = session.registry.find((e) => e.active);
    return active ? active.version : null;
  }

  return {
    mode: 'mock',

    async startOps(input) {
      await sleep();
      if (rooms.has(input.sessionId)) {
        record('startOps', false, { errorKind: 'DUPLICATE_SESSION' });
        throw new Error(`startOps: duplicate session ${input.sessionId}`);
      }
      const session = startOpsSession({
        target: 'vercel-ai',
        sessionId: input.sessionId,
      });
      rooms.set(input.sessionId, { session, closed: false });
      record('startOps', true, { detail: { sessionId: input.sessionId } });
    },

    async closeOps(input) {
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('closeOps', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`closeOps: no session ${input.sessionId}`);
      }
      room.closed = true;
      record('closeOps', true, {
        detail: {
          sessionId: input.sessionId,
          historyLength: room.session.history.length,
        },
      });
    },

    async updateRegistry(input): Promise<UpdateRegistryResult> {
      const t0 = Date.now();
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('updateRegistry', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`updateRegistry: no session ${input.sessionId}`);
      }
      const { registrySize } = updateRegistry(room.session, {
        version: input.entry.version,
        activate: input.entry.activate,
      });
      const out: UpdateRegistryResult = {
        sessionId: input.sessionId,
        version: input.entry.version,
        activated: input.entry.activate,
        registrySize,
        activeVersion: activeVersion(room.session),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('updateRegistry', true, { detail: out });
      return out;
    },

    async advanceRollout(input): Promise<AdvanceRolloutResult> {
      const t0 = Date.now();
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('advanceRollout', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`advanceRollout: no session ${input.sessionId}`);
      }
      const { currentPercent, reachedTarget } = advanceRollout(room.session, {
        targetPercent: input.rollout.targetPercent,
        incrementPercent: input.rollout.incrementPercent,
      });
      const out: AdvanceRolloutResult = {
        sessionId: input.sessionId,
        currentPercent,
        targetPercent: input.rollout.targetPercent,
        incrementPercent: input.rollout.incrementPercent,
        reachedTarget,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('advanceRollout', true, { detail: out });
      return out;
    },

    async evaluateAb(input): Promise<EvaluateAbResult> {
      const t0 = Date.now();
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('evaluateAb', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`evaluateAb: no session ${input.sessionId}`);
      }
      const { winner, delta } = evaluateAb(room.session, {
        results: input.ab.results,
        minSamples: input.ab.minSamples,
      });
      const qualifiedCount = input.ab.results.filter(
        (r) => r.samples >= input.ab.minSamples,
      ).length;
      const out: EvaluateAbResult = {
        sessionId: input.sessionId,
        variantCount: input.ab.results.length,
        qualifiedCount,
        winner,
        delta,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('evaluateAb', true, { detail: out });
      return out;
    },

    async promoteCanary(input): Promise<PromoteCanaryResult> {
      const t0 = Date.now();
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('promoteCanary', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`promoteCanary: no session ${input.sessionId}`);
      }
      const { promoted } = promoteCanary(room.session, {
        canaryVersion: input.canary.canaryVersion,
        errorRate: input.canary.errorRate,
        threshold: input.canary.threshold,
      });
      const out: PromoteCanaryResult = {
        sessionId: input.sessionId,
        canaryVersion: input.canary.canaryVersion,
        errorRate: input.canary.errorRate,
        threshold: input.canary.threshold,
        promoted,
        activeVersion: activeVersion(room.session),
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('promoteCanary', true, { detail: out });
      return out;
    },

    async compareShadow(input): Promise<CompareShadowResult> {
      const t0 = Date.now();
      await sleep();
      const room = rooms.get(input.sessionId);
      if (!room) {
        record('compareShadow', false, { errorKind: 'MISSING_SESSION' });
        throw new Error(`compareShadow: no session ${input.sessionId}`);
      }
      const { delta, better } = compareShadow(room.session, {
        productionScores: input.shadow.productionScores,
        shadowScores: input.shadow.shadowScores,
      });
      const prodAvg =
        input.shadow.productionScores.reduce((sum, s) => sum + s, 0) /
        input.shadow.productionScores.length;
      const shadowAvg =
        input.shadow.shadowScores.reduce((sum, s) => sum + s, 0) /
        input.shadow.shadowScores.length;
      const out: CompareShadowResult = {
        sessionId: input.sessionId,
        productionCount: input.shadow.productionScores.length,
        shadowCount: input.shadow.shadowScores.length,
        prodAvg,
        shadowAvg,
        delta,
        better,
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('compareShadow', true, { detail: out });
      return out;
    },

    async runPipeline(input: PipelineInput): Promise<OpsPipelineResult> {
      const t0 = Date.now();
      await sleep();

      const subSessionId = `${input.sessionId}:ops`;
      const session = startOpsSession({
        target: 'vercel-ai',
        sessionId: subSessionId,
      });

      // Stage 1 — registry. Refuse if no versions provided.
      if (input.registry.length === 0) {
        const out: OpsPipelineResult = {
          sessionId: input.sessionId,
          stage: 'blocked-no-versions',
          blockedReason: 'registry must not be empty',
          registry: {
            versionCount: 0,
            activeVersion: null,
          },
          rollout: {
            currentPercent: 0,
            reachedTarget: false,
          },
          ab: {
            winner: null,
            delta: 0,
            qualifiedCount: 0,
          },
          canary: {
            canaryVersion: input.canary.canaryVersion,
            promoted: false,
            errorRate: input.canary.errorRate,
            threshold: input.canary.threshold,
          },
          shadow: {
            prodAvg: 0,
            shadowAvg: 0,
            delta: 0,
            better: false,
          },
          latencyMs: Math.max(1, Date.now() - t0),
        };
        record('runPipeline', true, { detail: out });
        return out;
      }
      for (const entry of input.registry) {
        updateRegistry(session, {
          version: entry.version,
          activate: entry.activate,
        });
      }

      // Stage 2 — rollout advancement.
      const { currentPercent, reachedTarget } = advanceRollout(session, {
        targetPercent: input.rollout.targetPercent,
        incrementPercent: input.rollout.incrementPercent,
      });

      // Stage 3 — A/B evaluation. Refuse blocked if under-powered.
      const { winner, delta: abDelta } = evaluateAb(session, {
        results: input.ab.results,
        minSamples: input.ab.minSamples,
      });
      const qualifiedCount = input.ab.results.filter(
        (r) => r.samples >= input.ab.minSamples,
      ).length;
      const abUnderpowered = winner === null;

      // Stage 4 — canary promotion.
      const { promoted } = promoteCanary(session, {
        canaryVersion: input.canary.canaryVersion,
        errorRate: input.canary.errorRate,
        threshold: input.canary.threshold,
      });

      // Stage 5 — shadow comparison.
      const { delta: shadowDelta, better } = compareShadow(session, {
        productionScores: input.shadow.productionScores,
        shadowScores: input.shadow.shadowScores,
      });
      const prodAvg =
        input.shadow.productionScores.reduce((sum, s) => sum + s, 0) /
        input.shadow.productionScores.length;
      const shadowAvg =
        input.shadow.shadowScores.reduce((sum, s) => sum + s, 0) /
        input.shadow.shadowScores.length;

      // Blocking precedence — A/B under-powered > canary error rate >
      // shadow regression. The precedence is defined so downstream tests
      // can assert exactly one blocking reason per pipeline run.
      let stage: OpsPipelineResult['stage'] = 'completed';
      let blockedReason: string | null = null;
      if (abUnderpowered) {
        stage = 'blocked-ab-underpowered';
        blockedReason = `A/B qualified ${qualifiedCount} < 2 variants`;
      } else if (!promoted) {
        stage = 'blocked-canary-error-rate';
        blockedReason = `canary errorRate ${input.canary.errorRate} > threshold ${input.canary.threshold}`;
      } else if (shadowDelta < input.shadowMinDelta) {
        stage = 'blocked-shadow-regression';
        blockedReason = `shadow delta ${shadowDelta} < minDelta ${input.shadowMinDelta}`;
      }

      const out: OpsPipelineResult = {
        sessionId: input.sessionId,
        stage,
        blockedReason,
        registry: {
          versionCount: session.registry.length,
          activeVersion: activeVersion(session),
        },
        rollout: {
          currentPercent,
          reachedTarget,
        },
        ab: {
          winner,
          delta: abDelta,
          qualifiedCount,
        },
        canary: {
          canaryVersion: input.canary.canaryVersion,
          promoted,
          errorRate: input.canary.errorRate,
          threshold: input.canary.threshold,
        },
        shadow: {
          prodAvg,
          shadowAvg,
          delta: shadowDelta,
          better,
        },
        latencyMs: Math.max(1, Date.now() - t0),
      };
      record('runPipeline', true, { detail: out });
      return out;
    },

    traces() {
      return trace;
    },

    async reset() {
      rooms.clear();
      trace.length = 0;
    },

    registry(sessionId: string): readonly RecordedRegistryEntry[] {
      const room = rooms.get(sessionId);
      if (!room) return [];
      return room.session.registry.map((e) => ({
        version: e.version,
        active: e.active,
      }));
    },
  };
}
