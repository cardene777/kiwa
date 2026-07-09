import { semantics } from '@kiwa-lab/auth';
const {
  hitRevocationWindow,
  reportFingerprintDrift,
  requestEscalation,
  rotateRefresh,
  satisfyAal2,
  satisfyAal3,
  seamlessReauth,
  startContinuity,
  startHijackWatch,
  startStepUp,
  triggerLogoutCascade,
} = semantics;
type ContinuitySession = semantics.ContinuitySession;
type HijackSession = semantics.HijackSession;
type StepUpSession = semantics.StepUpSession;

import type {
  AuthPlatform,
  AuthStepUpAdapter,
  MfaSession,
  MfaStep,
} from './interface.js';

interface MockContext {
  stepUps: Map<string, StepUpSession>;
  continuities: Map<string, ContinuitySession>;
  hijacks: Map<string, HijackSession>;
  ops: number;
}

export function makeMockAdapter(): AuthStepUpAdapter {
  const ctx: MockContext = {
    stepUps: new Map(),
    continuities: new Map(),
    hijacks: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: AuthPlatform, userId: string): MfaSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, userId };
  };
  // Silence unused warning for hitRevocationWindow (used by revocation extension in future).
  void hitRevocationWindow;
  return {
    startStepUpFlow: async ({ platform, userId, currentAal }) => {
      const s = newSession('step', platform, userId);
      ctx.stepUps.set(s.sessionId, startStepUp({ platform, userId, currentAal }));
      return s;
    },
    escalateTo: async (session, { requiredAal }) => {
      const machine = ctx.stepUps.get(session.sessionId);
      if (!machine) throw new Error(`escalateTo: unknown sessionId ${session.sessionId}`);
      const step = requestEscalation(machine, { requiredAal });
      return {
        op: 'escalateTo',
        outcome: 'success',
        metadata: { requiredAal, neutralEvent: step.neutralEvent },
      } satisfies MfaStep;
    },
    satisfyFactor: async (session, { level, factor, nowMs }) => {
      const machine = ctx.stepUps.get(session.sessionId);
      if (!machine) throw new Error(`satisfyFactor: unknown sessionId ${session.sessionId}`);
      const step =
        level === 'AAL2'
          ? satisfyAal2(machine, { factor: factor as 'sms' | 'totp' | 'push', nowMs })
          : satisfyAal3(machine, {
              factor: factor as 'webauthn' | 'passkey-biometric' | 'hardware-key',
              nowMs,
            });
      return {
        op: 'satisfyFactor',
        outcome: 'success',
        metadata: { level, factor, neutralEvent: step.neutralEvent },
      };
    },
    closeStepUp: async (session) => {
      ctx.stepUps.delete(session.sessionId);
    },
    startContinuityFlow: async ({ platform, userId, refreshToken, expiresAtMs }) => {
      const s = newSession('cont', platform, userId);
      ctx.continuities.set(
        s.sessionId,
        startContinuity({ platform, userId, refreshToken, expiresAtMs }),
      );
      return s;
    },
    reauthSeamlessly: async (session, { nowMs }) => {
      const machine = ctx.continuities.get(session.sessionId);
      if (!machine) throw new Error(`reauthSeamlessly: unknown sessionId ${session.sessionId}`);
      const step = seamlessReauth(machine, { nowMs });
      return {
        op: 'reauthSeamlessly',
        outcome: 'success',
        metadata: { nowMs, neutralEvent: step.neutralEvent },
      };
    },
    rotateRefreshToken: async (session, { newToken, nowMs }) => {
      const machine = ctx.continuities.get(session.sessionId);
      if (!machine) throw new Error(`rotateRefreshToken: unknown sessionId ${session.sessionId}`);
      const step = rotateRefresh(machine, { newToken, nowMs });
      return {
        op: 'rotateRefreshToken',
        outcome: 'success',
        metadata: { newToken, neutralEvent: step.neutralEvent },
      };
    },
    closeContinuity: async (session) => {
      ctx.continuities.delete(session.sessionId);
    },
    startHijackWatchFlow: async ({ platform, userId, baselineFingerprint, baselineRegion }) => {
      const s = newSession('hj', platform, userId);
      ctx.hijacks.set(
        s.sessionId,
        startHijackWatch({
          platform,
          sessionId: s.sessionId,
          baselineFingerprint,
          baselineRegion,
        }),
      );
      return s;
    },
    reportDrift: async (session, { observedFingerprint, distance }) => {
      const machine = ctx.hijacks.get(session.sessionId);
      if (!machine) throw new Error(`reportDrift: unknown sessionId ${session.sessionId}`);
      const step = reportFingerprintDrift(machine, { observedFingerprint, distance });
      return {
        op: 'reportDrift',
        outcome: 'success',
        metadata: { observedFingerprint, distance, neutralEvent: step.neutralEvent },
      };
    },
    cascadeLogout: async (session, { revokedSessionIds }) => {
      const machine = ctx.hijacks.get(session.sessionId);
      if (!machine) throw new Error(`cascadeLogout: unknown sessionId ${session.sessionId}`);
      const step = triggerLogoutCascade(machine, { revokedSessionIds });
      return {
        op: 'cascadeLogout',
        outcome: 'success',
        metadata: { revokedCount: revokedSessionIds.length, neutralEvent: step.neutralEvent },
      };
    },
    closeHijackWatch: async (session) => {
      ctx.hijacks.delete(session.sessionId);
    },
  };
}
