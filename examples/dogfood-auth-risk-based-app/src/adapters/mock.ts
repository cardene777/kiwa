import { semantics } from '@kiwa/auth';
const {
  applyPolicy,
  detectAbuse,
  evaluateScore,
  recordAttempt,
  reportConcurrentSession,
  reportGeoAnomaly,
  startAuthTelemetry,
  startHijackWatch,
  startRiskEval,
} = semantics;
type AuthTelemetrySession = semantics.AuthTelemetrySession;
type HijackSession = semantics.HijackSession;
type RiskEngineSession = semantics.RiskSession;

import type {
  AuthPlatform,
  RiskAdapter,
  RiskSession,
  RiskStep,
} from './interface.js';

interface MockContext {
  risks: Map<string, RiskEngineSession>;
  telemetries: Map<string, AuthTelemetrySession>;
  hijacks: Map<string, HijackSession>;
  ops: number;
}

export function makeMockAdapter(): RiskAdapter {
  const ctx: MockContext = {
    risks: new Map(),
    telemetries: new Map(),
    hijacks: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: AuthPlatform, userId: string): RiskSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, userId };
  };
  return {
    startRiskFlow: async ({ platform, userId }) => {
      const s = newSession('risk', platform, userId);
      ctx.risks.set(s.sessionId, startRiskEval({ platform, userId }));
      return s;
    },
    evaluateScoreOp: async (session, signals) => {
      const machine = ctx.risks.get(session.sessionId);
      if (!machine) throw new Error(`evaluateScoreOp: unknown sessionId ${session.sessionId}`);
      const step = evaluateScore(machine, { signals });
      return {
        op: 'evaluateScoreOp',
        outcome: 'success',
        metadata: { score: Number(step.metadata.score ?? 0), neutralEvent: step.neutralEvent },
      } satisfies RiskStep;
    },
    applyPolicyOp: async (session) => {
      const machine = ctx.risks.get(session.sessionId);
      if (!machine) throw new Error(`applyPolicyOp: unknown sessionId ${session.sessionId}`);
      const step = applyPolicy(machine);
      return {
        op: 'applyPolicyOp',
        outcome: 'success',
        metadata: { blocked: Boolean(step.metadata.blocked ?? false), neutralEvent: step.neutralEvent },
      };
    },
    closeRisk: async (session) => {
      ctx.risks.delete(session.sessionId);
    },
    startTelemetryFlow: async ({ platform, userId, endpointId }) => {
      const s = newSession('tel', platform, userId);
      ctx.telemetries.set(s.sessionId, startAuthTelemetry({ platform, endpointId }));
      return s;
    },
    recordAttemptOp: async (session, { success, latencyMs }) => {
      const machine = ctx.telemetries.get(session.sessionId);
      if (!machine) throw new Error(`recordAttemptOp: unknown sessionId ${session.sessionId}`);
      const step = recordAttempt(machine, { success, latencyMs });
      return {
        op: 'recordAttemptOp',
        outcome: 'success',
        metadata: { success, latencyMs, neutralEvent: step.neutralEvent },
      };
    },
    detectAbuseOp: async (session, { failureRateThreshold, ipAddress }) => {
      const machine = ctx.telemetries.get(session.sessionId);
      if (!machine) throw new Error(`detectAbuseOp: unknown sessionId ${session.sessionId}`);
      const step = detectAbuse(machine, { failureRateThreshold, ipAddress });
      return {
        op: 'detectAbuseOp',
        outcome: 'success',
        metadata: { isAbuse: Boolean(step.metadata.isAbuse ?? false), neutralEvent: step.neutralEvent },
      };
    },
    closeTelemetry: async (session) => {
      ctx.telemetries.delete(session.sessionId);
    },
    startConcurrentWatch: async ({ platform, userId, baselineRegion }) => {
      const s = newSession('conc', platform, userId);
      ctx.hijacks.set(
        s.sessionId,
        startHijackWatch({
          platform,
          sessionId: s.sessionId,
          baselineFingerprint: 'fp-A',
          baselineRegion,
        }),
      );
      return s;
    },
    reportGeoAnomalyOp: async (session, { observedRegion, km, withinMinutes }) => {
      const machine = ctx.hijacks.get(session.sessionId);
      if (!machine) throw new Error(`reportGeoAnomalyOp: unknown sessionId ${session.sessionId}`);
      const step = reportGeoAnomaly(machine, { observedRegion, km, withinMinutes });
      return {
        op: 'reportGeoAnomalyOp',
        outcome: 'success',
        metadata: { observedRegion, km, neutralEvent: step.neutralEvent },
      };
    },
    reportConcurrentOp: async (session, { concurrentSessionCount }) => {
      const machine = ctx.hijacks.get(session.sessionId);
      if (!machine) throw new Error(`reportConcurrentOp: unknown sessionId ${session.sessionId}`);
      const step = reportConcurrentSession(machine, { concurrentSessionCount });
      return {
        op: 'reportConcurrentOp',
        outcome: 'success',
        metadata: {
          concurrentSessionCount,
          neutralEvent: step.neutralEvent,
        },
      };
    },
    closeConcurrentWatch: async (session) => {
      ctx.hijacks.delete(session.sessionId);
    },
  };
}
