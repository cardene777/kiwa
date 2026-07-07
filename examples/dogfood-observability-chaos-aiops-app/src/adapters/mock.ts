/**
 * Mock adapter — drives `@kiwa-test/observability` v2.2 advanced III
 * chaos + aiops semantics (startChaosSession / injectFault /
 * computeBlastRadius / triggerRollback + startAiopsSession /
 * detectAnomaly / executeRemediation / analyzeRootCause /
 * correlateAlerts) so the same app code exercises a deterministic
 * chaos-engine + AIOps ceremony without a real LitmusChaos / Gremlin /
 * PagerDuty AIOps provider. Both mock and real adapters satisfy
 * {@link ChaosAiopsAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface state stays separated. The
 * chaos surface owns the fault-injection + blast-radius + rollback
 * state machine; the remediation surface owns the anomaly-detect +
 * runbook-execute state machine; the rca surface owns the dependency
 * graph analysis + alert correlation state machine.
 *
 * The mock intentionally piggy-backs on the v2.2 chaos + aiops semantics.
 * Because both semantics are strict linear state machines (chaos: idle
 * → fault-injected → blast-radius-computed → rollback-triggered →
 * game-day-recorded; aiops: idle → anomaly-detected → remediation-
 * executed → root-cause-analyzed → alerts-correlated), the mock adapter
 * maintains a separate session per surface so each surface can drive
 * the semantics lifecycle independently and the fidelity harness can
 * point at the exact op that diverged.
 */

import { semantics } from '@kiwa-test/observability';
import {
  type AlertCorrelateResult,
  type AlertRecord,
  type AnomalyDetectResult,
  type AnomalyPoint,
  type BlastRadiusInput,
  type ChaosAiopsAdapter,
  type ChaosSessionInput,
  type DependencyEdge,
  type FaultInjectResult,
  type FaultRequest,
  type ObservabilityTarget,
  type RcaSessionInput,
  type RemediationAction,
  type RemediationExecuteResult,
  type RemediationSessionInput,
  type RollbackInput,
  type RollbackTriggerResult,
  type RootCauseAnalyzeResult,
  type TraceEvent,
} from './interface.js';

const {
  analyzeRootCause: obsAnalyzeRootCause,
  computeBlastRadius: obsComputeBlastRadius,
  correlateAlerts: obsCorrelateAlerts,
  detectAnomaly: obsDetectAnomaly,
  executeRemediation: obsExecuteRemediation,
  injectFault: obsInjectFault,
  startAiopsSession,
  startChaosSession,
  triggerRollback: obsTriggerRollback,
} = semantics;

type ChaosSemSession = ReturnType<typeof startChaosSession>;
type AiopsSemSession = ReturnType<typeof startAiopsSession>;

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms, default 1). */
  latencyMs?: number;
}

interface ChaosSurfaceState {
  sessionId: string;
  experimentId: string;
  target: ObservabilityTarget;
  chaos: ChaosSemSession;
  faultInjected: boolean;
  closed: boolean;
}

interface RemediationSurfaceState {
  sessionId: string;
  clusterId: string;
  target: ObservabilityTarget;
  aiops: AiopsSemSession;
  anomalyDetected: boolean;
  closed: boolean;
}

interface RcaSurfaceState {
  sessionId: string;
  clusterId: string;
  target: ObservabilityTarget;
  aiops: AiopsSemSession;
  anomalyDetected: boolean;
  remediationExecuted: boolean;
  rootCauseAnalyzed: boolean;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): ChaosAiopsAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const chaosSurfaces = new Map<string, ChaosSurfaceState>();
  const remediationSurfaces = new Map<string, RemediationSurfaceState>();
  const rcaSurfaces = new Map<string, RcaSurfaceState>();

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
   * Bootstrap the aiops semantics with a synthetic anomaly-detected step
   * so the remediation surface can drive executeRemediation. The v2.2
   * AiopsSession requires anomaly-detected state before remediation ops
   * can run, and the remediation surface exposes only executeRemediation
   * (not the underlying detectAnomaly) to app code.
   */
  function bootstrapAnomalyForRemediation(session: AiopsSemSession): void {
    obsDetectAnomaly(session, {
      points: [
        { metric: 'bootstrap.metric', value: 0, zScore: 999 },
      ],
      zScoreThreshold: 1,
    });
  }

  /**
   * Bootstrap prior aiops semantics steps synthetically for the rca
   * surface. The rca surface enters at analyzeRootCause which requires
   * remediation-executed state; play the anomaly + remediation steps
   * with zero-signal inputs so the semantics remain the source of truth
   * for state-transition ordering.
   */
  function bootstrapForRootCause(session: AiopsSemSession): void {
    obsDetectAnomaly(session, {
      points: [
        { metric: 'bootstrap.metric', value: 0, zScore: 999 },
      ],
      zScoreThreshold: 1,
    });
    obsExecuteRemediation(session, {
      actions: [
        { actionId: 'bootstrap-action', runbookId: 'bootstrap-rb', success: true },
      ],
    });
  }

  return {
    mode: 'mock',

    async startChaos(input) {
      if (chaosSurfaces.has(input.sessionId)) {
        record('startChaos', false, { errorKind: 'chaos_session_exists' });
        throw new Error('chaos_session_exists');
      }
      const chaos = startChaosSession({
        target: input.target,
        experimentId: input.experimentId,
      });
      chaosSurfaces.set(input.sessionId, {
        sessionId: input.sessionId,
        experimentId: input.experimentId,
        target: input.target,
        chaos,
        faultInjected: false,
        closed: false,
      });
      record('startChaos', true, {
        detail: {
          sessionId: input.sessionId,
          experimentId: input.experimentId,
          target: input.target,
        },
      });
    },

    async injectFault(input) {
      const session = chaosSurfaces.get(input.sessionId);
      if (!session) {
        record('injectFault', false, { errorKind: 'chaos_session_not_found' });
        throw new Error('chaos_session_not_found');
      }
      if (session.closed) {
        record('injectFault', false, { errorKind: 'chaos_session_closed' });
        throw new Error('chaos_session_closed');
      }
      if (input.fault.target.length === 0) {
        record('injectFault', false, { errorKind: 'target_must_not_be_empty' });
        throw new Error('target_must_not_be_empty');
      }
      if (input.fault.durationSec <= 0) {
        record('injectFault', false, {
          errorKind: 'durationSec_must_be_positive',
        });
        throw new Error('durationSec_must_be_positive');
      }
      try {
        obsInjectFault(session.chaos, {
          kind: input.fault.kind,
          target: input.fault.target,
          durationSec: input.fault.durationSec,
        });
        session.faultInjected = true;
        const result: FaultInjectResult = {
          sessionId: input.sessionId,
          experimentId: session.experimentId,
          faultKind: input.fault.kind,
          faultTarget: input.fault.target,
          durationSec: input.fault.durationSec,
          latencyMs,
        };
        record('injectFault', true, { detail: result });
        return result;
      } catch (err) {
        record('injectFault', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async triggerRollback(input) {
      const session = chaosSurfaces.get(input.sessionId);
      if (!session) {
        record('triggerRollback', false, {
          errorKind: 'chaos_session_not_found',
        });
        throw new Error('chaos_session_not_found');
      }
      if (session.closed) {
        record('triggerRollback', false, { errorKind: 'chaos_session_closed' });
        throw new Error('chaos_session_closed');
      }
      if (!session.faultInjected) {
        record('triggerRollback', false, {
          errorKind: 'fault_not_injected',
        });
        throw new Error('fault_not_injected');
      }
      if (input.blastRadius.totalInstances <= 0) {
        record('triggerRollback', false, {
          errorKind: 'totalInstances_must_be_positive',
        });
        throw new Error('totalInstances_must_be_positive');
      }
      if (
        input.blastRadius.affectedInstances < 0 ||
        input.blastRadius.affectedInstances > input.blastRadius.totalInstances
      ) {
        record('triggerRollback', false, {
          errorKind: 'affectedInstances_out_of_range',
        });
        throw new Error('affectedInstances_out_of_range');
      }
      if (input.rollback.errorRate < 0 || input.rollback.errorRate > 1) {
        record('triggerRollback', false, {
          errorKind: 'errorRate_out_of_range',
        });
        throw new Error('errorRate_out_of_range');
      }
      if (input.rollback.threshold < 0 || input.rollback.threshold > 1) {
        record('triggerRollback', false, {
          errorKind: 'threshold_out_of_range',
        });
        throw new Error('threshold_out_of_range');
      }
      try {
        const blast = obsComputeBlastRadius(session.chaos, {
          affectedInstances: input.blastRadius.affectedInstances,
          totalInstances: input.blastRadius.totalInstances,
        });
        const rollback = obsTriggerRollback(session.chaos, {
          errorRate: input.rollback.errorRate,
          threshold: input.rollback.threshold,
        });
        const result: RollbackTriggerResult = {
          sessionId: input.sessionId,
          experimentId: session.experimentId,
          triggered: Boolean(rollback.metadata.triggered),
          errorRate: input.rollback.errorRate,
          threshold: input.rollback.threshold,
          blastRadiusRatio: Number(blast.metadata.blastRadiusRatio),
          affectedInstances: input.blastRadius.affectedInstances,
          latencyMs,
        };
        record('triggerRollback', true, { detail: result });
        return result;
      } catch (err) {
        record('triggerRollback', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeChaos(input) {
      const session = chaosSurfaces.get(input.sessionId);
      if (!session) {
        record('closeChaos', false, { errorKind: 'chaos_session_not_found' });
        throw new Error('chaos_session_not_found');
      }
      session.closed = true;
      chaosSurfaces.delete(input.sessionId);
      record('closeChaos', true, { detail: { sessionId: input.sessionId } });
    },

    async startRemediation(input) {
      if (remediationSurfaces.has(input.sessionId)) {
        record('startRemediation', false, {
          errorKind: 'remediation_session_exists',
        });
        throw new Error('remediation_session_exists');
      }
      const aiops = startAiopsSession({
        target: input.target,
        clusterId: input.clusterId,
      });
      remediationSurfaces.set(input.sessionId, {
        sessionId: input.sessionId,
        clusterId: input.clusterId,
        target: input.target,
        aiops,
        anomalyDetected: false,
        closed: false,
      });
      record('startRemediation', true, {
        detail: {
          sessionId: input.sessionId,
          clusterId: input.clusterId,
          target: input.target,
        },
      });
    },

    async detectAnomaly(input) {
      const session = remediationSurfaces.get(input.sessionId);
      if (!session) {
        record('detectAnomaly', false, {
          errorKind: 'remediation_session_not_found',
        });
        throw new Error('remediation_session_not_found');
      }
      if (session.closed) {
        record('detectAnomaly', false, {
          errorKind: 'remediation_session_closed',
        });
        throw new Error('remediation_session_closed');
      }
      if (input.points.length === 0) {
        record('detectAnomaly', false, {
          errorKind: 'points_must_not_be_empty',
        });
        throw new Error('points_must_not_be_empty');
      }
      if (input.zScoreThreshold <= 0) {
        record('detectAnomaly', false, {
          errorKind: 'zScoreThreshold_must_be_positive',
        });
        throw new Error('zScoreThreshold_must_be_positive');
      }
      try {
        const step = obsDetectAnomaly(session.aiops, {
          points: input.points,
          zScoreThreshold: input.zScoreThreshold,
        });
        session.anomalyDetected = true;
        const result: AnomalyDetectResult = {
          sessionId: input.sessionId,
          clusterId: session.clusterId,
          pointCount: Number(step.metadata.pointCount),
          anomalyCount: Number(step.metadata.anomalyCount),
          zScoreThreshold: Number(step.metadata.zScoreThreshold),
          hasAnomaly: Boolean(step.metadata.hasAnomaly),
          latencyMs,
        };
        record('detectAnomaly', true, { detail: result });
        return result;
      } catch (err) {
        record('detectAnomaly', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async executeRemediation(input) {
      const session = remediationSurfaces.get(input.sessionId);
      if (!session) {
        record('executeRemediation', false, {
          errorKind: 'remediation_session_not_found',
        });
        throw new Error('remediation_session_not_found');
      }
      if (session.closed) {
        record('executeRemediation', false, {
          errorKind: 'remediation_session_closed',
        });
        throw new Error('remediation_session_closed');
      }
      if (input.actions.length === 0) {
        record('executeRemediation', false, {
          errorKind: 'actions_must_not_be_empty',
        });
        throw new Error('actions_must_not_be_empty');
      }
      try {
        // The v2.2 AiopsSession state machine requires an
        // anomaly-detected state before remediation can run. Bootstrap
        // the anomaly step with a synthetic point if the caller has not
        // driven it explicitly so semantics stay honest without forcing
        // every surface to walk the full ceremony.
        if (!session.anomalyDetected) {
          bootstrapAnomalyForRemediation(session.aiops);
          session.anomalyDetected = true;
        }
        const step = obsExecuteRemediation(session.aiops, {
          actions: input.actions,
        });
        const result: RemediationExecuteResult = {
          sessionId: input.sessionId,
          clusterId: session.clusterId,
          actionCount: Number(step.metadata.actionCount),
          succeeded: Number(step.metadata.succeeded),
          failed: Number(step.metadata.failed),
          allSucceeded: Boolean(step.metadata.allSucceeded),
          latencyMs,
        };
        record('executeRemediation', true, { detail: result });
        return result;
      } catch (err) {
        record('executeRemediation', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeRemediation(input) {
      const session = remediationSurfaces.get(input.sessionId);
      if (!session) {
        record('closeRemediation', false, {
          errorKind: 'remediation_session_not_found',
        });
        throw new Error('remediation_session_not_found');
      }
      session.closed = true;
      remediationSurfaces.delete(input.sessionId);
      record('closeRemediation', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    async startRca(input) {
      if (rcaSurfaces.has(input.sessionId)) {
        record('startRca', false, { errorKind: 'rca_session_exists' });
        throw new Error('rca_session_exists');
      }
      const aiops = startAiopsSession({
        target: input.target,
        clusterId: input.clusterId,
      });
      rcaSurfaces.set(input.sessionId, {
        sessionId: input.sessionId,
        clusterId: input.clusterId,
        target: input.target,
        aiops,
        anomalyDetected: false,
        remediationExecuted: false,
        rootCauseAnalyzed: false,
        closed: false,
      });
      record('startRca', true, {
        detail: {
          sessionId: input.sessionId,
          clusterId: input.clusterId,
          target: input.target,
        },
      });
    },

    async analyzeRootCause(input) {
      const session = rcaSurfaces.get(input.sessionId);
      if (!session) {
        record('analyzeRootCause', false, {
          errorKind: 'rca_session_not_found',
        });
        throw new Error('rca_session_not_found');
      }
      if (session.closed) {
        record('analyzeRootCause', false, {
          errorKind: 'rca_session_closed',
        });
        throw new Error('rca_session_closed');
      }
      if (input.failedServices.length === 0) {
        record('analyzeRootCause', false, {
          errorKind: 'failedServices_must_not_be_empty',
        });
        throw new Error('failedServices_must_not_be_empty');
      }
      try {
        // analyzeRootCause is the third step in the aiops lifecycle and
        // requires remediation-executed state. Bootstrap the anomaly +
        // remediation steps with synthetic inputs if the caller has not
        // driven them explicitly so semantics remain the SSOT for
        // state-transition ordering.
        if (!session.remediationExecuted) {
          bootstrapForRootCause(session.aiops);
          session.anomalyDetected = true;
          session.remediationExecuted = true;
        }
        const step = obsAnalyzeRootCause(session.aiops, {
          edges: input.edges,
          failedServices: input.failedServices,
        });
        session.rootCauseAnalyzed = true;
        const result: RootCauseAnalyzeResult = {
          sessionId: input.sessionId,
          clusterId: session.clusterId,
          failedCount: Number(step.metadata.failedCount),
          edgeCount: Number(step.metadata.edgeCount),
          rootCause: String(step.metadata.rootCause),
          latencyMs,
        };
        record('analyzeRootCause', true, { detail: result });
        return result;
      } catch (err) {
        record('analyzeRootCause', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async correlateAlerts(input) {
      const session = rcaSurfaces.get(input.sessionId);
      if (!session) {
        record('correlateAlerts', false, {
          errorKind: 'rca_session_not_found',
        });
        throw new Error('rca_session_not_found');
      }
      if (session.closed) {
        record('correlateAlerts', false, {
          errorKind: 'rca_session_closed',
        });
        throw new Error('rca_session_closed');
      }
      if (input.alerts.length === 0) {
        record('correlateAlerts', false, {
          errorKind: 'alerts_must_not_be_empty',
        });
        throw new Error('alerts_must_not_be_empty');
      }
      if (input.windowMs <= 0) {
        record('correlateAlerts', false, {
          errorKind: 'windowMs_must_be_positive',
        });
        throw new Error('windowMs_must_be_positive');
      }
      try {
        // correlateAlerts is the final step in the aiops lifecycle and
        // requires root-cause-analyzed state. Bootstrap all prior steps
        // with synthetic inputs if the caller has not driven them
        // explicitly.
        if (!session.rootCauseAnalyzed) {
          if (!session.remediationExecuted) {
            bootstrapForRootCause(session.aiops);
            session.anomalyDetected = true;
            session.remediationExecuted = true;
          }
          obsAnalyzeRootCause(session.aiops, {
            edges: [],
            failedServices: [`${session.clusterId}-bootstrap-svc`],
          });
          session.rootCauseAnalyzed = true;
        }
        const step = obsCorrelateAlerts(session.aiops, {
          alerts: input.alerts,
          windowMs: input.windowMs,
        });
        const result: AlertCorrelateResult = {
          sessionId: input.sessionId,
          clusterId: session.clusterId,
          alertCount: Number(step.metadata.alertCount),
          groupCount: Number(step.metadata.groupCount),
          windowMs: Number(step.metadata.windowMs),
          latencyMs,
        };
        record('correlateAlerts', true, { detail: result });
        return result;
      } catch (err) {
        record('correlateAlerts', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeRca(input) {
      const session = rcaSurfaces.get(input.sessionId);
      if (!session) {
        record('closeRca', false, { errorKind: 'rca_session_not_found' });
        throw new Error('rca_session_not_found');
      }
      session.closed = true;
      rcaSurfaces.delete(input.sessionId);
      record('closeRca', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      chaosSurfaces.clear();
      remediationSurfaces.clear();
      rcaSurfaces.clear();
    },
  };
}

/** Re-export for convenience — types cross to route + fidelity modules. */
export type {
  AlertCorrelateResult,
  AlertRecord,
  AnomalyDetectResult,
  AnomalyPoint,
  BlastRadiusInput,
  ChaosSessionInput,
  DependencyEdge,
  FaultInjectResult,
  FaultRequest,
  RcaSessionInput,
  RemediationAction,
  RemediationExecuteResult,
  RemediationSessionInput,
  RollbackInput,
  RollbackTriggerResult,
  RootCauseAnalyzeResult,
} from './interface.js';
