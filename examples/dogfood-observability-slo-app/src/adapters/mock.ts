/**
 * Mock adapter — drives `@kiwa-test/observability` v2.1 semantics/slo state
 * machine deterministically without any backend. The same app code
 * exercises a full SLO / error-budget / burn-rate / MWMBR ceremony
 * without launching Prometheus or Alertmanager.
 *
 * State model — one {@link SLOSession} per sloId; sessions are isolated
 * so multi-target harnesses can run 99.9 / 99.95 / 99.99 side-by-side
 * without state leakage. That mirrors how Prometheus / Alertmanager keep
 * per-SLO state in production.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary that
 * `@kiwa-test/observability` v2.1 semantics/slo emits — every op appends
 * the matching neutral event onto the trace so the fidelity harness can
 * assert both adapters produce identical event orderings.
 */

import { semantics } from '@kiwa-test/observability';
import {
  KIWA_SLO_ENV_MISSING,
  type AlertRouteResult,
  type ComputeBudgetResult,
  type ErrorBudgetPolicy,
  type EvaluateBurnRateResult,
  type MwmbrAlertResult,
  type MwmbrThreshold,
  type ObservabilityTarget,
  type PolicyEvaluationResult,
  type PromQlQueryResult,
  type SLOTarget,
  type SloAdapter,
  type StartSLOResult,
  type TraceEvent,
} from './interface.js';

const {
  computeErrorBudget: sloComputeErrorBudget,
  evaluateBurnRate: sloEvaluateBurnRate,
  fireMultiWindowMultiBurnRateAlert: sloFireMwmbrAlert,
  openSLOWindow,
  recordRequests: sloRecordRequests,
  startSLO,
} = semantics;

type SLOSession = ReturnType<typeof startSLO>;

/**
 * Silence / route ledger — the mock does not talk to Alertmanager so we
 * remember the ledger locally. That is enough to make routing behaviour
 * observable (silences suppress subsequent routing) without wiring in a
 * real Alertmanager mock.
 */
interface Ledger {
  silenced: Set<string>;
  routes: Map<string, AlertRouteResult>;
}

export function makeMockAdapter(input: {
  target?: ObservabilityTarget;
} = {}): SloAdapter {
  const target: ObservabilityTarget = input.target ?? 'prometheus';
  const sessions = new Map<string, SLOSession>();
  const ledger: Ledger = { silenced: new Set(), routes: new Map() };
  const traceLog: TraceEvent[] = [];

  const emit = (
    op: string,
    sloId: string,
    session: SLOSession | null,
    neutralEvent: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const providerEvent = providerEventFor(target, neutralEvent);
    traceLog.push({
      op,
      sloId,
      neutralEvent,
      providerEvent,
      target,
      state: session?.state ?? 'idle',
      timestampMs: Date.now(),
      ok: true,
      metadata: { target, sloId, ...metadata },
    });
  };

  const requireSession = (sloId: string): SLOSession => {
    const session = sessions.get(sloId);
    if (!session) {
      throw new Error(`mock adapter: sloId ${sloId} has not been started`);
    }
    return session;
  };

  return {
    target,

    async startSlo(t: SLOTarget): Promise<StartSLOResult> {
      const session = startSLO({
        target,
        sloId: t.sloId,
        targetObjective: t.targetObjective,
        windowDays: t.windowDays,
      });
      sessions.set(t.sloId, session);
      emit('startSlo', t.sloId, session, 'slo.session_started', {
        targetObjective: t.targetObjective,
        windowDays: t.windowDays,
      });
      return {
        sloId: t.sloId,
        targetObjective: t.targetObjective,
        windowDays: t.windowDays,
      };
    },

    async openWindow(sloId: string): Promise<void> {
      const session = requireSession(sloId);
      const step = openSLOWindow(session);
      emit('openWindow', sloId, session, step.neutralEvent, {
        windowDays: session.windowDays,
      });
    },

    async queryRequestCounts(query: {
      sloId: string;
      metricName: string;
    }): Promise<PromQlQueryResult> {
      const session = requireSession(query.sloId);
      const totalRequests = session.totalRequests;
      const totalErrors = session.totalErrors;
      const errorRate = totalRequests === 0 ? 0 : totalErrors / totalRequests;
      emit('queryRequestCounts', query.sloId, session, 'slo.query_executed', {
        metricName: query.metricName,
        totalRequests,
        totalErrors,
        errorRate,
      });
      return {
        metricName: query.metricName,
        totalRequests,
        totalErrors,
        errorRate,
      };
    },

    async recordRequests(input: {
      sloId: string;
      requests: number;
      errors: number;
    }): Promise<void> {
      const session = requireSession(input.sloId);
      sloRecordRequests(session, {
        requests: input.requests,
        errors: input.errors,
      });
      emit('recordRequests', input.sloId, session, 'slo.requests_recorded', {
        requests: input.requests,
        errors: input.errors,
      });
    },

    async computeErrorBudget(sloId: string): Promise<ComputeBudgetResult> {
      const session = requireSession(sloId);
      const step = sloComputeErrorBudget(session);
      emit('computeErrorBudget', sloId, session, step.neutralEvent, {
        errorBudgetSeconds: session.errorBudgetSeconds,
      });
      const allowedErrorRate = 1 - session.targetObjective;
      const windowSeconds = session.windowDays * 86_400;
      return {
        sloId,
        allowedErrorRate,
        windowSeconds,
        errorBudgetSeconds: session.errorBudgetSeconds,
      };
    },

    async evaluateBurnRate(input: {
      sloId: string;
      threshold: MwmbrThreshold;
    }): Promise<EvaluateBurnRateResult> {
      const session = requireSession(input.sloId);
      // v2.1 semantics expects budget-computed -> burn-evaluated once. For
      // MWMBR the same session gets driven through multiple thresholds
      // so we snapshot the burn rate here without hopping the state
      // machine multiple times.
      const step = sloEvaluateBurnRate(session, {
        shortWindowMinutes: input.threshold.shortWindowMinutes,
        longWindowMinutes: input.threshold.longWindowMinutes,
        burnRate: input.threshold.burnRate,
      });
      emit('evaluateBurnRate', input.sloId, session, step.neutralEvent, {
        severity: input.threshold.severity,
        burnRate: session.burnRate,
        thresholdRate: input.threshold.burnRate,
      });
      return {
        sloId: input.sloId,
        burnRate: session.burnRate,
        totalRequests: session.totalRequests,
        totalErrors: session.totalErrors,
        thresholdShortMinutes: input.threshold.shortWindowMinutes,
        thresholdLongMinutes: input.threshold.longWindowMinutes,
        thresholdRate: input.threshold.burnRate,
      };
    },

    async fireMwmbrAlert(input: {
      sloId: string;
      thresholds: MwmbrThreshold[];
      page: boolean;
    }): Promise<MwmbrAlertResult> {
      const session = requireSession(input.sloId);
      const step = sloFireMwmbrAlert(session, {
        thresholds: input.thresholds,
        page: input.page,
      });
      const matchedSeverities = input.thresholds
        .filter((t) => session.burnRate >= t.burnRate)
        .map((t) => t.severity);
      emit('fireMwmbrAlert', input.sloId, session, step.neutralEvent, {
        matchedCount: matchedSeverities.length,
        thresholdCount: input.thresholds.length,
        pagerEnabled: input.page,
      });
      return {
        sloId: input.sloId,
        fired: matchedSeverities.length > 0,
        matchedSeverities,
        burnRate: session.burnRate,
        thresholdCount: input.thresholds.length,
        pagerEnabled: input.page,
      };
    },

    async evaluatePolicy(input: {
      policy: ErrorBudgetPolicy;
      consumedFraction: number;
    }): Promise<PolicyEvaluationResult> {
      const session = sessions.get(input.policy.sloId) ?? null;
      const remaining = Math.max(0, 1 - input.consumedFraction);
      let action: PolicyEvaluationResult['action'] = 'ship';
      let reason = 'error budget healthy — ship';
      if (remaining < input.policy.pageThreshold) {
        action = 'page';
        reason = `remaining ${remaining.toFixed(4)} < page threshold ${input.policy.pageThreshold} — page on-call`;
      } else if (remaining < input.policy.freezeThreshold) {
        action = 'freeze';
        reason = `remaining ${remaining.toFixed(4)} < freeze threshold ${input.policy.freezeThreshold} — freeze deploys`;
      }
      emit(
        'evaluatePolicy',
        input.policy.sloId,
        session,
        'slo.policy_evaluated',
        {
          action,
          remainingBudgetFraction: remaining,
          freezeThreshold: input.policy.freezeThreshold,
          pageThreshold: input.policy.pageThreshold,
        },
      );
      return {
        sloId: input.policy.sloId,
        remainingBudgetFraction: remaining,
        action,
        reason,
      };
    },

    async routeAlert(input: {
      sloId: string;
      severity: 'fast' | 'slow';
      channel: 'pager' | 'chat' | 'ticket';
    }): Promise<AlertRouteResult> {
      const routeId = `${input.sloId}:${input.severity}:${input.channel}`;
      const silenced = ledger.silenced.has(routeId);
      const result: AlertRouteResult = {
        routeId,
        severity: input.severity,
        channel: input.channel,
        silenced,
      };
      ledger.routes.set(routeId, result);
      const session = sessions.get(input.sloId) ?? null;
      emit('routeAlert', input.sloId, session, 'slo.alert_routed', {
        routeId,
        severity: input.severity,
        channel: input.channel,
        silenced,
      });
      return result;
    },

    async silenceAlert(input: {
      routeId: string;
      silenceMinutes: number;
    }): Promise<void> {
      ledger.silenced.add(input.routeId);
      const existing = ledger.routes.get(input.routeId);
      if (existing) {
        ledger.routes.set(input.routeId, { ...existing, silenced: true });
      }
      // Silences aren't tied to a specific session; use the routeId prefix
      // to attribute for tracing purposes.
      const sloId = input.routeId.split(':')[0] ?? '';
      const session = sessions.get(sloId) ?? null;
      emit('silenceAlert', sloId, session, 'slo.alert_silenced', {
        routeId: input.routeId,
        silenceMinutes: input.silenceMinutes,
      });
    },

    async reset(): Promise<void> {
      sessions.clear();
      ledger.silenced.clear();
      ledger.routes.clear();
      traceLog.length = 0;
    },

    trace(): TraceEvent[] {
      return traceLog.slice();
    },
  };
}

/**
 * Map a neutral event to its provider-specific dialect. The observability
 * v2.1 package exposes `providerEventName` inside `types.ts` but that
 * symbol lives inside `semantics/` internals and is not re-exported. The
 * mock adapter uses its own minimal mapping — the fidelity harness only
 * needs the neutral event name for parity assertions, but the provider
 * event is emitted so the trace remains inspectable.
 */
function providerEventFor(target: ObservabilityTarget, neutralEvent: string): string {
  const prefix = target === 'grafana-oss' ? 'grafana' : target;
  return `${prefix}.${neutralEvent}`;
}
